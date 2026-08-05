<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_auth_service.php';

function check_auth(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function auth_test_state(): array
{
    return array(
        'user' => array(
            'id' => 7,
            'uid' => 'test-admin-uid',
            'login_id' => 'admin01',
            'display_name' => 'Test Admin',
            'password_hash' => password_hash('correct-horse-2026', PASSWORD_DEFAULT),
            'active_yn' => 'Y',
            'must_change_password' => 0,
            'failed_login_count' => 0,
            'locked_until' => null,
        ),
        'sessions' => array('old-session'),
        'passwordUpdates' => 0,
    );
}

function auth_test_repository(array &$state): array
{
    return array(
        'findUser' => function (string $loginId) use (&$state): ?array {
            return $state['user']['login_id'] === $loginId ? $state['user'] : null;
        },
        'recordFailure' => function (int $userId, int $count, ?string $lockedUntil) use (&$state): void {
            $state['user']['failed_login_count'] = $count;
            $state['user']['locked_until'] = $lockedUntil;
        },
        'recordSuccess' => function (int $userId, string $loginAt) use (&$state): void {
            $state['user']['failed_login_count'] = 0;
            $state['user']['locked_until'] = null;
            $state['user']['last_login_at'] = $loginAt;
        },
        'replaceSession' => function (int $userId, string $tokenHash, string $csrfHash, string $expiresAt) use (&$state): void {
            $state['sessions'] = array(array(
                'tokenHash' => $tokenHash,
                'csrfHash' => $csrfHash,
                'expiresAt' => $expiresAt,
            ));
        },
        'updatePassword' => function (int $userId, string $passwordHash) use (&$state): void {
            $state['user']['password_hash'] = $passwordHash;
            $state['user']['must_change_password'] = 0;
            $state['passwordUpdates']++;
        },
        'invalidateOtherSessions' => function (int $userId, string $currentTokenHash) use (&$state): void {
            $state['sessions'] = array_values(array_filter(
                $state['sessions'],
                function ($session) use ($currentTokenHash): bool {
                    return is_array($session) && isset($session['tokenHash']) && $session['tokenHash'] === $currentTokenHash;
                }
            ));
        },
    );
}

$now = new DateTimeImmutable('2026-08-05 12:00:00');
$state = auth_test_state();
$repo = auth_test_repository($state);
$result = auth_login($repo, 'admin01', 'correct-horse-2026', $now, 12);
check_auth($result['ok'] === true, 'correct credentials must log in');
check_auth(count($state['sessions']) === 1 && $state['sessions'][0] !== 'old-session', 'login must rotate the stored session');
check_auth($result['user']['loginId'] === 'admin01', 'login must return a normalized administrator');
check_auth(strlen($result['token']) === 64 && strlen($result['csrfToken']) === 64, 'login must issue random secrets');

$state = auth_test_state();
$repo = auth_test_repository($state);
for ($attempt = 1; $attempt <= 5; $attempt++) {
    $result = auth_login($repo, 'admin01', 'wrong-password', $now, 12);
    check_auth($result['ok'] === false, 'wrong password must fail');
    check_auth($result['message'] === invalid_credentials_message(), 'login failure must be generic');
}
check_auth($state['user']['failed_login_count'] === 5, 'five failures must be recorded');
check_auth($state['user']['locked_until'] === '2026-08-05 12:15:00', 'fifth failure must lock for 15 minutes');

$state = auth_test_state();
$state['user']['active_yn'] = 'N';
$result = auth_login(auth_test_repository($state), 'admin01', 'correct-horse-2026', $now, 12);
check_auth($result['ok'] === false, 'inactive account must be rejected');

$state = auth_test_state();
$state['user']['locked_until'] = '2026-08-05 12:10:00';
$result = auth_login(auth_test_repository($state), 'admin01', 'correct-horse-2026', $now, 12);
check_auth($result['ok'] === false, 'locked account must be rejected');

$state = auth_test_state();
$state['sessions'] = array(array('tokenHash' => hash_secret('current')), array('tokenHash' => hash_secret('other')));
$repo = auth_test_repository($state);
$change = auth_change_password($repo, $state['user'], 'wrong-current', 'new-correct-horse-2026', hash_secret('current'));
check_auth($change['ok'] === false, 'normal password change must verify the current password');
$state['user']['must_change_password'] = 1;
$change = auth_change_password($repo, $state['user'], '', 'new-correct-horse-2026', hash_secret('current'));
check_auth($change['ok'] === true, 'forced password change must not require the temporary password again');
check_auth($state['passwordUpdates'] === 1, 'password must be updated once');
check_auth(count($state['sessions']) === 1 && $state['sessions'][0]['tokenHash'] === hash_secret('current'), 'password change must invalidate other sessions');

echo "PHP authentication service OK\n";
