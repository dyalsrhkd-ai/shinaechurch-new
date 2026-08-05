<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_security.php';

function check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check(is_valid_login_id('admin01'), 'normal login ID must be accepted');
check(!is_valid_login_id('../admin'), 'path-like login ID must be rejected');
check(!is_valid_login_id('ab'), 'short login ID must be rejected');
check(validate_password('short') !== '', 'short password must be rejected');
check(validate_password('correct-horse-2026') === '', 'long password must be accepted');
check(strlen(hash_secret('token')) === 64, 'secret hash must be SHA-256 hex');
check(secure_equals(hash_secret('token'), hash_secret('token')), 'equal hashes must match');
check(!secure_equals(hash_secret('token'), hash_secret('other')), 'different hashes must not match');
check(public_error_message(new RuntimeException('database password leaked'), true) === 'Server error', 'production errors must be generic');

echo "PHP security helpers OK\n";
