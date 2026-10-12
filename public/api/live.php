<?php

require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_live_service.php';

function require_live_stream_key(array $input) {
    $key = isset($_GET['streamKey']) ? trim((string) $_GET['streamKey']) : trim((string) (isset($input['streamKey']) ? $input['streamKey'] : ''));
    if (!in_array($key, allowed_live_stream_keys(), true)) {
        api_error('Unknown live stream key.', 404, 'UNKNOWN_LIVE_STREAM');
    }
    return $key;
}

function read_live_setting(PDO $pdo, $streamKey) {
    $statement = $pdo->prepare('SELECT data_json FROM live_stream_settings WHERE setting_key = :setting_key');
    $statement->execute(array('setting_key' => $streamKey));
    $json = $statement->fetchColumn();
    $data = is_string($json) ? json_decode($json, true) : array();
    return normalize_live_setting($streamKey, is_array($data) ? $data : array());
}

function read_live_agent_state(PDO $pdo, $streamKey) {
    $rows = $pdo->query(
        "SELECT agent_key, display_name, managed_keys_json, status_key, status_json, current_video_id, last_seen_at, TIMESTAMPDIFF(SECOND, last_seen_at, NOW()) AS seen_ago " .
        "FROM live_stream_agents WHERE active_yn = 'Y' ORDER BY last_seen_at DESC, id"
    )->fetchAll();
    foreach ($rows as $row) {
        if (!agent_can_manage($row, $streamKey)) continue;
        $status = json_decode((string) $row['status_json'], true);
        $status = live_status_for_stream(is_array($status) ? $status : array(), $streamKey);
        $status['agentKey'] = (string) $row['agent_key'];
        $status['agentLabel'] = $status['agentLabel'] !== '' ? $status['agentLabel'] : (string) $row['display_name'];
        $status['status'] = (string) $row['status_key'];
        $status['currentVideoId'] = normalize_youtube_video_id((string) $row['current_video_id']);
        $status['lastSeenAt'] = $row['last_seen_at'];
        $status['seenAgo'] = $row['seen_ago'] === null ? null : (int) $row['seen_ago']; // 2026-10-12 간편 화면 신호등(60초 안이면 켜짐)
        return $status;
    }
    return null;
}

function read_latest_live_command(PDO $pdo, $streamKey) {
    $statement = $pdo->prepare(
        'SELECT request_key, command_type, status_key, claimed_by_agent_key, completed_at, error_message, created_at ' .
        'FROM live_stream_commands WHERE stream_key = :stream_key ORDER BY id DESC LIMIT 1'
    );
    $statement->execute(array('stream_key' => $streamKey));
    $row = $statement->fetch();
    if (!is_array($row)) return null;
    return array(
        'requestId' => (string) $row['request_key'],
        'desiredState' => (string) $row['command_type'],
        'status' => (string) $row['status_key'],
        'processedBy' => (string) $row['claimed_by_agent_key'],
        'processedAt' => $row['completed_at'],
        'requestedAt' => $row['created_at'],
        'error' => (string) $row['error_message'],
    );
}

function has_live_access($streamKey) {
    ensure_session_started();
    $expiresAt = isset($_SESSION['live_access'][$streamKey]) ? (int) $_SESSION['live_access'][$streamKey] : 0;
    return $expiresAt > time();
}

function public_live_payload(PDO $pdo, $streamKey) {
    $setting = read_live_setting($pdo, $streamKey);
    $setting['_accessRequired'] = $setting['accessPassword'] !== '' || $setting['accessKey'] !== '';
    $authorized = has_live_access($streamKey);
    $canView = can_view_live_setting($setting, $authorized);
    // 교인앱(2026-10-06): 비밀번호 걸린 방송도 「지금 방송 중인지」만 공개한다(영상 주소·에이전트 정보는 그대로 숨김)
    $fullAgent = read_live_agent_state($pdo, $streamKey);
    $latestCommand = read_latest_live_command($pdo, $streamKey);
    $stopPending = is_array($latestCommand) && in_array((string) $latestCommand['status'], array('pending', 'processing'), true)
        && (string) $latestCommand['desiredState'] === 'stop';
    $onAir = !$stopPending && trim((string) $setting['currentVideoId']) !== ''
        && ((is_array($fullAgent) && !empty($fullAgent['streamActive'])) || !empty($setting['enabled']));
    $agent = $canView ? $fullAgent : null;
    if (is_array($agent)) {
        unset($agent['agentKey'], $agent['message']);
    }
    return array(
        'streamKey' => $streamKey,
        'setting' => public_live_setting($setting, $authorized),
        'agent' => $agent,
        'command' => $canView ? $latestCommand : null,
        'onAir' => $onAir,
    );
}

run_api(function () {
    $input = json_input();
    $action = request_action($input);
    $pdo = db();

    if ($action === 'public') {
        require_method('GET');
        $streamKey = require_live_stream_key($input);
        json_response(array('ok' => true, 'live' => public_live_payload($pdo, $streamKey)));
    }

    // 2026-10-12 교인앱 서버(Worker)가 매분: 4부서 방송 상태와 영상 ID(비밀번호 걸린 방송도 — 앱은 승인 교인만 본다).
    // http 라 공유 키는 오지 않고 서명만 확인한다(_app_bridge.php)
    if ($action === 'app-status') {
        require_method('GET');
        require_once __DIR__ . '/_app_bridge.php';
        if (!app_bridge_signed('live', isset($_GET['ts']) ? $_GET['ts'] : '', isset($_GET['sig']) ? $_GET['sig'] : '')) {
            api_error('Forbidden.', 403, 'FORBIDDEN');
        }
        $streams = array();
        foreach (allowed_live_stream_keys() as $key) {
            $payload = public_live_payload($pdo, $key);
            $setting = read_live_setting($pdo, $key);
            $streams[] = array(
                'key' => $key,
                'title' => (string) $setting['title'],
                'onAir' => (bool) $payload['onAir'],
                'videoId' => $payload['onAir'] ? (string) $setting['currentVideoId'] : '',
            );
        }
        json_response(array('ok' => true, 'streams' => $streams));
    }

    if ($action === 'unlock') {
        require_method('POST');
        $streamKey = require_live_stream_key($input);
        $credential = trim((string) (isset($input['credential']) ? $input['credential'] : ''));
        $setting = read_live_setting($pdo, $streamKey);
        $valid = ($setting['accessPassword'] !== '' && secure_equals($setting['accessPassword'], $credential)) ||
            ($setting['accessKey'] !== '' && secure_equals($setting['accessKey'], $credential));
        if (!$valid) {
            api_error('Invalid live access credential.', 401, 'INVALID_LIVE_ACCESS');
        }
        ensure_session_started();
        if (!isset($_SESSION['live_access']) || !is_array($_SESSION['live_access'])) {
            $_SESSION['live_access'] = array();
        }
        $_SESSION['live_access'][$streamKey] = time() + 7200;
        json_response(array('ok' => true, 'live' => public_live_payload($pdo, $streamKey)));
    }

    $admin = require_admin();
    if ($admin['mustChangePassword']) {
        api_error('Password change required.', 403, 'PASSWORD_CHANGE_REQUIRED');
    }

    if ($action === 'admin') {
        require_method('GET');
        $streamKey = require_live_stream_key($input);
        json_response(array('ok' => true, 'live' => array(
            'streamKey' => $streamKey,
            'setting' => read_live_setting($pdo, $streamKey),
            'agent' => read_live_agent_state($pdo, $streamKey),
            'command' => read_latest_live_command($pdo, $streamKey),
        )));
    }

    require_method('POST');
    require_csrf();

    if ($action === 'save') {
        $streamKey = require_live_stream_key($input);
        $setting = normalize_live_setting($streamKey, isset($input['setting']) && is_array($input['setting']) ? $input['setting'] : array());
        $statement = $pdo->prepare(
            'INSERT INTO live_stream_settings (setting_key, data_json, updated_by_admin_id) VALUES (:setting_key, :data_json, :admin_id) ' .
            'ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_by_admin_id = VALUES(updated_by_admin_id)'
        );
        $statement->execute(array(
            'setting_key' => $streamKey,
            'data_json' => json_encode($setting, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'admin_id' => $admin['id'],
        ));
        audit_admin_action((int) $admin['id'], 'live.setting.save', 'live_stream', $streamKey);
        json_response(array('ok' => true, 'setting' => $setting));
    }

    if ($action === 'command') {
        $streamKey = require_live_stream_key($input);
        $desiredState = trim((string) (isset($input['desiredState']) ? $input['desiredState'] : ''));
        $error = validate_live_command($streamKey, $desiredState);
        if ($error !== '') api_error($error, 400, 'INVALID_LIVE_COMMAND');
        $requestKey = live_request_key();
        $statement = $pdo->prepare(
            'INSERT INTO live_stream_commands (request_key, stream_key, command_type, requested_by_admin_id) ' .
            'VALUES (:request_key, :stream_key, :command_type, :admin_id)'
        );
        $statement->execute(array(
            'request_key' => $requestKey,
            'stream_key' => $streamKey,
            'command_type' => $desiredState,
            'admin_id' => $admin['id'],
        ));
        audit_admin_action((int) $admin['id'], 'live.command.' . $desiredState, 'live_stream', $streamKey, array('requestId' => $requestKey));
        json_response(array('ok' => true, 'command' => read_latest_live_command($pdo, $streamKey)), 201);
    }

    if ($action === 'issue-agent') {
        $repository = array(
            'upsertAgent' => function (array $agent) use ($pdo) {
                $statement = $pdo->prepare(
                    'INSERT INTO live_stream_agents (agent_key, display_name, managed_keys_json, token_hash) ' .
                    'VALUES (:agent_key, :display_name, :managed_keys_json, :token_hash) ' .
                    'ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), managed_keys_json = VALUES(managed_keys_json), ' .
                    "token_hash = VALUES(token_hash), active_yn = 'Y'"
                );
                $statement->execute($agent);
            },
        );
        $issued = issue_live_agent(
            $repository,
            (string) (isset($input['agentKey']) ? $input['agentKey'] : ''),
            (string) (isset($input['displayName']) ? $input['displayName'] : ''),
            isset($input['streamKeys']) && is_array($input['streamKeys']) ? $input['streamKeys'] : array(),
            'random_secret',
            'hash_secret'
        );
        audit_admin_action((int) $admin['id'], 'live.agent.issue', 'live_agent', $issued['agentKey'], array('streamKeys' => $issued['streamKeys']));
        json_response(array('ok' => true, 'agent' => $issued), 201);
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
