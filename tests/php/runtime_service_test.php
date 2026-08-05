<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_runtime_service.php';

function check_runtime(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check_runtime(normalize_runtime_route('/admin/notices?x=1') === '/admin/notices', 'query string must be removed');
check_runtime(normalize_runtime_route('/public') === '', 'non-admin route must be rejected');
check_runtime(normalize_runtime_route(str_repeat('/admin/x', 60)) === '', 'oversized route must be rejected');

$visit = normalize_visit_payload(array(
    'path' => '/community/news#latest',
    'referrer' => 'https://search.example/path?q=1',
    'deviceType' => 'mobile',
));
check_runtime($visit['path'] === '/community/news#latest', 'safe visit path must be preserved');
check_runtime($visit['referrerHost'] === 'search.example', 'only referrer host may be stored');
check_runtime($visit['deviceType'] === 'mobile', 'known device type must be preserved');
check_runtime(normalize_visit_payload(array('path' => 'bad', 'deviceType' => 'watch'))['deviceType'] === 'unknown', 'unknown device type must be hidden');

$now = new DateTimeImmutable('2026-08-05 10:00:00');
$activeOther = array('admin_user_id' => 2, 'lock_token_hash' => hash_secret('other'), 'expires_at' => '2026-08-05 10:01:00');
check_runtime(lock_can_take(null, 1, hash_secret('mine'), $now), 'empty lock must be available');
check_runtime(!lock_can_take($activeOther, 1, hash_secret('mine'), $now), 'another active lock must block');
check_runtime(lock_can_take($activeOther, 1, hash_secret('mine'), $now->modify('+2 minutes')), 'expired lock must be available');

$log = normalize_runtime_audit_log(array(
    'id' => '7',
    'login_id' => 'admin01',
    'display_name' => 'Admin One',
    'action_key' => 'content.update',
    'target_type' => 'notices',
    'target_id' => 'n1',
    'created_at' => '2026-08-05 10:00:00',
));
check_runtime($log['id'] === 7 && $log['loginId'] === 'admin01', 'audit log must be normalized');
check_runtime(!array_key_exists('ip_hash', $log), 'private hashes must never be returned');

echo "PHP runtime service OK\n";
