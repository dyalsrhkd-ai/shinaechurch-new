<?php

// 2026-10-12 교인앱 서버(Worker) ↔ 홈페이지 서버 연동(방송 상태·공지). 카페24 PHP 5.5.
// 홈페이지는 http 만 열려 있어서 Worker → 홈페이지 요청에는 공유 키를 싣지 않는다:
// ts(초)와 sig = HMAC-SHA256(공유 키, ts + "\n" + 본문)만 보내고, 여기서 5분 안·서명 일치를 확인한다.
// 홈페이지 → Worker 는 https 라 지금처럼 X-Admin-Login-Key 헤더(_app_admin_service.php).

require_once __DIR__ . '/_app_admin_service.php';

define('APP_NOTICE_URL', 'https://shinae-community-media.shinae-community.workers.dev/app-notice');

function app_bridge_signed($body, $ts, $sig, $key = null, $now = null) {
    $key = $key === null ? app_admin_login_key() : $key;
    $ts = (string) $ts;
    $sig = strtolower((string) $sig);
    if ($key === '' || preg_match('/\A\d{9,12}\z/', $ts) !== 1 || preg_match('/\A[0-9a-f]{64}\z/', $sig) !== 1) {
        return false;
    }
    $now = $now === null ? time() : (int) $now;
    if (abs($now - (int) $ts) > 300) {
        return false;
    }
    return secure_equals(hash_hmac('sha256', $ts . "\n" . $body, $key), $sig);
}

// 앱 공지 → 홈페이지 공지 문서. 같은 앱 공지는 문서 ID 가 같아서 다시 와도 한 번만 생긴다
function app_notice_document($noticeId, $title, $content, $now = null) {
    $noticeId = strtolower(trim((string) $noticeId));
    if (preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/', $noticeId) !== 1) {
        throw new InvalidArgumentException('Invalid notice id.');
    }
    $title = trim((string) $title);
    $content = trim((string) $content);
    if ($title === '' || $content === '') {
        throw new InvalidArgumentException('Title and content are required.');
    }
    $now = $now === null ? time() : (int) $now;
    return array(
        'id' => 'app-' . $noticeId,
        'data' => array(
            'title' => function_exists('mb_substr') ? mb_substr($title, 0, 100, 'UTF-8') : substr($title, 0, 100),
            'badge' => '공지',
            'date' => gmdate('Y-m-d', $now + 9 * 3600), // 한국 날짜
            'content' => $content,
            'source' => 'app',
        ),
    );
}

// 홈페이지 관리자(앱 계정으로 로그인한 사람)의 앱 계정 uid. 비상용 계정이면 빈 값
function app_bridge_admin_uid(array $admin) {
    return strpos((string) $admin['loginId'], 'app-') === 0 ? (string) $admin['uid'] : '';
}
