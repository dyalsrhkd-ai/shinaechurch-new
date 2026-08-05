<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_admin_users_service.php';

function check_admin(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function admin_test_state(): array
{
    return array(
        'users' => array(
            1 => array('id' => 1, 'login_id' => 'admin01', 'display_name' => 'Admin One', 'active_yn' => 'Y', 'deleted_at' => null),
            2 => array('id' => 2, 'login_id' => 'admin02', 'display_name' => 'Admin Two', 'active_yn' => 'Y', 'deleted_at' => null),
        ),
        'nextId' => 3,
        'invalidated' => array(),
    );
}

function admin_test_repository(array &$state): array
{
    return array(
        'findById' => function (int $id) use (&$state): ?array {
            return isset($state['users'][$id]) ? $state['users'][$id] : null;
        },
        'findByLoginId' => function (string $loginId) use (&$state): ?array {
            foreach ($state['users'] as $user) {
                if ($user['login_id'] === $loginId && $user['deleted_at'] === null) {
                    return $user;
                }
            }
            return null;
        },
        'createUser' => function (array $user) use (&$state): int {
            $id = $state['nextId']++;
            $user['id'] = $id;
            $user['active_yn'] = 'Y';
            $user['deleted_at'] = null;
            $state['users'][$id] = $user;
            return $id;
        },
        'updateUser' => function (int $id, string $loginId, string $displayName) use (&$state): void {
            $state['users'][$id]['login_id'] = $loginId;
            $state['users'][$id]['display_name'] = $displayName;
        },
        'countActive' => function () use (&$state): int {
            return count(array_filter($state['users'], function (array $user): bool {
                return $user['active_yn'] === 'Y' && $user['deleted_at'] === null;
            }));
        },
        'softDelete' => function (int $id) use (&$state): void {
            $state['users'][$id]['active_yn'] = 'N';
            $state['users'][$id]['deleted_at'] = '2026-08-05 13:00:00';
        },
        'resetPassword' => function (int $id, string $passwordHash) use (&$state): void {
            $state['users'][$id]['password_hash'] = $passwordHash;
            $state['users'][$id]['must_change_password'] = 1;
        },
        'invalidateSessions' => function (int $id) use (&$state): void {
            $state['invalidated'][] = $id;
        },
    );
}

$state = admin_test_state();
$repo = admin_test_repository($state);
$duplicate = admin_create_user($repo, 'admin01', 'Duplicate', 'temporary-pass-2026');
check_admin($duplicate['ok'] === false, 'duplicate login ID must be rejected');

$created = admin_create_user($repo, 'admin03', 'Admin Three', 'temporary-pass-2026');
check_admin($created['ok'] === true && $created['id'] === 3, 'new administrator must be created');
check_admin($state['users'][3]['must_change_password'] === 1, 'temporary password must force a change');
check_admin(password_verify('temporary-pass-2026', $state['users'][3]['password_hash']), 'temporary password must be hashed');

$updated = admin_update_user($repo, 3, 'admin-three', 'Administrator Three');
check_admin($updated['ok'] === true, 'administrator details must update');
check_admin($state['users'][3]['login_id'] === 'admin-three', 'updated login ID must be stored');

$reset = admin_reset_password($repo, 3, 'new-temporary-pass-2026');
check_admin($reset['ok'] === true, 'password reset must succeed');
check_admin($state['users'][3]['must_change_password'] === 1, 'reset password must force change');
check_admin(in_array(3, $state['invalidated'], true), 'reset must invalidate existing sessions');

$selfDelete = admin_delete_user($repo, 1, 1);
check_admin($selfDelete['ok'] === false, 'current administrator must not delete itself');
$deleted = admin_delete_user($repo, 2, 1);
check_admin($deleted['ok'] === true && $state['users'][2]['active_yn'] === 'N', 'other administrator must be soft deleted');

$state = admin_test_state();
$state['users'][2]['active_yn'] = 'N';
$state['users'][2]['deleted_at'] = '2026-08-05 13:00:00';
$lastDelete = admin_delete_user(admin_test_repository($state), 1, 99);
check_admin($lastDelete['ok'] === false, 'last active administrator must not be deleted');

echo "PHP administrator account service OK\n";
