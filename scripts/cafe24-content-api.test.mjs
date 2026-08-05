import assert from 'node:assert/strict'
import http from 'node:http'

import { configureApiBaseUrl, setCsrfToken } from '../src/api/httpClient.js'
import {
  createContentDocument,
  deleteContentDocument,
  getContentDocument,
  listContentDocuments,
  reorderContentDocuments,
  updateContentDocument,
  upsertContentDocument,
} from '../src/api/contentApi.js'

const requests = []
const server = http.createServer((request, response) => {
  let raw = ''
  request.on('data', (chunk) => { raw += chunk })
  request.on('end', () => {
    const url = new URL(request.url, 'http://localhost')
    const body = raw ? JSON.parse(raw) : null
    requests.push({ method: request.method, url, body, headers: request.headers })
    response.setHeader('Content-Type', 'application/json')
    if (body?.id === 'stale') {
      response.statusCode = 409
      response.end(JSON.stringify({ ok: false, error: { code: 'VERSION_CONFLICT', message: 'Changed elsewhere' } }))
      return
    }
    if (request.method === 'GET' && url.searchParams.has('id')) {
      response.end(JSON.stringify({ ok: true, document: { id: url.searchParams.get('id'), title: 'One', _version: 2 } }))
      return
    }
    if (request.method === 'GET') {
      response.end(JSON.stringify({ ok: true, documents: [{ id: 'one', order: 1, _version: 1 }] }))
      return
    }
    response.end(JSON.stringify({ ok: true, document: { id: body.id || 'created', ...body.data, _version: 1 } }))
  })
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
configureApiBaseUrl(`http://127.0.0.1:${address.port}`)
setCsrfToken('content-csrf')

try {
  assert.equal((await getContentDocument('notices', 'main')).id, 'main')
  assert.equal((await listContentDocuments('notices', { sort: 'date', direction: 'asc', limit: 25 })).length, 1)
  assert.equal((await createContentDocument('notices', { title: 'Created' })).id, 'created')
  await upsertContentDocument('settings', 'main', { title: 'Upserted' }, 4)
  await updateContentDocument('settings', 'main', { title: 'Updated' }, 5)
  await deleteContentDocument('settings', 'main', 6)
  await reorderContentDocuments('slides', [{ id: 'slide1', order: 0 }])

  const list = requests.find((item) => item.method === 'GET' && !item.url.searchParams.has('id'))
  assert.equal(list.url.searchParams.get('collection'), 'notices')
  assert.equal(list.url.searchParams.get('sort'), 'date')
  assert.equal(list.url.searchParams.get('direction'), 'asc')
  assert.equal(list.url.searchParams.get('limit'), '25')

  const upsert = requests.find((item) => item.url.searchParams.get('action') === 'upsert')
  assert.deepEqual(upsert.body, { collection: 'settings', id: 'main', data: { title: 'Upserted' }, versionNo: 4 })
  assert.equal(upsert.headers['x-csrf-token'], 'content-csrf')

  const reorder = requests.find((item) => item.url.searchParams.get('action') === 'reorder')
  assert.deepEqual(reorder.body, { collection: 'slides', rows: [{ id: 'slide1', order: 0 }] })

  await assert.rejects(
    updateContentDocument('settings', 'stale', { title: 'Stale' }, 1),
    (error) => error.code === 'VERSION_CONFLICT' && error.status === 409 && error.message === 'Changed elsewhere',
  )
  console.log('Cafe24 content API client OK')
} finally {
  await new Promise((resolve) => server.close(resolve))
}
