import { useState } from 'react'
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

const photos = [
  { src: '/images/etc/corp6_1.jpg',  label: '본당' },
  { src: '/images/etc/corp6_2.jpg',  label: '소예배실' },
  { src: '/images/etc/corp6_6.jpg',  label: '성전' },
  { src: '/images/etc/corp6_3.jpg',  label: '방송실' },
  { src: '/images/etc/corp6_4.jpg',  label: '식당 1' },
  { src: '/images/etc/corp6_5.jpg',  label: '식당 2' },
  { src: '/images/etc/corp6_10.jpg', label: '유년부실' },
  { src: '/images/etc/corp6_11.jpg', label: '유아실' },
  { src: '/images/etc/corp6_9.jpg',  label: '교역자사무실' },
  { src: '/images/etc/corp6_12.jpg', label: '목양실' },
  { src: '/images/etc/corp6_13.jpg', label: '교육부사무실' },
  { src: '/images/etc/corp6_7.jpg',  label: '교회 앞 연못' },
  { src: '/images/etc/corp6_8.jpg',  label: '신애교회 농장' },
]

const buildings = [
  {
    name: '본관 (예배당)',
    color: '#1d4ed8',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2L3 9v12h6v-7h6v7h6V9L12 2z" strokeLinejoin="round"/>
      </svg>
    ),
    floors: [
      { floor: '1층', rooms: ['대예배실', '담임목사실', '에스더사랑방', '주차장'] },
      { floor: '2층', rooms: ['소예배실', '성가대 연습실', '사무실', '교육부 사무실'] },
      { floor: '3층', rooms: ['남전도회실', '권사회실', '여전도회실', '다목적실'] },
    ],
  },
  {
    name: '별관 (이레벨)',
    color: '#0369a1',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    floors: [
      { floor: '101호', rooms: ['재정부실', '전도부실', '새신자반'] },
      { floor: '201호', rooms: ['담임목사 사택'] },
      { floor: '301호', rooms: ['교역자실'] },
    ],
  },
  {
    name: '교육관',
    color: '#7c3aed',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
    ),
    floors: [
      { floor: '1층', rooms: ['아동부실', '중·고등부실', '청년부실'] },
      { floor: '2층', rooms: ['대학청년부실', '성경대학실', '교사실'] },
    ],
  },
]

export default function Facility() {
  const [lightbox, setLightbox] = useState(null)

  return (
    <SubLayout section="교회 소개" menus={menus} title="교회시설물 안내">
      <div>
        {/* 대표 사진 */}
        <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '36px', border: '1px solid #eaecf0' }}>
          <img
            src="/images/etc/corp6.jpg"
            alt="신애교회 전경"
            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* 시설 안내 테이블 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
          {buildings.map(b => (
            <div key={b.name} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ background: b.color, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                <div style={{ opacity: 0.9 }}>{b.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{b.name}</h3>
              </div>
              {b.floors.map((f, i) => (
                <div
                  key={f.floor}
                  style={{
                    display: 'flex',
                    borderBottom: i < b.floors.length - 1 ? '1px solid #f0f2f5' : 'none',
                  }}
                >
                  <div style={{ flexShrink: 0, width: '72px', padding: '14px 16px', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f0f2f5' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: b.color }}>{f.floor}</span>
                  </div>
                  <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {f.rooms.map(room => (
                      <span key={room} style={{ fontSize: '0.8rem', color: '#374151', background: '#f0f2f5', padding: '3px 10px', borderRadius: '9999px', fontWeight: 500 }}>
                        {room}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 시설 사진 갤러리 */}
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
                <img src={p.src} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
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

        {/* 부속 시설 */}
        <div style={{ marginTop: '32px', background: '#f6f8fb', borderRadius: '12px', padding: '20px 24px', border: '1px solid #eaecf0' }}>
          <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2040', marginBottom: '14px' }}>부속 시설</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {['주차장 (교회 전용)', '농장 (과수원·텃밭)', '25인승 버스', '해남수련관'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #eaecf0', borderRadius: '10px', padding: '10px 16px', fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1d4ed8', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 라이트박스 */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={photos[lightbox].src} alt={photos[lightbox].label} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '-36px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{photos[lightbox].label}</span>
            </div>
            {/* 이전/다음 */}
            {lightbox > 0 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
                style={{ position: 'absolute', left: '-52px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ‹
              </button>
            )}
            {lightbox < photos.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
                style={{ position: 'absolute', right: '-52px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ›
              </button>
            )}
            {/* 닫기 */}
            <button onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: '-44px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
