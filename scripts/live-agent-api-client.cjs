function createLiveAgentApiClient({ apiBaseUrl, agentToken, fetchImpl }) {
  const baseUrl = String(apiBaseUrl || '').replace(/\/$/, '')
  const token = String(agentToken || '').trim()
  if (!/^https?:\/\//i.test(baseUrl)) throw new Error('apiBaseUrl must be an HTTP(S) URL.')
  if (token.length < 16) throw new Error('agentToken is required.')
  const fetchFn = fetchImpl || require('undici').fetch

  async function request(action, body) {
    const url = `${baseUrl}/api/live-agent.php?action=${encodeURIComponent(action)}`
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetchFn(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        const text = await response.text()
        let payload
        try {
          payload = text ? JSON.parse(text) : {}
        } catch {
          payload = { ok: false, error: { message: 'Invalid server response.' } }
        }
        if (response.ok && payload.ok !== false) return payload

        const error = new Error(payload?.error?.message || `Live API request failed (${response.status}).`)
        error.status = response.status
        error.code = payload?.error?.code || 'LIVE_API_REQUEST_FAILED'
        if (response.status >= 500 && attempt === 0) continue
        throw error
      } catch (error) {
        if (!error.status && attempt === 0) continue
        throw error instanceof Error ? error : new Error(String(error))
      }
    }
    throw new Error('Live API request failed.')
  }

  return {
    async poll(status) {
      const payload = await request('poll', { status })
      return { settings: payload.settings || {}, command: payload.command || null }
    },
    async heartbeat(status) {
      return (await request('heartbeat', { status })).status || {}
    },
    async complete(requestId, ok, result) {
      const payload = await request('complete', { requestId, ok, result })
      return { duplicate: Boolean(payload.duplicate) }
    },
    async updateVideo(streamKey, videoId) {
      return (await request('video', { streamKey, videoId })).videoId || ''
    },
    async resolveVideo(streamKey, channelId) {
      return (await request('resolve-video', { streamKey, channelId })).videoId || ''
    },
  }
}

module.exports = { createLiveAgentApiClient }
