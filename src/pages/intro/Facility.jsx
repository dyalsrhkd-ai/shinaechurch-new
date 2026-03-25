import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '인사말',         path: '/intro/greeting' },
  { label: '교회 연혁',      path: '/intro/history' },
  { label: '섬기는 사람들',  path: '/intro/staff' },
  { label: '교회 연간 일정', path: '/intro/schedule' },
  { label: '예배 안내',      path: '/intro/worship' },
  { label: '오시는길',       path: '/intro/location' },
  { label: '교회시설물 안내', path: '/intro/facility' },
]

const BUILDING_ICONS = [
  // 본관 스타일
  <svg key="a" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 2L3 9v12h6v-7h6v7h6V9L12 2z" strokeLinejoin="round"/>
  </svg>,
  // 별관 스타일
  <svg key="b" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
  </svg>,
  // 집 스타일
  <svg key="c" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinejoin="round"/>
  </svg>,
  // 나무/자연 스타일
  <svg key="d" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 2l4 7H8l4-7z"/><rect x="10" y="9" width="4" height="13" rx="1"/>
  </svg>,
]

export default function Facility() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'facility', 'main'))
      .then(snap => { if (snap.exists()) setData(snap.data()) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <SubLayout section="교회 소개" menus={menus} title="교회시설물 안내">
      <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
    </SubLayout>
  )

  const buildings = data?.buildings || []
  const photos = data?.photos || []
  const heroUrl = data?.heroImageUrl || ''

  return (
    <SubLayout section="교회 소개" menus={menus} title="교회시설물 안내">
      <div>
        {/* 대표 사진 */}
        {heroUrl && (
          <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '36px', border: '1px solid #eaecf0' }}>
            <img
              src={heroUrl}
              alt="신애교회 전경"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* 시설 안내 테이블 */}
        {buildings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
            {buildings.map((b, bi) => (
              <div key={bi} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ background: b.color || '#0f2040', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                  <div style={{ opacity: 0.9 }}>{BUILDING_ICONS[bi % BUILDING_ICONS.length]}</div>
                  <h3 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{b.name}</h3>
                </div>
                {(b.floors || []).map((f, fi) => (
                  <div
                    key={fi}
                    style={{
                      display: 'flex',
                      borderBottom: fi < b.floors.length - 1 ? '1px solid #f0f2f5' : 'none',
                    }}
                  >
                    {f.floor && (
                      <div style={{ flexShrink: 0, width: '72px', padding: '14px 16px', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f0f2f5' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: b.color || '#1d4ed8' }}>{f.floor}</span>
                      </div>
                    )}
                    <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {(f.rooms || []).map((room, ri) => (
                        <span key={ri} style={{ fontSize: '0.8rem', color: '#374151', background: '#f0f2f5', padding: '3px 10px', borderRadius: '9999px', fontWeight: 500 }}>
                          {room}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 시설 사진 갤러리 */}
        {photos.length > 0 && (
          <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '36px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
              시설 사진
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {photos.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setLightbox(i)}
                  style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}
                  onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity = '0'}
                >
                  <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                  <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,48,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>{p.label}</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>{p.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={photos[lightbox].url} alt={photos[lightbox].label} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '-36px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{photos[lightbox].label}</span>
            </div>
            {lightbox > 0 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
                style={{ position: 'absolute', left: '-52px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            )}
            {lightbox < photos.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
                style={{ position: 'absolute', right: '-52px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            )}
            <button onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: '-44px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
