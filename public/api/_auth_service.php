<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';

function invalid_credentials_message(): string
{
    return 'Invalid login ID or password.';
}

function normalized_admin(array $user): array
{
    return array(
        'id' => (int) $user['id'],
        'uid' => (string) $user['uid'],
        'loginId' => (string) $user['login_id'],
        'displayName' => (string) $user['display_name'],
        'mustChangePassword' => (bool) $user['must_change_password'],
    );
}

function auth_login(array $repository, string $loginId, string $password, DateTimeImmutable $now, int $sessionHours): array
{
    $user = $repository['findUser']($loginId);
    if (!is_array($user) || $user['active_yn'] !== 'Y') {
        return array('ok' => false, 'message' => invalid_credentials_message());
    }

    if (!empty($user['locked_until']) && new DateTimeImmutable((string) $user['locked_until']) > $now) {
        return array('ok' => false, 'message' => invalid_credentials_message());
    }

    if (!password_verify($password, (string) $user['password_hash'])) {
        $failureCount = min(65535, (int) $user['failed_login_count'] + 1);
        $lockedUntil = $failureCount >= 5 ? $now->modify('+15 minutes')->format('Y-m-d H:i:s') : null;
        $repository['recordFailure']((int) $user['id'], $failureCount, $lockedUntil);
        return array('ok' => false, 'message' => invalid_credentials_message());
    }

    $token = random_secret();
    $csrfToken = random_secret();
    $expiresAt = $now->modify('+' . max(1, $sessionHours) . ' hours')->format('Y-m-d H:i:s');
    $repository['recordSuccess']((int) $user['id'], $now->format('Y-m-d H:i:s'));
    $repository['replaceSession'](
        (int) $user['id'],
        hash_secret($token),
        hash_secret($csrfToken),
        $expiresAt
    );

    return array(
        'ok' => true,
        'user' => normalized_admin($user),
        'token' => $token,
        'csrfToken' => $csrfToken,
        'expiresAt' => $expiresAt,
    );
}

function auth_change_password(array $repository, array $user, string $currentPassword, string $newPassword, string $currentTokenHash): array
{
    $passwordError = validate_password($newPassword);
    if ($passwordError !== '') {
        return array('ok' => false, 'message' => $passwordError);
    }

    if (!(bool) $user['must_change_password'] && !password_verify($currentPassword, (string) $user['password_hash'])) {
        return array('ok' => false, 'message' => 'Current password is incorrect.');
    }

    $repository['updatePassword']((int) $user['id'], password_hash($newPassword, PASSWORD_DEFAULT));
    $repository['invalidateOtherSessions']((int) $user['id'], $currentTokenHash);
    return array('ok' => true);
}
