<?php
declare(strict_types=1);

require_once __DIR__ . '/_content_service.php';

function content_row(PDO $pdo, string $collection, string $documentId, bool $forUpdate = false): ?array
{
    $sql = 'SELECT document_id, data_json, version_no FROM content_documents ' .
        'WHERE collection_key = :collection_key AND document_id = :document_id AND deleted_at IS NULL';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }
    $statement = $pdo->prepare($sql);
    $statement->execute(array('collection_key' => $collection, 'document_id' => $documentId));
    $row = $statement->fetch();
    return is_array($row) ? $row : null;
}

function content_values(array $data): array
{
    $sort = content_sort_metadata($data);
    return array(
        'data_json' => content_json($data),
        'sort_order' => $sort['order'],
        'sort_date' => $sort['date'],
    );
}

function require_content_collection(string $collection): void
{
    if (!is_allowed_content_collection($collection)) {
        api_error('Unknown content collection.', 404, 'UNKNOWN_COLLECTION');
    }
}

function require_content_document_id(string $documentId): void
{
    if (!is_valid_content_document_id($documentId)) {
        api_error('Invalid document ID.', 400, 'INVALID_DOCUMENT_ID');
    }
}

run_api(function (): void {
    if ((isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : '') === 'GET') {
        $collection = isset($_GET['collection']) ? trim((string) $_GET['collection']) : '';
        require_content_collection($collection);
        $pdo = db();

        if (isset($_GET['id']) && (string) $_GET['id'] !== '') {
            $documentId = (string) $_GET['id'];
            require_content_document_id($documentId);
            $row = content_row($pdo, $collection, $documentId);
            if (!is_array($row)) {
                api_error('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
            }
            json_response(array('ok' => true, 'document' => decode_content_row($row)));
        }

        $sortKey = isset($_GET['sort']) && $_GET['sort'] === 'date' ? 'sort_date' : 'sort_order';
        $direction = isset($_GET['direction']) && strtolower((string) $_GET['direction']) === 'asc' ? 'ASC' : 'DESC';
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 1000;
        $limit = max(1, min(5000, $limit));
        $sql = 'SELECT document_id, data_json, version_no FROM content_documents ' .
            'WHERE collection_key = :collection_key AND deleted_at IS NULL ' .
            'ORDER BY ' . $sortKey . ' ' . $direction . ', document_id ASC LIMIT ' . $limit;
        $statement = $pdo->prepare($sql);
        $statement->execute(array('collection_key' => $collection));
        $documents = array_map('decode_content_row', $statement->fetchAll());
        json_response(array('ok' => true, 'documents' => $documents));
    }

    require_method('POST');
    $input = json_input();
    $action = request_action($input);
    $admin = require_admin();
    if ($admin['mustChangePassword']) {
        api_error('Password change required.', 403, 'PASSWORD_CHANGE_REQUIRED');
    }
    require_csrf();

    $collection = isset($input['collection']) ? trim((string) $input['collection']) : '';
    require_content_collection($collection);
    $pdo = db();
    $documentId = isset($input['id']) ? (string) $input['id'] : '';
    $data = isset($input['data']) && is_array($input['data']) ? $input['data'] : array();
    $expectedVersion = isset($input['versionNo']) ? (int) $input['versionNo'] : null;

    try {
        if ($action === 'create') {
            $documentId = bin2hex(random_bytes(10));
            $now = gmdate('c');
            if (!isset($data['createdAt'])) {
                $data['createdAt'] = $now;
            }
            $data['updatedAt'] = $now;
            $values = content_values($data);
            $statement = $pdo->prepare(
                'INSERT INTO content_documents ' .
                '(collection_key, document_id, data_json, sort_order, sort_date, version_no) ' .
                'VALUES (:collection_key, :document_id, :data_json, :sort_order, :sort_date, 1)'
            );
            $statement->execute(array_merge($values, array(
                'collection_key' => $collection,
                'document_id' => $documentId,
            )));
            $row = content_row($pdo, $collection, $documentId);
            audit_admin_action((int) $admin['id'], 'content.create', $collection, $documentId);
            json_response(array('ok' => true, 'document' => decode_content_row($row)), 201);
        }

        if ($action === 'upsert' || $action === 'update' || $action === 'delete') {
            require_content_document_id($documentId);
            $pdo->beginTransaction();
            $row = content_row($pdo, $collection, $documentId, true);

            if ($action === 'delete') {
                if (!is_array($row)) {
                    $pdo->rollBack();
                    api_error('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
                }
                assert_content_version((int) $row['version_no'], $expectedVersion);
                $statement = $pdo->prepare(
                    'UPDATE content_documents SET deleted_at = NOW(), version_no = version_no + 1 ' .
                    'WHERE collection_key = :collection_key AND document_id = :document_id'
                );
                $statement->execute(array('collection_key' => $collection, 'document_id' => $documentId));
                $pdo->commit();
                audit_admin_action((int) $admin['id'], 'content.delete', $collection, $documentId);
                json_response(array('ok' => true));
            }

            if ($action === 'update' && !is_array($row)) {
                $pdo->rollBack();
                api_error('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
            }

            $nextData = $data;
            $version = 1;
            if (is_array($row)) {
                assert_content_version((int) $row['version_no'], $expectedVersion);
                $currentData = json_decode((string) $row['data_json'], true);
                if (!is_array($currentData)) {
                    $currentData = array();
                }
                $nextData = $action === 'update' ? merge_content_document($currentData, $data) : $data;
                if (!isset($nextData['createdAt']) && isset($currentData['createdAt'])) {
                    $nextData['createdAt'] = $currentData['createdAt'];
                }
                $version = (int) $row['version_no'] + 1;
            } elseif ($expectedVersion !== null && $expectedVersion !== 0) {
                throw new ContentVersionConflict('The document was changed by another administrator.');
            }
            $nextData['updatedAt'] = gmdate('c');
            $values = content_values($nextData);

            if (is_array($row)) {
                $statement = $pdo->prepare(
                    'UPDATE content_documents SET data_json = :data_json, sort_order = :sort_order, sort_date = :sort_date, ' .
                    'version_no = :version_no, deleted_at = NULL WHERE collection_key = :collection_key AND document_id = :document_id'
                );
            } else {
                $statement = $pdo->prepare(
                    'INSERT INTO content_documents ' .
                    '(collection_key, document_id, data_json, sort_order, sort_date, version_no) ' .
                    'VALUES (:collection_key, :document_id, :data_json, :sort_order, :sort_date, :version_no)'
                );
            }
            $statement->execute(array_merge($values, array(
                'version_no' => $version,
                'collection_key' => $collection,
                'document_id' => $documentId,
            )));
            $pdo->commit();
            $saved = content_row($pdo, $collection, $documentId);
            audit_admin_action((int) $admin['id'], 'content.' . $action, $collection, $documentId);
            json_response(array('ok' => true, 'document' => decode_content_row($saved)));
        }

        if ($action === 'reorder') {
            $rows = isset($input['rows']) && is_array($input['rows']) ? $input['rows'] : array();
            $error = validate_reorder_rows($rows);
            if ($error !== '') {
                api_error($error, 400, 'INVALID_REORDER');
            }
            $pdo->beginTransaction();
            foreach ($rows as $reorderRow) {
                $id = (string) $reorderRow['id'];
                $row = content_row($pdo, $collection, $id, true);
                if (!is_array($row)) {
                    throw new InvalidArgumentException('Document not found during reorder.');
                }
                $current = json_decode((string) $row['data_json'], true);
                if (!is_array($current)) {
                    $current = array();
                }
                $current['order'] = (int) $reorderRow['order'];
                $current['updatedAt'] = gmdate('c');
                $statement = $pdo->prepare(
                    'UPDATE content_documents SET data_json = :data_json, sort_order = :sort_order, version_no = version_no + 1 ' .
                    'WHERE collection_key = :collection_key AND document_id = :document_id'
                );
                $statement->execute(array(
                    'data_json' => content_json($current),
                    'sort_order' => (int) $reorderRow['order'],
                    'collection_key' => $collection,
                    'document_id' => $id,
                ));
            }
            $pdo->commit();
            audit_admin_action((int) $admin['id'], 'content.reorder', $collection, null, array('count' => count($rows)));
            json_response(array('ok' => true));
        }
    } catch (ContentVersionConflict $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        api_error($error->getMessage(), 409, 'VERSION_CONFLICT');
    } catch (InvalidArgumentException $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        api_error($error->getMessage(), 400, 'INVALID_CONTENT');
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
