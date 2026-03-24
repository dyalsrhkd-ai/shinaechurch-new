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

const staff = [
  {
    group: '담임목사',
    color: '#1d4ed8',
    members: [
      { name: '우용녀 목사', role: '담임목사', img: '/images/corp_new/mem8.jpg' },
    ],
  },
  {
    group: '교역자',
    color: '#0369a1',
    members: [
      { name: '김해림 목사',   role: '부목사',       img: '/images/corp_new/mem6.jpg' },
      { name: '김영단 전도사', role: '행정전도사',    img: '/images/corp_new/mem3.jpg' },
      { name: '유영희 전도사', role: '심방전도사',    img: '/images/corp_new/mem9.jpg' },
      { name: '한정욱 전도사', role: '전도사',        img: '/images/corp_new/mem11.jpg' },
      { name: '김요셉 전도사', role: '아동부전도사',  img: '/images/corp_new/mem5.jpg' },
    ],
  },
  {
    group: '시무장로',
    color: '#7c3aed',
    members: [
      { name: '우태호 장로', role: '원로장로', img: '/images/corp/man6.jpg' },
      { name: '문옥희 장로', role: '은퇴장로', img: '/images/corp_new/mem7.jpg' },
      { name: '김영옥 장로', role: '장로',     img: '/images/corp_new/mem4.jpg' },
      { name: '윤여균 장로', role: '장로',     img: '/images/corp_new/mem10.jpg' },
      { name: '김강석 장로', role: '장로',     img: '/images/corp_new/mem2.jpg' },
    ],
  },
]

export default function Staff() {
  return (
    <SubLayout section="교회 소개" menus={menus} title="섬기는 사람들">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {staff.map(group => (
          <div key={group.group}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '4px', height: '24px', background: group.color, borderRadius: '4px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{group.group}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
              {group.members.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: '#f6f8fb',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '1px solid #eaecf0',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* 사진 */}
                  <div style={{ position: 'relative', aspectRatio: '1/1', background: '#e8edf5', overflow: 'hidden' }}>
                    <img
                      src={m.img}
                      alt={m.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                      onError={e => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div
                      style={{
                        display: 'none',
                        width: '100%', height: '100%',
                        alignItems: 'center', justifyContent: 'center',
                        background: '#e8edf5',
                      }}
                    >
                      <svg width="36" height="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {/* 이름·직책 */}
                  <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '3px' }}>{m.name}</p>
                    <p style={{ fontSize: '0.72rem', color: group.color, fontWeight: 600 }}>{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SubLayout>
  )
}
