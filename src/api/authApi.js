import { apiRequest, clearCsrfToken, setCsrfToken } from './httpClient.js'

function rememberCsrf(result) {
  if (result.csrfToken) setCsrfToken(result.csrfToken)
  return result
}

export async function login(loginId, password) {
  return rememberCsrf(await apiRequest('/api/auth.php?action=login', {
    method: 'POST',
    body: { loginId, password },
  }))
}

export async function getCurrentAdmin() {
  return rememberCsrf(await apiRequest('/api/auth.php?action=me'))
}

export async function logout() {
  try {
    return await apiRequest('/api/auth.php?action=logout', { method: 'POST' })
  } finally {
    clearCsrfToken()
  }
}

export function changePassword(currentPassword, newPassword) {
  return apiRequest('/api/auth.php?action=change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}
