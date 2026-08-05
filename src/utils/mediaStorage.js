import { apiRequest, getCsrfToken, resolveApiUrl } from '../api/httpClient.js'

export function uploadMedia(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', resolveApiUrl('/api/media.php?action=upload'))
    request.withCredentials = true
    const csrfToken = getCsrfToken()
    if (csrfToken) request.setRequestHeader('X-CSRF-Token', csrfToken)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    request.onload = () => {
      let payload
      try {
        payload = JSON.parse(request.responseText || '{}')
      } catch {
        payload = { ok: false, error: { message: 'Invalid server response.' } }
      }
      if (request.status >= 200 && request.status < 300 && payload.ok !== false) {
        resolve(payload.file)
        return
      }
      const error = new Error(payload?.error?.message || `Upload failed (${request.status})`)
      error.code = payload?.error?.code || 'UPLOAD_FAILED'
      error.status = request.status
      reject(error)
    }
    request.onerror = () => reject(new Error('Upload connection failed.'))
    const body = new FormData()
    body.append('folder', folder)
    body.append('file', file)
    request.send(body)
  })
}

export function deleteMedia(path) {
  if (!path?.startsWith('uploads/')) return Promise.resolve({ ok: true })
  return apiRequest('/api/media.php?action=delete', { method: 'POST', body: { path } })
}
