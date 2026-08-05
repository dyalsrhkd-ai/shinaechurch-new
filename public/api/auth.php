<?php
declare(strict_types=1);

require_once __DIR__ . '/_auth_service.php';

function auth_repository(PDO $pdo): array
{
    return array(
        'findUser' => function (string $loginId) use ($pdo): ?array {
            $statement = $pdo->prepare(
                'SELECT id, uid, login_id, display_name, password_hash, active_yn, must_change_password, failed_login_count, locked_until ' .
                'FROM admin_users WHERE login_id = :login_id AND deleted_at IS NULL LIMIT 1'
            );
            $statement->execute(array('login_id' => $loginId));
            $row = $statement->fetch();
            return is_array($row) ? $row : null;
        },
        'recordFailure' => function (int $userId, int $count, ?string $lockedUntil) use ($pdo): void {
            $statement = $pdo->prepare(
                'UPDATE admin_users SET failed_login_count = :failed_count, locked_until = :locked_until WHERE id = :id'
            );
            $statement->execute(array('failed_count' => $count, 'locked_until' => $lockedUntil, 'id' => $userId));
        },
        'recordSuccess' => function (int $userId, string $loginAt) use ($pdo): void {
            $statement = $pdo->prepare(
                'UPDATE admin_users SET failed_login_count = 0, locked_until = NULL, last_login_at = :login_at WHERE id = :id'
            );
            $statement->execute(array('login_at' => $loginAt, 'id' => $userId));
        },
        'replaceSession' => function (int $userId, string $tokenHash, string $csrfHash, string $expiresAt) use ($pdo): void {
            $pdo->beginTransaction();
            try {
                $pdo->prepare('DELETE FROM admin_sessions WHERE admin_user_id = :admin_user_id')
                    ->execute(array('admin_user_id' => $userId));
                $statement = $pdo->prepare(
                    'INSERT INTO admin_sessions ' .
                    '(admin_user_id, token_hash, csrf_token_hash, expires_at, last_seen_at, ip_hash, user_agent_hash) ' .
                    'VALUES (:admin_user_id, :token_hash, :csrf_token_hash, :expires_at, NOW(), :ip_hash, :user_agent_hash)'
                );
                $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
                $agent = isset($_SERVER['HTTP_USER_AGENT']) ? (string) $_SERVER['HTTP_USER_AGENT'] : '';
                $statement->execute(array(
                    'admin_user_id' => $userId,
                    'token_hash' => $tokenHash,
                    'csrf_token_hash' => $csrfHash,
                    'expires_at' => $expiresAt,
                    'ip_hash' => $ip === '' ? null : private_value_hash($ip),
                    'user_agent_hash' => $agent === '' ? null : private_value_hash($agent),
                ));
                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }
        },
        'updatePassword' => function (int $userId, string $passwordHash) use ($pdo): void {
            $statement = $pdo->prepare(
                'UPDATE admin_users SET password_hash = :password_hash, must_change_password = 0 WHERE id = :id'
            );
            $statement->execute(array('password_hash' => $passwordHash, 'id' => $userId));
        },
        'invalidateOtherSessions' => function (int $userId, string $currentTokenHash) use ($pdo): void {
            $statement = $pdo->prepare(
                'DELETE FROM admin_sessions WHERE admin_user_id = :admin_user_id AND token_hash <> :token_hash'
            );
            $statement->execute(array('admin_user_id' => $userId, 'token_hash' => $currentTokenHash));
        },
    );
}

run_api(function (): void {
    $input = json_input();
    $action = request_action($input);
    $pdo = db();
    $repository = auth_repository($pdo);

    if ($action === 'login') {
        require_method('POST');
        $loginId = isset($input['loginId']) ? trim((string) $input['loginId']) : '';
        $password = isset($input['password']) ? (string) $input['password'] : '';
        if (!is_valid_login_id($loginId)) {
            api_error(invalid_credentials_message(), 401, 'INVALID_CREDENTIALS');
        }
        $config = app_config();
        $hours = isset($config['app']['session_hours']) ? (int) $config['app']['session_hours'] : 12;
        $result = auth_login($repository, $loginId, $password, new DateTimeImmutable('now'), $hours);
        if (!$result['ok']) {
            api_error($result['message'], 401, 'INVALID_CREDENTIALS');
        }

        ensure_session_started();
        session_regenerate_id(true);
        $_SESSION['admin_token'] = $result['token'];
        $_SESSION['csrf_token'] = $result['csrfToken'];
        audit_admin_action((int) $result['user']['id'], 'admin.login', 'admin_user', (string) $result['user']['id']);
        json_response(array('ok' => true, 'user' => $result['user'], 'csrfToken' => $result['csrfToken']));
    }

    if ($action === 'me') {
        require_method('GET');
        $user = require_admin();
        ensure_session_started();
        json_response(array('ok' => true, 'user' => $user, 'csrfToken' => (string) $_SESSION['csrf_token']));
    }

    if ($action === 'logout') {
        require_method('POST');
        $user = require_admin();
        require_csrf();
        $tokenHash = hash_secret((string) $_SESSION['admin_token']);
        $pdo->prepare('DELETE FROM admin_sessions WHERE token_hash = :token_hash')
            ->execute(array('token_hash' => $tokenHash));
        audit_admin_action((int) $user['id'], 'admin.logout', 'admin_user', (string) $user['id']);
        $_SESSION = array();
        session_destroy();
        json_response(array('ok' => true));
    }

    if ($action === 'change-password') {
        require_method('POST');
        $admin = require_admin();
        require_csrf();
        $statement = $pdo->prepare(
            'SELECT id, uid, login_id, display_name, password_hash, active_yn, must_change_password, failed_login_count, locked_until ' .
            'FROM admin_users WHERE id = :id AND active_yn = \'Y\' AND deleted_at IS NULL'
        );
        $statement->execute(array('id' => $admin['id']));
        $user = $statement->fetch();
        if (!is_array($user)) {
            api_error('Authentication required.', 401, 'AUTH_REQUIRED');
        }
        $result = auth_change_password(
            $repository,
            $user,
            isset($input['currentPassword']) ? (string) $input['currentPassword'] : '',
            isset($input['newPassword']) ? (string) $input['newPassword'] : '',
            hash_secret((string) $_SESSION['admin_token'])
        );
        if (!$result['ok']) {
            api_error($result['message'], 400, 'PASSWORD_CHANGE_FAILED');
        }
        audit_admin_action((int) $admin['id'], 'admin.password.change', 'admin_user', (string) $admin['id']);
        json_response(array('ok' => true));
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
