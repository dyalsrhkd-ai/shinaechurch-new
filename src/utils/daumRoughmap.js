const DAUM_ROUGHMAP_SCRIPT_URL = 'https://dmaps.daum.net/map_js_init/roughmapLoader.js'

let roughmapScriptPromise = null

export function loadDaumRoughmapScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'))
  }

  if (window.daum?.roughmap?.Lander) {
    return Promise.resolve(window.daum.roughmap)
  }

  if (roughmapScriptPromise) {
    return roughmapScriptPromise
  }

  roughmapScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${DAUM_ROUGHMAP_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.daum?.roughmap), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Daum roughmap script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = DAUM_ROUGHMAP_SCRIPT_URL
    script.async = true
    script.charset = 'UTF-8'
    script.onload = () => resolve(window.daum?.roughmap)
    script.onerror = () => reject(new Error('Failed to load Daum roughmap script'))
    document.head.appendChild(script)
  })

  return roughmapScriptPromise
}

export function renderDaumRoughmap({ containerId, timestamp, key, mapWidth = '100%', mapHeight = '100%' }) {
  return loadDaumRoughmapScript().then(() => {
    if (!window.daum?.roughmap?.Lander) {
      throw new Error('Daum roughmap is unavailable')
    }

    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`Map container not found: ${containerId}`)
    }

    container.innerHTML = ''
    new window.daum.roughmap.Lander({
      timestamp,
      key,
      mapWidth,
      mapHeight,
    }).render()
  })
}
