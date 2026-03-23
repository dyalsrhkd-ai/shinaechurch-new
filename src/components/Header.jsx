import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const menus = [
  {
    label: '교회 소개', path: '/intro',
    sub: [
      { label: '인사말', path: '/intro/greeting' },
      { label: '교회 연혁', path: '/intro/history' },
      { label: '섬기는 사람들', path: '/intro/staff' },
      { label: '교회 연간 일정', path: '/intro/schedule' },
      { label: '예배 안내', path: '/intro/worship' },
      { label: '오시는길', path: '/intro/location' },
      { label: '교회시설물 안내', path: '/intro/facility' },
    ],
  },
  {
    label: '말씀 · 찬양', path: '/media',
    sub: [
      { label: '주일예배', path: '/media/sunday' },
      { label: '특별설교', path: '/media/special' },
      { label: '성가대', path: '/media/choir' },
    ],
  },
  {
    label: '기관 · 부서', path: '/ministry',
    sub: [
      { label: '남전도회', path: '/ministry/men' },
      { label: '여전도회', path: '/ministry/women' },
      { label: '권사회', path: '/ministry/deaconess' },
      { label: '부서별', path: '/ministry/dept' },
    ],
  },
  {
    label: '교회 학교', path: '/school',
    sub: [
      { label: '아동부', path: '/school/children' },
      { label: '중·고등부', path: '/school/youth' },
      { label: '청년부', path: '/school/young' },
      { label: '성경대학', path: '/school/bible' },
    ],
  },
  {
    label: '교제와 나눔', path: '/community',
    sub: [
      { label: '교회소식', path: '/community/news' },
      { label: '주보보기', path: '/community/bulletin' },
      { label: '행사갤러리', path: '/community/gallery' },
      { label: '행사동영상', path: '/community/video' },
      { label: '새가족소개', path: '/community/newcomer' },
      { label: '부서자료실', path: '/community/resources' },
      { label: '공지사항', path: '/community/notice' },
      { label: '영선관리', path: '/community/farm' },
    ],
  },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const location = useLocation()

  const isActive = m => location.pathname.startsWith(m.path)

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#fff',
      borderBottom: '1px solid #eaecf0',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 clamp(1rem, 4vw, 3rem)',
        display: 'flex',
        alignItems: 'center',
        height: '72px',
        gap: '0',
      }}>

        {/* 로고 */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          style={{ display: 'flex', alignItems: 'center', marginRight: '48px', flexShrink: 0 }}
        >
          <img
            src="/images/logo.png"
            alt="신애교회"
            style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <span style={{ display: 'none', fontWeight: 900, fontSize: '1.1rem', color: '#0f2040', letterSpacing: '-0.02em' }}>
            신애교회
          </span>
        </Link>

        {/* PC 네비 */}
        <nav style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '4px' }} className="pc-nav">
          {menus.map(menu => (
            <div
              key={menu.path}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHovered(menu.path)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link
                to={menu.sub[0].path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 18px',
                  height: '72px',
                  fontSize: '0.925rem',
                  fontWeight: isActive(menu) ? 700 : 500,
                  color: isActive(menu) ? '#1d4ed8' : '#374151',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  transition: 'color 0.15s',
                }}
              >
                {menu.label}
                {/* 활성 언더바 */}
                {isActive(menu) && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '18px',
                    right: '18px',
                    height: '2px',
                    background: '#1d4ed8',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </Link>

              {/* 드롭다운 */}
              {hovered === menu.path && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  minWidth: '160px',
                  background: '#fff',
                  border: '1px solid #eaecf0',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  padding: '8px 0',
                  zIndex: 200,
                }}>
                  {menu.sub.map(sub => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      style={{
                        display: 'block',
                        padding: '10px 20px',
                        fontSize: '0.875rem',
                        fontWeight: location.pathname === sub.path ? 600 : 400,
                        color: location.pathname === sub.path ? '#1d4ed8' : '#374151',
                        background: location.pathname === sub.path ? '#eff6ff' : 'transparent',
                        textDecoration: 'none',
                        transition: 'background 0.12s, color 0.12s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        if (location.pathname !== sub.path) {
                          e.currentTarget.style.background = '#f8faff'
                          e.currentTarget.style.color = '#1d4ed8'
                        }
                      }}
                      onMouseLeave={e => {
                        if (location.pathname !== sub.path) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#374151'
                        }
                      }}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 전화번호 */}
        <a
          href="tel:031-429-4557"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginLeft: '24px',
            flexShrink: 0,
            textDecoration: 'none',
          }}
          className="pc-nav"
        >
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.12 9.13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>전화문의</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f2040' }}>031-429-4557</p>
          </div>
        </a>

        {/* 모바일 햄버거 */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{ display: 'none', marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', flexDirection: 'column', gap: '5px' }}
          className="mobile-nav"
        >
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: 'block', width: '24px', height: '2px',
              background: '#374151', borderRadius: '2px',
              transition: 'all 0.25s',
              transform: mobileOpen
                ? i === 0 ? 'rotate(45deg) translateY(7px)'
                : i === 1 ? 'scaleX(0)'
                : 'rotate(-45deg) translateY(-7px)'
                : 'none',
              opacity: mobileOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      <div style={{
        display: mobileOpen ? 'block' : 'none',
        borderTop: '1px solid #eaecf0',
        maxHeight: '75vh',
        overflowY: 'auto',
        background: '#fff',
      }} className="mobile-menu">
        {menus.map(menu => (
          <div key={menu.path}>
            <p style={{ padding: '10px 20px 6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', background: '#f9fafb' }}>
              {menu.label}
            </p>
            {menu.sub.map(sub => (
              <Link
                key={sub.path}
                to={sub.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 28px',
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === sub.path ? 600 : 400,
                  color: location.pathname === sub.path ? '#1d4ed8' : '#374151',
                  background: location.pathname === sub.path ? '#eff6ff' : '#fff',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pc-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
