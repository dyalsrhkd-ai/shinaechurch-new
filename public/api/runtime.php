<?php
declare(strict_types=1);

require_once __DIR__ . '/_runtime_service.php';

function runtime_lock_owner(PDO $pdo, string $route): ?array
{
    $statement = $pdo->prepare(
        'SELECT u.login_id, u.display_name, l.expires_at ' .
        'FROM admin_route_locks l JOIN admin_users u ON u.id = l.admin_user_id ' .
        'WHERE l.route_key = :route_key AND l.expires_at > NOW()'
    );
    $statement->execute(array('route_key' => $route));
    $row = $statement->fetch();
    if (!is_array($row)) {
        return null;
    }
    return array(
        'loginId' => (string) $row['login_id'],
        'displayName' => (string) $row['display_name'],
        'expiresAt' => (string) $row['expires_at'],
    );
}

run_api(function (): void {
    $input = json_input();
    $action = request_action($input);
    $pdo = db();

    if ($action === 'visit') {
        require_method('POST');
        $visit = normalize_visit_payload($input);
        $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? (string) $_SERVER['HTTP_USER_AGENT'] : '';
        $visitKey = private_value_hash(date('Y-m-d') . '|' . $ip . '|' . $userAgent);

        $pdo->beginTransaction();
        try {
            $check = $pdo->prepare(
                'SELECT id FROM visitor_logs WHERE visit_key_hash = :visit_key_hash AND visited_at >= CURDATE() LIMIT 1'
            );
            $check->execute(array('visit_key_hash' => $visitKey));
            $recorded = $check->fetchColumn() === false;
            if ($recorded) {
                $pdo->prepare(
                    'INSERT INTO visitor_logs (visit_key_hash, path, referrer_host, user_agent_hash) ' .
                    'VALUES (:visit_key_hash, :path, :referrer_host, :user_agent_hash)'
                )->execute(array(
                    'visit_key_hash' => $visitKey,
                    'path' => $visit['path'],
                    'referrer_host' => $visit['referrerHost'] === '' ? null : $visit['referrerHost'],
                    'user_agent_hash' => $userAgent === '' ? null : private_value_hash($userAgent),
                ));
                $pdo->exec(
                    'INSERT INTO visitor_daily_stats (visit_date, page_view_count, visitor_count) VALUES (CURDATE(), 1, 1) ' .
                    'ON DUPLICATE KEY UPDATE page_view_count = page_view_count + 1, visitor_count = visitor_count + 1'
                );
            }
            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }
        json_response(array('ok' => true, 'recorded' => $recorded));
    }

    $admin = require_admin();

    if ($action === 'visitor-summary') {
        require_method('GET');
        $summary = $pdo->query(
            'SELECT ' .
            'COALESCE(SUM(CASE WHEN visit_date = CURDATE() THEN visitor_count ELSE 0 END), 0) AS today_visits, ' .
            'COALESCE(SUM(CASE WHEN visit_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN visitor_count ELSE 0 END), 0) AS week_visits, ' .
            'COALESCE(SUM(CASE WHEN visit_date >= DATE_FORMAT(CURDATE(), \'%Y-%m-01\') THEN visitor_count ELSE 0 END), 0) AS month_visits, ' .
            'COALESCE(SUM(CASE WHEN visit_date >= DATE_FORMAT(CURDATE(), \'%Y-01-01\') THEN visitor_count ELSE 0 END), 0) AS year_visits, ' .
            'COALESCE(SUM(visitor_count), 0) AS total_visits FROM visitor_daily_stats'
        )->fetch();
        json_response(array('ok' => true, 'summary' => array(
            'todayVisits' => (int) $summary['today_visits'],
            'weekVisits' => (int) $summary['week_visits'],
            'monthVisits' => (int) $summary['month_visits'],
            'yearVisits' => (int) $summary['year_visits'],
            'totalVisits' => (int) $summary['total_visits'],
        )));
    }

    if ($action === 'visitor-logs') {
        require_method('GET');
        $rows = $pdo->query(
            'SELECT id, path, referrer_host, visited_at FROM visitor_logs ORDER BY visited_at DESC LIMIT 100'
        )->fetchAll();
        json_response(array('ok' => true, 'logs' => array_map('normalize_runtime_visitor_log', $rows)));
    }

    if ($action === 'activity-logs') {
        require_method('GET');
        $rows = $pdo->query(
            'SELECT l.id, u.login_id, u.display_name, l.action_key, l.target_type, l.target_id, l.created_at ' .
            'FROM admin_audit_logs l LEFT JOIN admin_users u ON u.id = l.admin_user_id ' .
            'ORDER BY l.created_at DESC LIMIT 200'
        )->fetchAll();
        json_response(array('ok' => true, 'logs' => array_map('normalize_runtime_audit_log', $rows)));
    }

    require_method('POST');
    require_csrf();
    $route = normalize_runtime_route(isset($input['route']) ? (string) $input['route'] : '');
    $token = isset($input['lockToken']) ? (string) $input['lockToken'] : '';
    if ($route === '' || strlen($token) < 16 || strlen($token) > 128) {
        api_error('Invalid route lock request.', 400, 'INVALID_LOCK');
    }
    $tokenHash = hash_secret($token);

    if ($action === 'lock-acquire') {
        $pdo->beginTransaction();
        try {
            $pdo->exec('DELETE FROM admin_route_locks WHERE expires_at <= NOW()');
            $statement = $pdo->prepare('SELECT * FROM admin_route_locks WHERE route_key = :route_key FOR UPDATE');
            $statement->execute(array('route_key' => $route));
            $existing = $statement->fetch();
            $existing = is_array($existing) ? $existing : null;
            if (!lock_can_take($existing, (int) $admin['id'], $tokenHash, new DateTimeImmutable('now'))) {
                $pdo->commit();
                json_response(array('ok' => true, 'acquired' => false, 'owner' => runtime_lock_owner($pdo, $route)));
            }
            $pdo->prepare('DELETE FROM admin_route_locks WHERE admin_user_id = :admin_user_id AND route_key <> :route_key')
                ->execute(array('admin_user_id' => $admin['id'], 'route_key' => $route));
            $pdo->prepare(
                'INSERT INTO admin_route_locks (route_key, admin_user_id, lock_token_hash, expires_at) ' .
                'VALUES (:route_key, :admin_user_id, :lock_token_hash, DATE_ADD(NOW(), INTERVAL 90 SECOND)) ' .
                'ON DUPLICATE KEY UPDATE admin_user_id = VALUES(admin_user_id), lock_token_hash = VALUES(lock_token_hash), expires_at = VALUES(expires_at)'
            )->execute(array('route_key' => $route, 'admin_user_id' => $admin['id'], 'lock_token_hash' => $tokenHash));
            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }
        json_response(array('ok' => true, 'acquired' => true));
    }

    if ($action === 'lock-heartbeat') {
        $statement = $pdo->prepare(
            'UPDATE admin_route_locks SET expires_at = DATE_ADD(NOW(), INTERVAL 90 SECOND) ' .
            'WHERE route_key = :route_key AND admin_user_id = :admin_user_id AND lock_token_hash = :lock_token_hash'
        );
        $statement->execute(array('route_key' => $route, 'admin_user_id' => $admin['id'], 'lock_token_hash' => $tokenHash));
        json_response(array('ok' => true, 'owned' => $statement->rowCount() > 0));
    }

    if ($action === 'lock-release') {
        $statement = $pdo->prepare(
            'DELETE FROM admin_route_locks WHERE route_key = :route_key AND admin_user_id = :admin_user_id AND lock_token_hash = :lock_token_hash'
        );
        $statement->execute(array('route_key' => $route, 'admin_user_id' => $admin['id'], 'lock_token_hash' => $tokenHash));
        json_response(array('ok' => true));
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
