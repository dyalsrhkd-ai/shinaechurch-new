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

const months = [
  {
    month: '1월',
    events: ['신년 감사예배', '신년 하례', '직원수련회'],
  },
  {
    month: '2월',
    events: ['사순절 시작', '중·고등부 수련회'],
  },
  {
    month: '3월',
    events: ['삼일절 기념예배', '성경대학 개강', '청년부 수련회'],
  },
  {
    month: '4월',
    events: ['종려주일 예배', '고난주간 예배', '부활절 연합예배'],
  },
  {
    month: '5월',
    events: ['어버이날 감사예배', '어린이날 행사', '가정의 달 특별예배'],
  },
  {
    month: '6월',
    events: ['현충일 추모예배', '교회 수련회', '아동부 수련회'],
  },
  {
    month: '7월',
    events: ['맥추감사절 예배', '여름성경학교', '청소년 캠프'],
  },
  {
    month: '8월',
    events: ['광복절 기념예배', '하계 수련회'],
  },
  {
    month: '9월',
    events: ['성경대학 개강', '추석 감사예배', '전도축제'],
  },
  {
    month: '10월',
    events: ['종교개혁주일 예배', '선교대회', '문화행사'],
  },
  {
    month: '11월',
    events: ['추수감사절 예배', '성경대학 수료식', '연말 특별집회'],
  },
  {
    month: '12월',
    events: ['대강절(대림절) 예배', '성탄절 예배', '송년 감사예배'],
  },
]

export default function Schedule() {
  return (
    <SubLayout section="교회 소개" menus={menus} title="교회 연간 일정">
      <div>
        {/* 표어 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '36px',
            borderLeft: '4px solid #1d4ed8',
          }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '6px' }}>2026년 표어</p>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2040' }}>섬김과 봉사 — 사랑으로 하나 되는 신애교회</p>
        </div>

        {/* 월별 일정 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {months.map(m => (
            <div
              key={m.month}
              style={{
                background: '#f6f8fb',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #eaecf0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: '#1d4ed8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{m.month}</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {m.events.map((ev, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#374151', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, width: '5px', height: '5px', borderRadius: '50%', background: '#1d4ed8', marginTop: '6px' }} />
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
          * 일정은 교회 사정에 따라 변경될 수 있습니다. 자세한 내용은 주보 및 공지사항을 확인하세요.
        </p>
      </div>
    </SubLayout>
  )
}
