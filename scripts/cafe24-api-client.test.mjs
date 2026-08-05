import assert from 'node:assert/strict'
import http from 'node:http'

import { configureApiBaseUrl } from '../src/api/httpClient.js'
import { changePassword, getCurrentAdmin, login, logout } from '../src/api/authApi.js'
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  resetAdminPassword,
  updateAdminUser,
} from '../src/api/adminUsersApi.js'

const requests = []
const server = http.createServer((request, response) => {
  let raw = ''
  request.on('data', (chunk) => { raw += chunk })
  request.on('end', () => {
    const url = new URL(request.url, 'http://localhost')
    const body = raw ? JSON.parse(raw) : null
    requests.push({ method: request.method, url, body, headers: request.headers })
    response.setHeader('Content-Type', 'application/json')

    if (url.searchParams.get('action') === 'error') {
      response.statusCode = 400
      response.end(JSON.stringify({ ok: false, error: { code: 'BAD_REQUEST', message: 'Readable error' } }))
      return
    }
    if (url.pathname.endsWith('/auth.php')) {
      const action = url.searchParams.get('action')
      if (action === 'login' || action === 'me') {
        response.end(JSON.stringify({
          ok: true,
          user: { id: 1, loginId: 'admin01', displayName: 'Admin' },
          csrfToken: 'csrf-from-server',
        }))
        return
      }
      response.end(JSON.stringify({ ok: true }))
      return
    }
    if (url.searchParams.get('action') === 'list') {
      response.end(JSON.stringify({ ok: true, users: [{ id: 1, loginId: 'admin01' }] }))
      return
    }
    response.end(JSON.stringify({ ok: true, id: 9 }))
  })
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
configureApiBaseUrl(`http://127.0.0.1:${address.port}`)
const nativeFetch = globalThis.fetch
const fetchOptions = []
globalThis.fetch = (url, options) => {
  fetchOptions.push(options)
  return nativeFetch(url, options)
}

try {
  const loggedIn = await login('admin01', 'correct-horse-2026')
  assert.equal(loggedIn.user.loginId, 'admin01')
  await getCurrentAdmin()
  await changePassword('old-password', 'new-password-2026')
  assert.equal((await listAdminUsers()).length, 1)
  await createAdminUser({ loginId: 'admin02', displayName: 'Second', temporaryPassword: 'temporary-pass-2026' })
  await updateAdminUser(2, { loginId: 'admin-two', displayName: 'Second Admin' })
  await resetAdminPassword(2, 'reset-password-2026')
  await deleteAdminUser(2)
  await logout()

  const loginRequest = requests.find((item) => item.url.searchParams.get('action') === 'login')
  assert.equal(loginRequest.method, 'POST')
  assert.deepEqual(loginRequest.body, { loginId: 'admin01', password: 'correct-horse-2026' })
  assert.ok(fetchOptions.every((options) => options.credentials === 'same-origin'))

  const changeRequest = requests.find((item) => item.url.searchParams.get('action') === 'change-password')
  assert.equal(changeRequest.headers['x-csrf-token'], 'csrf-from-server')
  const listRequest = requests.find((item) => item.url.searchParams.get('action') === 'list')
  assert.equal(listRequest.method, 'GET')
  assert.equal(listRequest.headers['x-csrf-token'], undefined)

  const createRequest = requests.find((item) => item.url.searchParams.get('action') === 'create')
  assert.equal(createRequest.headers['x-csrf-token'], 'csrf-from-server')
  assert.equal(createRequest.headers['content-type'], 'application/json')

  const { apiRequest } = await import('../src/api/httpClient.js')
  await assert.rejects(
    apiRequest('/api/admin-users.php?action=error'),
    (error) => error.message === 'Readable error' && error.code === 'BAD_REQUEST' && error.status === 400,
  )

  console.log('Cafe24 frontend API clients OK')
} finally {
  globalThis.fetch = nativeFetch
  await new Promise((resolve) => server.close(resolve))
}
