import { useEffect, useMemo, useState } from 'react'
import { acquireRouteLock, heartbeatRouteLock, releaseRouteLock } from '../api/runtimeApi.js'

const HEARTBEAT_MS = 20 * 1000
const RETRY_MS = 15 * 1000
const STORAGE_KEY = 'shinae-admin-lock-token'

function getLockToken() {
  if (typeof window === 'undefined') return 'server-lock-token'
  const existing = window.sessionStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const next = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.sessionStorage.setItem(STORAGE_KEY, next)
  return next
}

export function useAdminRouteLock({ pathname, user }) {
  const [status, setStatus] = useState('idle')
  const [lockOwner, setLockOwner] = useState(null)
  const lockToken = useMemo(() => getLockToken(), [])
  const enabled = Boolean(user && pathname && pathname !== '/admin/login' && pathname !== '/admin/dashboard')

  useEffect(() => {
    if (!enabled) {
      setStatus('available')
      setLockOwner(null)
      return undefined
    }

    let active = true
    let timer = null
    const clearTimer = () => {
      if (timer) clearInterval(timer)
      timer = null
    }

    const startRetry = () => {
      clearTimer()
      timer = setInterval(acquire, RETRY_MS)
    }

    const startHeartbeat = () => {
      clearTimer()
      timer = setInterval(async () => {
        const result = await heartbeatRouteLock(pathname, lockToken).catch(() => ({ owned: false }))
        if (!active || result.owned) return
        setStatus('blocked')
        setLockOwner({ displayName: '\uB2E4\uB978 \uAD00\uB9AC\uC790' })
        startRetry()
      }, HEARTBEAT_MS)
    }

    async function acquire() {
      try {
        const result = await acquireRouteLock(pathname, lockToken)
        if (!active) return
        if (result.acquired) {
          setStatus('owned')
          setLockOwner(null)
          startHeartbeat()
        } else {
          setStatus('blocked')
          setLockOwner(result.owner || null)
          startRetry()
        }
      } catch (error) {
        console.error(error)
        if (active) setStatus('error')
      }
    }

    setStatus('checking')
    acquire()

    return () => {
      active = false
      clearTimer()
      releaseRouteLock(pathname, lockToken).catch(() => {})
    }
  }, [enabled, lockToken, pathname])

  return {
    enabled,
    isChecking: enabled && status === 'checking',
    isLockedByMe: enabled && status === 'owned',
    isLockedByOther: enabled && status === 'blocked',
    hasError: enabled && status === 'error',
    lockOwner,
  }
}
