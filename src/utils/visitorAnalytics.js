import { getVisitorSummary, listVisitorLogs, trackVisit } from '../api/runtimeApi.js'

const STORAGE_KEY = 'shinae-visitor-last-tracked-date'
const POLL_MS = 30 * 1000

function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function detectDeviceType(userAgent = '') {
  const ua = String(userAgent).toLowerCase()
  if (/ipad|tablet/.test(ua)) return 'tablet'
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile'
  return 'desktop'
}

function shouldTrackVisitor(host = '', userAgent = '') {
  const safeHost = String(host).toLowerCase()
  const safeUa = String(userAgent).toLowerCase()
  return Boolean(
    safeHost
    && !safeHost.includes('localhost')
    && !safeHost.startsWith('127.0.0.1')
    && !safeHost.endsWith('.vercel.app')
    && !safeUa.includes('headlesschrome')
  )
}

export async function trackVisitorOncePerDay() {
  if (typeof window === 'undefined') return
  const userAgent = window.navigator?.userAgent || ''
  const host = window.location?.host || ''
  if (!shouldTrackVisitor(host, userAgent)) return

  const today = getTodayKey()
  if (window.localStorage.getItem(STORAGE_KEY) === today) return

  await trackVisit({
    path: `${window.location?.pathname || '/'}${window.location?.hash || ''}`,
    referrer: document.referrer || '',
    deviceType: detectDeviceType(userAgent),
  })
  window.localStorage.setItem(STORAGE_KEY, today)
}

export { getVisitorSummary }

function subscribe(loader, onChange, onError) {
  let active = true
  const load = async () => {
    try {
      const value = await loader()
      if (active) onChange(value)
    } catch (error) {
      if (active && onError) onError(error)
    }
  }
  load()
  const timer = setInterval(load, POLL_MS)
  return () => {
    active = false
    clearInterval(timer)
  }
}

export function subscribeVisitorSummary(onChange, onError) {
  return subscribe(getVisitorSummary, onChange, onError)
}

export function subscribeVisitorLogs(onChange, onError) {
  return subscribe(listVisitorLogs, onChange, onError)
}
