// Windows 8.1 broadcasting PCs use Node 16, OBS 27 and obs-websocket v4 on port 4444.
if (typeof globalThis.fetch !== 'function') globalThis.fetch = require('undici').fetch

const process = require('node:process')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const readline = require('node:readline')
const { chromium } = require('playwright-core')
const OBSWebSocket = require('./obs-compat.cjs')
const { createLiveAgentApiClient } = require('./live-agent-api-client.cjs')
const { readChromeProfiles, pickChromeProfile } = require('./chrome-profiles.cjs')

const DEFAULT_HEARTBEAT_MS = 15000
const DEFAULT_VIDEO_RESYNC_MS = 600000
const DEFAULT_YOUTUBE_AUTOMATION_PORT = 9223
const DEFAULT_ADMIN_PAGE_URL = ''
const INITIAL_LIVE_ID_DELAY_MS = 30000

function getLogPath() {
  return path.join(getExecutableDir(), 'ShinaeLiveYouthYoung-error.log')
}

function writeFatalLog(error) {
  const message = `[${new Date().toISOString()}] ${error && error.stack ? error.stack : error && error.message ? error.message : String(error)}\n`
  const logPath = getLogPath()
  fs.appendFileSync(logPath, message, 'utf8')
  console.error(message)
  console.error(`Error log written to ${logPath}`)
}

async function exitWithLoggedError(error) {
  try {
    writeFatalLog(error)
  } catch (logError) {
    console.error(logError)
  }

  await new Promise((resolve) => setTimeout(resolve, 15000))
  process.exit(1)
}

process.on('uncaughtException', (error) => {
  exitWithLoggedError(error)
})

process.on('unhandledRejection', (reason) => {
  exitWithLoggedError(reason)
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getExecutableDir() {
  return path.dirname(process.execPath)
}

function getObsExecutableCandidates() {
  return [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'obs-studio', 'bin', '64bit', 'obs64.exe'),
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
    console.warn(`[live-agent] Failed to launch OBS: ${error.message}`)
    return false
  }
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

function getStartupScriptPath(startupId) {
  const startupDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    : ''

  if (!startupDir) return ''

  return path.join(startupDir, `ShinaeLiveAgent-${startupId}.cmd`)
}

function ensureWindowsAutoStart(startupId) {
  if (process.platform !== 'win32') return null
  if (!process.execPath.toLowerCase().endsWith('.exe')) return null

  const startupScriptPath = getStartupScriptPath(startupId)
  if (!startupScriptPath) return null

  const command = `@echo off\r\nstart "" "${process.execPath}"\r\n`

  try {
    if (fs.existsSync(startupScriptPath)) {
      const current = fs.readFileSync(startupScriptPath, 'utf8')
      if (current === command) {
        return startupScriptPath
      }
    }

    fs.writeFileSync(startupScriptPath, command, 'utf8')
    return startupScriptPath
  } catch (error) {
    console.warn(`[live-agent] Failed to register startup script: ${error.message}`)
    return null
  }
}

function getChromeStartupScriptPath(startupId) {
  const startupDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    : ''

  return startupDir ? path.join(startupDir, `ShinaeLiveChrome-${startupId}.cmd`) : ''
}

function getChromeExecutableCandidates() {
  return [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean)
}

function findChromeExecutable() {
  return getChromeExecutableCandidates().find((candidate) => fs.existsSync(candidate)) || ''
}

function getChromeUserDataRoot() {
  return path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')
}

function getChromeAutomationUserDataRoot(agentId) {
  return path.join(process.env.LOCALAPPDATA || getExecutableDir(), `ShinaeLiveChrome-${agentId}`)
}

function shouldSkipChromeProfileCopy(relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/')
  const baseName = path.basename(normalized)

  if (!baseName) return false
  if (baseName === 'lockfile' || baseName === 'DevToolsActivePort') return true
  if (baseName.startsWith('Singleton')) return true
  if (normalized.startsWith('Crashpad/')) return true
  if (normalized.startsWith('ShaderCache/')) return true
  if (normalized.startsWith('GrShaderCache/')) return true
  if (normalized.startsWith('DawnCache/')) return true
  if (normalized.startsWith('Code Cache/')) return true

  return false
}

function copyChromeProfileBestEffort(sourceDir, targetDir, relativeRoot = '') {
  fs.mkdirSync(targetDir, { recursive: true })
  let copiedCookies = false
  let skippedCookies = false

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const relativePath = relativeRoot ? path.join(relativeRoot, entry.name) : entry.name
    const normalizedRelativePath = relativePath.replaceAll('\\', '/')
    if (shouldSkipChromeProfileCopy(normalizedRelativePath)) continue

    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      const result = copyChromeProfileBestEffort(sourcePath, targetPath, relativePath)
      copiedCookies = copiedCookies || result.copiedCookies
      skippedCookies = skippedCookies || result.skippedCookies
      continue
    }

    try {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.copyFileSync(sourcePath, targetPath)
      if (normalizedRelativePath === 'Network/Cookies') {
        copiedCookies = true
      }
    } catch (error) {
      if (normalizedRelativePath === 'Network/Cookies') {
        skippedCookies = true
      }

      if (!['EBUSY', 'EPERM', 'EACCES', 'ENOENT'].includes(error.code)) {
        throw error
      }
    }
  }

  return { copiedCookies, skippedCookies }
}

function ensureChromeAutomationProfileExists(agentId, profileName) {
  const sourceRoot = getChromeUserDataRoot()
  const normalizedProfileName = String(profileName || '').trim() || 'Default'
  const sourceProfileDir = path.join(sourceRoot, normalizedProfileName)
  if (!fs.existsSync(sourceProfileDir)) {
    throw new Error(`Chrome profile not found: ${sourceProfileDir}`)
  }

  const automationRoot = getChromeAutomationUserDataRoot(agentId)
  const automationProfileDir = path.join(automationRoot, normalizedProfileName)
  const copyMarkerPath = path.join(automationProfileDir, '.shinae-profile-copy-complete')
  const targetCookiesPath = path.join(automationProfileDir, 'Network', 'Cookies')
  const needsProfileCopy = !fs.existsSync(automationProfileDir)
    || (!fs.existsSync(copyMarkerPath) && !fs.existsSync(targetCookiesPath))

  if (needsProfileCopy) {
    fs.mkdirSync(automationRoot, { recursive: true })

    const localStatePath = path.join(sourceRoot, 'Local State')
    const targetLocalStatePath = path.join(automationRoot, 'Local State')
    if (fs.existsSync(localStatePath) && !fs.existsSync(targetLocalStatePath)) {
      try {
        fs.copyFileSync(localStatePath, targetLocalStatePath)
      } catch (error) {
        if (!['EBUSY', 'EPERM', 'EACCES', 'ENOENT'].includes(error.code)) {
          throw error
        }
      }
    }

    const copyResult = copyChromeProfileBestEffort(sourceProfileDir, automationProfileDir)
    if (copyResult.copiedCookies || fs.existsSync(targetCookiesPath)) {
      fs.writeFileSync(copyMarkerPath, new Date().toISOString(), 'utf8')
    }
  }

  return { profileName: normalizedProfileName, userDataRoot: automationRoot }
}

function ensureChromeAutomationAutoStart(agentId, startupId, runtimeConfig, profileName) {
  if (process.platform !== 'win32') return false
  if (process.env.LIVE_AGENT_REGISTER_CHROME_STARTUP !== '1') return false

  const executablePath = findChromeExecutable()
  if (!executablePath) return false

  const startupScriptPath = getChromeStartupScriptPath(startupId)
  if (!startupScriptPath) return false

  const { profileName: resolvedProfileName, userDataRoot } = ensureChromeAutomationProfileExists(agentId, profileName)
  const command = [
    '@echo off',
    `start "" "${executablePath}" --remote-debugging-port=${runtimeConfig.youtubeAutomationPort} --user-data-dir="${userDataRoot}" --profile-directory="${resolvedProfileName}" "${runtimeConfig.adminPageUrl}"`,
    '',
  ].join('\r\n')

  try {
    fs.writeFileSync(startupScriptPath, command, 'utf8')
    return true
  } catch {
    return false
  }
}

function removeChromeAutomationAutoStart(startupId) {
  const startupScriptPath = getChromeStartupScriptPath(startupId)
  if (!startupScriptPath || !fs.existsSync(startupScriptPath)) return false

  try {
    fs.unlinkSync(startupScriptPath)
    return true
  } catch {
    return false
  }
}

function promptYesNo(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve(false)
      return
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    // 2026-10-12: 컴퓨터를 켜면 저절로 켜지는 프로그램이 Y/N 답을 끝없이 기다려 빨간불이었다 → 10초 안에 답이 없으면 「예」
    let done = false
    const timer = setTimeout(() => {
      if (done) return
      done = true
      console.log('\n(10초 동안 답이 없어 자동으로 Y)')
      rl.close()
      resolve(true)
    }, 10000)
    rl.question(question, (answer) => {
      if (done) return
      done = true
      clearTimeout(timer)
      rl.close()
      resolve(!/^n(o)?$/i.test(String(answer || '').trim()))
    })
  })
}

async function waitForChromeDebugEndpoint(runtimeConfig, timeoutMs = 15000) {
  const startedAt = Date.now()
  const endpoint = `http://127.0.0.1:${runtimeConfig.youtubeAutomationPort}/json/version`

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

    await sleep(500)
  }

  throw new Error('Chrome remote debugging endpoint did not open in time')
}

async function hasChromeDebugEndpoint(runtimeConfig) {
  try {
    await waitForChromeDebugEndpoint(runtimeConfig, 1500)
    return true
  } catch {
    return false
  }
}

function launchChromeAutomationWindow(agentId, runtimeConfig, profileName, startUrl = 'about:blank') {
  const executablePath = findChromeExecutable()
  if (!executablePath) {
    throw new Error('Chrome or Edge executable not found')
  }

  const { profileName: resolvedProfileName, userDataRoot } = ensureChromeAutomationProfileExists(agentId, profileName)
  const args = [
    `--remote-debugging-port=${runtimeConfig.youtubeAutomationPort}`,
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

async function ensureChromeAutomationBrowser(agentId, runtimeConfig, profileName, logInfo) {
  const { profileName: resolvedProfileName } = ensureChromeAutomationProfileExists(agentId, profileName)

  if (await hasChromeDebugEndpoint(runtimeConfig)) {
    logInfo(`Chrome remote debugging endpoint already available for profile ${resolvedProfileName}`)
    return resolvedProfileName
  }

  launchChromeAutomationWindow(agentId, runtimeConfig, resolvedProfileName)
  await waitForChromeDebugEndpoint(runtimeConfig, 20000)
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

function readLocalConfig(agentId) {
  const configPath = path.join(getExecutableDir(), `live-agent.${agentId}.json`)
  if (!fs.existsSync(configPath)) throw new Error(`Missing live agent config: ${configPath}`)
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    throw new Error(`Invalid live agent config ${configPath}: ${error.message}`)
  }
}

function normalizeRunOptions(input) {
  if (Array.isArray(input)) return { streamKeys: input }
  if (typeof input === 'string') return { streamKeys: [input] }
  if (input && typeof input === 'object') {
    return {
      streamKeys: Array.isArray(input.streamKeys) ? input.streamKeys : [input.streamKey],
      agentId: input.agentId,
      startupId: input.startupId,
      defaultObsPassword: input.defaultObsPassword,
      youtubeAutomationPort: input.youtubeAutomationPort,
      logPrefix: input.logPrefix,
    }
  }

  return { streamKeys: [] }
}

function resolveRuntimeConfig(agentId, streamKeys, options = {}) {
  const config = readLocalConfig(agentId)
  const required = ['apiBaseUrl', 'agentId', 'agentToken', 'obsUrl', 'obsPassword', 'agentLabel']
  const missing = required.filter((key) => !String(config[key] || '').trim())
  if (missing.length) throw new Error(`Missing live agent config fields: ${missing.join(', ')}`)
  const managedStreamKeys = Array.isArray(config.managedStreamKeys) ? config.managedStreamKeys : []
  if (streamKeys.some((key) => !managedStreamKeys.includes(key))) {
    throw new Error(`managedStreamKeys must include ${streamKeys.join(', ')}.`)
  }
  const apiBaseUrl = String(config.apiBaseUrl).trim().replace(/\/+$/, '')

  return {
    apiBaseUrl,
    agentId: String(config.agentId).trim(),
    agentToken: String(config.agentToken).trim(),
    obsUrl: String(config.obsUrl).trim(),
    obsPassword: String(config.obsPassword),
    agentLabel: String(config.agentLabel).trim(),
    heartbeatMs: Number(config.heartbeatMs) || DEFAULT_HEARTBEAT_MS,
    videoResyncMs: Number(config.videoResyncMs) || DEFAULT_VIDEO_RESYNC_MS,
    youtubeAutomationPort: Number(config.youtubeAutomationPort) || Number(options.youtubeAutomationPort) || DEFAULT_YOUTUBE_AUTOMATION_PORT,
    adminPageUrl: String(config.adminPageUrl || DEFAULT_ADMIN_PAGE_URL || `${apiBaseUrl}/#/admin/live-streams/${streamKeys[0]}`).trim(),
    streamSettings: config.streamSettings && typeof config.streamSettings === 'object' ? config.streamSettings : {},
  }
}

async function fetchCurrentLiveVideoId(apiClient, streamKey, channelId) {
  return apiClient.resolveVideo(streamKey, channelId)
}

async function fetchCurrentLiveVideoIdFromChannelPage(channelId) {
  const response = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Channel page request failed: ${response.status}`)
  }

  const finalUrl = response.url
  const redirectMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (redirectMatch && redirectMatch[1]) return redirectMatch[1]

  const html = await response.text()
  function extractInnertubeApiKey(input) {
    const match = input.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
    return String((match && match[1]) || '').trim()
  }

  function extractVisitorData(input) {
    const match = input.match(/"visitorData":"([^"]+)"/)
    return String((match && match[1]) || '').trim()
  }

  function extractBrowseParams(input) {
    const match = input.match(/"browseEndpoint":\{"browseId":"UC[a-zA-Z0-9_-]{22}","params":"([^"]+)"/)
    return String((match && match[1]) || '').trim()
  }

  function hasLiveBadge(videoRenderer) {
    const overlays = Array.isArray(videoRenderer && videoRenderer.thumbnailOverlays) ? videoRenderer.thumbnailOverlays : []
    const hasLiveOverlay = overlays.some((overlay) => {
      const status = overlay && overlay.thumbnailOverlayTimeStatusRenderer
      return status && (status.style === 'LIVE' || status.style === 'LIVE_NOW')
    })

    const badges = Array.isArray(videoRenderer && videoRenderer.badges) ? videoRenderer.badges : []
    const hasBadge = badges.some((badge) => {
      const style = (badge && badge.metadataBadgeRenderer && badge.metadataBadgeRenderer.style) || ''
      const label = (badge && badge.metadataBadgeRenderer && badge.metadataBadgeRenderer.label) || ''
      return style.includes('LIVE') || label.includes('LIVE') || label.includes('실시간')
    })

    const viewCount = (videoRenderer && videoRenderer.viewCountText && videoRenderer.viewCountText.simpleText) || ''
    const published = (videoRenderer && videoRenderer.publishedTimeText && videoRenderer.publishedTimeText.simpleText) || ''

    return hasLiveOverlay || hasBadge || viewCount.includes('시청 중')
  }

  function parseRecentMinutes(text) {
    const input = String(text || '').trim()
    const minuteMatch = input.match(/(\d+)\s*분\s*전/)
    if (minuteMatch && minuteMatch[1]) return Number(minuteMatch[1])
    if (input.includes('방금 전')) return 0
    const hourMatch = input.match(/(\d+)\s*시간\s*전/)
    if (hourMatch && hourMatch[1]) return Number(hourMatch[1]) * 60
    return Number.POSITIVE_INFINITY
  }

  function summarizeVideoRenderer(videoRenderer) {
    const overlays = Array.isArray(videoRenderer && videoRenderer.thumbnailOverlays) ? videoRenderer.thumbnailOverlays : []
    const overlayStyles = overlays
      .map((overlay) => {
        if (overlay && overlay.thumbnailOverlayTimeStatusRenderer) {
          return overlay.thumbnailOverlayTimeStatusRenderer.style || ''
        }
        if (overlay && overlay.thumbnailOverlayNowPlayingRenderer) {
          return 'NOW_PLAYING'
        }
        return ''
      })
      .filter(Boolean)

    const badges = Array.isArray(videoRenderer && videoRenderer.badges) ? videoRenderer.badges : []
    const badgeLabels = badges
      .map((badge) => (badge && badge.metadataBadgeRenderer && (badge.metadataBadgeRenderer.label || badge.metadataBadgeRenderer.style)) || '')
      .filter(Boolean)

    return {
      videoId: String((videoRenderer && videoRenderer.videoId) || ''),
      title: String((videoRenderer && videoRenderer.title && videoRenderer.title.runs && videoRenderer.title.runs[0] && videoRenderer.title.runs[0].text) || (videoRenderer && videoRenderer.title && videoRenderer.title.simpleText) || ''),
      published: String((videoRenderer && videoRenderer.publishedTimeText && videoRenderer.publishedTimeText.simpleText) || ''),
      viewCount: String((videoRenderer && videoRenderer.viewCountText && videoRenderer.viewCountText.simpleText) || ''),
      length: String((videoRenderer && videoRenderer.lengthText && videoRenderer.lengthText.simpleText) || ''),
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

    if (node.videoRenderer && node.videoRenderer.videoId) {
      const videoRenderer = node.videoRenderer
      const published = (videoRenderer.publishedTimeText && videoRenderer.publishedTimeText.simpleText) || ''
      const hasLength = Boolean((videoRenderer.lengthText && videoRenderer.lengthText.simpleText) || (videoRenderer.lengthText && videoRenderer.lengthText.accessibility))
      if (hasLength && !hasLiveBadge(videoRenderer)) {
        return ''
      }

      if (hasLiveBadge(videoRenderer)) {
        return String(videoRenderer.videoId).trim()
      }
    }

    for (const value of Object.values(node)) {
      const found = findLiveVideoId(value)
      if (found) return found
    }

    return ''
  }
  const isLive = (
    html.includes('"isLive":true')
    || html.includes('"liveBroadcastContent":"live"')
    || html.includes('"style":"LIVE"')
    || html.includes('"isLiveNow":true')
  )

  // liveBroadcastContent:"live" 근처의 videoId를 우선 탐색 (가장 정확)
  const liveContextPatterns = [
    /"videoId":"([a-zA-Z0-9_-]{11})"[^{}]{0,300}"liveBroadcastContent":"live"/,
    /"liveBroadcastContent":"live"[^{}]{0,300}"videoId":"([a-zA-Z0-9_-]{11})"/,
  ]
  for (const pattern of liveContextPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) return match[1]
  }

  const patterns = [
    /"canonicalBaseUrl":"\/watch\?v=([a-zA-Z0-9_-]{11})"/,
    /https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ]

  if (isLive) {
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match && match[1]) return match[1]
    }
  }

  try {
    const apiKey = extractInnertubeApiKey(html)
    const visitorData = extractVisitorData(html)
    const params = extractBrowseParams(html)
    if (apiKey && params) {
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
          if (node.videoRenderer && node.videoRenderer.videoId) {
            candidates.push(summarizeVideoRenderer(node.videoRenderer))
          }
          Object.values(node).forEach(collectVideoRenderers)
        })(browseJson)
        const liveVideoId = findLiveVideoId(browseJson)
        if (liveVideoId) return liveVideoId
      }
    }
  } catch {}

  return ''
}

async function runLiveAgent(input) {
  const options = normalizeRunOptions(input)
  const streamKeys = [...new Set(options.streamKeys.map((item) => String(item || '').trim()).filter(Boolean))]

  if (streamKeys.length === 0) {
    throw new Error('at least one streamKey is required')
  }

  const agentId = String(options.agentId || streamKeys.join('-')).trim()
  const startupId = String(options.startupId || agentId).trim()
  const runtimeConfig = resolveRuntimeConfig(agentId, streamKeys, options)
  const apiClient = createLiveAgentApiClient(runtimeConfig)
  const startupScriptPath = ensureWindowsAutoStart(startupId)
  const removedChromeStartupPath = removeChromeAutomationAutoStart(startupId)
  const logPrefix = String(options.logPrefix || agentId).trim()
  const runtimeLogPath = path.join(getExecutableDir(), `${logPrefix}.log`)
  const obs = new OBSWebSocket()
  let liveSettings = {}
  let agentStatus = {
    agentLabel: runtimeConfig.agentLabel,
    obsConnected: false,
    streamActive: false,
    activeStreamKey: '',
    message: 'Starting',
  }
  // 2026-10-12: Firebase 시절 줄 3개(doc/db)가 남아 통합 EXE 가 켜지자마자 멈췄다 — 홈페이지 서버(apiClient)로 옮긴 뒤 쓰지 않는다

  let obsConnected = false
  let reconnecting = false
  let obsLaunchAttempted = false
  let heartbeatTimer = null
  let pollTimer = null
  let executing = false
  let activeStreamKey = ''
  let lastResolvedVideoId = ''
  let lastVideoSyncAt = 0
  let currentVideoIdLocked = false
  let startupSetupRequested = false

  function appendRuntimeLog(level, message) {
    const line = `[${new Date().toISOString()}] [${level}] ${message}\n`
    try {
      fs.appendFileSync(runtimeLogPath, line, 'utf8')
    } catch {}

    if (level === 'ERROR') {
      console.error(line.trimEnd())
      return
    }

    console.log(line.trimEnd())
  }

  function logInfo(message) {
    appendRuntimeLog('INFO', message)
  }

  function logWarn(message) {
    appendRuntimeLog('WARN', message)
  }

  function logError(message) {
    appendRuntimeLog('ERROR', message)
  }

  async function clickFirstVisible(page, labels, timeoutMs = 5000) {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
      for (const label of labels) {
        const locator = page.getByRole('button', { name: label }).first()
        if (await locator.isVisible().catch(() => false)) {
          await locator.click({ timeout: 5000 })
          return true
        }
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
      /connection/i,
      /health/i,
      /stream/i,
      /상태/i,
      /스트림/i,
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

  async function getYoutubeAutomationProfileName(streamKey) {
    const settings = await getSettingsSnapshot()
    const stream = settings.liveStreams && settings.liveStreams[streamKey] ? settings.liveStreams[streamKey] : {}
    // 10/12: 폴더명을 몰라도 된다 — 저장값이 없거나 틀리면 방송 PC의 크롬 프로필에서 알아서 고른다
    const wanted = String(stream.youtubeChromeProfileName || '').trim()
    const profileName = pickChromeProfile(wanted, readChromeProfiles(getChromeUserDataRoot()))
    logInfo(`${streamKey} youtubeChromeProfileName => ${profileName}${wanted && wanted !== profileName ? ` (저장값 ${wanted} 없음)` : ''}`)
    return profileName
  }

  async function syncChromeAutomationEnvironment(streamKey, channelId, options = {}) {
    const profileName = await getYoutubeAutomationProfileName(streamKey)
    ensureChromeAutomationAutoStart(agentId, startupId, runtimeConfig, profileName)

    if (!channelId) {
      logWarn(`${streamKey} YouTube Studio automation skipped because youtubeUrl is not a channel URL`)
      return profileName
    }

    if (options.startUrl && !(await hasChromeDebugEndpoint(runtimeConfig))) {
      launchChromeAutomationWindow(agentId, runtimeConfig, profileName, options.startUrl)
      await waitForChromeDebugEndpoint(runtimeConfig, 20000)
      logInfo(`Chrome remote debugging endpoint ready for profile ${profileName}`)
      return profileName
    }

    await ensureChromeAutomationBrowser(agentId, runtimeConfig, profileName, logInfo)
    return profileName
  }

  async function prepareYoutubeStudioAutomation(streamKey) {
    const youtubeTarget = await getYoutubeTarget(streamKey)
    const channelId = extractYoutubeChannelId(youtubeTarget)
    const youtubeChromeProfileName = await syncChromeAutomationEnvironment(streamKey, channelId)
    return { channelId, youtubeChromeProfileName }
  }

  async function openYoutubeStudioDashboard(streamKey) {
    const youtubeTarget = await getYoutubeTarget(streamKey)
    const channelId = extractYoutubeChannelId(youtubeTarget)

    if (!channelId) return false

    const studioUrl = `https://studio.youtube.com/channel/${channelId}/livestreaming/dashboard`
    const profileName = await syncChromeAutomationEnvironment(streamKey, channelId, { startUrl: studioUrl })
    let browser

    try {
      const wsEndpoint = await waitForChromeDebugEndpoint(runtimeConfig)
      browser = await chromium.connectOverCDP(wsEndpoint)
      const context = browser.contexts()[0]
      const pages = context?.pages?.() || []
      // 2026-10-12: 유튜브가 주소를 바꿔(…/livestreaming 등) 같은 창을 못 알아보고 새 창을 또 열었다 → 채널 기준으로 찾는다
      const existingPage = pages.find((page) => String(page.url() || '').includes(`studio.youtube.com/channel/${channelId}`))
      const page = existingPage || await context.newPage()
      if (!String(page.url() || '').startsWith(studioUrl)) {
        await page.goto(studioUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      }
      logInfo(`${streamKey} YouTube Studio dashboard opened with profile ${profileName}`)
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

  async function warmUpYoutubeStudioDashboards() {
    // 중고등부·청년부가 같은 유튜브 채널이면 스튜디오 창은 하나만(10/12 요셉님: 창이 왜 2개나 떠?)
    const opened = new Set()
    for (const streamKey of streamKeys) {
      try {
        const channelId = extractYoutubeChannelId(await getYoutubeTarget(streamKey))
        if (channelId && opened.has(channelId)) continue
        if (channelId) opened.add(channelId)
        await openYoutubeStudioDashboard(streamKey)
      } catch (error) {
        logWarn(`${streamKey} YouTube Studio dashboard warm-up failed: ${error.message}`)
      }
    }
  }

  async function openAdminPage() {
    const adminPageUrl = String(runtimeConfig.adminPageUrl || '').trim()
    if (!adminPageUrl) return false

    if (!(await hasChromeDebugEndpoint(runtimeConfig))) {
      const profileName = await getYoutubeAutomationProfileName(streamKeys[0])
      launchChromeAutomationWindow(agentId, runtimeConfig, profileName, adminPageUrl)
      await waitForChromeDebugEndpoint(runtimeConfig, 20000)
    }

    let browser
    try {
      const wsEndpoint = await waitForChromeDebugEndpoint(runtimeConfig)
      browser = await chromium.connectOverCDP(wsEndpoint)
      const context = browser.contexts()[0]
      const pages = context?.pages?.() || []
      const existingPage = pages.find((page) => String(page.url() || '').startsWith(adminPageUrl))
      const page = existingPage || await context.newPage()
      if (!String(page.url() || '').startsWith(adminPageUrl)) {
        await page.goto(adminPageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      }
      logInfo(`admin page opened => ${adminPageUrl}`)
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

  async function warmUpStartupPages() {
    await warmUpYoutubeStudioDashboards()
    await openAdminPage()
  }

  async function ensureYoutubeGoLive(streamKey, channelId, profileName) {
    if (!channelId) return false

    const studioUrl = `https://studio.youtube.com/channel/${channelId}/livestreaming/dashboard`
    let browser

    try {
      const wsEndpoint = await waitForChromeDebugEndpoint(runtimeConfig)
      browser = await chromium.connectOverCDP(wsEndpoint)
      const context = browser.contexts()[0]
      const page = await getReusableAutomationPage(context)

      if (!String(page.url() || '').includes('studio.youtube.com')) {
        await page.goto(studioUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      }

      await clickFirstVisible(page, [/확인/i, /닫기/i, /나중에/i, /Got it/i, /Close/i, /Dismiss/i], 3000)
      await waitForYoutubeStudioReady(page, 90000)

      const goLiveClicked = await clickFirstVisible(page, [/라이브 시작/i, /^Go live$/i], 90000)
      if (!goLiveClicked) {
        logWarn(`${streamKey} YouTube Studio automation could not find Go live button`)
        return false
      }

      logInfo(`${streamKey} YouTube Studio Go live clicked with profile ${profileName}`)
      await page.waitForTimeout(3000)
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

  async function setLiveEnabled(streamKey, enabled) {
    liveSettings[streamKey] = { ...(liveSettings[streamKey] || {}), enabled }
  }

  async function setCurrentVideoId(streamKey, currentVideoId) {
    const normalized = String(currentVideoId || '').trim()
    if (streamKey === activeStreamKey) {
      lastResolvedVideoId = normalized
      lastVideoSyncAt = Date.now()
      currentVideoIdLocked = Boolean(normalized)
    }
    liveSettings[streamKey] = { ...(liveSettings[streamKey] || {}), currentVideoId: normalized }
    logInfo(`${streamKey} currentVideoId => ${normalized || '(empty)'}`)
    await apiClient.updateVideo(streamKey, normalized)
  }

  async function getSettingsSnapshot() {
    return { liveStreams: liveSettings }
  }

  async function getYoutubeTarget(streamKey) {
    const target = String(liveSettings[streamKey]?.youtubeUrl || '').trim()
    logInfo(`${streamKey} youtubeUrl => ${target || '(empty)'}`)
    return target
  }

  async function restoreActiveStreamKey() {
    const enabledKey = streamKeys.find((streamKey) => Boolean(liveSettings[streamKey]?.enabled))
    activeStreamKey = enabledKey || ''
  }

  async function updateAgentStatus(extra = {}) {
    agentStatus = {
      ...agentStatus,
      agentLabel: runtimeConfig.agentLabel,
      obsConnected,
      activeStreamKey,
      chromeProfiles: readChromeProfiles(getChromeUserDataRoot()).profiles,
      ...extra,
    }
    return apiClient.heartbeat(agentStatus)
  }

  async function getStreamActive() {
    const response = await obs.call('GetStreamStatus')
    return Boolean(response.outputActive)
  }

  async function connectObs() {
    if (obsConnected || reconnecting) return

    reconnecting = true
    logInfo(`Connecting OBS => ${runtimeConfig.obsUrl}`)
    try {
      await obs.connect(runtimeConfig.obsUrl, runtimeConfig.obsPassword)
      obsConnected = true
      obsLaunchAttempted = false
      logInfo('OBS connected')
      await updateAgentStatus({ message: 'OBS connected' })
    } catch (error) {
      if (!obsLaunchAttempted) {
        obsLaunchAttempted = true
        const launched = launchObsIfInstalled()

        if (launched) {
          logWarn('OBS not connected, launching OBS automatically')
          await updateAgentStatus({ message: 'Launching OBS automatically' })
          await sleep(8000)
          await obs.connect(runtimeConfig.obsUrl, runtimeConfig.obsPassword)
          obsConnected = true
          obsLaunchAttempted = false
          logInfo('OBS launched and connected')
          await updateAgentStatus({ message: 'OBS launched and connected' })
          return
        }
      }

      obsConnected = false
      logError(`OBS connection failed: ${error.message}`)
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

  async function applyStreamPreset(streamKey) {
    const streamSetting = runtimeConfig.streamSettings && runtimeConfig.streamSettings[streamKey]
    if (!streamSetting || typeof streamSetting !== 'object') return

    if (streamSetting.sceneCollectionName) {
      logInfo(`${streamKey} scene collection => ${streamSetting.sceneCollectionName}`)
      await obs.call('SetCurrentSceneCollection', { sceneCollectionName: String(streamSetting.sceneCollectionName) })
    }

    if (streamSetting.profileName) {
      logInfo(`${streamKey} profile => ${streamSetting.profileName}`)
      await obs.call('SetCurrentProfile', { profileName: String(streamSetting.profileName) })
    }
  }

  async function syncCurrentVideoId(streamKey, options = {}) {
    const attempts = options.attempts || 1
    const delayMs = options.delayMs || 0
    const youtubeTarget = await getYoutubeTarget(streamKey)
    const channelId = extractYoutubeChannelId(youtubeTarget)
    const directVideoId = channelId ? '' : extractYoutubeVideoId(youtubeTarget)
    logInfo(`${streamKey} syncCurrentVideoId targetType => ${channelId ? 'channel' : directVideoId ? 'video' : 'none'}`)

    if (!youtubeTarget) {
      if (streamKey === activeStreamKey) currentVideoIdLocked = false
      await setCurrentVideoId(streamKey, '')
      return ''
    }

    if (directVideoId) {
      await setCurrentVideoId(streamKey, directVideoId)
      return directVideoId
    }

    if (!channelId) {
      if (streamKey === activeStreamKey) currentVideoIdLocked = false
      await setCurrentVideoId(streamKey, '')
      return ''
    }

    for (let index = 0; index < attempts; index += 1) {
      try {
        let nextVideoId = ''

        try {
          logInfo(`${streamKey} YouTube API live lookup attempt ${index + 1}/${attempts}`)
          nextVideoId = await fetchCurrentLiveVideoId(apiClient, streamKey, channelId)
          // 2026-10-12: 서버 API 가 「없음」이면 채널 라이브 페이지도 본다(단일 부서 EXE 와 같게) — 유튜브는 라이브인데 영상을 못 찾아 알림이 안 갔다
          if (!nextVideoId) {
            logInfo(`${streamKey} API returned empty, falling back to channel page`)
            nextVideoId = await fetchCurrentLiveVideoIdFromChannelPage(channelId)
          }
        } catch {
          logWarn(`${streamKey} YouTube API lookup failed, falling back to channel page`)
          nextVideoId = await fetchCurrentLiveVideoIdFromChannelPage(channelId)
        }

        if (nextVideoId) {
          logInfo(`${streamKey} resolved live video => ${nextVideoId}`)
          await setCurrentVideoId(streamKey, nextVideoId)
          return nextVideoId
        }
        logWarn(`${streamKey} resolved live video => (empty)`)
      } catch (error) {
        logWarn(`${streamKey} live lookup failed: ${error.message}`)
        if (index === attempts - 1) throw error
      }

      if (index < attempts - 1 && delayMs > 0) {
        await sleep(delayMs)
      }
    }

    await setCurrentVideoId(streamKey, '')
    return ''
  }

  async function clearInactiveStreamState(activeKey) {
    const updates = streamKeys
      .filter((streamKey) => streamKey !== activeKey)
      .flatMap((streamKey) => [
        setLiveEnabled(streamKey, false),
        setCurrentVideoId(streamKey, ''),
      ])

    await Promise.all(updates)
  }

  async function completeControl(streamKey, requestId, patch) {
    const result = {
      streamKey,
      message: patch.message || '',
      error: patch.error || '',
    }
    if (patch.lastAppliedState) result.streamActive = patch.lastAppliedState === 'live'
    await apiClient.complete(requestId, patch.status === 'completed', result)
  }

  async function handleCommand(streamKey, control) {
    const requestId = control.requestId
    logInfo(`${streamKey} command => ${control.desiredState} requestId=${requestId}`)

    try {
      await ensureObsReady()

      if (control.desiredState === 'start') {
        const streamActive = await getStreamActive()
        if (streamActive && activeStreamKey && activeStreamKey !== streamKey) {
          throw new Error(`${activeStreamKey} 방송이 아직 종료되지 않았습니다.`)
        }

        await applyStreamPreset(streamKey)
        activeStreamKey = streamKey
        currentVideoIdLocked = false
        await clearInactiveStreamState(streamKey)
        await setCurrentVideoId(streamKey, '')

        let youtubeAutomation = null
        await prepareYoutubeStudioAutomation(streamKey).then((result) => {
          youtubeAutomation = result
          logInfo(`${streamKey} YouTube Studio automation prepared before OBS start`)
        }).catch((error) => {
          logWarn(`${streamKey} YouTube Studio automation preparation failed before OBS start: ${error.message}`)
        })

        if (!streamActive) {
          logInfo(`${streamKey} StartStream`)
          await obs.call('StartStream')
          await sleep(12000)
        }

        await (async () => {
          if (!youtubeAutomation) {
            youtubeAutomation = await prepareYoutubeStudioAutomation(streamKey)
          }
          const { channelId, youtubeChromeProfileName } = youtubeAutomation
          await ensureYoutubeGoLive(streamKey, channelId, youtubeChromeProfileName)
        })().catch((error) => {
          logWarn(`${streamKey} YouTube Studio automation failed after OBS start: ${error.message}`)
        })
      } else if (control.desiredState === 'stop') {
        const streamActive = await getStreamActive()
        if (streamActive && activeStreamKey && activeStreamKey !== streamKey) {
          throw new Error(`${activeStreamKey} 방송이 현재 송출 중입니다.`)
        }

        if (streamActive && (!activeStreamKey || activeStreamKey === streamKey)) {
          logInfo(`${streamKey} StopStream`)
          await obs.call('StopStream')
          for (let index = 0; index < 6; index += 1) {
            await sleep(1000)
            const stillActive = await getStreamActive()
            if (!stillActive) break
          }
        }
      } else {
        throw new Error(`Unsupported desiredState: ${control.desiredState}`)
      }

      const streamActive = await getStreamActive()

      if (control.desiredState === 'stop' && !streamActive && activeStreamKey === streamKey) {
        activeStreamKey = ''
      }

      if (streamActive) {
        activeStreamKey = streamKey
        await setLiveEnabled(streamKey, true)
        await syncCurrentVideoId(streamKey, { attempts: 4, delayMs: 5000 })
      } else {
        if (activeStreamKey === streamKey) currentVideoIdLocked = false
        await setLiveEnabled(streamKey, false)
        await setCurrentVideoId(streamKey, '')
      }

      await completeControl(streamKey, requestId, {
        status: 'completed',
        lastAppliedState: streamActive ? 'start' : 'stop',
        error: '',
        message: streamActive ? 'OBS stream started' : 'OBS stream stopped',
      })
      logInfo(`${streamKey} command completed => ${streamActive ? 'start' : 'stop'}`)

      await updateAgentStatus({
        streamActive,
        lastHandledRequestId: requestId,
        lastCommandStatus: 'completed',
        lastCommandAt: new Date().toISOString(),
        message: streamActive ? 'Streaming' : 'Idle',
      })
    } catch (error) {
      logError(`${streamKey} command failed: ${error.message}`)
      await completeControl(streamKey, requestId, {
        status: 'error',
        error: error.message,
        message: error.message,
      })
      await updateAgentStatus({
        lastHandledRequestId: requestId,
        lastCommandStatus: 'error',
        lastCommandAt: new Date().toISOString(),
        message: error.message,
      })
    }
  }

  async function pollCommands() {
    if (executing) return
    const payload = await apiClient.poll(agentStatus)
    liveSettings = payload.settings || liveSettings
    if (!payload.command) return
    executing = true
    try {
      await handleCommand(payload.command.streamKey, payload.command)
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
      logInfo(`heartbeat streamActive=${streamActive} activeStreamKey=${activeStreamKey || '(none)'}`)
      if (!streamActive) {
        currentVideoIdLocked = false
        if (activeStreamKey) {
          await setLiveEnabled(activeStreamKey, false)
        }
        activeStreamKey = ''
      }

      if (streamActive && activeStreamKey && (!lastResolvedVideoId || Date.now() - lastVideoSyncAt > runtimeConfig.videoResyncMs)) {
        await syncCurrentVideoId(activeStreamKey, { attempts: 1 })
      }

      await updateAgentStatus({
        streamActive,
        message: streamActive ? 'Streaming' : 'Idle',
      })
    } catch (error) {
      obsConnected = false
      logError(`heartbeat failed: ${error.message}`)
      await updateAgentStatus({
        streamActive: false,
        message: error.message,
      })
    }
  }

  async function idleHeartbeat() {
    try {
      await updateAgentStatus({
        streamActive: false,
        message: 'Agent online; live setup not started',
      })
    } catch (error) {
      logError(`idle heartbeat failed: ${error.message}`)
    }
  }

  obs.on('ConnectionClosed', async () => {
    obsConnected = false
    logWarn('OBS connection closed')
    await updateAgentStatus({ streamActive: false, message: 'OBS connection closed' })
  })

  obs.on('Identified', async () => {
    obsConnected = true
    logInfo('OBS identified')
    await updateAgentStatus({ message: 'OBS identified' })
  })

  logInfo(`agent boot => ${agentId} streamKeys=${streamKeys.join(',')}`)
  await pollCommands()
  await restoreActiveStreamKey()

  startupSetupRequested = await promptYesNo('Start live setup now? OBS, YouTube Studio, and admin page will open. (Y/N): ')
  logInfo(`startup live setup => ${startupSetupRequested ? 'yes' : 'no'}`)

  if (startupSetupRequested) {
    await heartbeat()
  } else {
    await idleHeartbeat()
  }

  pollTimer = setInterval(() => pollCommands().catch(logError), 2000)

  heartbeatTimer = setInterval(() => {
    const task = startupSetupRequested || obsConnected || activeStreamKey
      ? heartbeat()
      : idleHeartbeat()

    task.catch((error) => {
      console.error('Heartbeat failed:', error)
    })
  }, runtimeConfig.heartbeatMs)

  if (startupSetupRequested) {
    warmUpStartupPages().catch((error) => {
      logWarn(`startup page warm-up failed: ${error.message}`)
    })
  }

  const shutdown = async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    if (pollTimer) clearInterval(pollTimer)

    try {
      logWarn('agent shutdown')
      await updateAgentStatus({ obsConnected: false, streamActive: false, message: 'Agent stopped' })
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  logInfo(`agent online => ${agentId} as ${runtimeConfig.agentLabel}`)
  if (startupScriptPath) {
    logInfo(`startup registered => ${startupScriptPath}`)
  } else {
    logWarn('startup registration skipped or failed')
  }
  if (removedChromeStartupPath) {
    logInfo('chrome startup registration removed; EXE controls live setup prompt')
  }
}

module.exports = {
  runLiveAgent,
}

runLiveAgent({
  streamKeys: ['youth', 'young'],
  agentId: 'youth-young',
  startupId: 'youth-young',
  logPrefix: 'ShinaeLiveYouthYoung',
}).catch((error) => {
  exitWithLoggedError(error)
})
