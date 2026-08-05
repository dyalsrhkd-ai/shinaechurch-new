<?php
declare(strict_types=1);

function allowed_live_stream_keys(): array
{
    return array('children', 'youth', 'young', 'main');
}

function normalize_agent_stream_keys(array $keys): array
{
    $normalized = array();
    foreach ($keys as $key) {
        $key = trim((string) $key);
        if (!in_array($key, allowed_live_stream_keys(), true)) {
            throw new InvalidArgumentException('Unknown live stream key.');
        }
        if (!in_array($key, $normalized, true)) {
            $normalized[] = $key;
        }
    }
    if (count($normalized) === 0) {
        throw new InvalidArgumentException('At least one live stream key is required.');
    }
    return $normalized;
}

function validate_live_command(string $streamKey, string $desiredState): string
{
    if (!in_array($streamKey, allowed_live_stream_keys(), true)) {
        return 'Unknown live stream key.';
    }
    if ($desiredState !== 'start' && $desiredState !== 'stop') {
        return 'Unsupported live command.';
    }
    return '';
}

function normalize_live_status(array $status): array
{
    $activeKey = isset($status['activeStreamKey']) ? trim((string) $status['activeStreamKey']) : '';
    if ($activeKey !== '' && !in_array($activeKey, allowed_live_stream_keys(), true)) {
        $activeKey = '';
    }
    return array(
        'agentLabel' => substr(trim((string) (isset($status['agentLabel']) ? $status['agentLabel'] : '')), 0, 100),
        'obsConnected' => !empty($status['obsConnected']),
        'streamActive' => !empty($status['streamActive']),
        'activeStreamKey' => $activeKey,
        'message' => substr(trim((string) (isset($status['message']) ? $status['message'] : '')), 0, 500),
    );
}

function agent_managed_stream_keys(array $agent): array
{
    $value = isset($agent['managed_keys_json']) ? $agent['managed_keys_json'] : array();
    if (is_string($value)) {
        $value = json_decode($value, true);
    }
    if (!is_array($value)) {
        return array();
    }
    try {
        return normalize_agent_stream_keys($value);
    } catch (InvalidArgumentException $error) {
        return array();
    }
}

function agent_can_manage(array $agent, string $streamKey): bool
{
    return in_array($streamKey, agent_managed_stream_keys($agent), true);
}

function issue_live_agent(
    array $repository,
    string $agentKey,
    string $displayName,
    array $streamKeys,
    callable $tokenFactory,
    callable $tokenHasher
): array {
    $agentKey = trim($agentKey);
    $displayName = trim($displayName);
    if (preg_match('/\A[A-Za-z0-9_-]{3,64}\z/D', $agentKey) !== 1) {
        throw new InvalidArgumentException('Invalid agent key.');
    }
    if ($displayName === '' || strlen($displayName) > 100) {
        throw new InvalidArgumentException('Invalid agent display name.');
    }
    $keys = normalize_agent_stream_keys($streamKeys);
    $token = (string) $tokenFactory();
    if (strlen($token) < 16) {
        throw new RuntimeException('Generated agent token is too short.');
    }
    $repository['upsertAgent'](array(
        'agent_key' => $agentKey,
        'display_name' => $displayName,
        'managed_keys_json' => json_encode($keys, JSON_UNESCAPED_SLASHES),
        'token_hash' => (string) $tokenHasher($token),
    ));
    return array('agentKey' => $agentKey, 'agentToken' => $token, 'streamKeys' => $keys);
}

function claim_live_command(
    array $repository,
    array $agent,
    string $staleBefore,
    string $claimedAt
): ?array {
    $keys = agent_managed_stream_keys($agent);
    if ($keys === array()) {
        throw new InvalidArgumentException('Agent has no managed stream keys.');
    }
    $repository['recoverStale']($keys, $staleBefore);
    return $repository['claimOldest']($keys, (string) $agent['agent_key'], $claimedAt);
}

function complete_live_command(
    array $repository,
    array $agent,
    string $requestKey,
    bool $ok,
    array $result
): array {
    $command = $repository['findCommand']($requestKey);
    if (!is_array($command)) {
        return array('ok' => false, 'message' => 'Live command not found.');
    }
    if (!agent_can_manage($agent, (string) $command['stream_key'])) {
        return array('ok' => false, 'message' => 'Agent cannot manage this stream.');
    }
    $status = (string) $command['status_key'];
    if ($status === 'completed' || $status === 'error') {
        return array('ok' => true, 'duplicate' => true);
    }
    if ($status !== 'processing' || (string) $command['claimed_by_agent_key'] !== (string) $agent['agent_key']) {
        return array('ok' => false, 'message' => 'Live command was not claimed by this agent.');
    }
    $repository['completeCommand']($requestKey, $ok, $result);
    return array('ok' => true, 'duplicate' => false);
}

function record_live_heartbeat(array $repository, array $agent, array $status): array
{
    $normalized = normalize_live_status($status);
    $repository['heartbeat']((string) $agent['agent_key'], $normalized);
    return $normalized;
}

function default_live_setting(string $streamKey): array
{
    $titles = array(
        'children' => '아동부 실시간 예배 영상',
        'youth' => '중고등부 실시간 예배 영상',
        'young' => '청년부 실시간 예배 영상',
        'main' => '대예배 실시간 예배 영상',
    );
    return array(
        'enabled' => false,
        'title' => isset($titles[$streamKey]) ? $titles[$streamKey] : '실시간 예배 영상',
        'youtubeUrl' => '',
        'youtubeChromeProfileName' => '',
        'currentVideoId' => '',
        'accessPassword' => '',
        'accessKey' => '',
        'sermonTitle' => '',
        'scriptureTitle' => '',
    );
}

function normalize_youtube_video_id(string $value): string
{
    $value = trim($value);
    return preg_match('/\A[A-Za-z0-9_-]{11}\z/D', $value) === 1 ? $value : '';
}

function normalize_live_setting(string $streamKey, array $input): array
{
    if (!in_array($streamKey, allowed_live_stream_keys(), true)) {
        throw new InvalidArgumentException('Unknown live stream key.');
    }
    $setting = default_live_setting($streamKey);
    foreach (array('title', 'youtubeUrl', 'youtubeChromeProfileName', 'accessPassword', 'accessKey', 'sermonTitle', 'scriptureTitle') as $field) {
        if (isset($input[$field])) {
            $setting[$field] = substr(trim((string) $input[$field]), 0, $field === 'youtubeUrl' ? 500 : 255);
        }
    }
    $setting['enabled'] = !empty($input['enabled']);
    $setting['currentVideoId'] = normalize_youtube_video_id(isset($input['currentVideoId']) ? (string) $input['currentVideoId'] : '');
    return $setting;
}

function public_live_setting(array $setting, bool $authorized): array
{
    unset($setting['accessPassword'], $setting['accessKey'], $setting['youtubeChromeProfileName']);
    $setting['accessRequired'] = !empty($setting['_accessRequired']);
    unset($setting['_accessRequired']);
    $setting['authorized'] = $authorized || !$setting['accessRequired'];
    if (!$setting['authorized']) {
        $setting['currentVideoId'] = '';
        $setting['youtubeUrl'] = '';
    }
    return $setting;
}

function live_request_key(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}
