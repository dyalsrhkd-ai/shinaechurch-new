<?php

// 2026-10-12 공지 웹 ↔ 앱(요셉님: 쓸 때 웹·앱을 골라 한쪽에서 써도 다른 쪽에 올라가게)
//  from-app : 앱 서버(Worker)가 서명해서 보낸 앱 공지 → 홈페이지 공지(같은 앱 공지는 한 번만)
//  to-app   : 홈페이지 관리자(앱 계정으로 로그인) → 앱 서버 → 그 관리자 이름으로 앱 공지

require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_content_service.php';
require_once __DIR__ . '/_app_bridge.php';

run_api(function () {
    $action = isset($_GET['action']) ? trim((string) $_GET['action']) : '';
    require_method('POST');

    if ($action === 'from-app') {
        $raw = file_get_contents('php://input');
        $raw = $raw === false ? '' : $raw;
        $ts = isset($_SERVER['HTTP_X_BRIDGE_TS']) ? $_SERVER['HTTP_X_BRIDGE_TS'] : '';
        $sig = isset($_SERVER['HTTP_X_BRIDGE_SIG']) ? $_SERVER['HTTP_X_BRIDGE_SIG'] : '';
        if (!app_bridge_signed($raw, $ts, $sig)) {
            api_error('Forbidden.', 403, 'FORBIDDEN');
        }
        $input = json_decode($raw, true);
        $input = is_array($input) ? $input : array();
        try {
            $doc = app_notice_document(
                isset($input['noticeId']) ? $input['noticeId'] : '',
                isset($input['title']) ? $input['title'] : '',
                isset($input['content']) ? $input['content'] : ''
            );
        } catch (InvalidArgumentException $error) {
            api_error($error->getMessage(), 400, 'INVALID_NOTICE');
        }
        $pdo = db();
        $found = $pdo->prepare("SELECT 1 FROM content_documents WHERE collection_key = 'notices' AND document_id = :id");
        $found->execute(array('id' => $doc['id']));
        if ($found->fetchColumn()) {
            json_response(array('ok' => true, 'id' => $doc['id'], 'created' => false));
        }
        $now = gmdate('c');
        $data = $doc['data'];
        $data['createdAt'] = $now;
        $data['updatedAt'] = $now;
        $sort = content_sort_metadata($data);
        $pdo->prepare(
            'INSERT INTO content_documents (collection_key, document_id, data_json, sort_order, sort_date, version_no) ' .
            "VALUES ('notices', :document_id, :data_json, :sort_order, :sort_date, 1)"
        )->execute(array(
            'document_id' => $doc['id'],
            'data_json' => content_json($data),
            'sort_order' => $sort['order'],
            'sort_date' => $sort['date'],
        ));
        json_response(array('ok' => true, 'id' => $doc['id'], 'created' => true), 201);
    }

    if ($action === 'to-app') {
        $admin = require_admin();
        require_csrf();
        $input = json_input();
        $uid = app_bridge_admin_uid($admin);
        if ($uid === '') {
            api_error('앱 관리자 계정으로 로그인해야 앱에 올릴 수 있습니다. (지금은 비상용 계정)', 409, 'NOT_APP_ADMIN');
        }
        $title = trim((string) (isset($input['title']) ? $input['title'] : ''));
        $body = trim((string) (isset($input['content']) ? $input['content'] : ''));
        $length = function ($text) { return function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text); };
        if ($title === '' || $length($title) > 100 || $body === '' || $length($body) > 3000) {
            api_error('앱 공지는 제목 1~100자, 내용 1~3000자입니다.', 400, 'INVALID_NOTICE');
        }
        $key = app_admin_login_key();
        if ($key === '') {
            api_error('앱 서버 연결 설정이 없습니다.', 503, 'APP_UNAVAILABLE');
        }
        $response = app_admin_http_post(
            APP_NOTICE_URL,
            array('Content-Type: application/json', 'X-Admin-Login-Key: ' . $key),
            json_encode(array('uid' => $uid, 'title' => $title, 'body' => $body))
        );
        $data = json_decode((string) $response[1], true);
        if ((int) $response[0] !== 201 || !is_array($data) || empty($data['ok'])) {
            $message = is_array($data) && isset($data['error']) ? (string) $data['error'] : '앱 서버가 응답하지 않습니다.';
            api_error($message, 502, 'APP_NOTICE_FAILED');
        }
        audit_admin_action((int) $admin['id'], 'content.app-notice', 'notices', (string) $data['id']);
        json_response(array('ok' => true, 'id' => (string) $data['id']), 201);
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
