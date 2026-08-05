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
