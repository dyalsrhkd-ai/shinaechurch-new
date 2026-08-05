<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_content_service.php';

function check_content(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check_content(is_allowed_content_collection('notices'), 'public collection must be allowlisted');
check_content(!is_allowed_content_collection('admin_sessions'), 'operational table must not be a content collection');
check_content(is_valid_content_document_id('Abc_123-main'), 'normal document ID must be accepted');
check_content(!is_valid_content_document_id('../secret'), 'path-like document ID must be rejected');
check_content(validate_content_data(array('title' => 'Notice')) === '', 'object-like data must be accepted');
check_content(validate_content_data(array('_version' => 3)) !== '', 'reserved keys must be rejected');
check_content(validate_content_data(array('body' => str_repeat('x', 1048577))) !== '', 'oversized JSON must be rejected');

$merged = merge_content_document(
    array('title' => 'Old', 'nested' => array('a' => 1), 'keep' => true),
    array('title' => 'New', 'nested' => array('b' => 2))
);
check_content($merged['title'] === 'New', 'patch must replace top-level values');
check_content($merged['nested'] === array('b' => 2), 'patch must use Firestore-style shallow merge');
check_content($merged['keep'] === true, 'patch must preserve untouched values');

$sort = content_sort_metadata(array('order' => 42, 'date' => '2026-08-05T09:30:00+09:00'));
check_content($sort['order'] === 42, 'order metadata must be extracted');
check_content($sort['date'] === '2026-08-05 00:30:00', 'date metadata must be normalized to UTC');

assert_content_version(4, 4);
$conflicted = false;
try {
    assert_content_version(4, 3);
} catch (ContentVersionConflict $error) {
    $conflicted = true;
}
check_content($conflicted, 'stale version must raise a conflict');

check_content(validate_reorder_rows(array(
    array('id' => 'one', 'order' => 0),
    array('id' => 'two', 'order' => 1),
)) === '', 'valid reorder rows must pass');
check_content(validate_reorder_rows(array(
    array('id' => 'same', 'order' => 0),
    array('id' => 'same', 'order' => 1),
)) !== '', 'duplicate reorder IDs must fail');

echo "PHP content service OK\n";
