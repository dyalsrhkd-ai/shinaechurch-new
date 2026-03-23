import { useEffect } from 'react'
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

export default function Location() {
  useEffect(() => {
    const tryRender = () => {
      if (window.daum && window.daum.roughmap && window.daum.roughmap.Lander) {
        new window.daum.roughmap.Lander({
          timestamp: '1535262039184',
          key: 'pp3p',
          mapWidth: '100%',
          mapHeight: '440',
        }).render()
      } else {
        setTimeout(tryRender, 100)
      }
    }
    tryRender()
  }, [])

  return (
    <SubLayout section="교회 소개" menus={menus} title="오시는길">
      <div>
        {/* 지도 */}
        <div
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '32px',
            border: '1px solid #eaecf0',
            height: '440px',
          }}
        >
          <div
            id="daumRoughmapContainer1535262039184"
            className="root_daum_roughmap root_daum_roughmap_landing"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* 주소 정보 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {[
            {
              icon: (
                <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                </svg>
              ),
              label: '도로명 주소',
              value: '경기도 의왕시 왕곡로 187번지 (왕곡동)',
            },
            {
              icon: (
                <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.12 9.13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              ),
              label: '전화',
              value: '031-429-4557',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: '#f6f8fb',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                border: '1px solid #eaecf0',
              }}
            >
              <div
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f2040' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 교통 안내 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
            교통 안내
          </h3>

          {/* 지하철 */}
          <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span
                style={{
                  background: '#1d63c0',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                1호선
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>의왕역 하차</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                '일반버스 1-2번(마을버스 01·02) 하차 후 환승 → 일반 87번(고천, 의왕시청) → 왕림윗마을 정류장 하차',
                '일반버스 5번, 64번, 65번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
                '일반 777번, 301번 / 직행 3000번, 8409번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
              ].map((r, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.82rem', color: '#374151', lineHeight: 1.7 }}>
                  <span style={{ flexShrink: 0, color: '#9ca3af' }}>·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* 4호선 */}
          <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span
                style={{
                  background: '#00a2e8',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                4호선
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>환승 이용</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                '일반 301번, 10번 / 좌석 300번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
                '일반 777번, 441번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
                '직행 3000번, 3102번(의왕톨게이트 정류장 하차) → 일반 87번(고천체육공원) → 왕림윗마을 하차',
              ].map((r, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.82rem', color: '#374151', lineHeight: 1.7 }}>
                  <span style={{ flexShrink: 0, color: '#9ca3af' }}>·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* 지도 링크 */}
          <a
            href="https://map.kakao.com/link/search/경기도 의왕시 왕곡로 187번지"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#FEE500',
              color: '#1a1a1a',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              alignSelf: 'flex-start',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1a1a"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            카카오맵으로 길찾기
          </a>
        </div>
      </div>
    </SubLayout>
  )
}
