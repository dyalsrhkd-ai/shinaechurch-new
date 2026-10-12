// 2026-10-12 윈도우 11 PC의 OBS 28+(내장 웹소켓 v5)에도 붙어야 한다 — 같은 EXE 하나로 8.1(OBS 27, v4)·11 둘 다.
// 가짜 v5 OBS 서버(Hello → Identify → Identified, Request → RequestResponse)를 띄워 실제 소켓으로 확인한다.
const test = require('node:test')
const assert = require('node:assert/strict')
const { WebSocketServer } = require('ws')
const ObsCompat = require('./obs-compat.cjs')
const { obsUrlCandidates } = require('./obs-compat.cjs')

function fakeV5Obs() {
  const requests = []
  const server = new WebSocketServer({ port: 0, handleProtocols: protocols => Array.from(protocols).includes('obswebsocket.json') ? 'obswebsocket.json' : false })
  server.on('connection', socket => {
    socket.send(JSON.stringify({ op: 0, d: { obsWebSocketVersion: '5.5.0', rpcVersion: 1 } }))
    socket.on('message', raw => {
      const msg = JSON.parse(String(raw))
      if (msg.op === 1) return socket.send(JSON.stringify({ op: 2, d: { negotiatedRpcVersion: 1 } }))
      if (msg.op === 6) {
        requests.push(msg.d.requestType)
        const responseData = msg.d.requestType === 'GetStreamStatus' ? { outputActive: true } : undefined
        return socket.send(JSON.stringify({ op: 7, d: { requestType: msg.d.requestType, requestId: msg.d.requestId, requestStatus: { result: true, code: 100 }, responseData } }))
      }
      socket.close(4002, 'not v5') // v4 클라이언트가 보내는 요청 → 진짜 OBS 처럼 끊는다
    })
  })
  return new Promise(done => server.on('listening', () => done({ server, requests, port: server.address().port })))
}

test('OBS 가 v5(28 이상)면 v4 로 안 붙어도 v5 로 붙고, 요청은 v5 이름 그대로 보낸다', async () => {
  const { server, requests, port } = await fakeV5Obs()
  const obs = new ObsCompat()
  let identified = 0
  obs.on('Identified', () => { identified++ })
  try {
    await obs.connect(`ws://127.0.0.1:${port}`, '')
    assert.equal(obs.protocol, 'v5')
    assert.equal(identified, 1)
    assert.deepEqual(await obs.call('GetStreamStatus'), { outputActive: true })
    await obs.call('StartStream')
    assert.deepEqual(requests, ['GetStreamStatus', 'StartStream'])
  } finally { await obs.disconnect(); server.close() }
})

test('v5 로 붙은 뒤 OBS 가 꺼지면 ConnectionClosed 를 한 번 알린다', async () => {
  const { server, port } = await fakeV5Obs()
  const obs = new ObsCompat()
  let closed = 0
  obs.on('ConnectionClosed', () => { closed++ })
  await obs.connect(`ws://127.0.0.1:${port}`, '')
  for (const client of server.clients) client.terminate()
  await new Promise(r => setTimeout(r, 300))
  assert.equal(closed, 1)
  server.close()
})

test('주소 후보: 설정 주소 다음, 4444 면 v5 기본 4455 도 시도', () => {
  assert.deepEqual(obsUrlCandidates('ws://127.0.0.1:4444'), ['ws://127.0.0.1:4444', 'ws://127.0.0.1:4455'])
  assert.deepEqual(obsUrlCandidates('ws://127.0.0.1:4455'), ['ws://127.0.0.1:4455'])
  assert.deepEqual(obsUrlCandidates('127.0.0.1:4444'), ['ws://127.0.0.1:4444', 'ws://127.0.0.1:4455'])
})

test('아무것도 없으면 v4·v5 둘 다 실패한 이유를 담아 Error 로 던진다', async () => {
  const obs = new ObsCompat()
  await assert.rejects(obs.connect('ws://127.0.0.1:1', ''), error => error instanceof Error && /v4/.test(error.message) && /v5/.test(error.message))
})

test('OBS 27(v4, 8.1 PC)이면 지금처럼 v4 로 붙고 v4 요청 이름으로 바꿔 보낸다', async () => {
  const requests = []
  const server = new WebSocketServer({ port: 0 })
  server.on('connection', socket => socket.on('message', raw => {
    const msg = JSON.parse(String(raw))
    requests.push(msg['request-type'])
    const extra = msg['request-type'] === 'GetAuthRequired' ? { authRequired: false } : msg['request-type'] === 'GetStreamingStatus' ? { streaming: false } : {}
    socket.send(JSON.stringify({ 'message-id': msg['message-id'], status: 'ok', ...extra }))
  }))
  await new Promise(done => server.on('listening', done))
  const obs = new ObsCompat()
  try {
    await obs.connect(`ws://127.0.0.1:${server.address().port}`, '')
    assert.equal(obs.protocol, 'v4')
    assert.deepEqual(await obs.call('GetStreamStatus'), { outputActive: false })
    await obs.call('StartStream')
    assert.deepEqual(requests.filter(r => r !== 'GetAuthRequired'), ['GetStreamingStatus', 'StartStreaming'])
  } finally { await obs.disconnect(); server.close() }
})
