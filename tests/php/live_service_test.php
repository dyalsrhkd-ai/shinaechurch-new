<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_live_service.php';

function check_live(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check_live(allowed_live_stream_keys() === array('children', 'youth', 'young', 'main'), 'stream allowlist must match the site categories');
check_live(normalize_agent_stream_keys(array('youth', 'young', 'youth')) === array('youth', 'young'), 'managed stream keys must be unique');

$unknownRejected = false;
try {
    normalize_agent_stream_keys(array('main', 'unknown'));
} catch (InvalidArgumentException $error) {
    $unknownRejected = true;
}
check_live($unknownRejected, 'unknown managed stream key must be rejected');

check_live(validate_live_command('main', 'start') === '', 'start command must be accepted');
check_live(validate_live_command('children', 'stop') === '', 'stop command must be accepted');
check_live(validate_live_command('main', 'restart') !== '', 'unsupported command must be rejected');
check_live(validate_live_command('unknown', 'start') !== '', 'unknown stream must be rejected');

$status = normalize_live_status(array(
    'agentLabel' => 'Main PC',
    'obsConnected' => true,
    'streamActive' => false,
    'activeStreamKey' => 'main',
    'message' => 'Idle',
    'agentToken' => 'must-not-leak',
    'obsPassword' => 'must-not-leak',
    'stack' => 'private stack',
));
check_live($status === array(
    'agentLabel' => 'Main PC',
    'obsConnected' => true,
    'streamActive' => false,
    'activeStreamKey' => 'main',
    'message' => 'Idle',
), 'status must keep public fields and remove private fields');

$agent = array('managed_keys_json' => '["youth","young"]');
check_live(agent_can_manage($agent, 'youth'), 'combined agent must manage youth');
check_live(agent_can_manage($agent, 'young'), 'combined agent must manage young');
check_live(!agent_can_manage($agent, 'main'), 'combined agent must not manage main');

echo "PHP live service OK\n";
