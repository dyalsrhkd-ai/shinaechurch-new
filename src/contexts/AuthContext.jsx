import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import {
  claimAdminUserSession,
  getAdminSessionHeartbeatMs,
  releaseAdminUserSession,
  refreshAdminUserSession,
} from '../utils/adminSession'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [sessionConflict, setSessionConflict] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let heartbeatId = null
    let activeUser = null

    const clearHeartbeat = () => {
      if (heartbeatId) {
        clearInterval(heartbeatId)
        heartbeatId = null
      }
    }

    const unsub = onAuthStateChanged(auth, async u => {
      clearHeartbeat()

      if (!u) {
        if (activeUser) {
          releaseAdminUserSession(activeUser).catch(console.error)
          activeUser = null
        }
        setUser(null)
        setSessionReady(true)
        return
      }

      setSessionReady(false)
      const claim = await claimAdminUserSession(u).catch(error => {
        console.error(error)
        return { ok: false, existing: null, internalError: true }
      })

      if (!claim?.ok) {
        setSessionConflict(claim?.internalError ? '세션 확인 중 오류가 발생했습니다.' : '계정이 이미 사용중입니다.')
        setUser(null)
        setSessionReady(true)
        await signOut(auth).catch(console.error)
        return
      }

      setSessionConflict('')
      activeUser = u
      setUser(u)
      setSessionReady(true)

      heartbeatId = setInterval(async () => {
        const ok = await refreshAdminUserSession(u).catch(() => false)
        if (ok) return

        clearHeartbeat()
        setSessionConflict('다른 곳에서 같은 계정으로 로그인되어 현재 세션이 종료되었습니다.')
        setUser(null)
        setSessionReady(true)
        releaseAdminUserSession(u).catch(console.error)
        activeUser = null
        await signOut(auth).catch(console.error)
      }, getAdminSessionHeartbeatMs())
    })

    const handleBeforeUnload = () => {
      if (!activeUser) return
      releaseAdminUserSession(activeUser).catch(console.error)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearHeartbeat()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unsub()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, sessionConflict, sessionReady }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
