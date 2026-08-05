<?php
declare(strict_types=1);

function app_config(): array
{
    static $config;

    if (is_array($config)) {
        return $config;
    }

    $path = getenv('SHINAE_PRIVATE_CONFIG');
    if (!is_string($path) || $path === '') {
        $documentRoot = isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] !== ''
            ? (string) $_SERVER['DOCUMENT_ROOT']
            : dirname(__DIR__, 2);
        $path = dirname($documentRoot) . DIRECTORY_SEPARATOR . 'shinae-private.php';
    }

    if (!is_file($path)) {
        throw new RuntimeException('Private configuration file is missing.');
    }

    $loaded = require $path;
    if (!is_array($loaded)) {
        throw new RuntimeException('Private configuration must return an array.');
    }

    $config = $loaded;
    return $config;
}

function db(): PDO
{
    static $pdo;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = app_config();
    $database = isset($config['db']) && is_array($config['db']) ? $config['db'] : array();
    foreach (array('dsn', 'user', 'password') as $key) {
        if (!isset($database[$key]) || !is_string($database[$key])) {
            throw new RuntimeException('Database configuration is incomplete.');
        }
    }

    $pdo = new PDO($database['dsn'], $database['user'], $database['password'], array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ));
    return $pdo;
}

function ensure_session_started(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $config = app_config();
    $app = isset($config['app']) && is_array($config['app']) ? $config['app'] : array();
    session_name(isset($app['session_name']) ? (string) $app['session_name'] : 'shinae_admin');
    session_set_cookie_params(array(
        'lifetime' => 0,
        'path' => '/',
        'secure' => !isset($app['secure_cookie']) || (bool) $app['secure_cookie'],
        'httponly' => true,
        'samesite' => 'Lax',
    ));
    session_start();
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return array();
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || json_last_error() !== JSON_ERROR_NONE) {
        api_error('Invalid JSON body.', 400, 'INVALID_JSON');
    }
    return $decoded;
}

function json_response(array $body, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_error(string $message, int $status, string $code): void
{
    json_response(array(
        'ok' => false,
        'error' => array('code' => $code, 'message' => $message),
    ), $status);
}

function require_method(string $method): void
{
    $actual = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : '';
    if ($actual !== strtoupper($method)) {
        api_error('Method not allowed.', 405, 'METHOD_NOT_ALLOWED');
    }
}

function request_action(array $input): string
{
    if (isset($_GET['action'])) {
        return trim((string) $_GET['action']);
    }
    return isset($input['action']) ? trim((string) $input['action']) : '';
}

function public_error_message(Throwable $error, bool $production): string
{
    return $production ? 'Server error' : $error->getMessage();
}

function run_api(callable $handler): void
{
    try {
        $handler();
    } catch (Throwable $error) {
        error_log($error->getMessage());
        $config = app_config();
        $app = isset($config['app']) && is_array($config['app']) ? $config['app'] : array();
        $production = !isset($app['environment']) || $app['environment'] === 'production';
        api_error(public_error_message($error, $production), 500, 'SERVER_ERROR');
    }
}
