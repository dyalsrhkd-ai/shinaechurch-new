<?php
declare(strict_types=1);

require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_live_service.php';

function bearer_agent_token(): string
{
    $header = isset($_SERVER['HTTP_AUTHORIZATION']) ? (string) $_SERVER['HTTP_AUTHORIZATION'] :
        (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) ? (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '');
    if (preg_match('/\ABearer\s+(.+)\z/i', trim($header), $matches) !== 1) return '';
    return trim((string) $matches[1]);
}

function require_live_agent(PDO $pdo): array
{
    $token = bearer_agent_token();
    if (strlen($token) < 16) api_error('Agent authentication required.', 401, 'AGENT_AUTH_REQUIRED');
    $statement = $pdo->prepare(
        "SELECT agent_key, display_name, managed_keys_json FROM live_stream_agents " .
        "WHERE token_hash = :token_hash AND active_yn = 'Y' LIMIT 1"
    );
    $statement->execute(array('token_hash' => hash_secret($token)));
    $agent = $statement->fetch();
    if (!is_array($agent)) api_error('Invalid agent token.', 401, 'INVALID_AGENT_TOKEN');
    return $agent;
}

function sql_in_placeholders(array $values, string $prefix): array
{
    $params = array();
    $names = array();
    foreach (array_values($values) as $index => $value) {
        $name = $prefix . $index;
        $names[] = ':' . $name;
        $params[$name] = $value;
    }
    return array('sql' => implode(',', $names), 'params' => $params);
}

function live_agent_repository(PDO $pdo): array
{
    return array(
        'recoverStale' => function (array $keys, string $before) use ($pdo): void {
            $in = sql_in_placeholders($keys, 'stream_');
            $statement = $pdo->prepare(
                "UPDATE live_stream_commands SET status_key = 'pending', claimed_by_agent_key = NULL, claimed_at = NULL " .
                "WHERE status_key = 'processing' AND claimed_at < :before AND stream_key IN (" . $in['sql'] . ')'
            );
            $statement->execute(array_merge($in['params'], array('before' => $before)));
        },
        'claimOldest' => function (array $keys, string $agentKey, string $claimedAt) use ($pdo): ?array {
            $in = sql_in_placeholders($keys, 'stream_');
            $pdo->beginTransaction();
            try {
                $statement = $pdo->prepare(
                    "SELECT request_key, stream_key, command_type, payload_json, status_key, claimed_by_agent_key " .
                    "FROM live_stream_commands WHERE status_key = 'pending' AND stream_key IN (" . $in['sql'] . ') ORDER BY id LIMIT 1 FOR UPDATE'
                );
                $statement->execute($in['params']);
                $command = $statement->fetch();
                if (!is_array($command)) {
                    $pdo->commit();
                    return null;
                }
                $update = $pdo->prepare(
                    "UPDATE live_stream_commands SET status_key = 'processing', claimed_by_agent_key = :agent_key, claimed_at = :claimed_at " .
                    "WHERE request_key = :request_key AND status_key = 'pending'"
                );
                $update->execute(array(
                    'agent_key' => $agentKey,
                    'claimed_at' => $claimedAt,
                    'request_key' => $command['request_key'],
                ));
                $pdo->commit();
                $payload = json_decode((string) $command['payload_json'], true);
                return array(
                    'requestId' => (string) $command['request_key'],
                    'streamKey' => (string) $command['stream_key'],
                    'desiredState' => (string) $command['command_type'],
                    'payload' => is_array($payload) ? $payload : array(),
                );
            } catch (Throwable $error) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                throw $error;
            }
        },
        'findCommand' => function (string $requestKey) use ($pdo): ?array {
            $statement = $pdo->prepare(
                'SELECT request_key, stream_key, status_key, claimed_by_agent_key FROM live_stream_commands WHERE request_key = :request_key'
            );
            $statement->execute(array('request_key' => $requestKey));
            $row = $statement->fetch();
            return is_array($row) ? $row : null;
        },
        'completeCommand' => function (string $requestKey, bool $ok, array $result) use ($pdo): void {
            $message = trim((string) (isset($result['message']) ? $result['message'] : (isset($result['error']) ? $result['error'] : '')));
            $statement = $pdo->prepare(
                'UPDATE live_stream_commands SET status_key = :status_key, completed_at = NOW(), result_json = :result_json, error_message = :error_message ' .
                'WHERE request_key = :request_key'
            );
            $statement->execute(array(
                'status_key' => $ok ? 'completed' : 'error',
                'result_json' => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'error_message' => $ok ? null : substr($message, 0, 500),
                'request_key' => $requestKey,
            ));
        },
        'heartbeat' => function (string $agentKey, array $status) use ($pdo): void {
            $statement = $pdo->prepare(
                'UPDATE live_stream_agents SET status_key = :status_key, status_json = :status_json, last_seen_at = NOW() WHERE agent_key = :agent_key'
            );
            $statement->execute(array(
                'status_key' => $status['streamActive'] ? 'streaming' : ($status['obsConnected'] ? 'online' : 'offline'),
                'status_json' => json_encode($status, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'agent_key' => $agentKey,
            ));
        },
    );
}

function live_agent_settings(PDO $pdo, array $keys): array
{
    $result = array();
    foreach ($keys as $key) {
        $statement = $pdo->prepare('SELECT data_json FROM live_stream_settings WHERE setting_key = :setting_key');
        $statement->execute(array('setting_key' => $key));
        $json = $statement->fetchColumn();
        $data = is_string($json) ? json_decode($json, true) : array();
        $setting = normalize_live_setting($key, is_array($data) ? $data : array());
        unset($setting['accessPassword'], $setting['accessKey']);
        $result[$key] = $setting;
    }
    return $result;
}

function update_live_video(PDO $pdo, string $agentKey, string $streamKey, string $videoId): void
{
    $statement = $pdo->prepare('SELECT data_json FROM live_stream_settings WHERE setting_key = :setting_key');
    $statement->execute(array('setting_key' => $streamKey));
    $json = $statement->fetchColumn();
    $data = is_string($json) ? json_decode($json, true) : array();
    $setting = normalize_live_setting($streamKey, is_array($data) ? $data : array());
    $setting['currentVideoId'] = $videoId;
    $upsert = $pdo->prepare(
        'INSERT INTO live_stream_settings (setting_key, data_json) VALUES (:setting_key, :data_json) ' .
        'ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)'
    );
    $upsert->execute(array(
        'setting_key' => $streamKey,
        'data_json' => json_encode($setting, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ));
    $pdo->prepare('UPDATE live_stream_agents SET current_video_id = :video_id WHERE agent_key = :agent_key')
        ->execute(array('video_id' => $videoId === '' ? null : $videoId, 'agent_key' => $agentKey));
}

function resolve_youtube_live_video(string $channelId, array $apiKeys): string
{
    if (preg_match('/\AUC[A-Za-z0-9_-]{22}\z/D', $channelId) !== 1) {
        throw new InvalidArgumentException('Invalid YouTube channel ID.');
    }
    foreach ($apiKeys as $apiKey) {
        if (!is_string($apiKey) || trim($apiKey) === '') continue;
        $url = 'https://www.googleapis.com/youtube/v3/search?' . http_build_query(array(
            'part' => 'id,snippet', 'channelId' => $channelId, 'eventType' => 'live',
            'type' => 'video', 'maxResults' => '1', 'key' => trim($apiKey),
        ));
        $body = false;
        if (function_exists('curl_init')) {
            $curl = curl_init($url);
            curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10));
            $body = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
            if ($status !== 200) continue;
        } else {
            $body = @file_get_contents($url, false, stream_context_create(array('http' => array('timeout' => 10))));
        }
        if (!is_string($body)) continue;
        $payload = json_decode($body, true);
        $videoId = isset($payload['items'][0]['id']['videoId']) ? (string) $payload['items'][0]['id']['videoId'] : '';
        $videoId = normalize_youtube_video_id($videoId);
        if ($videoId !== '') return $videoId;
    }
    return '';
}

run_api(function (): void {
    require_method('POST');
    $input = json_input();
    $action = request_action($input);
    $pdo = db();
    $agent = require_live_agent($pdo);
    $repository = live_agent_repository($pdo);
    $managedKeys = agent_managed_stream_keys($agent);

    if ($action === 'heartbeat') {
        $status = record_live_heartbeat($repository, $agent, isset($input['status']) && is_array($input['status']) ? $input['status'] : array());
        json_response(array('ok' => true, 'status' => $status));
    }

    if ($action === 'poll') {
        if (isset($input['status']) && is_array($input['status'])) {
            record_live_heartbeat($repository, $agent, $input['status']);
        }
        $now = new DateTimeImmutable('now');
        $command = claim_live_command(
            $repository,
            $agent,
            $now->modify('-5 minutes')->format('Y-m-d H:i:s'),
            $now->format('Y-m-d H:i:s')
        );
        json_response(array('ok' => true, 'settings' => live_agent_settings($pdo, $managedKeys), 'command' => $command));
    }

    if ($action === 'complete') {
        $requestKey = trim((string) (isset($input['requestId']) ? $input['requestId'] : ''));
        $result = isset($input['result']) && is_array($input['result']) ? $input['result'] : array();
        $completed = complete_live_command($repository, $agent, $requestKey, !empty($input['ok']), $result);
        if (!$completed['ok']) api_error((string) $completed['message'], 403, 'LIVE_COMMAND_COMPLETE_FAILED');
        if (isset($result['streamKey']) && agent_can_manage($agent, (string) $result['streamKey'])) {
            $streamKey = (string) $result['streamKey'];
            $statement = $pdo->prepare('SELECT data_json FROM live_stream_settings WHERE setting_key = :setting_key');
            $statement->execute(array('setting_key' => $streamKey));
            $data = json_decode((string) $statement->fetchColumn(), true);
            $setting = normalize_live_setting($streamKey, is_array($data) ? $data : array());
            if (isset($result['streamActive'])) $setting['enabled'] = (bool) $result['streamActive'];
            $pdo->prepare(
                'INSERT INTO live_stream_settings (setting_key, data_json) VALUES (:setting_key, :data_json) ' .
                'ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)'
            )->execute(array('setting_key' => $streamKey, 'data_json' => json_encode($setting, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));
        }
        json_response(array('ok' => true, 'duplicate' => $completed['duplicate']));
    }

    if ($action === 'video') {
        $streamKey = trim((string) (isset($input['streamKey']) ? $input['streamKey'] : ''));
        if (!agent_can_manage($agent, $streamKey)) api_error('Agent cannot manage this stream.', 403, 'AGENT_STREAM_FORBIDDEN');
        $rawVideoId = trim((string) (isset($input['videoId']) ? $input['videoId'] : ''));
        $videoId = $rawVideoId === '' ? '' : normalize_youtube_video_id($rawVideoId);
        if ($rawVideoId !== '' && $videoId === '') api_error('Invalid YouTube video ID.', 400, 'INVALID_VIDEO_ID');
        update_live_video($pdo, (string) $agent['agent_key'], $streamKey, $videoId);
        json_response(array('ok' => true, 'videoId' => $videoId));
    }

    if ($action === 'resolve-video') {
        $streamKey = trim((string) (isset($input['streamKey']) ? $input['streamKey'] : ''));
        if (!agent_can_manage($agent, $streamKey)) api_error('Agent cannot manage this stream.', 403, 'AGENT_STREAM_FORBIDDEN');
        $config = app_config();
        $keys = isset($config['youtube']['api_keys']) && is_array($config['youtube']['api_keys']) ? $config['youtube']['api_keys'] : array();
        $videoId = resolve_youtube_live_video(trim((string) (isset($input['channelId']) ? $input['channelId'] : '')), $keys);
        json_response(array('ok' => true, 'videoId' => $videoId));
    }

    api_error('Unknown action.', 404, 'UNKNOWN_ACTION');
});
