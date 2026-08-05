<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_media_service.php';

function check_media(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check_media(is_allowed_media_folder('gallery'), 'known media folder must pass');
check_media(is_allowed_media_folder('missions/domestic'), 'safe child folder must pass');
check_media(!is_allowed_media_folder('../gallery'), 'path traversal folder must fail');
check_media(!is_allowed_media_folder('unknown'), 'unknown folder must fail');

check_media(validate_media_upload('gallery', 'photo.jpg', 'image/jpeg', 1024) === '', 'valid image must pass');
check_media(validate_media_upload('notices', 'document.pdf', 'application/pdf', 1024) === '', 'valid document must pass');
check_media(validate_media_upload('gallery', 'script.php', 'text/x-php', 10) !== '', 'executable extension must fail');
check_media(validate_media_upload('gallery', 'fake.jpg', 'text/plain', 10) !== '', 'wrong MIME must fail');
check_media(validate_media_upload('gallery', 'huge.png', 'image/png', 10485761) !== '', 'oversized image must fail');

$path = generated_media_path('page-content/home', '교회 사진.PNG', 'abcdef123456', '20260805');
check_media($path === 'uploads/page-content/home/20260805_abcdef123456.png', 'generated path must be stable and safe');
check_media(is_safe_media_delete_path($path), 'generated path must be deletable');
check_media(!is_safe_media_delete_path('uploads/gallery/../../config.php'), 'delete traversal must fail');
check_media(!is_safe_media_delete_path('config.php'), 'delete outside uploads must fail');

echo "PHP media service OK\n";
