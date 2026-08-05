<?php
declare(strict_types=1);

require __DIR__ . '/../../public/api/_live_service.php';

function check_live_endpoint(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$state = array(
    'agents' => array(),
    'commands' => array(
        array('request_key' => 'first', 'stream_key' => 'youth', 'status_key' => 'pending', 'claimed_by_agent_key' => null),
        array('request_key' => 'second', 'stream_key' => 'main', 'status_key' => 'pending', 'claimed_by_agent_key' => null),
    ),
    'heartbeats' => array(),
    'recoveries' => 0,
);

$repo = array(
    'upsertAgent' => function (array $agent) use (&$state): void {
        $state['agents'][$agent['agent_key']] = $agent;
    },
    'recoverStale' => function (array $keys, string $before) use (&$state): void {
        $state['recoveries']++;
    },
    'claimOldest' => function (array $keys, string $agentKey, string $claimedAt) use (&$state): ?array {
        foreach ($state['commands'] as &$command) {
            if ($command['status_key'] === 'pending' && in_array($command['stream_key'], $keys, true)) {
                $command['status_key'] = 'processing';
                $command['claimed_by_agent_key'] = $agentKey;
                return $command;
            }
        }
        return null;
    },
    'findCommand' => function (string $requestKey) use (&$state): ?array {
        foreach ($state['commands'] as $command) {
            if ($command['request_key'] === $requestKey) return $command;
        }
        return null;
    },
    'completeCommand' => function (string $requestKey, bool $ok, array $result) use (&$state): void {
        foreach ($state['commands'] as &$command) {
            if ($command['request_key'] === $requestKey) {
                $command['status_key'] = $ok ? 'completed' : 'error';
                $command['result'] = $result;
            }
        }
    },
    'heartbeat' => function (string $agentKey, array $status) use (&$state): void {
        $state['heartbeats'][$agentKey] = $status;
    },
);

$issued = issue_live_agent(
    $repo,
    'youth-young-pc',
    'Youth and Young PC',
    array('youth', 'young'),
    function (): string { return 'raw-agent-token-2026'; },
    function (string $token): string { return 'hash:' . $token; }
);
check_live_endpoint($issued['agentToken'] === 'raw-agent-token-2026', 'raw token must be returned once');
check_live_endpoint($state['agents']['youth-young-pc']['token_hash'] === 'hash:raw-agent-token-2026', 'only token hash must be stored');
check_live_endpoint($state['agents']['youth-young-pc']['managed_keys_json'] === '["youth","young"]', 'managed keys must be stored');

$agent = $state['agents']['youth-young-pc'];
$command = claim_live_command($repo, $agent, '2026-08-05 00:00:00', '2026-08-05 00:10:00');
check_live_endpoint($command['request_key'] === 'first', 'agent must claim oldest manageable command');
check_live_endpoint($state['recoveries'] === 1, 'stale commands must be recovered before polling');

$completed = complete_live_command($repo, $agent, 'first', true, array('message' => 'done'));
check_live_endpoint($completed['ok'] === true && $completed['duplicate'] === false, 'claimed command must complete');
$duplicate = complete_live_command($repo, $agent, 'first', true, array('message' => 'done'));
check_live_endpoint($duplicate['ok'] === true && $duplicate['duplicate'] === true, 'duplicate completion must be idempotent');

$blocked = complete_live_command($repo, $agent, 'second', true, array());
check_live_endpoint($blocked['ok'] === false, 'agent must not complete another stream command');

record_live_heartbeat($repo, $agent, array(
    'agentLabel' => 'Combined PC',
    'obsConnected' => true,
    'streamActive' => false,
    'agentToken' => 'private',
));
check_live_endpoint(!isset($state['heartbeats']['youth-young-pc']['agentToken']), 'heartbeat must discard private fields');

echo "PHP live endpoint service OK\n";
