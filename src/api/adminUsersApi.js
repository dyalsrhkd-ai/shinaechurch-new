import { apiRequest } from './httpClient.js'

export async function listAdminUsers() {
  const result = await apiRequest('/api/admin-users.php?action=list')
  return result.users
}

export function createAdminUser(user) {
  return apiRequest('/api/admin-users.php?action=create', { method: 'POST', body: user })
}

export function updateAdminUser(id, user) {
  return apiRequest('/api/admin-users.php?action=update', { method: 'POST', body: { id, ...user } })
}

export function deleteAdminUser(id) {
  return apiRequest('/api/admin-users.php?action=delete', { method: 'POST', body: { id } })
}

export function resetAdminPassword(id, temporaryPassword) {
  return apiRequest('/api/admin-users.php?action=reset-password', {
    method: 'POST',
    body: { id, temporaryPassword },
  })
}
