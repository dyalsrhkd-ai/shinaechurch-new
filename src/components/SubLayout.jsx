import { Link, useLocation } from 'react-router-dom'

/**
 * 서브페이지 공통 레이아웃
 * props:
 *   section   – 상위 메뉴 이름 (예: '교회 소개')
 *   menus     – [{ label, path }] 사이드 메뉴 목록
 *   title     – 현재 페이지 제목
 *   children  – 본문 내용
 */
export default function SubLayout({ section, menus, title, children }) {
  const location = useLocation()

  return (
    <div>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f2040 0%, #1d3a6e 100%)',
          padding: '56px 0 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 패턴 */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)', position: 'relative' }}>
          {/* 브레드크럼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Link to="/" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>홈</Link>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>›</span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{section}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>›</span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{title}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            {title}
          </h1>
        </div>
      </div>

      {/* 본문 영역 */}
      <div style={{ background: '#f6f8fb', minHeight: '60vh' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 3rem) clamp(4rem, 6vw, 6rem)',
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          gap: '40px',
          alignItems: 'start',
        }}
        className="sub-grid">

          {/* 사이드 메뉴 */}
          <aside
            style={{
              background: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #eaecf0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              position: 'sticky',
              top: '88px',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af' }}>
                {section}
              </p>
            </div>
            <ul style={{ listStyle: 'none' }}>
              {menus.map((m, i) => {
                const active = location.pathname === m.path
                return (
                  <li key={m.path}>
                    <Link
                      to={m.path}
                      style={{
                        display: 'block',
                        padding: '13px 20px',
                        fontSize: '0.875rem',
                        fontWeight: active ? 700 : 400,
                        color: active ? '#1d4ed8' : '#374151',
                        background: active ? '#eff6ff' : 'transparent',
                        borderBottom: i < menus.length - 1 ? '1px solid #f6f8fb' : 'none',
                        textDecoration: 'none',
                        transition: 'background 0.15s, color 0.15s',
                        borderLeft: active ? '3px solid #1d4ed8' : '3px solid transparent',
                      }}
                    >
                      {m.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* 콘텐츠 */}
          <main style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eaecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', minHeight: '400px' }}>
            {children}
          </main>

        </div>
      </div>

    </div>
  )
}
