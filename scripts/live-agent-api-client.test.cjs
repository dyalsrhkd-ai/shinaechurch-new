const assert = require('node:assert/strict')
const { createLiveAgentApiClient } = require('./live-agent-api-client.cjs')

function response(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  }
}

async function main() {
  const calls = []
  const replies = [
    response(200, { ok: true, settings: { main: { enabled: false } }, command: null }),
    response(200, { ok: true, status: { obsConnected: true } }),
    response(200, { ok: true, duplicate: false }),
    response(200, { ok: true, videoId: 'abcdefghijk' }),
    response(200, { ok: true, videoId: 'abcdefghijk' }),
  ]
  const client = createLiveAgentApiClient({
    apiBaseUrl: 'https://church.example/',
    agentToken: 'agent-token-1234567890',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return replies.shift()
    },
  })

  assert.deepEqual(await client.poll({ obsConnected: true }), {
    settings: { main: { enabled: false } },
    command: null,
  })
  await client.heartbeat({ obsConnected: true })
  assert.deepEqual(await client.complete('request-1', true, { streamKey: 'main', streamActive: true }), { duplicate: false })
  assert.equal(await client.updateVideo('main', 'abcdefghijk'), 'abcdefghijk')
  assert.equal(await client.resolveVideo('main', 'UCabcdefghijklmnopqrstuv'), 'abcdefghijk')

  assert.equal(calls[0].url, 'https://church.example/api/live-agent.php?action=poll')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer agent-token-1234567890')
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: { obsConnected: true } })
  assert.deepEqual(JSON.parse(calls[2].options.body), {
    requestId: 'request-1',
    ok: true,
    result: { streamKey: 'main', streamActive: true },
  })
  assert.deepEqual(JSON.parse(calls[3].options.body), { streamKey: 'main', videoId: 'abcdefghijk' })
  assert.deepEqual(JSON.parse(calls[4].options.body), { streamKey: 'main', channelId: 'UCabcdefghijklmnopqrstuv' })

  let attempts = 0
  const retryClient = createLiveAgentApiClient({
    apiBaseUrl: 'https://church.example',
    agentToken: 'agent-token-1234567890',
    fetchImpl: async () => {
      attempts += 1
      return attempts === 1
        ? response(503, { ok: false, error: { message: 'temporarily unavailable' } })
        : response(200, { ok: true, status: {} })
    },
  })
  await retryClient.heartbeat({})
  assert.equal(attempts, 2, '5xx must retry once')

  attempts = 0
  const networkRetryClient = createLiveAgentApiClient({
    apiBaseUrl: 'https://church.example',
    agentToken: 'agent-token-1234567890',
    fetchImpl: async () => {
      attempts += 1
      if (attempts === 1) throw new Error('socket closed')
      return response(200, { ok: true, status: {} })
    },
  })
  await networkRetryClient.heartbeat({})
  assert.equal(attempts, 2, 'network failure must retry once')

  for (const status of [401, 403]) {
    attempts = 0
    const unauthorizedClient = createLiveAgentApiClient({
      apiBaseUrl: 'https://church.example',
      agentToken: 'agent-token-1234567890',
      fetchImpl: async () => {
        attempts += 1
        return response(status, { ok: false, error: { message: 'invalid agent token' } })
      },
    })
    await assert.rejects(
      () => unauthorizedClient.poll({}),
      (error) => error.status === status && /invalid agent token/.test(error.message),
    )
    assert.equal(attempts, 1, `${status} must not retry`)
  }

  console.log('Live agent API client OK')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
