import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminRouteLock } from '../../hooks/useAdminRouteLock'
import { MENU_GROUPS } from './menuItems'
import { getVisitorSummary } from '../../utils/visitorAnalytics'

const SESSION_TIMEOUT_MS = 10 * 60 * 1000

function getFavKey(uid) { return `shinae_fav_${uid}` }
function loadFavs(uid) {
  try { return JSON.parse(localStorage.getItem(getFavKey(uid)) || '[]') } catch { return [] }
}
function saveFavs(uid, favs) {
  localStorage.setItem(getFavKey(uid), JSON.stringify(favs))
}

function formatRemainingTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function createToast(message) {
  const text = String(message || '').trim()
  const lower = text.toLowerCase()
  const type = lower.includes('오류') || lower.includes('실패') ? 'error' : 'success'
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: text,
    type,
  }
}

export default function AdminLayout({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const contentRef = useRef(null)
  const timeoutRef = useRef(null)
  const deadlineRef = useRef(0)
  const expiredRef = useRef(false)

  const uid = user?.uid || ''
  const [favs, setFavs] = useState(() => loadFavs(uid))
  const [hoveredPath, setHoveredPath] = useState(null)
  const [menuKeyword, setMenuKeyword] = useState('')
  const [remainingMs, setRemainingMs] = useState(SESSION_TIMEOUT_MS)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [toasts, setToasts] = useState([])
  const [visitorStats, setVisitorStats] = useState({
    todayVisits: 0,
    weekVisits: 0,
    monthVisits: 0,
    yearVisits: 0,
    totalVisits: 0,
  })
  const routeLock = useAdminRouteLock({ pathname: location.pathname, user })
  const shouldWarnUnsaved = Boolean(
    hasUnsavedChanges &&
    location.pathname !== '/admin/login' &&
    location.pathname !== '/admin/dashboard'
  )
  const routeLabel = MENU_GROUPS
    .flatMap(group => group.items)
    .find(item => item.path === location.pathname)?.label || '현재 페이지'
  const normalizedMenuKeyword = menuKeyword.trim().toLowerCase()
  const visibleGroups = MENU_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!normalizedMenuKeyword) return true
        const haystack = `${item.label} ${item.desc || ''} ${group.label}`.toLowerCase()
        return haystack.includes(normalizedMenuKeyword)
      }),
    }))
    .filter(group => group.items.length > 0)

  const toggleFav = (e, path) => {
    e.preventDefault()
    e.stopPropagation()
    const next = favs.includes(path) ? favs.filter(p => p !== path) : [...favs, path]
    setFavs(next)
    saveFavs(uid, next)
  }

  const handleLogout = async () => {
    setHasUnsavedChanges(false)
    await signOut(auth)
    navigate('/admin/login')
  }

  useEffect(() => {
    const pushToast = (message) => {
      const toast = createToast(message)
      if (!toast.message) return

      setToasts(current => [...current, toast])
      window.setTimeout(() => {
        setToasts(current => current.filter(item => item.id !== toast.id))
      }, 3200)
    }

    const handleToastEvent = (event) => {
      pushToast(event.detail?.message)
    }

    const originalAlert = window.alert
    window.alert = (message) => pushToast(message)
    window.addEventListener('admin:toast', handleToastEvent)

    return () => {
      window.alert = originalAlert
      window.removeEventListener('admin:toast', handleToastEvent)
    }
  }, [])

  useEffect(() => {
    setHasUnsavedChanges(false)
  }, [location.pathname])

  useEffect(() => {
    const markSaved = () => setHasUnsavedChanges(false)
    window.addEventListener('admin:changes-saved', markSaved)
    return () => {
      window.removeEventListener('admin:changes-saved', markSaved)
    }
  }, [])

  useEffect(() => {
    if (!shouldWarnUnsaved) return undefined

    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [shouldWarnUnsaved])

  useEffect(() => {
    if (!shouldWarnUnsaved) return undefined

    const handleDocumentClick = (event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const anchor = target.closest('a')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href') || ''
      if (!href || href === '#') return

      const confirmed = window.confirm('저장되지 않은 수정 내용이 있습니다. 이동하면 현재 수정 중인 내용은 초기화됩니다. 계속하시겠습니까?')
      if (!confirmed) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      setHasUnsavedChanges(false)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [shouldWarnUnsaved])

  useEffect(() => {
    const root = contentRef.current
    if (!root || routeLock.isLockedByOther || routeLock.isChecking) return undefined

    const markDirty = (event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      if (event.type === 'click') {
        const button = target.closest('button')
        if (!button) return

        const buttonText = (button.textContent || '').trim()
        const shouldMarkButton = /추가|삭제|선택|등록|저장|수정|업데이트|완료|변경/.test(buttonText)
        if (!shouldMarkButton) return
      }

      setHasUnsavedChanges(true)
    }

    root.addEventListener('input', markDirty, true)
    root.addEventListener('change', markDirty, true)
    root.addEventListener('click', markDirty, true)

    return () => {
      root.removeEventListener('input', markDirty, true)
      root.removeEventListener('change', markDirty, true)
      root.removeEventListener('click', markDirty, true)
    }
  }, [routeLock.isChecking, routeLock.isLockedByOther, location.pathname])

  useEffect(() => {
    if (!user) return undefined

    const clearSessionTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const expireSession = async () => {
      if (expiredRef.current) return
      expiredRef.current = true
      clearSessionTimer()

      alert('10분 동안 동작이 없어 세션이 만료되었습니다. 다시 로그인해 주세요.')

      try {
        await signOut(auth)
      } finally {
        navigate('/admin/login')
      }
    }

    const resetSessionTimer = () => {
      if (expiredRef.current) return
      clearSessionTimer()
      deadlineRef.current = Date.now() + SESSION_TIMEOUT_MS
      setRemainingMs(SESSION_TIMEOUT_MS)
      timeoutRef.current = setTimeout(() => {
        expireSession()
      }, SESSION_TIMEOUT_MS)
    }

    expiredRef.current = false
    resetSessionTimer()

    const countdownId = setInterval(() => {
      if (!deadlineRef.current || expiredRef.current) return
      setRemainingMs(Math.max(0, deadlineRef.current - Date.now()))
    }, 1000)

    const activityEvents = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, resetSessionTimer, { passive: true })
    })

    return () => {
      clearSessionTimer()
      clearInterval(countdownId)
      activityEvents.forEach(eventName => {
        window.removeEventListener(eventName, resetSessionTimer)
      })
    }
  }, [navigate, user])

  useEffect(() => {
    if (!user) return undefined

    let active = true

    getVisitorSummary()
      .then(stats => {
        if (!active) return
        setVisitorStats({
          todayVisits: stats.todayVisits,
          weekVisits: stats.weekVisits,
          monthVisits: stats.monthVisits,
          yearVisits: stats.yearVisits,
          totalVisits: stats.totalVisits,
        })
      })
      .catch(console.error)

    return () => {
      active = false
    }
  }, [user])

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
        <p style={{ color: '#9ca3af' }}>로딩 중...</p>
      </div>
    )
  }

  if (!user) {
    navigate('/admin/login')
    return null
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fb' }}>

      {/* 사이드바 */}
      <aside style={{ width: '240px', flexShrink: 0, background: '#0f2040', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto' }}>

        {/* 로고 */}
        <Link to="/admin/dashboard" style={{ textDecoration: 'none', padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '4px 8px', flexShrink: 0 }}>
              <img src="/images/logo.png" alt="신애교회" style={{ height: '26px', width: 'auto', display: 'block' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>안녕하세요!</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{user.email?.split('@')[0]}님</p>
            </div>
          </div>
        </Link>

        {/* 메뉴 */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ marginBottom: '18px', padding: '0 4px' }}>
            <div style={{ position: 'relative' }}>
              <input
                value={menuKeyword}
                onChange={event => setMenuKeyword(event.target.value)}
                placeholder="메뉴 검색"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                검색
              </span>
            </div>
          </div>

          {/* 대시보드 */}
          <div style={{ marginBottom: '24px' }}>
            {(() => {
              const active = location.pathname === '/admin/dashboard'
              return (
                <Link to="/admin/dashboard"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '8px', marginBottom: '2px', textDecoration: 'none', fontSize: '0.825rem', fontWeight: active ? 700 : 400, background: active ? 'rgba(29,78,216,0.5)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}}
                >
                  <span style={{ fontSize: '0.9rem' }}>🏠</span>
                  대시보드
                </Link>
              )
            })()}
          </div>

          {visibleGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', padding: '0 8px', marginBottom: '6px' }}>
                {group.label}
              </p>
              {group.items.map(item => {
                const active = location.pathname === item.path
                const starred = favs.includes(item.path)
                const hovered = hoveredPath === item.path
                return (
                  <div key={item.path}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                  >
                    <Link
                      to={item.path}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 10px', paddingRight: '32px',
                        borderRadius: '8px', marginBottom: '2px',
                        textDecoration: 'none', fontSize: '0.825rem', fontWeight: active ? 700 : 400,
                        background: active ? 'rgba(29,78,216,0.5)' : 'transparent',
                        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                      {item.label}
                    </Link>
                    {/* 별표 버튼 */}
                    {(hovered || starred) && (
                      <button
                        onClick={e => toggleFav(e, item.path)}
                        title={starred ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                        style={{
                          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '0.8rem', lineHeight: 1, padding: '2px',
                          color: starred ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24' }}
                        onMouseLeave={e => { e.currentTarget.style.color = starred ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}
                      >
                        {starred ? '★' : '☆'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {visibleGroups.length === 0 ? (
            <div style={{ marginTop: '20px', padding: '14px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', lineHeight: 1.6 }}>
              검색된 메뉴가 없습니다.
            </div>
          ) : null}
        </nav>

        {/* 하단 사용자 정보 */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </p>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 콘텐츠 */}
      <main style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #eaecf0', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {routeLock.enabled ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: routeLock.isLockedByOther ? '#fef2f2' : routeLock.isChecking ? '#f8fafc' : '#ecfdf5',
                border: routeLock.isLockedByOther ? '1px solid #fecaca' : routeLock.isChecking ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
                color: routeLock.isLockedByOther ? '#b91c1c' : routeLock.isChecking ? '#475569' : '#047857',
                fontSize: '0.8rem',
                fontWeight: 800,
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: routeLock.isLockedByOther ? '#dc2626' : routeLock.isChecking ? '#94a3b8' : '#10b981',
                  boxShadow: routeLock.isLockedByOther ? '0 0 0 4px rgba(220,38,38,0.14)' : 'none',
                }} />
                {routeLock.isLockedByOther ? `${routeLabel} 읽기 전용` : routeLock.isChecking ? '잠금 확인 중' : `${routeLabel} 수정 중`}
              </div>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
              <span style={{ color: '#9ca3af' }}>세션 남은 시간</span>
              <span style={{ padding: '6px 10px', borderRadius: '999px', background: remainingMs <= 60 * 1000 ? '#fef2f2' : '#eff6ff', color: remainingMs <= 60 * 1000 ? '#dc2626' : '#1d4ed8', fontFamily: 'monospace', fontWeight: 800 }}>
                {formatRemainingTime(remainingMs)}
              </span>
            </div>
            <div style={{ width: '1px', alignSelf: 'stretch', background: '#e5e7eb' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, flexWrap: 'wrap' }}>
              <span style={{ color: '#9ca3af' }}>홈페이지 방문자</span>
              <span style={{ padding: '6px 10px', borderRadius: '999px', background: '#f8fafc', color: '#0f2040', fontWeight: 700 }}>
                오늘 {visitorStats.todayVisits.toLocaleString()}
              </span>
              <span style={{ padding: '6px 10px', borderRadius: '999px', background: '#f8fafc', color: '#0f2040', fontWeight: 700 }}>
                주 {visitorStats.weekVisits.toLocaleString()}
              </span>
              <span style={{ padding: '6px 10px', borderRadius: '999px', background: '#f8fafc', color: '#0f2040', fontWeight: 700 }}>
                월 {visitorStats.monthVisits.toLocaleString()}
              </span>
              <span style={{ padding: '6px 10px', borderRadius: '999px', background: '#f8fafc', color: '#0f2040', fontWeight: 700 }}>
                연 {visitorStats.yearVisits.toLocaleString()}
              </span>
              <span style={{ padding: '6px 10px', borderRadius: '999px', background: '#eef2ff', color: '#3730a3', fontWeight: 800 }}>
                총 {visitorStats.totalVisits.toLocaleString()}
              </span>
            </div>
          </div>
          <Link
            to="/"
            target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.color = '#1d4ed8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            홈페이지 보기
          </Link>
        </div>

        <div ref={contentRef} style={{ padding: '32px', position: 'relative' }}>
          {toasts.length > 0 ? (
            <div style={{ position: 'fixed', top: '84px', right: '28px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
              {toasts.map(toast => (
                <div key={toast.id} style={{
                  minWidth: '260px',
                  maxWidth: '360px',
                  borderRadius: '14px',
                  border: toast.type === 'error' ? '1px solid #fecaca' : '1px solid #bfdbfe',
                  background: toast.type === 'error' ? '#fff1f2' : '#eff6ff',
                  color: toast.type === 'error' ? '#b91c1c' : '#1d4ed8',
                  padding: '12px 14px',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.12)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}>
                  {toast.message}
                </div>
              ))}
            </div>
          ) : null}
          {routeLock.enabled ? (
            <div style={{
              marginBottom: '20px',
              borderRadius: '16px',
              border: routeLock.isLockedByOther ? '1px solid #fecaca' : routeLock.hasError ? '1px solid #fde68a' : '1px solid #bfdbfe',
              background: routeLock.isLockedByOther ? '#fef2f2' : routeLock.hasError ? '#fffbeb' : '#eff6ff',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              boxShadow: routeLock.isLockedByOther ? '0 10px 24px rgba(185,28,28,0.08)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 900, color: routeLock.isLockedByOther ? '#b91c1c' : routeLock.hasError ? '#92400e' : '#1d4ed8' }}>
                  {routeLock.isChecking
                    ? '편집 잠금을 확인하는 중입니다.'
                    : routeLock.isLockedByOther
                      ? `${routeLabel} 페이지는 현재 읽기 전용입니다.`
                      : routeLock.hasError
                        ? '편집 잠금 상태를 확인하지 못했습니다.'
                        : `${routeLabel} 페이지를 현재 수정 중입니다.`}
                </p>
                {routeLock.isLockedByOther && routeLock.lockOwner?.email ? (
                  <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '6px', fontWeight: 700 }}>
                    편집 중 관리자: {routeLock.lockOwner.email}
                  </p>
                ) : null}
                {routeLock.isLockedByMe ? (
                  <p style={{ fontSize: '0.8rem', color: '#1e40af', marginTop: '6px', fontWeight: 700 }}>
                    현재 이 메뉴는 본인만 수정할 수 있습니다.
                  </p>
                ) : null}
                {routeLock.isLockedByOther ? (
                  <p style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '6px' }}>
                    다른 메뉴는 이동 가능하지만 이 페이지에서는 입력과 저장이 차단됩니다.
                  </p>
                ) : null}
              </div>
              {routeLock.isLockedByOther && routeLock.lockOwner?.expiresAt ? (
                <span style={{ fontSize: '0.76rem', color: '#991b1b', fontWeight: 800, padding: '8px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.72)' }}>
                  잠금 만료 예정: {new Date(routeLock.lockOwner.expiresAt).toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          ) : null}

          {shouldWarnUnsaved ? (
            <div style={{
              marginBottom: '20px',
              borderRadius: '14px',
              border: '1px solid #fde68a',
              background: '#fffbeb',
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e' }}>저장되지 않은 수정 내용이 있습니다.</p>
              <p style={{ fontSize: '0.76rem', color: '#b45309', marginTop: '4px' }}>다른 메뉴로 이동하면 현재 수정 중이던 내용은 초기화됩니다.</p>
            </div>
          ) : null}

          <div style={{
            position: 'relative',
            opacity: routeLock.isLockedByOther || routeLock.isChecking ? 0.55 : 1,
            pointerEvents: routeLock.isLockedByOther || routeLock.isChecking ? 'none' : 'auto',
          }}>
            {routeLock.isLockedByOther ? (
              <div style={{
                position: 'sticky',
                top: '88px',
                zIndex: 9,
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <div style={{
                  maxWidth: '520px',
                  width: '100%',
                  borderRadius: '18px',
                  border: '1px solid #fecaca',
                  background: 'rgba(255,255,255,0.96)',
                  boxShadow: '0 18px 42px rgba(185, 28, 28, 0.16)',
                  padding: '18px 20px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#b91c1c' }}>읽기 전용 상태</p>
                  <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '6px', lineHeight: 1.6 }}>
                    다른 관리자가 현재 <strong>{routeLabel}</strong> 페이지를 수정 중이라 입력과 저장이 잠겨 있습니다.
                  </p>
                </div>
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
