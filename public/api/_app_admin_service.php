<?php

// 홈페이지 관리자 로그인을 교인앱 계정으로(2026-10-08 요셉님: 계정은 앱 하나로, 지금 계정은 비상용).
// 비상용 계정(admin_users 비밀번호) 확인이 실패하면 여기로 와서 앱 서버(Worker /admin-login)에 묻는다.
// 카페24 PHP 5.5 — ?? · 타입힌트 · random_bytes 쓰지 않는다.

require_once __DIR__ . '/_auth_service.php';

define('APP_ADMIN_LOGIN_URL', 'https://shinae-community-media.shinae-community.workers.dev/admin-login');

// 앱 로그인에 쓰는 모양(아이디 3자~·휴대폰 번호·이메일·admin). 홈페이지 아이디 규칙(4자~)보다 넓다
function app_admin_identity_ok($identity) {
    return preg_match('/\A[A-Za-z0-9][A-Za-z0-9._@+()\- ]{2,99}\z/D', $identity) === 1;
}

// 공유 키 — 운영 서버에만 있는 _app_login_key.php(깃에 없음). 없으면 앱 로그인을 쓰지 않는다
function app_admin_login_key() {
    $file = __DIR__ . '/_app_login_key.php';
    if (!is_file($file)) {
        return '';
    }
    $key = require $file;
    return is_string($key) ? $key : '';
}

function app_admin_http_post($url, array $headers, $body) {
    $curl = curl_init($url);
    curl_setopt_array($curl, array(
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 8,
    ));
    $result = curl_exec($curl);
    $status = $result === false ? 0 : (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return array($status, $result === false ? '' : (string) $result);
}

// 결과: array('ok' => true, 'uid', 'name', 'session' => array('access_token', 'refresh_token'))
//       array('ok' => false, 'kind' => 'denied' | 'unavailable')
// $post 는 시험에서 바꿔 끼우는 HTTP 함수(url, headers, body) → array(status, body)
function app_admin_check($identity, $password, $key = null, $post = null) {
    $key = $key === null ? app_admin_login_key() : $key;
    if ($key === '') {
        return array('ok' => false, 'kind' => 'unavailable');
    }
    $post = $post === null ? 'app_admin_http_post' : $post;
    $response = call_user_func(
        $post,
        APP_ADMIN_LOGIN_URL,
        array('Content-Type: application/json', 'X-Admin-Login-Key: ' . $key),
        json_encode(array('identity' => $identity, 'password' => $password))
    );
    $status = (int) $response[0];
    $data = json_decode((string) $response[1], true);
    if ($status === 200 && is_array($data) && !empty($data['ok']) && !empty($data['uid'])) {
        return array(
            'ok' => true,
            'uid' => (string) $data['uid'],
            'name' => isset($data['name']) && trim((string) $data['name']) !== '' ? (string) $data['name'] : '앱 관리자',
            'session' => array(
                'access_token' => isset($data['access_token']) ? (string) $data['access_token'] : '',
                'refresh_token' => isset($data['refresh_token']) ? (string) $data['refresh_token'] : '',
            ),
        );
    }
    if ($status === 400 || $status === 401 || $status === 429) {
        return array('ok' => false, 'kind' => 'denied');
    }
    return array('ok' => false, 'kind' => 'unavailable');
}

// 앱 관리자의 그림자 줄 — 세션·활동 로그가 admin_users 번호를 쓰므로 필요하다.
// uid = 앱 uid, login_id = app-<uid>, 비밀번호는 아무도 모르는 무작위 해시(이 줄로는 비밀번호 로그인이 안 된다).
// 비상용 화면에서 지웠더라도 앱이 관리자라고 하면 되살린다(기준은 앱).
function app_admin_shadow(array $repository, $uid, $name) {
    $loginId = 'app-' . $uid;
    $existing = $repository['findShadow']($uid);
    if (is_array($existing)) {
        $repository['reviveShadow']((int) $existing['id'], $loginId, $name);
    } else {
        $repository['releaseDeletedLoginId']($loginId);
        $repository['createShadow'](array(
            'uid' => $uid,
            'login_id' => $loginId,
            'display_name' => $name,
            'password_hash' => password_hash(random_secret(), PASSWORD_DEFAULT),
            'must_change_password' => 0,
        ));
    }
    return $repository['findUser']($loginId);
}
