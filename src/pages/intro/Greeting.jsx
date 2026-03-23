import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '인사말',        path: '/intro/greeting' },
  { label: '교회 연혁',     path: '/intro/history' },
  { label: '섬기는 사람들', path: '/intro/staff' },
  { label: '교회 연간 일정', path: '/intro/schedule' },
  { label: '예배 안내',     path: '/intro/worship' },
  { label: '오시는길',      path: '/intro/location' },
  { label: '교회시설물 안내', path: '/intro/facility' },
]

export default function Greeting() {
  return (
    <SubLayout section="교회 소개" menus={menus} title="인사말">
      {/* 목사 사진 + 인사말 */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 사진 */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              width: '200px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #eaecf0',
              background: '#f6f8fb',
            }}
          >
            <img
              src="/images/corp_new/mem8.jpg"
              alt="우용녀 목사"
              style={{ width: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            <div
              style={{
                display: 'none',
                width: '200px',
                height: '240px',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e8edf5',
              }}
            >
              <svg width="48" height="48" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0f2040' }}>우용녀 목사</p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>신애교회 담임목사</p>
          </div>
        </div>

        {/* 인사 글 */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ borderLeft: '4px solid #1d4ed8', paddingLeft: '20px', marginBottom: '28px' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f2040', lineHeight: 1.5 }}>
              신애교회에 오신 것을<br />주님의 이름으로 환영합니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', color: '#374151', lineHeight: 1.9 }}>
            <p>
              먼저 하나님께 영광을 돌리며, 신애교회에 오신 것을 주님의 이름으로 환영합니다.
            </p>
            <p>
              주님은 우리의 화평이시며 원수 된 것과 막힌 담을 자기 육체로 허시고,
              십자가로 이 둘을 한 몸으로 하나님께서 화목하게 하셨습니다.
            </p>
            <p>
              하나님께서 세우신 교회가 서로 연합하여 성령 안에서 하나님이 거하실 처소가 되기 위해
              그리스도 예수 안에서 함께 지어져가는 성전이 되길 소망합니다.
            </p>
            <p>
              신애교회를 찾는 모든 이들이 화평으로 하나님의 나라를 세워가는
              그리스도인이 되길 바랍니다.
            </p>
          </div>

          <div style={{ marginTop: '36px', textAlign: 'right' }}>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>신애교회 담임목사</p>
            <img
              src="/images/corp/corp1_2.png"
              alt="우용녀 목사 서명"
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <p style={{ display: 'none', fontSize: '1.3rem', fontWeight: 900, color: '#0f2040', fontFamily: 'serif' }}>우용녀</p>
          </div>
        </div>
      </div>

      {/* 교회 비전 */}
      <div style={{ marginTop: '48px', borderTop: '1px solid #f0f2f5', paddingTop: '40px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2040', marginBottom: '24px' }}>교회 비전</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: '말씀 중심',  desc: '성경 말씀 위에 세워진 건강한 교회' },
            { label: '기도 공동체', desc: '기도로 하나 되는 성령 충만한 교회' },
            { label: '사랑과 섬김', desc: '이웃을 사랑하고 세상을 섬기는 교회' },
          ].map(v => (
            <div
              key={v.label}
              style={{
                background: '#f6f8fb',
                borderRadius: '12px',
                padding: '24px 20px',
                borderTop: '3px solid #1d4ed8',
              }}
            >
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2040', marginBottom: '8px' }}>{v.label}</p>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SubLayout>
  )
}
