<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_live_service.php';

function require_live_stream_key(array $input): string
{
    $key = isset($_GET['streamKey']) ? trim((string) $_GET['streamKey']) : trim((string) (isset($input['streamKey']) ? $input['streamKey'] : ''));
    if (!in_array($key, allowed_live_stream_keys(), true)) {
        api_error('Unknown live stream key.', 404, 'UNKNOWN_LIVE_STREAM');
    }
    return $key;
}

function read_live_setting(PDO $pdo, string $streamKey): array
{
    $statement = $pdo->prepare('SELECT data_json FROM live_stream_settings WHERE setting_key = :setting_key');
    $statement->execute(array('setting_key' => $streamKey));
    $json = $statement->fetchColumn();
    $data = is_string($json) ? json_decode($json, true) : array();
    return normalize_live_setting($streamKey, is_array($data) ? $data : array());
}

function read_live_agent_state(PDO $pdo, string $streamKey): ?array
{
    $rows = $pdo->query(
        "SELECT agent_key, display_name, managed_keys_json, status_key, status_json, current_video_id, last_seen_at " .
        "FROM live_stream_agents WHERE active_yn = 'Y' ORDER BY last_seen_at DESC, id"
    )->fetchAll();
    foreach ($rows as $row) {
        if (!agent_can_manage($row, $streamKey)) continue;
        $status = json_decode((string) $row['status_json'], true);
        $status = normalize_live_status(is_array($status) ? $status : array());
        $status['agentKey'] = (string) $row['agent_key'];
        $status['agentLabel'] = $status['agentLabel'] !== '' ? $status['agentLabel'] : (string) $row['display_name'];
        $status['status'] = (string) $row['status_key'];
        $status['currentVideoId'] = normalize_youtube_video_id((string) $row['current_video_id']);
        $status['lastSeenAt'] = $row['last_seen_at'];
        return $status;
    }
    return null;
}

function read_latest_live_command(PDO $pdo, string $streamKey): ?array
{
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

function has_live_access(string $streamKey): bool
{
    ensure_session_started();
    $expiresAt = isset($_SESSION['live_access'][$streamKey]) ? (int) $_SESSION['live_access'][$streamKey] : 0;
    return $expiresAt > time();
}

function public_live_payload(PDO $pdo, string $streamKey): array
{
    $setting = read_live_setting($pdo, $streamKey);
    $setting['_accessRequired'] = $setting['accessPassword'] !== '' || $setting['accessKey'] !== '';
    $authorized = has_live_access($streamKey);
    $canView = can_view_live_setting($setting, $authorized);
    $agent = $canView ? read_live_agent_state($pdo, $streamKey) : null;
    if (is_array($agent)) {
        unset($agent['agentKey'], $agent['message']);
    }
    return array(
        'streamKey' => $streamKey,
        'setting' => public_live_setting($setting, $authorized),
        'agent' => $agent,
        'command' => $canView ? read_latest_live_command($pdo, $streamKey) : null,
    );
}

run_api(function (): void {
    $input = json_input();
    $action = request_action($input);
    $pdo = db();

    if ($action === 'public') {
        require_method('GET');
        $streamKey = require_live_stream_key($input);
        json_response(array('ok' => true, 'live' => public_live_payload($pdo, $streamKey)));
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
            'upsertAgent' => function (array $agent) use ($pdo): void {
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
