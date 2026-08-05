import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'

import { configureApiBaseUrl, setCsrfToken } from '../src/api/httpClient.js'
import {
  acquireRouteLock,
  getVisitorSummary,
  heartbeatRouteLock,
  listActivityLogs,
  listVisitorLogs,
  releaseRouteLock,
  trackVisit,
} from '../src/api/runtimeApi.js'

const requests = []
const server = http.createServer((request, response) => {
  let raw = ''
  request.on('data', chunk => { raw += chunk })
  request.on('end', () => {
    const url = new URL(request.url, 'http://localhost')
    const body = raw ? JSON.parse(raw) : null
    requests.push({ method: request.method, url, body, headers: request.headers })
    response.setHeader('Content-Type', 'application/json')
    const action = url.searchParams.get('action')
    if (action === 'visitor-summary') return response.end(JSON.stringify({ ok: true, summary: { totalVisits: 5 } }))
    if (action === 'visitor-logs' || action === 'activity-logs') return response.end(JSON.stringify({ ok: true, logs: [{ id: 1 }] }))
    if (action === 'lock-acquire') return response.end(JSON.stringify({ ok: true, acquired: true }))
    if (action === 'lock-heartbeat') return response.end(JSON.stringify({ ok: true, owned: true }))
    response.end(JSON.stringify({ ok: true, recorded: true }))
  })
})

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
configureApiBaseUrl(`http://127.0.0.1:${server.address().port}`)
setCsrfToken('runtime-csrf')

try {
  assert.equal((await trackVisit({ path: '/', referrer: '', deviceType: 'desktop' })).recorded, true)
  assert.equal((await getVisitorSummary()).totalVisits, 5)
  assert.equal((await listVisitorLogs()).length, 1)
  assert.equal((await listActivityLogs()).length, 1)
  assert.equal((await acquireRouteLock('/admin/notices', 'lock-token-123456')).acquired, true)
  assert.equal((await heartbeatRouteLock('/admin/notices', 'lock-token-123456')).owned, true)
  await releaseRouteLock('/admin/notices', 'lock-token-123456')

  const lock = requests.find(item => item.url.searchParams.get('action') === 'lock-acquire')
  assert.deepEqual(lock.body, { route: '/admin/notices', lockToken: 'lock-token-123456' })
  assert.equal(lock.headers['x-csrf-token'], 'runtime-csrf')

  for (const filename of [
    'src/hooks/useAdminRouteLock.js',
    'src/utils/visitorAnalytics.js',
    'src/pages/admin/analytics/VisitorLogsManager.jsx',
    'src/pages/admin/analytics/ActivityLogsManager.jsx',
  ]) {
    const source = fs.readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /firebase|firestore|from ['"][^'"]*firebase/, `${filename} still uses Firebase runtime`)
  }
  const adminLayout = fs.readFileSync(new URL('../src/pages/admin/AdminLayout.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(adminLayout, /firebase\/firestore|addDoc\(|collection\(db/, 'AdminLayout still writes Firestore activity logs')

  console.log('Cafe24 runtime API client OK')
} finally {
  await new Promise(resolve => server.close(resolve))
}
