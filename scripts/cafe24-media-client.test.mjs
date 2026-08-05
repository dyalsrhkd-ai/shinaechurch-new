import assert from 'node:assert/strict'
import http from 'node:http'

import { configureApiBaseUrl, setCsrfToken } from '../src/api/httpClient.js'
import { deleteMedia, uploadMedia } from '../src/utils/mediaStorage.js'

let uploadRequest
class FakeXMLHttpRequest {
  constructor() {
    this.headers = {}
    this.upload = {}
    uploadRequest = this
  }

  open(method, url) {
    this.method = method
    this.url = url
  }

  setRequestHeader(name, value) {
    this.headers[name] = value
  }

  send(body) {
    this.body = body
    this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 })
    this.status = 200
    this.responseText = JSON.stringify({ ok: true, file: { url: '/uploads/gallery/file.jpg', path: 'uploads/gallery/file.jpg' } })
    this.onload()
  }
}

const deletes = []
const server = http.createServer((request, response) => {
  let raw = ''
  request.on('data', (chunk) => { raw += chunk })
  request.on('end', () => {
    deletes.push({ request, body: JSON.parse(raw) })
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ ok: true }))
  })
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
configureApiBaseUrl(`http://127.0.0.1:${address.port}`)
setCsrfToken('media-csrf')
const NativeXMLHttpRequest = globalThis.XMLHttpRequest
globalThis.XMLHttpRequest = FakeXMLHttpRequest

try {
  const progress = []
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  const uploaded = await uploadMedia(file, 'gallery', (value) => progress.push(value))
  assert.deepEqual(uploaded, { url: '/uploads/gallery/file.jpg', path: 'uploads/gallery/file.jpg' })
  assert.equal(uploadRequest.method, 'POST')
  assert.match(uploadRequest.url, /media\.php\?action=upload$/)
  assert.equal(uploadRequest.headers['X-CSRF-Token'], 'media-csrf')
  assert.deepEqual(progress, [50])

  await deleteMedia('uploads/gallery/file.jpg')
  assert.equal(deletes[0].body.path, 'uploads/gallery/file.jpg')
  assert.equal(deletes[0].request.headers['x-csrf-token'], 'media-csrf')
  console.log('Cafe24 media client OK')
} finally {
  globalThis.XMLHttpRequest = NativeXMLHttpRequest
  await new Promise((resolve) => server.close(resolve))
}
