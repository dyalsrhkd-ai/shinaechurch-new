import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'
import { headerMenus } from '../data/siteMenus'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const location = useLocation()
  const { phone, logoUrl } = useSettings()

  const matchesPath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  const isActive = (menu) => menu.sub.some((sub) => matchesPath(sub.path))

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '1px solid #eaecf0',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(1rem, 4vw, 3rem)',
          display: 'flex',
          alignItems: 'center',
          height: '72px',
          gap: 0,
        }}
      >
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          style={{ display: 'flex', alignItems: 'center', marginRight: '48px', flexShrink: 0 }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="신애교회"
              style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
              onError={event => {
                event.target.style.display = 'none'
                event.target.nextSibling.style.display = 'block'
              }}
            />
          ) : null}
          <span style={{ display: logoUrl ? 'none' : 'block', fontWeight: 900, fontSize: '1.1rem', color: '#0f2040', letterSpacing: '-0.02em' }}>
            신애교회
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '4px' }} className="pc-nav">
          {headerMenus.map(menu => (
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
                {isActive(menu) ? (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '18px',
                      right: '18px',
                      height: '2px',
                      background: '#1d4ed8',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                ) : null}
              </Link>

              {hovered === menu.path ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: '180px',
                    background: '#fff',
                    border: '1px solid #eaecf0',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    padding: '8px 0',
                    zIndex: 200,
                  }}
                >
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
                      onMouseEnter={event => {
                        if (location.pathname !== sub.path) {
                          event.currentTarget.style.background = '#f8faff'
                          event.currentTarget.style.color = '#1d4ed8'
                        }
                      }}
                      onMouseLeave={event => {
                        if (location.pathname !== sub.path) {
                          event.currentTarget.style.background = 'transparent'
                          event.currentTarget.style.color = '#374151'
                        }
                      }}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <a
          href={`tel:${phone}`}
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
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.12 9.13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>전화문의</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f2040' }}>{phone}</p>
          </div>
        </a>

        <button
          onClick={() => setMobileOpen(open => !open)}
          style={{ display: 'none', marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', flexDirection: 'column', gap: '5px' }}
          className="mobile-nav"
        >
          {[0, 1, 2].map(index => (
            <span
              key={index}
              style={{
                display: 'block',
                width: '24px',
                height: '2px',
                background: '#374151',
                borderRadius: '2px',
                transition: 'all 0.25s',
                transform: mobileOpen
                  ? index === 0
                    ? 'rotate(45deg) translateY(7px)'
                    : index === 1
                      ? 'scaleX(0)'
                      : 'rotate(-45deg) translateY(-7px)'
                  : 'none',
                opacity: mobileOpen && index === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      <div
        style={{
          display: mobileOpen ? 'block' : 'none',
          borderTop: '1px solid #eaecf0',
          maxHeight: '75vh',
          overflowY: 'auto',
          background: '#fff',
        }}
        className="mobile-menu"
      >
        {headerMenus.map(menu => (
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
