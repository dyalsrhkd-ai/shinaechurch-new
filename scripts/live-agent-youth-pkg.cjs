// Windows 8.1 broadcasting PCs use Node 16, OBS 27 and obs-websocket v4 on port 4444.
if (typeof globalThis.fetch !== 'function') globalThis.fetch = require('undici').fetch

const process = require('node:process')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright-core')
const OBSWebSocket = require('./obs-compat.cjs')
const { createLiveAgentApiClient } = require('./live-agent-api-client.cjs')
const { readChromeProfiles, pickChromeProfile } = require('./chrome-profiles.cjs')

const STREAM_KEY = 'youth'
const YOUTUBE_AUTOMATION_PORT = 9223
const INITIAL_LIVE_ID_DELAY_MS = 30000

function getExecutableDir() {
  return path.dirname(process.execPath)
}

function getLogPath() {
  return path.join(getExecutableDir(), 'ShinaeLiveYouth-error.log')
}

function getRuntimeLogPath() {
  return path.join(getExecutableDir(), 'ShinaeLiveYouth.log')
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

let globalLastStartRequestedAt = 0

// 2026-10-12: 유튜브 「라이브 시작」 누르는 함수(바깥)가 main 안의 변수를 써서 누르는 순간 ReferenceError 가 났다 → 바깥으로
let lastStudioReadyAt = 0
let lastGoLiveClickedAt = 0

function logTimeline(label, timestamp = Date.now()) {
  const sinceStart = globalLastStartRequestedAt ? `${Math.max(0, timestamp - globalLastStartRequestedAt)}ms` : 'n/a'
  logInfo(`timeline ${label} => ${new Date(timestamp).toISOString()} (since start: ${sinceStart})`)
}

function getStartupScriptPath() {
  const startupDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    : ''

  return startupDir ? path.join(startupDir, 'ShinaeLiveAgent-youth.cmd') : ''
}

function getChromeStartupScriptPath() {
  const startupDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    : ''

  return startupDir ? path.join(startupDir, 'ShinaeLiveChrome-youth.cmd') : ''
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

function ensureChromeAutomationAutoStart(profileName) {
  if (process.platform !== 'win32') return false

  const executablePath = findChromeExecutable()
  if (!executablePath) return false

  const startupScriptPath = getChromeStartupScriptPath()
  if (!startupScriptPath) return false

  const { profileName: resolvedProfileName, userDataRoot } = ensureChromeAutomationProfileExists(profileName)
  const command = [
    '@echo off',
    `start "" "${executablePath}" --remote-debugging-port=${YOUTUBE_AUTOMATION_PORT} --user-data-dir="${userDataRoot}" --profile-directory="${resolvedProfileName}" about:blank`,
    '',
  ].join('\r\n')

  try {
    fs.writeFileSync(startupScriptPath, command, 'utf8')
    return true
  } catch (error) {
    logWarn(`Failed to register Chrome startup script: ${error.message}`)
    return false
  }
}

function resolveRuntimeConfig() {
  const configPath = path.join(getExecutableDir(), `live-agent.${STREAM_KEY}.json`)
  if (!fs.existsSync(configPath)) throw new Error(`Missing live agent config: ${configPath}`)

  let config
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    throw new Error(`Invalid live agent config ${configPath}: ${error.message}`)
  }

  const required = ['apiBaseUrl', 'agentId', 'agentToken', 'obsUrl', 'obsPassword', 'agentLabel']
  const missing = required.filter((key) => !String(config[key] || '').trim())
  if (missing.length) throw new Error(`Missing live agent config fields: ${missing.join(', ')}`)
  if (Array.isArray(config.managedStreamKeys) && !config.managedStreamKeys.includes(STREAM_KEY)) {
    throw new Error(`managedStreamKeys must include ${STREAM_KEY}.`)
  }

  return {
    apiBaseUrl: String(config.apiBaseUrl).trim(),
    agentId: String(config.agentId).trim(),
    agentToken: String(config.agentToken).trim(),
    obsUrl: String(config.obsUrl).trim(),
    obsPassword: String(config.obsPassword),
    agentLabel: String(config.agentLabel).trim(),
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

function getChromeAutomationUserDataRoot() {
  return path.join(process.env.LOCALAPPDATA || getExecutableDir(), `ShinaeLiveChrome-${STREAM_KEY}`)
}

function shouldSkipChromeProfileCopy(relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/')
  const baseName = path.basename(normalized)

  if (!baseName) return false
  if (baseName === 'lockfile' || baseName === 'DevToolsActivePort') return true
  if (baseName === 'Cookies' || baseName === 'Cookies-journal') return true
  if (baseName.startsWith('Singleton')) return true
  if (normalized.startsWith('Crashpad/')) return true
  if (normalized.startsWith('ShaderCache/')) return true
  if (normalized.startsWith('GrShaderCache/')) return true
  if (normalized.startsWith('DawnCache/')) return true
  if (normalized.startsWith('Code Cache/')) return true

  return false
}

function ensureChromeAutomationProfileExists(profileName) {
  const sourceRoot = getChromeUserDataRoot()
  const normalizedProfileName = String(profileName || '').trim() || 'Default'
  const sourceProfileDir = path.join(sourceRoot, normalizedProfileName)
  if (!fs.existsSync(sourceProfileDir)) {
    throw new Error(`Chrome profile not found: ${sourceProfileDir}`)
  }

  const automationRoot = getChromeAutomationUserDataRoot()
  const automationProfileDir = path.join(automationRoot, normalizedProfileName)

  if (!fs.existsSync(automationProfileDir)) {
    logInfo(`Bootstrapping Chrome automation profile ${normalizedProfileName}`)
    fs.mkdirSync(automationRoot, { recursive: true })

    const localStatePath = path.join(sourceRoot, 'Local State')
    const targetLocalStatePath = path.join(automationRoot, 'Local State')
    if (fs.existsSync(localStatePath) && !fs.existsSync(targetLocalStatePath)) {
      fs.copyFileSync(localStatePath, targetLocalStatePath)
    }

    fs.cpSync(sourceProfileDir, automationProfileDir, {
      recursive: true,
      force: true,
      errorOnExist: false,
      filter: (_, dest) => {
        const relativePath = path.relative(automationProfileDir, dest)
        return !shouldSkipChromeProfileCopy(relativePath)
      },
    })
  }

  return { profileName: normalizedProfileName, sourceRoot, userDataRoot: automationRoot }
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

async function hasChromeDebugEndpoint() {
  try {
    await waitForChromeDebugEndpoint(1500)
    return true
  } catch {
    return false
  }
}

function launchChromeAutomationWindow(executablePath, profileName, startUrl = 'about:blank') {
  const { profileName: resolvedProfileName, userDataRoot } = ensureChromeAutomationProfileExists(profileName)
  logInfo(`Launching YouTube Studio automation with profile ${resolvedProfileName}`)

  const args = [
    `--remote-debugging-port=${YOUTUBE_AUTOMATION_PORT}`,
    `--user-data-dir=${userDataRoot}`,
    `--profile-directory=${resolvedProfileName}`,
    '--new-window',
    startUrl,
  ]

  const child = spawn(executablePath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  })
  child.unref()

  return { profileName: resolvedProfileName }
}

async function ensureChromeAutomationBrowser(profileName) {
  const executablePath = findChromeExecutable()
  if (!executablePath) {
    throw new Error('Chrome or Edge executable not found')
  }

  const { profileName: resolvedProfileName } = ensureChromeAutomationProfileExists(profileName)

  if (await hasChromeDebugEndpoint()) {
    logInfo(`Chrome remote debugging endpoint already available for profile ${resolvedProfileName}`)
    return resolvedProfileName
  }

  launchChromeAutomationWindow(executablePath, resolvedProfileName)
  await waitForChromeDebugEndpoint(20000)
  logInfo(`Chrome remote debugging endpoint ready for profile ${resolvedProfileName}`)
  return resolvedProfileName
}

async function getReusableAutomationPage(context) {
  const pages = context?.pages?.() || []
  const studioPage = pages.find((item) => String(item.url() || '').includes('studio.youtube.com'))
  if (studioPage) return studioPage

  const reusablePage = pages.find((item) => {
    const url = String(item.url() || '').trim()
    return !url || url === 'about:blank'
  }) || pages[0]

  if (reusablePage) return reusablePage
  return context.newPage()
}

async function openYoutubeStudioDashboard(channelId) {
  if (!channelId) return false

  const studioUrl = `https://studio.youtube.com/channel/${channelId}/livestreaming/dashboard`
  let browser
  try {
    const wsEndpoint = await waitForChromeDebugEndpoint()
    browser = await chromium.connectOverCDP(wsEndpoint)
    const context = browser.contexts()[0]
    if (!context) {
      throw new Error('Chrome automation context not available')
    }

    const page = await getReusableAutomationPage(context)
    await page.bringToFront().catch(() => {})
    if (String(page.url() || '') !== studioUrl) {
      await page.goto(studioUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    }
    logInfo(`YouTube Studio dashboard opened => ${studioUrl}`)
    return true
  } finally {
    if (browser) {
      if (typeof browser.disconnect === 'function') {
        browser.disconnect()
      } else {
        await browser.close().catch(() => {})
      }
    }
  }
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
      lastStudioReadyAt = Date.now()
      logInfo('YouTube Studio looks ready for Go live')
      logTimeline('studio_ready', lastStudioReadyAt)
      return true
    }

    await page.waitForTimeout(1000)
  }

  logWarn('YouTube Studio readiness signal not found before timeout')
  return false
}

async function ensureYoutubeGoLive(channelId, profileName) {
  if (!channelId) return false

  const studioUrl = `https://studio.youtube.com/channel/${channelId}/livestreaming/dashboard`

  let browser
  try {
    const wsEndpoint = await waitForChromeDebugEndpoint()
    browser = await chromium.connectOverCDP(wsEndpoint)
    const context = browser.contexts()[0]
    const page = await getReusableAutomationPage(context)
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

    lastGoLiveClickedAt = Date.now()
    logInfo('YouTube Studio Go live clicked')
    logTimeline('go_live_clicked', lastGoLiveClickedAt)
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

function launchObsIfInstalled() {
  const obsExecutable = findObsExecutable()
  if (!obsExecutable) return false

  try {
    const child = spawn(obsExecutable, [], {
      cwd: path.dirname(obsExecutable),
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })
    child.unref()
    return true
  } catch (error) {
    logWarn(`Failed to launch OBS: ${error.message}`)
    return false
  }
}

async function connectObsWithRetry(obs, runtimeConfig, attempts = 1, delayMs = 0) {
  let lastError = null

  for (let index = 0; index < attempts; index += 1) {
    try {
      await obs.connect(runtimeConfig.obsUrl, runtimeConfig.obsPassword)
      return true
    } catch (error) {
      lastError = error
      if (index < attempts - 1 && delayMs > 0) {
        await sleep(delayMs)
      }
    }
  }

  throw lastError || new Error('OBS connect failed')
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
  const runtimeConfig = resolveRuntimeConfig()
  ensureWindowsAutoStart()
  const apiClient = createLiveAgentApiClient(runtimeConfig)
  const obs = new OBSWebSocket()
  let liveSettings = {}
  let agentStatus = {
    agentLabel: runtimeConfig.agentLabel,
    obsConnected: false,
    streamActive: false,
    activeStreamKey: '',
    message: 'Starting',
  }

  let obsConnected = false
  let reconnecting = false
  let processedRequestId = ''
  let heartbeatTimer = null
  let pollTimer = null
  let executing = false
  let lastResolvedVideoId = ''
  let lastVideoSyncAt = 0
  let obsLaunchAttempted = false
  let currentVideoIdLocked = false
  let lastStartRequestedAt = 0
  let lastObsStartedAt = 0
  let startRecoveryRunning = false
  let pendingStartGoLivePromise = null
  let connectObsPromise = null

  async function updateAgentStatus(extra = {}) {
    agentStatus = {
      ...agentStatus,
      agentLabel: runtimeConfig.agentLabel,
      obsConnected,
      chromeProfiles: readChromeProfiles(getChromeUserDataRoot()).profiles,
      ...extra,
    }
    return apiClient.heartbeat(agentStatus)
  }

  async function setCurrentVideoId(currentVideoId) {
    const normalized = String(currentVideoId || '').trim()
    lastResolvedVideoId = normalized
    lastVideoSyncAt = Date.now()
    currentVideoIdLocked = Boolean(normalized)
    liveSettings[STREAM_KEY] = { ...(liveSettings[STREAM_KEY] || {}), currentVideoId: normalized }
    logInfo(`currentVideoId => ${normalized || '(empty)'}`)
    await apiClient.updateVideo(STREAM_KEY, normalized)
  }

  async function getYoutubeTarget() {
    const target = String(liveSettings[STREAM_KEY]?.youtubeUrl || '').trim()
    logInfo(`youtubeUrl => ${target || '(empty)'}`)
    return target
  }

  async function getYoutubeAutomationProfileName() {
    // 10/12: 폴더명을 몰라도 된다 — 저장값이 없거나 틀리면 방송 PC의 크롬 프로필에서 알아서 고른다
    const wanted = String(liveSettings[STREAM_KEY]?.youtubeChromeProfileName || '').trim()
    const profileName = pickChromeProfile(wanted, readChromeProfiles(getChromeUserDataRoot()))
    logInfo(`youtubeChromeProfileName => ${profileName}${wanted && wanted !== profileName ? ` (저장값 ${wanted} 없음)` : ''}`)
    return profileName
  }

  async function getStreamActive() {
    const response = await obs.call('GetStreamStatus')
    return Boolean(response.outputActive)
  }

  async function connectObs() {
    if (obsConnected) return
    if (connectObsPromise) {
      await connectObsPromise
      return
    }

    connectObsPromise = (async () => {
      reconnecting = true
      try {
        await connectObsWithRetry(obs, runtimeConfig, 1, 0)
        obsConnected = true
        obsLaunchAttempted = false
        await updateAgentStatus({ message: 'OBS connected' })
      } catch (error) {
        if (!obsLaunchAttempted) {
          obsLaunchAttempted = true
          const launched = launchObsIfInstalled()

          if (launched) {
            logWarn('OBS not connected, launching OBS automatically')
            await updateAgentStatus({ message: 'Launching OBS automatically' })
            await connectObsWithRetry(obs, runtimeConfig, 12, 5000)
            obsConnected = true
            obsLaunchAttempted = false
            await updateAgentStatus({ message: 'OBS launched and connected' })
            return
          }
        }

        obsConnected = false
        await updateAgentStatus({ message: `OBS connection failed: ${error.message}` })
        throw error
      } finally {
        reconnecting = false
        connectObsPromise = null
      }
    })()

    await connectObsPromise
  }

  async function ensureObsReady() {
    if (!obsConnected) {
      await connectObs()
    }
  }

  async function waitForObsStreamActive(timeoutMs = 10000) {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
      const active = await getStreamActive().catch(() => false)
      if (active) {
        return true
      }
      await sleep(500)
    }

    return false
  }

  async function syncChromeAutomationEnvironment(channelId = '', { openDashboard = true } = {}) {
    const profileName = await getYoutubeAutomationProfileName()
    ensureChromeAutomationAutoStart(profileName)

    try {
      await ensureChromeAutomationBrowser(profileName)
      if (channelId && openDashboard) {
        await openYoutubeStudioDashboard(channelId)
      }
    } catch (error) {
      logWarn(`Chrome automation browser setup failed: ${error.message}`)
    }

    return profileName
  }

  async function runStartRecovery(channelId, youtubeChromeProfileName) {
    if (!channelId || startRecoveryRunning) return

    startRecoveryRunning = true
    try {
      for (let index = 0; index < 20; index += 1) {
        await sleep(3000)

        const streamActive = await getStreamActive().catch(() => false)
        if (!streamActive) {
          logInfo('start recovery stopped because OBS stream is no longer active')
          return
        }

        if (lastObsStartedAt && Date.now() - lastObsStartedAt < INITIAL_LIVE_ID_DELAY_MS) {
          logInfo('start recovery waiting for initial live-id delay window to elapse')
          continue
        }

        if (lastResolvedVideoId) {
          logInfo(`start recovery skipped because currentVideoId already resolved => ${lastResolvedVideoId}`)
          return
        }

        logInfo(`start recovery pass ${index + 1}/20 => retrying YouTube Studio check and live sync`)
        await ensureYoutubeGoLive(channelId, youtubeChromeProfileName).catch((error) => {
          logWarn(`start recovery Go live retry failed: ${error.message}`)
        })
        await syncCurrentVideoId({ attempts: 1, delayMs: 0 }).catch((error) => {
          logWarn(`start recovery sync failed: ${error.message}`)
        })

        if (lastResolvedVideoId) {
          logInfo(`start recovery resolved currentVideoId => ${lastResolvedVideoId}`)
          return
        }
      }
    } finally {
      startRecoveryRunning = false
    }
  }

async function fetchCurrentLiveVideoId(apiClient, channelId) {
  logInfo(`Requesting current live video from server for channel ${channelId}`)
  return apiClient.resolveVideo(STREAM_KEY, channelId)
}

function isQuotaExceededPayload(payloadText) {
  const rawText = String(payloadText || '')
  if (!rawText) return false

  const normalizedText = rawText.toLowerCase()
  if (
    normalizedText.includes('quotaexceeded') ||
    normalizedText.includes('quota exceeded') ||
    normalizedText.includes('dailylimitexceeded') ||
    normalizedText.includes('rateLimitExceeded'.toLowerCase())
  ) {
    return true
  }

  try {
    const parsed = JSON.parse(rawText)
    const reasons = []

    ;(function collectReasons(node) {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        node.forEach(collectReasons)
        return
      }

      if (typeof node.reason === 'string') reasons.push(node.reason)
      if (typeof node.message === 'string') reasons.push(node.message)
      if (typeof node.domain === 'string') reasons.push(node.domain)
      Object.values(node).forEach(collectReasons)
    })(parsed)

    return reasons.some((value) => {
      const normalizedValue = String(value || '').toLowerCase()
      return (
        normalizedValue.includes('quotaexceeded') ||
        normalizedValue.includes('quota exceeded') ||
        normalizedValue.includes('dailylimitexceeded') ||
        normalizedValue.includes('ratelimitexceeded')
      )
    })
  } catch {
    return false
  }
}

async function fetchCurrentLiveVideoIdFromChannelPage(channelId, { allowAggressiveYoutubeiFallback = false } = {}) {
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
      recentMinutes: parseRecentMinutes(videoRenderer?.publishedTimeText?.simpleText || ''),
    }
  }

  function chooseAggressiveYoutubeiCandidate(candidates) {
    const eligibleCandidates = candidates
      .filter((candidate) => candidate.videoId)
      .filter((candidate) => candidate.overlays.includes('NOW_PLAYING'))
      .filter((candidate) => candidate.recentMinutes <= 40)
      .filter((candidate) => !candidate.length || /^0:/.test(candidate.length) || /^1:/.test(candidate.length))
      .filter((candidate) => {
        const title = String(candidate.title || '')
        return title.includes('실시간 스트림') || title.toLowerCase().includes('live')
      })
      .sort((left, right) => left.recentMinutes - right.recentMinutes)

    return eligibleCandidates[0]?.videoId || ''
  }

  function choosePreferredYoutubeiLiveCandidate(candidates) {
    const eligibleCandidates = candidates
      .filter((candidate) => candidate.videoId)
      .filter((candidate) => candidate.overlays.includes('NOW_PLAYING'))
      .sort((left, right) => {
        const leftRecent = Number.isFinite(left.recentMinutes) ? left.recentMinutes : Number.POSITIVE_INFINITY
        const rightRecent = Number.isFinite(right.recentMinutes) ? right.recentMinutes : Number.POSITIVE_INFINITY
        if (leftRecent !== rightRecent) return leftRecent - rightRecent

        const leftLength = String(left.length || '')
        const rightLength = String(right.length || '')
        const leftHasLength = Boolean(leftLength)
        const rightHasLength = Boolean(rightLength)
        if (leftHasLength !== rightHasLength) return leftHasLength ? -1 : 1

        const leftViewCount = String(left.viewCount || '')
        const rightViewCount = String(right.viewCount || '')
        if (leftViewCount !== rightViewCount) return leftViewCount.localeCompare(rightViewCount)

        return leftLength.localeCompare(rightLength)
      })

    return eligibleCandidates[0]?.videoId || ''
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
    if ((isLive || allowAggressiveYoutubeiFallback) && apiKey && params) {
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
        const liveVideoId = choosePreferredYoutubeiLiveCandidate(candidates) || findLiveVideoId(browseJson)
        if (liveVideoId) {
          logInfo(`Channel page resolvedVideoId (youtubei browse) => ${liveVideoId}`)
          return liveVideoId
        }

        if (allowAggressiveYoutubeiFallback) {
          logInfo('Aggressive youtubei fallback enabled, but recent recorded-video fallback is disabled')
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
          nextVideoId = await fetchCurrentLiveVideoId(apiClient, channelId)
          if (!nextVideoId) {
            logInfo(`attempt ${index + 1}/${attempts} api returned empty, falling back to channel page`)
            nextVideoId = await fetchCurrentLiveVideoIdFromChannelPage(channelId)
          }
        } catch (apiError) {
          logInfo(`attempt ${index + 1}/${attempts} api failed => ${apiError.message}`)
          const allowAggressiveYoutubeiFallback = isQuotaExceededPayload(apiError?.message || '')
          logInfo(`attempt ${index + 1}/${attempts} aggressiveYoutubeiFallback => ${allowAggressiveYoutubeiFallback}`)
          nextVideoId = await fetchCurrentLiveVideoIdFromChannelPage(channelId, { allowAggressiveYoutubeiFallback })
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

  async function handleCommand(control) {
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
          handleCommand(pendingControl).catch(writeFatalLog)
        }
      }, 500)
      return
    }

    executing = true
    processedRequestId = control.requestId
    const requestedBy = String(control.requestedBy || '').trim() || '(unknown)'
    const requestedAt = control.requestedAt?.toDate
      ? control.requestedAt.toDate().toISOString()
      : String(control.requestedAt || '').trim() || '(unknown)'
    logInfo(`command received => ${control.desiredState} requestId=${control.requestId} requestedBy=${requestedBy} requestedAt=${requestedAt}`)

    try {
      await ensureObsReady()

      if (control.desiredState === 'start') {
        lastStartRequestedAt = Date.now()
        globalLastStartRequestedAt = lastStartRequestedAt
        lastObsStartedAt = 0
        lastStudioReadyAt = 0
        lastGoLiveClickedAt = 0
        startRecoveryRunning = false
        logTimeline('start_command_received', lastStartRequestedAt)
        const active = await getStreamActive()
        currentVideoIdLocked = false
        await setCurrentVideoId('')
        if (!active) {
          await obs.call('StartStream')
          const streamStarted = await waitForObsStreamActive(10000)
          if (!streamStarted) {
            throw new Error('OBS StartStream did not activate the stream')
          }
          lastObsStartedAt = Date.now()
          logTimeline('obs_start_called', lastObsStartedAt)
          logInfo('Waiting 12 seconds after OBS start before YouTube Studio Go live')
          await sleep(12000)
        }

        const youtubeTarget = await getYoutubeTarget()
        const channelId = extractYoutubeChannelId(youtubeTarget)
        const youtubeChromeProfileName = await syncChromeAutomationEnvironment(channelId, { openDashboard: false })
        pendingStartGoLivePromise = ensureYoutubeGoLive(channelId, youtubeChromeProfileName).catch((error) => {
          logWarn(`YouTube Studio automation failed: ${error.message}`)
        }).finally(() => {
          pendingStartGoLivePromise = null
        })
        runStartRecovery(channelId, youtubeChromeProfileName).catch((error) => {
          logWarn(`start recovery failed: ${error.message}`)
        })
      } else if (control.desiredState === 'stop') {
        startRecoveryRunning = false
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
        currentVideoIdLocked = false
        await setCurrentVideoId('')
      } else {
        throw new Error(`Unsupported desiredState: ${control.desiredState}`)
      }

      const streamActive = await getStreamActive()

      if (streamActive) {
        if (pendingStartGoLivePromise) {
          await pendingStartGoLivePromise
        }
        const initialLiveIdDelayMs = Math.max(0, INITIAL_LIVE_ID_DELAY_MS - (lastObsStartedAt ? (Date.now() - lastObsStartedAt) : 0))
        if (initialLiveIdDelayMs > 0) {
          logInfo(`Waiting ${initialLiveIdDelayMs}ms after OBS start before resolving live video ID`)
          await sleep(initialLiveIdDelayMs)
        }
        await syncCurrentVideoId({ attempts: 6, delayMs: 5000 })
      } else {
        currentVideoIdLocked = false
        await setCurrentVideoId('')
      }

      await apiClient.complete(control.requestId, true, {
        streamKey: STREAM_KEY,
        streamActive,
        message: streamActive ? 'Streaming started' : 'Streaming stopped',
      })
      await updateAgentStatus({
        streamActive,
        lastHandledRequestId: control.requestId,
        lastCommandStatus: 'completed',
        lastCommandAt: new Date().toISOString(),
        message: streamActive ? 'Streaming' : 'Idle',
      })
    } catch (error) {
      await apiClient.complete(control.requestId, false, {
        streamKey: STREAM_KEY,
        error: error.message,
        message: error.message,
      })
      await updateAgentStatus({
        lastHandledRequestId: control.requestId,
        lastCommandStatus: 'error',
        lastCommandAt: new Date().toISOString(),
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
        if (lastResolvedVideoId) {
          await setCurrentVideoId('')
        }
      }

      if (streamActive && !currentVideoIdLocked) {
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

  async function pollCommands() {
    if (executing) return
    const payload = await apiClient.poll(agentStatus)
    liveSettings = payload.settings || liveSettings
    if (payload.command) await handleCommand(payload.command)
  }

  obs.on('ConnectionClosed', async () => {
    obsConnected = false
    await updateAgentStatus({ streamActive: false, message: 'OBS connection closed' })
  })

  obs.on('Identified', async () => {
    obsConnected = true
    await updateAgentStatus({ message: 'OBS identified' })
  })

  await pollCommands()
  await heartbeat()
  heartbeatTimer = setInterval(heartbeat, 15000)
  pollTimer = setInterval(() => pollCommands().catch(writeFatalLog), 2000)

  process.on('SIGINT', async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    if (pollTimer) clearInterval(pollTimer)
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
