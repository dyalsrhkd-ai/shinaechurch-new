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

const worshipMain = [
  { name: '주일 낮 1부',  time: '오전 09:00',  place: '본당 1층' },
  { name: '주일 낮 2부',  time: '오전 11:00',  place: '본당 1층' },
  { name: '주일 오후',    time: '오후 02:00',  place: '본당 1층' },
  { name: '수요 저녁',    time: '오후 07:30',  place: '본당 1층' },
  { name: '금요 저녁',    time: '오후 08:00',  place: '본당 1층' },
  { name: '매일 새벽',    time: '오전 05:00',  place: '본당 1층' },
]

const worshipDept = [
  { name: '대학청년부 주일', time: '오후 02:00', place: '대학청년부실' },
  { name: '아동부 주일',    time: '오전 11:00', place: '아동부실' },
  { name: '중·고등부 주일', time: '오전 11:00', place: '중·고등부실' },
]

export default function Worship() {
  return (
    <SubLayout section="교회 소개" menus={menus} title="예배 안내">
      <div>
        {/* 표어 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '40px',
            borderLeft: '4px solid #1d4ed8',
          }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '6px' }}>2026년 표어</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2040' }}>섬김과 봉사</p>
        </div>

        {/* 주요 예배 */}
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
          주요 예배
        </h3>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden', marginBottom: '36px' }}>
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              background: '#0f2040',
              padding: '12px 20px',
            }}
          >
            {['예배', '시간', '장소'].map(h => (
              <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {worshipMain.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '16px 20px',
                borderBottom: i < worshipMain.length - 1 ? '1px solid #f0f2f5' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafbfc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{w.name}</span>
              <span style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 600 }}>{w.time}</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{w.place}</span>
            </div>
          ))}
        </div>

        {/* 부서 예배 */}
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#7c3aed', borderRadius: '4px' }} />
          부서 예배
        </h3>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              background: '#4c1d95',
              padding: '12px 20px',
            }}
          >
            {['예배', '시간', '장소'].map(h => (
              <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {worshipDept.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '16px 20px',
                borderBottom: i < worshipDept.length - 1 ? '1px solid #f0f2f5' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafbfc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{w.name}</span>
              <span style={{ fontSize: '0.875rem', color: '#7c3aed', fontWeight: 600 }}>{w.time}</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{w.place}</span>
            </div>
          ))}
        </div>

        {/* 안내 문구 */}
        <div
          style={{
            marginTop: '32px',
            background: '#f6f8fb',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.8 }}>
            예배 시간은 교회 사정에 따라 변경될 수 있습니다. 자세한 내용은
            주보 또는 공지사항을 확인해 주시기 바랍니다.<br />
            문의: <a href="tel:031-429-4557" style={{ color: '#1d4ed8', fontWeight: 600 }}>031-429-4557</a>
          </p>
        </div>
      </div>
    </SubLayout>
  )
}
