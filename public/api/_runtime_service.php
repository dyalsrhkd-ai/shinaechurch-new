<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';

function normalize_runtime_route(string $route): string
{
    $path = parse_url(trim($route), PHP_URL_PATH);
    if (!is_string($path) || strlen($path) > 255 || strpos($path, '/admin/') !== 0 || preg_match('/[\x00-\x1F\x7F]/', $path)) {
        return '';
    }
    return $path;
}

function normalize_visit_payload(array $input): array
{
    $path = isset($input['path']) ? trim((string) $input['path']) : '/';
    if ($path === '' || $path[0] !== '/' || strlen($path) > 500 || preg_match('/[\x00-\x1F\x7F]/', $path)) {
        $path = '/';
    }

    $referrer = isset($input['referrer']) ? trim((string) $input['referrer']) : '';
    $referrerHost = $referrer === '' ? '' : (string) parse_url($referrer, PHP_URL_HOST);
    if (strlen($referrerHost) > 255) {
        $referrerHost = '';
    }

    $deviceType = isset($input['deviceType']) ? (string) $input['deviceType'] : 'unknown';
    if (!in_array($deviceType, array('desktop', 'mobile', 'tablet'), true)) {
        $deviceType = 'unknown';
    }

    return array('path' => $path, 'referrerHost' => $referrerHost, 'deviceType' => $deviceType);
}

function lock_can_take(?array $existing, int $adminUserId, string $tokenHash, DateTimeImmutable $now): bool
{
    if ($existing === null) {
        return true;
    }
    if ((string) $existing['expires_at'] <= $now->format('Y-m-d H:i:s')) {
        return true;
    }
    return (int) $existing['admin_user_id'] === $adminUserId
        && hash_equals((string) $existing['lock_token_hash'], $tokenHash);
}

function normalize_runtime_audit_log(array $row): array
{
    return array(
        'id' => (int) $row['id'],
        'loginId' => isset($row['login_id']) ? (string) $row['login_id'] : '',
        'displayName' => isset($row['display_name']) ? (string) $row['display_name'] : '',
        'action' => (string) $row['action_key'],
        'targetType' => isset($row['target_type']) ? (string) $row['target_type'] : '',
        'targetId' => isset($row['target_id']) ? (string) $row['target_id'] : '',
        'createdAt' => (string) $row['created_at'],
    );
}

function normalize_runtime_visitor_log(array $row): array
{
    return array(
        'id' => (int) $row['id'],
        'path' => (string) $row['path'],
        'referrerHost' => isset($row['referrer_host']) ? (string) $row['referrer_host'] : '',
        'visitedAt' => (string) $row['visited_at'],
    );
}
