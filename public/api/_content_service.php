<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';

final class ContentVersionConflict extends RuntimeException
{
}

function allowed_content_collections(): array
{
    return array(
        'settings', 'siteAssets', 'pageContents', 'specialContents',
        'gallery', 'videos', 'choirVideos', 'choirGallery', 'slides',
        'notices', 'bulletins', 'news', 'newcomers', 'missions', 'farm',
        'farm_info', 'sundaySermons', 'specialSermons', 'history', 'staff',
        'staff_settings', 'worship', 'schedule', 'location', 'facility', 'greeting',
    );
}

function is_allowed_content_collection(string $collection): bool
{
    return in_array($collection, allowed_content_collections(), true);
}

function is_valid_content_document_id(string $documentId): bool
{
    return preg_match('/\A[A-Za-z0-9_-]{1,128}\z/D', $documentId) === 1;
}

function validate_content_data(array $data): string
{
    if (array_key_exists('id', $data) || array_key_exists('_version', $data)) {
        return 'Reserved document fields are not allowed.';
    }
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json) || json_last_error() !== JSON_ERROR_NONE) {
        return 'Document data is not valid JSON.';
    }
    if (strlen($json) > 1048576) {
        return 'Document data is too large.';
    }
    return '';
}

function merge_content_document(array $current, array $patch): array
{
    return array_replace($current, $patch);
}

function content_sort_metadata(array $data): array
{
    $order = isset($data['order']) && is_numeric($data['order']) ? (int) $data['order'] : 0;
    $dateValue = isset($data['date']) ? $data['date'] : (isset($data['createdAt']) ? $data['createdAt'] : null);
    $date = null;
    if (is_string($dateValue) && trim($dateValue) !== '') {
        try {
            $parsed = new DateTimeImmutable($dateValue);
            $date = $parsed->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        } catch (Throwable $error) {
            $date = null;
        }
    }
    return array('order' => $order, 'date' => $date);
}

function assert_content_version(int $currentVersion, ?int $expectedVersion): void
{
    if ($expectedVersion !== null && $currentVersion !== $expectedVersion) {
        throw new ContentVersionConflict('The document was changed by another administrator.');
    }
}

function validate_reorder_rows(array $rows): string
{
    $ids = array();
    foreach ($rows as $row) {
        if (!is_array($row) || !isset($row['id'], $row['order'])) {
            return 'Each reorder row requires id and order.';
        }
        $id = (string) $row['id'];
        if (!is_valid_content_document_id($id) || !is_numeric($row['order'])) {
            return 'Invalid reorder row.';
        }
        if (isset($ids[$id])) {
            return 'Duplicate document ID in reorder request.';
        }
        $ids[$id] = true;
    }
    return '';
}

function decode_content_row(array $row): array
{
    $data = json_decode((string) $row['data_json'], true);
    if (!is_array($data)) {
        $data = array();
    }
    $data['id'] = (string) $row['document_id'];
    $data['_version'] = (int) $row['version_no'];
    return $data;
}

function content_json(array $data): string
{
    $error = validate_content_data($data);
    if ($error !== '') {
        throw new InvalidArgumentException($error);
    }
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) {
        throw new InvalidArgumentException('Document data is not valid JSON.');
    }
    return $json;
}
