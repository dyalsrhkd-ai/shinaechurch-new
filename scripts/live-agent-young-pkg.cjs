const os = require('node:os')
const process = require('node:process')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright-core')
const OBSWebSocket = require('obs-websocket-js').default
const { initializeApp } = require('firebase/app')
const { doc, getDoc, onSnapshot, serverTimestamp, setDoc, getFirestore } = require('firebase/firestore')
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth')

const LIVE_STREAM_AGENT_COLLECTION = 'liveStreamAgents'
const LIVE_STREAM_CONTROL_COLLECTION = 'liveStreamControls'
const DEFAULT_OBS_URL = 'ws://127.0.0.1:4455'
const DEFAULT_OBS_PASSWORD = '123456789#'
const DEFAULT_ADMIN_EMAIL = 'admin@shinaechurch.com'
const DEFAULT_ADMIN_PASSWORD = '123456789!'
const STREAM_KEY = 'young'
const YOUTUBE_AUTOMATION_PORT = 9223
const YOUTUBE_API_KEYS = [
  'AIzaSyAIzzSeolSPp16rsqS8lcB-D6n3hg8fg1o',
]

const firebaseConfig = {
  apiKey: 'AIzaSyDroOJix6yaqw65JMCvP7ZfE-Ihku8Pvxk',
  authDomain: 'shinae-new.firebaseapp.com',
  projectId: 'shinae-new',
  storageBucket: 'shinae-new.firebasestorage.app',
  messagingSenderId: '61716478568',
  appId: '1:61716478568:web:41f329a0047eb88a02d9dd',
}

function getExecutableDir() {
  return path.dirname(process.execPath)
}

function getLogPath() {
  return path.join(getExecutableDir(), 'ShinaeLiveYoung-error.log')
}

function getRuntimeLogPath() {
  return path.join(getExecutableDir(), 'ShinaeLiveYoung.log')
}

function writeFatalLog(error) {
  const message = `[${new Date().toISOString()}] ${error && error.stack ? error.stack : String(error)}\n`
  fs.appendFileSync(getLogPath(), message, 'utf8')
  console.error(message)
}

function logInfo(message) {
  const line = `[${new Date().toISOString()}] [INFO] ${message}`
  fs.appendFileSync(getRuntimeLogPath(), `${line}\n`, 'utf8')
  console.log(`[live-agent] ${message}`)
}

function logWarn(message) {
  const line = `[${new Date().toISOString()}] [WARN] ${message}`
  fs.appendFileSync(getRuntimeLogPath(), `${line}\n`, 'utf8')
  console.warn(`[live-agent] ${message}`)
}

function getStartupScriptPath() {
  const startupDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    : ''

  return startupDir ? path.join(startupDir, 'ShinaeLiveAgent-young.cmd') : ''
}

function ensureWindowsAutoStart() {
  if (process.platform !== 'win32') return
  if (!process.execPath.toLowerCase().endsWith('.exe')) return

  const startupScriptPath = getStartupScriptPath()
  if (!startupScriptPath) return

  const command = `@echo off\r\nstart "" "${process.execPath}"\r\n`

  try {
    fs.writeFileSync(startupScriptPath, command, 'utf8')
  } catch (error) {
    console.warn(`[live-agent] Failed to register startup script: ${error.message}`)
  }
}

function resolveRuntimeConfig() {
  return {
    obsUrl: DEFAULT_OBS_URL,
    obsPassword: DEFAULT_OBS_PASSWORD,
    agentLabel: `${os.hostname()}-${STREAM_KEY}`,
    adminEmail: DEFAULT_ADMIN_EMAIL,
    adminPassword: DEFAULT_ADMIN_PASSWORD,
  }
}

function getChromeExecutableCandidates() {
  return [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean)
}

function findChromeExecutable() {
  return getChromeExecutableCandidates().find((candidate) => fs.existsSync(candidate)) || ''
}

function getChromeUserDataRoot() {
  return path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')
}

function ensureChromeAutomationProfileExists(profileName) {
  const sourceRoot = getChromeUserDataRoot()
  const normalizedProfileName = String(profileName || '').trim() || 'Default'
  const sourceProfileDir = path.join(sourceRoot, normalizedProfileName)
  if (!fs.existsSync(sourceProfileDir)) {
    throw new Error(`Chrome profile not found: ${sourceProfileDir}`)
  }
  return { profileName: normalizedProfileName, sourceRoot }
}

async function waitForChromeDebugEndpoint(timeoutMs = 15000) {
  const startedAt = Date.now()
  const endpoint = `http://127.0.0.1:${YOUTUBE_AUTOMATION_PORT}/json/version`

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(endpoint)
      if (response.ok) {
        const payload = await response.json()
        if (payload?.webSocketDebuggerUrl) {
          return payload.webSocketDebuggerUrl
        }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error('Chrome remote debugging endpoint did not open in time')
}

function launchChromeAutomationWindow(executablePath, studioUrl, profileName) {
  const { profileName: resolvedProfileName, sourceRoot } = ensureChromeAutomationProfileExists(profileName)
  logInfo(`Launching YouTube Studio automation with profile ${resolvedProfileName}`)

  const args = [
    `--remote-debugging-port=${YOUTUBE_AUTOMATION_PORT}`,
    `--user-data-dir=${sourceRoot}`,
    `--profile-directory=${resolvedProfileName}`,
    '--new-window',
    studioUrl,
  ]

  const child = spawn(executablePath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  })
  child.unref()

  return { profileName: resolvedProfileName }
}

async function clickFirstVisible(page, labels, timeoutMs = 5000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    for (const label of labels) {
      const button = page.getByRole('button', { name: label }).first()
      try {
        if (await button.isVisible({ timeout: 250 })) {
          await button.click({ timeout: 1000 })
          return true
        }
      } catch {}
    }

    await page.waitForTimeout(300)
  }

  return false
}

async function waitForYoutubeStudioReady(page, timeoutMs = 90000) {
  const startedAt = Date.now()
  const readyTexts = [
    /excellent connection/i,
    /stream health/i,
    /좋은 연결 상태/i,
    /연결 상태가 좋습니다/i,
    /스트림 상태/i,
  ]

  while (Date.now() - startedAt < timeoutMs) {
    const bodyText = await page.locator('body').innerText().catch(() => '')
    if (readyTexts.some((pattern) => pattern.test(bodyText))) {
      logInfo('YouTube Studio looks ready for Go live')
      return true
    }

    await page.waitForTimeout(1000)
  }

  logWarn('YouTube Studio readiness signal not found before timeout')
  return false
}

async function ensureYoutubeGoLive(channelId, profileName) {
  if (!channelId) return false

  const executablePath = findChromeExecutable()
  if (!executablePath) {
    throw new Error('Chrome or Edge executable not found')
  }

  const studioUrl = `https://studio.youtube.com/channel/${channelId}/livestreaming/dashboard`

  let browser
  try {
    launchChromeAutomationWindow(executablePath, studioUrl, profileName)
    const wsEndpoint = await waitForChromeDebugEndpoint()
    browser = await chromium.connectOverCDP(wsEndpoint)
    const context = browser.contexts()[0]
    const page = context.pages().find((item) => String(item.url() || '').includes('studio.youtube.com'))
      || await context.newPage()
    if (!String(page.url() || '').includes('studio.youtube.com')) {
      await page.goto(studioUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    }

    // Dismiss simple interstitials if YouTube shows them.
    await clickFirstVisible(page, [/확인/i, /닫기/i, /나중에/i, /Got it/i, /Close/i], 3000)

    await waitForYoutubeStudioReady(page, 90000)

    const goLiveClicked = await clickFirstVisible(page, [/라이브 시작/i, /^Go live$/i], 90000)
    if (!goLiveClicked) {
      logWarn('YouTube Studio automation could not find Go live button')
      return false
    }

    logInfo('YouTube Studio Go live clicked')
    await page.waitForTimeout(3000)
    return true
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}

function getObsExecutableCandidates() {
  return [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'obs-studio', 'bin', '64bit', 'obs64.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'obs-studio', 'bin', '64bit', 'obs64.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'obs-studio', 'bin', '64bit', 'obs64.exe'),
  ].filter(Boolean)
}

function findObsExecutable() {
  return getObsExecutableCandidates().find((candidate) => fs.existsSync(candidate)) || ''
}

function extractYoutubeChannelId(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(input)) {
    return input
  }

  try {
    const url = new URL(input)
    const segments = url.pathname.split('/').filter(Boolean)
    const channelIndex = segments.findIndex((segment) => segment === 'channel')
    const candidate = segments[channelIndex + 1] || ''

    if (channelIndex >= 0 && /^UC[a-zA-Z0-9_-]{22}$/.test(candidate)) {
      return candidate
    }
  } catch {
    return ''
  }

  return ''
}

function extractYoutubeVideoId(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  try {
    const url = new URL(input)

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\//, '').slice(0, 11)
    }

    if (url.searchParams.get('v')) {
      return url.searchParams.get('v').slice(0, 11)
    }

    const segments = url.pathname.split('/').filter(Boolean)
    const liveIndex = segments.findIndex((segment) => segment === 'live' || segment === 'embed')
    if (liveIndex >= 0 && segments[liveIndex + 1]) {
      return segments[liveIndex + 1].slice(0, 11)
    }
  } catch {
    return ''
  }

  return ''
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  ensureWindowsAutoStart()

  const runtimeConfig = resolveRuntimeConfig()
  const app = initializeApp(firebaseConfig, `live-agent-${STREAM_KEY}`)
  const db = getFirestore(app)
  const auth = getAuth(app)
  const obs = new OBSWebSocket()

  const controlRef = doc(db, LIVE_STREAM_CONTROL_COLLECTION, STREAM_KEY)
  const agentRef = doc(db, LIVE_STREAM_AGENT_COLLECTION, STREAM_KEY)
  const settingsRef = doc(db, 'settings', 'main')

  let obsConnected = false
  let reconnecting = false
  let processedRequestId = ''
  let heartbeatTimer = null
  let executing = false
  let lastResolvedVideoId = ''
  let lastVideoSyncAt = 0
  let obsLaunchAttempted = false
  let currentVideoIdLocked = false

  async function updateAgentStatus(extra = {}) {
    await setDoc(agentRef, {
      streamKey: STREAM_KEY,
      agentLabel: runtimeConfig.agentLabel,
      agentVersion: '1.2.0',
      obsUrl: runtimeConfig.obsUrl,
      obsConnected,
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...extra,
    }, { merge: true })
  }

  async function setLiveState(patch) {
    await setDoc(settingsRef, {
      liveStreams: {
        [STREAM_KEY]: patch,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function setLiveEnabled(enabled) {
    await setLiveState({ enabled })
  }

  async function setCurrentVideoId(currentVideoId) {
    const normalized = String(currentVideoId || '').trim()
    lastResolvedVideoId = normalized
    lastVideoSyncAt = Date.now()
    currentVideoIdLocked = Boolean(normalized)
    logInfo(`currentVideoId => ${normalized || '(empty)'}`)
    await setLiveState({ currentVideoId: normalized })
  }

  async function getStreamActive() {
    const response = await obs.call('GetStreamStatus')
    return Boolean(response.outputActive)
  }

  async function connectObs() {
    if (obsConnected || reconnecting) return

    reconnecting = true
    try {
      await obs.connect(runtimeConfig.obsUrl, runtimeConfig.obsPassword)
      obsConnected = true
      obsLaunchAttempted = false
      await updateAgentStatus({ message: 'OBS connected' })
    } catch (error) {
      obsConnected = false
      await updateAgentStatus({ message: `OBS connection failed: ${error.message}` })
      throw error
    } finally {
      reconnecting = false
    }
  }

  async function ensureObsReady() {
    if (!obsConnected) {
      await connectObs()
    }
  }

  async function getYoutubeTarget() {
    const snapshot = await getDoc(settingsRef)
    const settings = snapshot.data() || {}
    const stream = settings?.liveStreams?.[STREAM_KEY] || {}
    const target = String(stream.youtubeUrl || '').trim()
    logInfo(`youtubeUrl => ${target || '(empty)'}`)
    return target
  }

  async function getYoutubeAutomationProfileName() {
    const snapshot = await getDoc(settingsRef)
    const settings = snapshot.data() || {}
    const stream = settings?.liveStreams?.[STREAM_KEY] || {}
    const profileName = String(stream.youtubeChromeProfileName || '').trim() || 'Default'
    logInfo(`youtubeChromeProfileName => ${profileName}`)
    return profileName
  }

async function fetchCurrentLiveVideoId(channelId) {
  logInfo(`Requesting current live video from channel ${channelId}`)
  let lastError = null

  for (let index = 0; index < YOUTUBE_API_KEYS.length; index += 1) {
    const apiKey = YOUTUBE_API_KEYS[index]
    const params = new URLSearchParams({
      part: 'id,snippet',
      channelId,
      eventType: 'live',
      type: 'video',
      maxResults: '1',
      key: apiKey,
    })

    logInfo(`Trying YouTube API key ${index + 1}/${YOUTUBE_API_KEYS.length}`)

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`)
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      const message = `YouTube API request failed: ${response.status}${body ? ` ${body}` : ''}`
      lastError = new Error(message)

      if (response.status === 403 && body.includes('quotaExceeded') && index < YOUTUBE_API_KEYS.length - 1) {
        logInfo(`API key ${index + 1} quota exceeded, rotating to next key`)
        continue
      }

      throw lastError
    }

    const payload = await response.json()
    const liveItem = (payload?.items || []).find((item) => item?.snippet?.liveBroadcastContent === 'live')
    logInfo(`YouTube API items => ${(payload?.items || []).length}`)
    return String(liveItem?.id?.videoId || '').trim()
  }

  throw lastError || new Error('No YouTube API keys available')
}

async function fetchCurrentLiveVideoIdFromChannelPage(channelId) {
  const url = `https://www.youtube.com/channel/${channelId}/live`
  logInfo(`Falling back to channel page ${url}`)

  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Channel page request failed: ${response.status}`)
  }

  // 리다이렉트된 최종 URL에서 영상 ID 추출 (라이브 있을 때만 watch?v=... 로 리다이렉트됨)
  const finalUrl = response.url
  logInfo(`Channel page final URL => ${finalUrl}`)

  const redirectMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (false && redirectMatch?.[1]) {
    logInfo(`Channel page resolvedVideoId (from redirect) => ${redirectMatch[1]}`)
    return redirectMatch[1]
  }

  // 리다이렉트에서 못 찾으면 HTML 파싱으로 폴백
  const html = await response.text()

  function extractInnertubeApiKey(input) {
    const match = input.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
    return String(match?.[1] || '').trim()
  }

  function extractVisitorData(input) {
    const match = input.match(/"visitorData":"([^"]+)"/)
    return String(match?.[1] || '').trim()
  }

  function extractBrowseParams(input) {
    const match = input.match(/"browseEndpoint":\{"browseId":"UC[a-zA-Z0-9_-]{22}","params":"([^"]+)"/)
    return String(match?.[1] || '').trim()
  }

  function hasLiveBadge(videoRenderer) {
    const overlays = Array.isArray(videoRenderer?.thumbnailOverlays) ? videoRenderer.thumbnailOverlays : []
    const hasLiveOverlay = overlays.some((overlay) => {
      const status = overlay?.thumbnailOverlayTimeStatusRenderer
      return status?.style === 'LIVE' || status?.style === 'LIVE_NOW'
    })

    const badges = Array.isArray(videoRenderer?.badges) ? videoRenderer.badges : []
    const hasBadge = badges.some((badge) => {
      const style = badge?.metadataBadgeRenderer?.style || ''
      const label = badge?.metadataBadgeRenderer?.label || ''
      return style.includes('LIVE') || label.includes('LIVE') || label.includes('실시간')
    })

    const viewCount = videoRenderer?.viewCountText?.simpleText || ''
    const published = videoRenderer?.publishedTimeText?.simpleText || ''

    return hasLiveOverlay || hasBadge || viewCount.includes('시청 중')
  }

  function parseRecentMinutes(text) {
    const input = String(text || '').trim()
    const minuteMatch = input.match(/(\d+)\s*분\s*전/)
    if (minuteMatch?.[1]) {
      return Number(minuteMatch[1])
    }

    if (input.includes('방금 전')) {
      return 0
    }

    const hourMatch = input.match(/(\d+)\s*시간\s*전/)
    if (hourMatch?.[1]) {
      return Number(hourMatch[1]) * 60
    }

    return Number.POSITIVE_INFINITY
  }

  function hasConfirmedLiveSignal(videoRenderer) {
    if (!videoRenderer) return false

    const overlays = Array.isArray(videoRenderer?.thumbnailOverlays) ? videoRenderer.thumbnailOverlays : []
    const overlayHasLive = overlays.some((overlay) => {
      const renderer = overlay?.thumbnailOverlayTimeStatusRenderer
      const style = String(renderer?.style || '')
      const text = String(renderer?.text?.simpleText || '')
      return style === 'LIVE' || style === 'LIVE_NOW' || text.includes('LIVE')
    })

    if (overlayHasLive) {
      return true
    }

    const badges = Array.isArray(videoRenderer?.badges) ? videoRenderer.badges : []
    return badges.some((badge) => {
      const style = String(badge?.metadataBadgeRenderer?.style || '')
      const label = String(badge?.metadataBadgeRenderer?.label || '')
      return style.includes('LIVE') || label.includes('LIVE') || label.includes('실시간')
    })
  }

  function summarizeVideoRenderer(videoRenderer) {
    const overlays = Array.isArray(videoRenderer?.thumbnailOverlays) ? videoRenderer.thumbnailOverlays : []
    const overlayStyles = overlays
      .map((overlay) => overlay?.thumbnailOverlayTimeStatusRenderer?.style || overlay?.thumbnailOverlayNowPlayingRenderer ? 'NOW_PLAYING' : '')
      .filter(Boolean)

    const badges = Array.isArray(videoRenderer?.badges) ? videoRenderer.badges : []
    const badgeLabels = badges
      .map((badge) => badge?.metadataBadgeRenderer?.label || badge?.metadataBadgeRenderer?.style || '')
      .filter(Boolean)

    return {
      videoId: String(videoRenderer?.videoId || ''),
      title: String(videoRenderer?.title?.runs?.[0]?.text || videoRenderer?.title?.simpleText || ''),
      published: String(videoRenderer?.publishedTimeText?.simpleText || ''),
      viewCount: String(videoRenderer?.viewCountText?.simpleText || ''),
      length: String(videoRenderer?.lengthText?.simpleText || ''),
      overlays: overlayStyles,
      badges: badgeLabels,
    }
  }

  function findLiveVideoId(node) {
    if (!node || typeof node !== 'object') return ''

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = findLiveVideoId(item)
        if (found) return found
      }
      return ''
    }

    if (node.videoRenderer?.videoId) {
      const videoRenderer = node.videoRenderer
      const hasLength = Boolean(videoRenderer?.lengthText?.simpleText || videoRenderer?.lengthText?.accessibility)

      if (hasConfirmedLiveSignal(videoRenderer)) {
        return String(videoRenderer.videoId).trim()
      }

      if (hasLength) {
        return ''
      }
    }

    for (const value of Object.values(node)) {
      const found = findLiveVideoId(value)
      if (found) return found
    }

    return ''
  }

  const isLive =
    html.includes('"isLive":true') ||
    html.includes('"liveBroadcastContent":"live"') ||
    html.includes('"style":"LIVE"') ||
    html.includes('"isLiveNow":true')

  // liveBroadcastContent:"live" 근처의 videoId를 우선 탐색 (가장 정확)
  const liveContextPatterns = [
    /"videoId":"([a-zA-Z0-9_-]{11})"[^{}]{0,300}"liveBroadcastContent":"live"/,
    /"liveBroadcastContent":"live"[^{}]{0,300}"videoId":"([a-zA-Z0-9_-]{11})"/,
  ]
  for (const pattern of liveContextPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      logInfo(`Channel page resolvedVideoId (live context) => ${match[1]}`)
      return match[1]
    }
  }

  // Avoid generic watch URL extraction here. On YouTube's channel /live page it can
  // point at a regular recorded video even when no live stream is active.

  try {
    const apiKey = extractInnertubeApiKey(html)
    const visitorData = extractVisitorData(html)
    const params = extractBrowseParams(html)
    if (isLive && apiKey && params) {
      logInfo('Trying youtubei browse fallback')
      const browseResponse = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-youtube-client-name': '1',
          'x-youtube-client-version': '2.20260406.01.00',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20260406.01.00',
              hl: 'ko',
              gl: 'KR',
              visitorData,
            },
          },
          browseId: channelId,
          params,
        }),
      })

      if (browseResponse.ok) {
        const browseJson = await browseResponse.json()
        const candidates = []
        ;(function collectVideoRenderers(node) {
          if (!node || typeof node !== 'object') return
          if (Array.isArray(node)) {
            node.forEach(collectVideoRenderers)
            return
          }
          if (node.videoRenderer?.videoId) {
            candidates.push(summarizeVideoRenderer(node.videoRenderer))
          }
          Object.values(node).forEach(collectVideoRenderers)
        })(browseJson)
        logInfo(`youtubei browse candidates => ${JSON.stringify(candidates.slice(0, 8))}`)
        const liveVideoId = findLiveVideoId(browseJson)
        if (liveVideoId) {
          logInfo(`Channel page resolvedVideoId (youtubei browse) => ${liveVideoId}`)
          return liveVideoId
        }
      } else {
        logInfo(`youtubei browse failed: ${browseResponse.status}`)
      }
    } else if (!isLive) {
      logInfo('Skipping youtubei browse fallback because channel page is not live')
    }
  } catch (error) {
    logInfo(`youtubei browse fallback failed => ${error.message}`)
  }

  if (!isLive) {
    logInfo('Channel page: no live stream detected')
  }
  logInfo('Channel page resolvedVideoId => (empty)')
  return ''
}

  async function syncCurrentVideoId({ attempts = 1, delayMs = 0 } = {}) {
    const youtubeTarget = await getYoutubeTarget()
    const channelId = extractYoutubeChannelId(youtubeTarget)
    const directVideoId = channelId ? '' : extractYoutubeVideoId(youtubeTarget)

    logInfo(`syncCurrentVideoId targetType => ${channelId ? 'channel' : directVideoId ? 'video' : 'none'}`)

    if (!youtubeTarget) {
      currentVideoIdLocked = false
      await setCurrentVideoId('')
      return ''
    }

    if (directVideoId) {
      await setCurrentVideoId(directVideoId)
      return directVideoId
    }

    for (let index = 0; index < attempts; index += 1) {
      try {
        let nextVideoId = ''

        try {
          nextVideoId = await fetchCurrentLiveVideoId(channelId)
          if (!nextVideoId) {
            logInfo(`attempt ${index + 1}/${attempts} api returned empty, falling back to channel page`)
            nextVideoId = await fetchCurrentLiveVideoIdFromChannelPage(channelId)
          }
        } catch (apiError) {
          logInfo(`attempt ${index + 1}/${attempts} api failed => ${apiError.message}`)
          nextVideoId = await fetchCurrentLiveVideoIdFromChannelPage(channelId)
        }

        logInfo(`attempt ${index + 1}/${attempts} resolvedVideoId => ${nextVideoId || '(empty)'}`)
        if (nextVideoId) {
          await setCurrentVideoId(nextVideoId)
          return nextVideoId
        }
      } catch (error) {
        logInfo(`attempt ${index + 1}/${attempts} failed => ${error.message}`)
        if (index === attempts - 1) {
          throw error
        }
      }

      if (index < attempts - 1 && delayMs > 0) {
        await sleep(delayMs)
      }
    }

    await setCurrentVideoId('')
    return ''
  }

  async function handleCommandSnapshot(snapshot) {
    const control = snapshot.data()
    if (!control) {
      logWarn('control snapshot ignored => empty')
      return
    }
    if (!control.requestId) {
      logWarn('control snapshot ignored => missing requestId')
      return
    }
    if (control.requestId === processedRequestId) {
      logWarn(`control snapshot ignored => already processed ${control.requestId}`)
      return
    }
    if (executing) {
      logWarn(`control snapshot queued => will recheck after current execution requestId=${control.requestId}`)
      const pendingControl = control
      const checkAfterExecution = setInterval(async () => {
        if (executing) return
        clearInterval(checkAfterExecution)
        if (pendingControl.requestId !== processedRequestId) {
          handleCommandSnapshot(snapshot).catch(writeFatalLog)
        }
      }, 500)
      return
    }

    executing = true
    processedRequestId = control.requestId
    logInfo(`command received => ${control.desiredState} requestId=${control.requestId}`)

    try {
      await ensureObsReady()

      if (control.desiredState === 'start') {
        const active = await getStreamActive()
        currentVideoIdLocked = false
        await setCurrentVideoId('')
        if (!active) {
          await obs.call('StartStream')
        }

        const youtubeTarget = await getYoutubeTarget()
        const channelId = extractYoutubeChannelId(youtubeTarget)
        const youtubeChromeProfileName = await getYoutubeAutomationProfileName()
        ensureYoutubeGoLive(channelId, youtubeChromeProfileName).catch((error) => {
          logWarn(`YouTube Studio automation failed: ${error.message}`)
        })
      } else if (control.desiredState === 'stop') {
        const active = await getStreamActive()
        if (active) {
          await obs.call('StopStream')
          // OBS가 실제로 스트림을 멈출 때까지 대기 (최대 6초)
          for (let i = 0; i < 6; i++) {
            await sleep(1000)
            const stillActive = await getStreamActive()
            if (!stillActive) break
          }
        }
      } else {
        throw new Error(`Unsupported desiredState: ${control.desiredState}`)
      }

      const streamActive = await getStreamActive()
      await setLiveEnabled(streamActive)

      if (streamActive) {
        await syncCurrentVideoId({ attempts: 1 })
      } else {
        currentVideoIdLocked = false
      }

      await setDoc(controlRef, {
        status: 'completed',
        processedAt: serverTimestamp(),
        processedRequestId: control.requestId,
        processedBy: runtimeConfig.agentLabel,
        lastAppliedState: streamActive ? 'start' : 'stop',
        error: '',
        message: streamActive ? 'OBS stream started' : 'OBS stream stopped',
        updatedAt: serverTimestamp(),
      }, { merge: true })
      await updateAgentStatus({
        streamActive,
        lastHandledRequestId: control.requestId,
        lastCommandStatus: 'completed',
        lastCommandAt: serverTimestamp(),
        message: streamActive ? 'Streaming' : 'Idle',
      })
    } catch (error) {
      await setDoc(controlRef, {
        status: 'error',
        processedAt: serverTimestamp(),
        processedRequestId: control.requestId,
        processedBy: runtimeConfig.agentLabel,
        error: error.message,
        message: error.message,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      await updateAgentStatus({
        lastHandledRequestId: control.requestId,
        lastCommandStatus: 'error',
        lastCommandAt: serverTimestamp(),
        message: error.message,
      })
      throw error
    } finally {
      executing = false
    }
  }

  async function heartbeat() {
    try {
      if (!obsConnected) {
        await connectObs()
      }

      const streamActive = await getStreamActive()
      if (!streamActive) {
        currentVideoIdLocked = false
      }

      if (streamActive && (!lastResolvedVideoId || Date.now() - lastVideoSyncAt > 15000)) {
        await syncCurrentVideoId({ attempts: 1 })
      }

      await updateAgentStatus({
        streamActive,
        message: streamActive ? 'Streaming' : 'Idle',
      })
    } catch (error) {
      obsConnected = false
      await updateAgentStatus({
        streamActive: false,
        message: error.message,
      })
    }
  }

  obs.on('ConnectionClosed', async () => {
    obsConnected = false
    await updateAgentStatus({ streamActive: false, message: 'OBS connection closed' })
  })

  obs.on('Identified', async () => {
    obsConnected = true
    await updateAgentStatus({ message: 'OBS identified' })
  })

  await signInWithEmailAndPassword(auth, runtimeConfig.adminEmail, runtimeConfig.adminPassword)

  const existingControl = await getDoc(controlRef)
  processedRequestId = (existingControl.data() || {}).processedRequestId || ''

  await heartbeat()
  heartbeatTimer = setInterval(heartbeat, 15000)

  onSnapshot(controlRef, (snapshot) => {
    logInfo('control snapshot received')
    handleCommandSnapshot(snapshot).catch(writeFatalLog)
  })

  process.on('SIGINT', async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    try {
      await updateAgentStatus({ message: 'Agent stopped', obsConnected: false })
    } finally {
      process.exit(0)
    }
  })

  console.log(`[live-agent] ${STREAM_KEY} agent online as ${runtimeConfig.agentLabel}`)
}

main().catch(async (error) => {
  try {
    writeFatalLog(error)
  } catch (logError) {
    console.error(logError)
  }

  await new Promise((resolve) => setTimeout(resolve, 15000))
  process.exit(1)
})
