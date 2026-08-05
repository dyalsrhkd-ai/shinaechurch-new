<?php
declare(strict_types=1);

return array(
    'db' => array(
        'dsn' => 'mysql:host=DB_HOST;dbname=DB_NAME;charset=utf8mb4',
        'user' => 'DB_USER',
        'password' => 'DB_PASSWORD',
    ),
    'app' => array(
        'environment' => 'production',
        'secret' => 'REPLACE_WITH_RANDOM_64_CHARACTER_SECRET',
        'session_name' => 'shinae_admin',
        'secure_cookie' => true,
        'session_hours' => 12,
    ),
    'uploads' => array(
        'root' => 'ABSOLUTE_UPLOAD_DIRECTORY',
        'public_base_url' => '/uploads',
    ),
    'youtube' => array(
        'api_keys' => array(),
    ),
);
