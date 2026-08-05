<?php
declare(strict_types=1);

require_once __DIR__ . '/_admin_users_service.php';

function admin_users_repository(PDO $pdo): array
{
    return array(
        'findById' => function (int $id) use ($pdo): ?array {
            $statement = $pdo->prepare('SELECT * FROM admin_users WHERE id = :id LIMIT 1');
            $statement->execute(array('id' => $id));
            $row = $statement->fetch();
            return is_array($row) ? $row : null;
        },
        'findByLoginId' => function (string $loginId) use ($pdo): ?array {
            $statement = $pdo->prepare('SELECT * FROM admin_users WHERE login_id = :login_id AND deleted_at IS NULL LIMIT 1');
            $statement->execute(array('login_id' => $loginId));
            $row = $statement->fetch();
            return is_array($row) ? $row : null;
        },
        'createUser' => function (array $user) use ($pdo): int {
            $statement = $pdo->prepare(
                'INSERT INTO admin_users (uid, login_id, display_name, password_hash, must_change_password) ' .
                'VALUES (:uid, :login_id, :display_name, :password_hash, :must_change_password)'
            );
            $statement->execute($user);
            return (int) $pdo->lastInsertId();
        },
        'updateUser' => function (int $id, string $loginId, string $displayName) use ($pdo): void {
            $statement = $pdo->prepare(
                'UPDATE admin_users SET login_id = :login_id, display_name = :display_name WHERE id = :id'
            );
            $statement->execute(array('login_id' => $loginId, 'display_name' => $displayName, 'id' => $id));
        },
        'countActive' => function () use ($pdo): int {
            return (int) $pdo->query("SELECT COUNT(*) FROM admin_users WHERE active_yn = 'Y' AND deleted_at IS NULL")->fetchColumn();
        },
        'softDelete' => function (int $id) use ($pdo): void {
            $statement = $pdo->prepare(
                "UPDATE admin_users SET active_yn = 'N', deleted_at = NOW() WHERE id = :id"
            );
            $statement->execute(array('id' => $id));
        },
        'resetPassword' => function (int $id, string $passwordHash) use ($pdo): void {
            $statement = $pdo->prepare(
                'UPDATE admin_users SET password_hash = :password_hash, must_change_password = 1, failed_login_count = 0, locked_until = NULL WHERE id = :id'
            );
            $statement->execute(array('password_hash' => $passwordHash, 'id' => $id));
        },
        'invalidateSessions' => function (int $id) use ($pdo): void {
            $pdo->prepare('DELETE FROM admin_sessions WHERE admin_user_id = :admin_user_id')
                ->execute(array('admin_user_id' => $id));
        },
    );
}

function admin_list(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT id, login_id, display_name, active_yn, must_change_password, last_login_at, created_at, updated_at ' .
        'FROM admin_users WHERE deleted_at IS NULL ORDER BY display_name, id'
    )->fetchAll();

    return array_map(function (array $row): array {
        return array(
            'id' => (int) $row['id'],
            'loginId' => (string) $row['login_id'],
            'displayName' => (string) $row['display_name'],
            'active' => $row['active_yn'] === 'Y',
            'mustChangePassword' => (bool) $row['must_change_password'],
            'lastLoginAt' => $row['last_login_at'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        );
    }, $rows);
}

run_api(function (): void {
    $input = json_input();
    $action = request_action($input);
    $admin = require_admin();
    if ($admin['mustChangePassword']) {
        api_error('Password change required.', 403, 'PASSWORD_CHANGE_REQUIRED');
    }

    $pdo = db();
    $repository = admin_users_repository($pdo);
    if ($action === 'list') {
        require_method('GET');
        json_response(array('ok' => true, 'users' => admin_list($pdo)));
    }

    require_method('POST');
    require_csrf();
    $id = isset($input['id']) ? (int) $input['id'] : 0;

    if ($action === 'create') {
        $result = admin_create_user(
            $repository,
            isset($input['loginId']) ? (string) $input['loginId'] : '',
            isset($input['displayName']) ? (string) $input['displayName'] : '',
            isset($input['temporaryPassword']) ? (string) $input['temporaryPassword'] : ''
        );
        if (!$result['ok']) {
            api_error($result['message'], 400, 'ADMIN_CREATE_FAILED');
        }
        audit_admin_action((int) $admin['id'], 'admin.user.create', 'admin_user', (string) $result['id']);
        json_response(array('ok' => true, 'id' => $result['id']), 201);
    }

    if ($action === 'update') {
        $result = admin_update_user(
            $repository,
            $id,
            isset($input['loginId']) ? (string) $input['loginId'] : '',
            isset($input['displayName']) ? (string) $input['displayName'] : ''
        );
        if (!$result['ok']) {
            api_error($result['message'], 400, 'ADMIN_UPDATE_FAILED');
        }
        audit_admin_action((int) $admin['id'], 'admin.user.update', 'admin_user', (string) $id);
        json_response(array('ok' => true));
    }

    if ($action === 'delete') {
        $result = admin_delete_user($repository, $id, (int) $admin['id']);
        if (!$result['ok']) {
            api_error($result['message'], 400, 'ADMIN_DELETE_FAILED');
        }
        audit_admin_action((int) $admin['id'], 'admin.user.delete', 'admin_user', (string) $id);
        json_response(array('ok' => true));
    }

    if ($action === 'reset-password') {
        $result = admin_reset_password(
            $repository,
            $id,
            isset($input['temporaryPassword']) ? (string) $input['temporaryPassword'] : ''
        );
        if (!$result['ok']) {
            api_error($result['message'], 400, 'ADMIN_RESET_FAILED');
        }
        audit_admin_action((int) $admin['id'], 'admin.user.password.reset', 'admin_user', (string) $id);
        json_response(array('ok' => true));
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
