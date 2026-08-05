<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

function is_valid_login_id(string $loginId): bool
{
    return preg_match('/\A[A-Za-z0-9][A-Za-z0-9._-]{3,63}\z/D', $loginId) === 1;
}

function validate_password(string $password): string
{
    $length = strlen($password);
    if ($length < 10) {
        return 'Password must be at least 10 characters.';
    }
    if ($length > 128) {
        return 'Password is too long.';
    }
    return '';
}

function hash_secret(string $secret): string
{
    return hash('sha256', $secret);
}

function secure_equals(string $known, string $provided): bool
{
    return hash_equals($known, $provided);
}

function random_secret(): string
{
    return bin2hex(random_bytes(32));
}

function private_value_hash(string $value): string
{
    $config = app_config();
    $secret = isset($config['app']['secret']) ? (string) $config['app']['secret'] : '';
    if (strlen($secret) < 32) {
        throw new RuntimeException('Application secret is not configured.');
    }
    return hash_hmac('sha256', $value, $secret);
}

function require_admin(): array
{
    ensure_session_started();
    $token = isset($_SESSION['admin_token']) ? (string) $_SESSION['admin_token'] : '';
    if ($token === '') {
        api_error('Authentication required.', 401, 'AUTH_REQUIRED');
    }

    $statement = db()->prepare(
        "SELECT u.id, u.uid, u.login_id, u.display_name, u.must_change_password\n" .
        "  FROM admin_sessions s\n" .
        "  JOIN admin_users u ON u.id = s.admin_user_id\n" .
        " WHERE s.token_hash = :token_hash\n" .
        "   AND s.expires_at > NOW()\n" .
        "   AND u.active_yn = 'Y'\n" .
        "   AND u.deleted_at IS NULL"
    );
    $statement->execute(array('token_hash' => hash_secret($token)));
    $row = $statement->fetch();
    if (!is_array($row)) {
        $_SESSION = array();
        api_error('Authentication required.', 401, 'AUTH_REQUIRED');
    }

    db()->prepare('UPDATE admin_sessions SET last_seen_at = NOW() WHERE token_hash = :token_hash')
        ->execute(array('token_hash' => hash_secret($token)));

    return array(
        'id' => (int) $row['id'],
        'uid' => (string) $row['uid'],
        'loginId' => (string) $row['login_id'],
        'displayName' => (string) $row['display_name'],
        'mustChangePassword' => (bool) $row['must_change_password'],
    );
}

function require_csrf(): void
{
    ensure_session_started();
    $expected = isset($_SESSION['csrf_token']) ? (string) $_SESSION['csrf_token'] : '';
    $provided = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? (string) $_SERVER['HTTP_X_CSRF_TOKEN'] : '';
    if ($expected === '' || $provided === '' || !secure_equals($expected, $provided)) {
        api_error('Invalid security token.', 403, 'INVALID_CSRF');
    }
}

function audit_admin_action(int $adminUserId, string $action, ?string $targetType = null, ?string $targetId = null, array $details = array()): void
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
    $statement = db()->prepare(
        'INSERT INTO admin_audit_logs (admin_user_id, action_key, target_type, target_id, detail_json, ip_hash) ' .
        'VALUES (:admin_user_id, :action_key, :target_type, :target_id, :detail_json, :ip_hash)'
    );
    $statement->execute(array(
        'admin_user_id' => $adminUserId,
        'action_key' => $action,
        'target_type' => $targetType,
        'target_id' => $targetId,
        'detail_json' => $details === array() ? null : json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'ip_hash' => $ip === '' ? null : private_value_hash($ip),
    ));
}
