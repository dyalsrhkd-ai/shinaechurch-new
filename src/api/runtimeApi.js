import { apiRequest } from './httpClient.js'

export function trackVisit(visit) {
  return apiRequest('/api/runtime.php?action=visit', { method: 'POST', body: visit })
}

export async function getVisitorSummary() {
  return (await apiRequest('/api/runtime.php?action=visitor-summary')).summary
}

export async function listVisitorLogs() {
  return (await apiRequest('/api/runtime.php?action=visitor-logs')).logs
}

export async function listActivityLogs() {
  return (await apiRequest('/api/runtime.php?action=activity-logs')).logs
}

function lockRequest(action, route, lockToken) {
  return apiRequest(`/api/runtime.php?action=${action}`, {
    method: 'POST',
    body: { route, lockToken },
  })
}

export function acquireRouteLock(route, lockToken) {
  return lockRequest('lock-acquire', route, lockToken)
}

export function heartbeatRouteLock(route, lockToken) {
  return lockRequest('lock-heartbeat', route, lockToken)
}

export function releaseRouteLock(route, lockToken) {
  return lockRequest('lock-release', route, lockToken)
}
