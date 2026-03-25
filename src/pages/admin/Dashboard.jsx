import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ALL_ITEMS } from './menuItems'

function getFavKey(uid) { return `shinae_fav_${uid}` }
function loadFavs(uid) {
  try { return JSON.parse(localStorage.getItem(getFavKey(uid)) || '[]') } catch { return [] }
}
function saveFavs(uid, favs) {
  localStorage.setItem(getFavKey(uid), JSON.stringify(favs))
}

function MenuCard({ item, starred, onToggleStar }) {
  return (
    <div style={{ position: 'relative' }}>
      <Link to={item.path} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{ background: '#fff', borderRadius: '14px', border: '1px solid #eaecf0', padding: '24px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div style={{ width: '44px', height: '44px', background: item.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '14px' }}>
            {item.icon}
          </div>
          <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2040', marginBottom: '4px' }}>{item.label}</p>
          <p style={{ fontSize: '0.775rem', color: '#9ca3af' }}>{item.desc}</p>
        </div>
      </Link>
      {/* 별표 버튼 */}
      <button
        onClick={e => { e.preventDefault(); onToggleStar(item.path) }}
        title={starred ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: starred ? '#fffbeb' : 'transparent',
          border: starred ? '1px solid #fde68a' : '1px solid transparent',
          borderRadius: '6px', width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1rem',
          color: starred ? '#f59e0b' : '#d1d5db',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.borderColor = '#fde68a'; e.currentTarget.style.background = '#fffbeb' }}
        onMouseLeave={e => {
          if (!starred) {
            e.currentTarget.style.color = '#d1d5db'
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        {starred ? '★' : '☆'}
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const uid = user?.uid || ''
  const [favs, setFavs] = useState(() => loadFavs(uid))
  const [showAll, setShowAll] = useState(false)

  const toggleStar = (path) => {
    const next = favs.includes(path) ? favs.filter(p => p !== path) : [...favs, path]
    setFavs(next)
    saveFavs(uid, next)
  }

  const favItems = ALL_ITEMS.filter(item => favs.includes(item.path))
  const otherItems = ALL_ITEMS.filter(item => !favs.includes(item.path))

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f2040' }}>대시보드</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
          ★ 즐겨찾기한 메뉴가 여기에 표시됩니다. 사이드바나 아래 메뉴에서 별표를 눌러 추가하세요.
        </p>
      </div>

      {/* ── 즐겨찾기 섹션 ─────────────────────────── */}
      {favItems.length > 0 ? (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1rem', color: '#f59e0b' }}>★</span>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f2040' }}>즐겨찾기</h2>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{favItems.length}개</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {favItems.map(item => (
              <MenuCard key={item.path} item={item} starred={true} onToggleStar={toggleStar} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fffbeb', border: '1px dashed #fde68a', borderRadius: '14px', padding: '32px', textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>☆</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>즐겨찾기가 없습니다</p>
          <p style={{ fontSize: '0.8rem', color: '#b45309' }}>아래 메뉴에서 별표(☆)를 눌러 자주 쓰는 기능을 추가하세요</p>
        </div>
      )}

      {/* ── 전체 메뉴 ────────────────────────────────── */}
      <div>
        <button
          onClick={() => setShowAll(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#6b7280' }}>전체 메뉴</h2>
          <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transition: 'transform 0.2s', transform: showAll ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{showAll ? '접기' : `${ALL_ITEMS.length}개 펼치기`}</span>
        </button>

        {showAll && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {ALL_ITEMS.map(item => (
              <MenuCard key={item.path} item={item} starred={favs.includes(item.path)} onToggleStar={toggleStar} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
