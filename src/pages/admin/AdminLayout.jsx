import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
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

export default function AdminLayout({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const timeoutRef = useRef(null)
  const deadlineRef = useRef(0)
  const expiredRef = useRef(false)

  const uid = user?.uid || ''
  const [favs, setFavs] = useState(() => loadFavs(uid))
  const [hoveredPath, setHoveredPath] = useState(null)
  const [remainingMs, setRemainingMs] = useState(SESSION_TIMEOUT_MS)
  const [visitorStats, setVisitorStats] = useState({
    todayVisits: 0,
    weekVisits: 0,
    monthVisits: 0,
    yearVisits: 0,
    totalVisits: 0,
  })

  const toggleFav = (e, path) => {
    e.preventDefault()
    e.stopPropagation()
    const next = favs.includes(path) ? favs.filter(p => p !== path) : [...favs, path]
    setFavs(next)
    saveFavs(uid, next)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

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

          {MENU_GROUPS.map(group => (
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

        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
