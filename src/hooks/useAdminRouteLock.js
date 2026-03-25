import { useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore'
import { db } from '../firebase'

const LOCK_TTL_MS = 90 * 1000
const HEARTBEAT_MS = 20 * 1000
const RETRY_MS = 15 * 1000

function getLockId(pathname) {
  return encodeURIComponent(pathname)
}

function getSessionId() {
  if (typeof window === 'undefined') return 'server'

  const storageKey = 'shinae-admin-lock-session-id'
  const existing = window.sessionStorage.getItem(storageKey)
  if (existing) return existing

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.sessionStorage.setItem(storageKey, next)
  return next
}

function isExpired(lock, now) {
  return !lock?.expiresAt || lock.expiresAt <= now
}

async function releaseOtherUserLocks({ pathname, user, sessionId }) {
  const snap = await getDocs(query(collection(db, 'adminLocks'), where('uid', '==', user.uid)))
  const targets = snap.docs.filter(item => {
    const data = item.data()
    return data.path !== pathname || data.sessionId !== sessionId
  })

  await Promise.all(targets.map(item => deleteDoc(item.ref)))
}

async function acquireRouteLock({ pathname, user, sessionId }) {
  const now = Date.now()
  const lockRef = doc(db, 'adminLocks', getLockId(pathname))

  return runTransaction(db, async transaction => {
    const snap = await transaction.get(lockRef)
    const existing = snap.exists() ? snap.data() : null

    if (
      existing &&
      (existing.uid !== user.uid || existing.sessionId !== sessionId) &&
      !isExpired(existing, now)
    ) {
      return { ok: false, lock: existing }
    }

    const nextLock = {
      path: pathname,
      uid: user.uid,
      sessionId,
      email: user.email || '',
      acquiredAt: existing?.uid === user.uid ? (existing.acquiredAt || now) : now,
      heartbeatAt: now,
      expiresAt: now + LOCK_TTL_MS,
    }

    transaction.set(lockRef, nextLock, { merge: true })
    return { ok: true, lock: nextLock }
  })
}

async function refreshRouteLock({ pathname, user, sessionId }) {
  const now = Date.now()
  const lockRef = doc(db, 'adminLocks', getLockId(pathname))

  return runTransaction(db, async transaction => {
    const snap = await transaction.get(lockRef)
    const existing = snap.exists() ? snap.data() : null

    if (
      !existing ||
      existing.uid !== user.uid ||
      existing.sessionId !== sessionId ||
      isExpired(existing, now)
    ) {
      return false
    }

    transaction.set(lockRef, {
      heartbeatAt: now,
      expiresAt: now + LOCK_TTL_MS,
    }, { merge: true })
    return true
  })
}

async function releaseRouteLock({ pathname, user, sessionId }) {
  const lockRef = doc(db, 'adminLocks', getLockId(pathname))
  const snap = await getDoc(lockRef)
  if (!snap.exists()) return

  const existing = snap.data()
  if (existing.uid !== user.uid || existing.sessionId !== sessionId) return

  await deleteDoc(lockRef)
}

export function useAdminRouteLock({ pathname, user }) {
  const [status, setStatus] = useState('idle')
  const [lockOwner, setLockOwner] = useState(null)
  const sessionId = useMemo(() => getSessionId(), [])

  const enabled = useMemo(
    () => Boolean(user && pathname && pathname !== '/admin/login' && pathname !== '/admin/dashboard'),
    [pathname, user]
  )

  useEffect(() => {
    if (!enabled) {
      setStatus('available')
      setLockOwner(null)
      return undefined
    }

    let active = true
    let heartbeatId = null
    let retryId = null

    const clearTimers = () => {
      if (heartbeatId) clearInterval(heartbeatId)
      if (retryId) clearInterval(retryId)
    }

    const startHeartbeat = () => {
      clearTimers()
      heartbeatId = setInterval(async () => {
        const ok = await refreshRouteLock({ pathname, user, sessionId }).catch(() => false)
        if (!active) return
        if (!ok) {
          setStatus('blocked')
          setLockOwner({
            email: '다른 편집 탭',
          })
          clearTimers()
        }
      }, HEARTBEAT_MS)
    }

    const startRetry = () => {
      clearTimers()
      retryId = setInterval(() => {
        acquire()
      }, RETRY_MS)
    }

    const acquire = async () => {
      try {
        const result = await acquireRouteLock({ pathname, user, sessionId })
        if (!active) return

        if (result.ok) {
          await releaseOtherUserLocks({ pathname, user, sessionId }).catch(console.error)
          setStatus('owned')
          setLockOwner(result.lock)
          startHeartbeat()
          return
        }

        setStatus('blocked')
        setLockOwner(result.lock)
        if (result.lock?.uid !== user.uid) {
          startRetry()
        }
      } catch (error) {
        console.error(error)
        if (!active) return
        setStatus('error')
      }
    }

    setStatus('checking')
    acquire()

    const release = () => {
      releaseRouteLock({ pathname, user, sessionId }).catch(console.error)
    }

    window.addEventListener('beforeunload', release)

    return () => {
      active = false
      clearTimers()
      window.removeEventListener('beforeunload', release)
      release()
    }
  }, [enabled, pathname, sessionId, user])

  return {
    enabled,
    isChecking: enabled && status === 'checking',
    isLockedByMe: enabled && status === 'owned',
    isLockedByOther: enabled && status === 'blocked',
    hasError: enabled && status === 'error',
    lockOwner,
  }
}
