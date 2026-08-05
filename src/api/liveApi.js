import { apiRequest } from './httpClient.js'

export async function getPublicLiveState(streamKey) {
  return (await apiRequest(`/api/live.php?action=public&streamKey=${encodeURIComponent(streamKey)}`)).live
}

export async function unlockLiveStream(streamKey, credential) {
  return (await apiRequest('/api/live.php?action=unlock', {
    method: 'POST',
    body: { streamKey, credential },
  })).live
}

export async function getAdminLiveState(streamKey) {
  return (await apiRequest(`/api/live.php?action=admin&streamKey=${encodeURIComponent(streamKey)}`)).live
}

export async function saveLiveSetting(streamKey, setting) {
  return (await apiRequest('/api/live.php?action=save', {
    method: 'POST',
    body: { streamKey, setting },
  })).setting
}

export async function requestLiveCommand(streamKey, desiredState) {
  return (await apiRequest('/api/live.php?action=command', {
    method: 'POST',
    body: { streamKey, desiredState },
  })).command
}

export async function issueLiveAgent(agentKey, displayName, streamKeys) {
  return (await apiRequest('/api/live.php?action=issue-agent', {
    method: 'POST',
    body: { agentKey, displayName, streamKeys },
  })).agent
}
