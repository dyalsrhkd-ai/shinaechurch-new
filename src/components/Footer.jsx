import { Link } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

const cols = [
  {
    title: '교회 소개',
    links: [
      { label: '인사말',       to: '/intro/greeting' },
      { label: '교회 연혁',    to: '/intro/history' },
      { label: '섬기는 사람들', to: '/intro/staff' },
      { label: '예배 안내',    to: '/intro/worship' },
      { label: '오시는길',     to: '/intro/location' },
    ],
  },
  {
    title: '말씀 · 찬양',
    links: [
      { label: '주일예배', to: '/media/sunday' },
      { label: '특별설교', to: '/media/special' },
      { label: '성가대',   to: '/media/choir' },
    ],
  },
  {
    title: '기관 · 부서',
    links: [
      { label: '남전도회', to: '/ministry/men' },
      { label: '여전도회', to: '/ministry/women' },
      { label: '권사회',   to: '/ministry/deaconess' },
      { label: '부서별',   to: '/ministry/dept' },
    ],
  },
  {
    title: '교회 학교',
    links: [
      { label: '아동부',    to: '/school/children' },
      { label: '중·고등부', to: '/school/youth' },
      { label: '청년부',    to: '/school/young' },
      { label: '성경대학',  to: '/school/bible' },
    ],
  },
  {
    title: '교제와 나눔',
    links: [
      { label: '공지사항',   to: '/community/notice' },
      { label: '주보보기',   to: '/community/bulletin' },
      { label: '행사갤러리', to: '/community/gallery' },
      { label: '부서자료실', to: '/community/resources' },
    ],
  },
]

export default function Footer() {
  const { churchName, representative, privacyManager, address, phone, fax, email, tagline } = useSettings()
  return (
    <footer style={{ background: '#0D1F40' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)' }}>
        {/* 상단 */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '80px',
            paddingBottom: '64px',
          }}
        >
          {/* 교회 로고 */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{
              display: 'inline-block',
              background: '#fff',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '20px',
            }}>
              <img src="/images/logo.png" alt="신애교회" style={{ display: 'block', height: '40px', width: 'auto' }} />
            </div>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.3)', whiteSpace: 'pre-line' }}>
              {tagline}
            </p>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '20px' }}>
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 카피라이트 */}
        <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <address style={{ fontStyle: 'normal', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 2 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{churchName}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;대표 : {representative}
            &nbsp;&nbsp;|&nbsp;&nbsp;개인정보관리 : {privacyManager}
            &nbsp;&nbsp;|&nbsp;&nbsp;주소 : {address}
            <br />
            전화 : {phone}
            &nbsp;&nbsp;|&nbsp;&nbsp;팩스 : {fax}
            &nbsp;&nbsp;|&nbsp;&nbsp;이메일 :&nbsp;
            <a href={`mailto:${email}`} style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >{email}</a>
          </address>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.15)' }}>
              Copyright © shinaechurch. All rights reserved.
            </p>
            <Link to="/admin/login" style={{ color: 'rgba(255,255,255,0.08)', textDecoration: 'none', fontSize: '0.68rem', flexShrink: 0 }}>
              관리자
            </Link>
          </div>
        </div>
      </div>

    </footer>
  )
}
