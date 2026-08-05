import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'

import { configureApiBaseUrl, setCsrfToken } from '../src/api/httpClient.js'
import {
  getAdminLiveState,
  getPublicLiveState,
  issueLiveAgent,
  requestLiveCommand,
  saveLiveSetting,
  unlockLiveStream,
} from '../src/api/liveApi.js'

const requests = []
const server = http.createServer((request, response) => {
  let raw = ''
  request.on('data', (chunk) => { raw += chunk })
  request.on('end', () => {
    const url = new URL(request.url, 'http://localhost')
    const body = raw ? JSON.parse(raw) : null
    requests.push({ method: request.method, url, body, headers: request.headers })
    response.setHeader('Content-Type', 'application/json')
    const action = url.searchParams.get('action')
    if (action === 'save') return response.end(JSON.stringify({ ok: true, setting: body.setting }))
    if (action === 'command') return response.end(JSON.stringify({ ok: true, command: { requestId: 'req-1', desiredState: body.desiredState } }))
    if (action === 'issue-agent') return response.end(JSON.stringify({ ok: true, agent: { agentKey: body.agentKey, agentToken: 'once' } }))
    response.end(JSON.stringify({ ok: true, live: { streamKey: url.searchParams.get('streamKey') || body?.streamKey, setting: { title: 'Live' } } }))
  })
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
configureApiBaseUrl(`http://127.0.0.1:${server.address().port}`)
setCsrfToken('live-csrf')

try {
  assert.equal((await getPublicLiveState('main')).streamKey, 'main')
  assert.equal((await unlockLiveStream('main', 'secret')).streamKey, 'main')
  assert.equal((await getAdminLiveState('young')).streamKey, 'young')
  assert.equal((await saveLiveSetting('main', { title: 'Main' })).title, 'Main')
  assert.equal((await requestLiveCommand('main', 'start')).requestId, 'req-1')
  assert.equal((await issueLiveAgent('main-pc', 'Main PC', ['main'])).agentToken, 'once')

  const unlock = requests.find((item) => item.url.searchParams.get('action') === 'unlock')
  assert.deepEqual(unlock.body, { streamKey: 'main', credential: 'secret' })
  const command = requests.find((item) => item.url.searchParams.get('action') === 'command')
  assert.deepEqual(command.body, { streamKey: 'main', desiredState: 'start' })
  assert.equal(command.headers['x-csrf-token'], 'live-csrf')
  const issue = requests.find((item) => item.url.searchParams.get('action') === 'issue-agent')
  assert.deepEqual(issue.body, { agentKey: 'main-pc', displayName: 'Main PC', streamKeys: ['main'] })
  const adminLayout = fs.readFileSync(new URL('../src/pages/admin/AdminLayout.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(adminLayout, /LIVE_STREAM_AGENT_COLLECTION|onSnapshot\(\s*doc\(db,/, 'admin live status must use Cafe24 API')
  console.log('Cafe24 live API client OK')
} finally {
  await new Promise((resolve) => server.close(resolve))
}
