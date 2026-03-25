import { deleteDoc, doc, getDoc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

const SESSION_TTL_MS = 90 * 1000
const SESSION_HEARTBEAT_MS = 20 * 1000
const DEVICE_SESSION_KEY = 'shinae-admin-device-session-id'

function getNow() {
  return Date.now()
}

function isExpired(data, now = getNow()) {
  return !data?.expiresAt || data.expiresAt <= now
}

export function getAdminSessionHeartbeatMs() {
  return SESSION_HEARTBEAT_MS
}

export function getAdminDeviceSessionId() {
  if (typeof window === 'undefined') return 'server'

  const existing = window.localStorage.getItem(DEVICE_SESSION_KEY)
  if (existing) return existing

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(DEVICE_SESSION_KEY, next)
  return next
}

function getSessionRef(uid) {
  return doc(db, 'adminUserSessions', uid)
}

export async function claimAdminUserSession(user) {
  const now = getNow()
  const deviceSessionId = getAdminDeviceSessionId()
  const sessionRef = getSessionRef(user.uid)

  return runTransaction(db, async transaction => {
    const snap = await transaction.get(sessionRef)
    const existing = snap.exists() ? snap.data() : null

    if (
      existing &&
      existing.deviceSessionId !== deviceSessionId &&
      !isExpired(existing, now)
    ) {
      return { ok: false, existing }
    }

    const next = {
      uid: user.uid,
      email: user.email || '',
      deviceSessionId,
      heartbeatAt: now,
      expiresAt: now + SESSION_TTL_MS,
    }

    transaction.set(sessionRef, next, { merge: true })
    return { ok: true, session: next }
  })
}

export async function refreshAdminUserSession(user) {
  const now = getNow()
  const deviceSessionId = getAdminDeviceSessionId()
  const sessionRef = getSessionRef(user.uid)

  return runTransaction(db, async transaction => {
    const snap = await transaction.get(sessionRef)
    const existing = snap.exists() ? snap.data() : null

    if (
      !existing ||
      existing.deviceSessionId !== deviceSessionId ||
      isExpired(existing, now)
    ) {
      return false
    }

    transaction.set(sessionRef, {
      heartbeatAt: now,
      expiresAt: now + SESSION_TTL_MS,
    }, { merge: true })
    return true
  })
}

export async function releaseAdminUserSession(user) {
  const deviceSessionId = getAdminDeviceSessionId()
  const sessionRef = getSessionRef(user.uid)
  const snap = await getDoc(sessionRef)
  if (!snap.exists()) return

  const existing = snap.data()
  if (existing.deviceSessionId !== deviceSessionId) return

  await deleteDoc(sessionRef)
}
