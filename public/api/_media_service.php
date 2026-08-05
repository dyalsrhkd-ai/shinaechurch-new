<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';

function allowed_media_folder_roots(): array
{
    return array(
        'slides', 'gallery', 'news', 'notices', 'bulletins', 'facility',
        'farm', 'greeting', 'missions', 'newcomers', 'page-content',
        'site-assets', 'staff',
    );
}

function normalized_media_folder(string $folder): string
{
    return trim(str_replace('\\', '/', $folder), '/');
}

function is_allowed_media_folder(string $folder): bool
{
    $folder = normalized_media_folder($folder);
    if ($folder === '' || preg_match('/\A[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\z/D', $folder) !== 1) {
        return false;
    }
    $root = explode('/', $folder)[0];
    return in_array($root, allowed_media_folder_roots(), true);
}

function media_extension_policy(string $extension): ?array
{
    $images = array(
        'jpg' => array('image/jpeg'),
        'jpeg' => array('image/jpeg'),
        'png' => array('image/png'),
    );
    $documents = array(
        'pdf' => array('application/pdf'),
        'hwp' => array('application/x-hwp', 'application/haansofthwp', 'application/vnd.hancom.hwp', 'application/octet-stream'),
        'hwpx' => array('application/vnd.hancom.hwpx', 'application/zip', 'application/octet-stream'),
        'doc' => array('application/msword', 'application/octet-stream'),
        'docx' => array('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'),
        'xls' => array('application/vnd.ms-excel', 'application/octet-stream'),
        'xlsx' => array('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/octet-stream'),
        'ppt' => array('application/vnd.ms-powerpoint', 'application/octet-stream'),
        'pptx' => array('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/octet-stream'),
    );
    if (isset($images[$extension])) {
        return array('mimes' => $images[$extension], 'maxBytes' => 10 * 1024 * 1024);
    }
    if (isset($documents[$extension])) {
        return array('mimes' => $documents[$extension], 'maxBytes' => 200 * 1024 * 1024);
    }
    return null;
}

function validate_media_upload(string $folder, string $originalName, string $mime, int $size): string
{
    if (!is_allowed_media_folder($folder)) {
        return 'Upload folder is not allowed.';
    }
    $extension = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
    $policy = media_extension_policy($extension);
    if (!is_array($policy)) {
        return 'File extension is not allowed.';
    }
    if ($size <= 0 || $size > $policy['maxBytes']) {
        return 'File size is not allowed.';
    }
    if (!in_array(strtolower($mime), $policy['mimes'], true)) {
        return 'File type does not match its extension.';
    }
    return '';
}

function generated_media_path(string $folder, string $originalName, string $randomHex, string $date): string
{
    $extension = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
    return 'uploads/' . normalized_media_folder($folder) . '/' . $date . '_' . strtolower($randomHex) . '.' . $extension;
}

function is_safe_media_delete_path(string $path): bool
{
    $path = str_replace('\\', '/', trim($path));
    if (strpos($path, 'uploads/') !== 0 || strpos($path, '..') !== false) {
        return false;
    }
    $inside = substr($path, strlen('uploads/'));
    $lastSlash = strrpos($inside, '/');
    if ($lastSlash === false) {
        return false;
    }
    $folder = substr($inside, 0, $lastSlash);
    $filename = substr($inside, $lastSlash + 1);
    return is_allowed_media_folder($folder)
        && preg_match('/\A[A-Za-z0-9_-]+\.[A-Za-z0-9]+\z/D', $filename) === 1;
}
