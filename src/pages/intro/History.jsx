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

const eras = [
  {
    period: '1995 — 2010',
    color: '#1d4ed8',
    events: [
      { date: '1995.11.30', desc: '신애교회 창립예배' },
      { date: '1998.03.26', desc: '우용녀 목사 안수' },
      { date: '1998.11.01', desc: '신애교회 헌당예배' },
      { date: '1999.04.17', desc: '장로 장립, 권사 취임예배 (장로: 정재복, 권사: 황금옥, 김영옥)' },
      { date: '2001.11.24', desc: '김영단 전도사 임명' },
      { date: '2002.01.26', desc: '장로 장립·권사 취임예배 (장로: 표은희, 권사 다수)' },
      { date: '2002.10.30', desc: '우용녀 목사 노회장 취임예배' },
      { date: '2004.04.18', desc: '목사 안수·집사 안수·권사 취임예배' },
      { date: '2005.05.08', desc: '교회 명칭을 "제일신애교회"로 변경' },
      { date: '2006.10.28', desc: '장로·안수집사 임직 및 권사 취임예배' },
      { date: '2009.10.04', desc: '김해림 전도사 임명' },
      { date: '2010.05.22', desc: '경기도 안양시 호계동 성전 이전 입당 및 임직예배' },
    ],
  },
  {
    period: '2011 — 2020',
    color: '#0369a1',
    events: [
      { date: '2012.05.13', desc: '유영희 전도사 임명' },
      { date: '2012.11.11', desc: '이평자 전도사 은퇴' },
      { date: '2014.03.29', desc: '목사 안수 및 임직예배 (목사: 우용미)' },
      { date: '2015.01.20', desc: '헤필드대학교로부터 담임목사 명예박사학위 수여' },
      { date: '2015.03.03', desc: '제일신애교회 성경대학 개설' },
      { date: '2015.12.04', desc: '호계구사거리 교육관 이전 예배' },
      { date: '2016.04.05', desc: '경기도 의왕시 왕곡동 83-10 성전 부지 구입' },
      { date: '2016.06.23', desc: '의왕시 왕곡동 주차장 부지 구입' },
      { date: '2016.11.15', desc: '성전 건축 착공' },
      { date: '2017.04.01', desc: '제일신애교회 → 신애교회로 명칭 변경 및 주소 이전' },
      { date: '2017.06.10', desc: '성전 입당 및 임직예배 (장로·안수집사·권사 다수 임직)' },
      { date: '2019.04.25', desc: '연합성총회에서 백석총회로 소속 변경' },
      { date: '2019.06.30', desc: '교육관 개관식 및 담장 설치' },
      { date: '2020.02.08', desc: '식당 뒤 전답 매입' },
    ],
  },
  {
    period: '2021 — 현재',
    color: '#7c3aed',
    events: [
      { date: '2021.03.02', desc: '의왕시 별묘길3 이레벨빌라 교육관으로 소유권 이전' },
      { date: '2021.03.14', desc: '장로·권사 은퇴식 및 권사 임직식' },
      { date: '2022.04.18', desc: '김해림 강도사 인허' },
      { date: '2022.06.05', desc: '상반기 임시총회 — 강도사·전도사 임명' },
      { date: '2023.02.19', desc: '각 부서별실 개설 (재정부·전도부·새신자반 등)' },
      { date: '2023.10.17', desc: '김해림 목사 임직예배' },
      { date: '2024.06~',   desc: '농장부 지역사회 어려운 이웃에게 농작물 후원' },
      { date: '2024.07~',   desc: '장학회 고천중·우성고등학교 장학금 지원' },
      { date: '2025.02',    desc: '인도네시아 GPDI 베데스다교회 건축 기공식' },
      { date: '2025.11',    desc: '인도네시아 베데스다교회 완공예배' },
    ],
  },
]

export default function History() {
  return (
    <SubLayout section="교회 소개" menus={menus} title="교회 연혁">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {eras.map(era => (
          <div key={era.period}>
            {/* 시대 구분 헤더 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div style={{ width: '4px', height: '28px', background: era.color, borderRadius: '4px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f2040' }}>{era.period}</h3>
            </div>

            {/* 타임라인 */}
            <div style={{ borderLeft: `2px solid ${era.color}20`, marginLeft: '8px', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {era.events.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    paddingBottom: i < era.events.length - 1 ? '20px' : '0',
                  }}
                >
                  {/* 점 */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-36px',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: era.color,
                      border: '2px solid #fff',
                      boxShadow: `0 0 0 2px ${era.color}40`,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: era.color,
                        fontFamily: 'monospace',
                        paddingTop: '2px',
                        minWidth: '90px',
                      }}
                    >
                      {ev.date}
                    </span>
                    <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.65 }}>{ev.desc}</p>
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
