<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';

function admin_service_error(string $message): array
{
    return array('ok' => false, 'message' => $message);
}

function valid_display_name(string $displayName): bool
{
    $length = function_exists('mb_strlen') ? mb_strlen($displayName, 'UTF-8') : strlen($displayName);
    return $displayName !== '' && $length <= 100;
}

function uuid_v4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}

function admin_create_user(array $repository, string $loginId, string $displayName, string $temporaryPassword): array
{
    $loginId = trim($loginId);
    $displayName = trim($displayName);
    if (!is_valid_login_id($loginId)) {
        return admin_service_error('Invalid login ID.');
    }
    if (!valid_display_name($displayName)) {
        return admin_service_error('Display name is required.');
    }
    $passwordError = validate_password($temporaryPassword);
    if ($passwordError !== '') {
        return admin_service_error($passwordError);
    }
    if (is_array($repository['findByLoginId']($loginId))) {
        return admin_service_error('Login ID already exists.');
    }

    $id = $repository['createUser'](array(
        'uid' => uuid_v4(),
        'login_id' => $loginId,
        'display_name' => $displayName,
        'password_hash' => password_hash($temporaryPassword, PASSWORD_DEFAULT),
        'must_change_password' => 1,
    ));
    return array('ok' => true, 'id' => $id);
}

function admin_update_user(array $repository, int $id, string $loginId, string $displayName): array
{
    $loginId = trim($loginId);
    $displayName = trim($displayName);
    $target = $repository['findById']($id);
    if (!is_array($target) || $target['active_yn'] !== 'Y' || $target['deleted_at'] !== null) {
        return admin_service_error('Administrator not found.');
    }
    if (!is_valid_login_id($loginId)) {
        return admin_service_error('Invalid login ID.');
    }
    if (!valid_display_name($displayName)) {
        return admin_service_error('Display name is required.');
    }
    $duplicate = $repository['findByLoginId']($loginId);
    if (is_array($duplicate) && (int) $duplicate['id'] !== $id) {
        return admin_service_error('Login ID already exists.');
    }

    $repository['updateUser']($id, $loginId, $displayName);
    return array('ok' => true);
}

function admin_delete_user(array $repository, int $id, int $currentAdminId): array
{
    if ($id === $currentAdminId) {
        return admin_service_error('You cannot delete your own account.');
    }
    $target = $repository['findById']($id);
    if (!is_array($target) || $target['active_yn'] !== 'Y' || $target['deleted_at'] !== null) {
        return admin_service_error('Administrator not found.');
    }
    if ($repository['countActive']() <= 1) {
        return admin_service_error('The last active administrator cannot be deleted.');
    }

    $repository['softDelete']($id);
    $repository['invalidateSessions']($id);
    return array('ok' => true);
}

function admin_reset_password(array $repository, int $id, string $temporaryPassword): array
{
    $target = $repository['findById']($id);
    if (!is_array($target) || $target['active_yn'] !== 'Y' || $target['deleted_at'] !== null) {
        return admin_service_error('Administrator not found.');
    }
    $passwordError = validate_password($temporaryPassword);
    if ($passwordError !== '') {
        return admin_service_error($passwordError);
    }

    $repository['resetPassword']($id, password_hash($temporaryPassword, PASSWORD_DEFAULT));
    $repository['invalidateSessions']($id);
    return array('ok' => true);
}
