let apiBaseUrl = ''
let csrfToken = ''

export function configureApiBaseUrl(baseUrl) {
  apiBaseUrl = String(baseUrl || '').replace(/\/$/, '')
}

export function setCsrfToken(value) {
  csrfToken = String(value || '')
}

export function clearCsrfToken() {
  csrfToken = ''
}

function apiUrl(path) {
  return /^https?:\/\//i.test(path) ? path : `${apiBaseUrl}${path}`
}

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const upperMethod = method.toUpperCase()
  const requestHeaders = { ...headers }
  const options = {
    method: upperMethod,
    credentials: 'same-origin',
    headers: requestHeaders,
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  if (csrfToken && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
    requestHeaders['X-CSRF-Token'] = csrfToken
  }

  const response = await fetch(apiUrl(path), options)
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { ok: false, error: { message: 'Invalid server response.' } }
  }

  if (!response.ok || payload.ok === false) {
    const error = new Error(payload?.error?.message || `Request failed (${response.status})`)
    error.code = payload?.error?.code || 'REQUEST_FAILED'
    error.status = response.status
    throw error
  }
  return payload
}
