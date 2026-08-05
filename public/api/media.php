<?php
declare(strict_types=1);

require_once __DIR__ . '/_media_service.php';

run_api(function (): void {
    require_method('POST');
    $admin = require_admin();
    if ($admin['mustChangePassword']) {
        api_error('Password change required.', 403, 'PASSWORD_CHANGE_REQUIRED');
    }
    require_csrf();

    $action = isset($_GET['action']) ? (string) $_GET['action'] : '';
    $config = app_config();
    $uploadConfig = isset($config['uploads']) && is_array($config['uploads']) ? $config['uploads'] : array();
    $root = isset($uploadConfig['root']) ? rtrim((string) $uploadConfig['root'], '/\\') : '';
    $publicBaseUrl = isset($uploadConfig['public_base_url']) ? rtrim((string) $uploadConfig['public_base_url'], '/') : '/uploads';
    if ($root === '') {
        throw new RuntimeException('Upload directory is not configured.');
    }

    if ($action === 'upload') {
        $folder = isset($_POST['folder']) ? (string) $_POST['folder'] : '';
        $file = isset($_FILES['file']) && is_array($_FILES['file']) ? $_FILES['file'] : null;
        if (!is_array($file) || (int) $file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file((string) $file['tmp_name'])) {
            api_error('Upload did not complete.', 400, 'UPLOAD_FAILED');
        }
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file((string) $file['tmp_name']);
        $validation = validate_media_upload($folder, (string) $file['name'], $mime, (int) $file['size']);
        if ($validation !== '') {
            api_error($validation, 400, 'INVALID_FILE');
        }

        $path = generated_media_path($folder, (string) $file['name'], bin2hex(random_bytes(6)), gmdate('Ymd'));
        $insideUploads = substr($path, strlen('uploads/'));
        $target = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $insideUploads);
        $directory = dirname($target);
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new RuntimeException('Upload directory could not be created.');
        }
        if (!move_uploaded_file((string) $file['tmp_name'], $target)) {
            throw new RuntimeException('Uploaded file could not be stored.');
        }
        $url = $publicBaseUrl . '/' . str_replace(DIRECTORY_SEPARATOR, '/', $insideUploads);
        audit_admin_action((int) $admin['id'], 'media.upload', 'file', $path, array('bytes' => (int) $file['size']));
        json_response(array('ok' => true, 'file' => array('url' => $url, 'path' => $path)), 201);
    }

    if ($action === 'delete') {
        $input = json_input();
        $path = isset($input['path']) ? (string) $input['path'] : '';
        if (!is_safe_media_delete_path($path)) {
            api_error('File path is not allowed.', 400, 'INVALID_FILE_PATH');
        }
        $insideUploads = substr($path, strlen('uploads/'));
        $target = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $insideUploads);
        if (is_file($target)) {
            $rootReal = realpath($root);
            $targetReal = realpath($target);
            if (!is_string($rootReal) || !is_string($targetReal) || strpos($targetReal, $rootReal . DIRECTORY_SEPARATOR) !== 0) {
                api_error('File path is not allowed.', 400, 'INVALID_FILE_PATH');
            }
            if (!unlink($targetReal)) {
                throw new RuntimeException('File could not be deleted.');
            }
        }
        audit_admin_action((int) $admin['id'], 'media.delete', 'file', $path);
        json_response(array('ok' => true));
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
