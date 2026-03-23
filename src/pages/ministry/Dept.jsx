import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회',   path: '/ministry/deaconess' },
  { label: '부서별',   path: '/ministry/dept' },
]

const depts = [
  {
    name: '전도부',
    color: '#1d4ed8',
    verse: '\"오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라\" (행 1:8)',
    schedule: [
      { time: '매주 목요일 10:00 ~ 11:00', activity: '거리 전도 대회', place: '다목적체육관 앞' },
    ],
    desc: '\"가족전도프로젝트\" 진행을 통해 온 가족이 함께 복음을 전하는 사역을 이어가고 있습니다.',
  },
  {
    name: '제직회',
    color: '#7c3aed',
    verse: '\"누구든지 첫째가 되고자 하면 뭇 사람의 끝이 되며 뭇 사람을 섬기는 자가 되어야 하리라\" (막 9:35)',
    schedule: [],
    desc: '예수님께서는 하나님 자신임에도 불구하고 낮고 천한 사람들을 돌보고 치료하고 위로하는 섬김의 삶을 사셨습니다. 신애교회 제직회는 \"섬김과 봉사\"라는 표어 아래 주님을 본받아 교회와 이웃을 섬기고 있습니다.',
  },
  {
    name: '재정부',
    color: '#059669',
    verse: '\"각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라\" (고후 9:7)',
    schedule: [],
    desc: '교회 재정의 투명하고 건강한 관리를 위해 섬기는 부서입니다. 별관 이레벨 1층 재정부실에서 운영됩니다.',
  },
  {
    name: '새신자부',
    color: '#0369a1',
    verse: '\"그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고\" (마 28:19)',
    schedule: [],
    desc: '새로 교회를 찾은 성도님들을 따뜻하게 환영하고 교회에 잘 정착할 수 있도록 돕는 부서입니다. 별관 이레벨 1층 새신자반에서 운영됩니다.',
  },
]

const photos = [
  { src: '/images/ministry/dept_1006.jpg', label: '농장부비닐작업및감자씨심기' },
  { src: '/images/ministry/dept_981.jpg',  label: '구역장모임공과공부(매주수요일)' },
  { src: '/images/ministry/dept_978.jpg',  label: '매주목요일전도활동' },
  { src: '/images/ministry/dept_977.jpg',  label: '아동부왕곡천전도활동' },
  { src: '/images/ministry/dept_967.jpg',  label: '전도부단합대' },
  { src: '/images/ministry/dept_927.jpg',  label: '식당에서 만든 먹거리들' },
  { src: '/images/ministry/dept_921.jpg',  label: '중보기도팀 회의 후 점심만찬' },
  { src: '/images/ministry/dept_919.jpg',  label: '새가족수료식' },
  { src: '/images/ministry/dept_918.jpg',  label: '전도부헌신예배' },
  { src: '/images/ministry/dept_897.jpg',  label: '6월달전도부활동' },
  { src: '/images/ministry/dept_857.jpg',  label: '구역성장예배' },
  { src: '/images/ministry/dept_856.jpg',  label: '전도부미용봉사 신애헤어방' },
  { src: '/images/ministry/dept_855.jpg',  label: '가족전도프로젝트준비' },
  { src: '/images/ministry/dept_831.jpg',  label: '4월전교인전도대회' },
  { src: '/images/ministry/dept_796.jpg',  label: '전도부 단합대회(화천)' },
  { src: '/images/ministry/dept_793.jpg',  label: '전도부화천심방' },
  { src: '/images/ministry/dept_441.jpg',  label: '2020.1.18직분자교육' },
  { src: '/images/ministry/dept_421.jpg',  label: '흥부와놀부의성탄절' },
  { src: '/images/ministry/dept_404.jpg',  label: '집사미용봉사' },
  { src: '/images/ministry/dept_393.jpg',  label: '전도부국화빵개시' },
  { src: '/images/ministry/dept_275.jpg',  label: '제직회헌신예배(2019.6.23)' },
  { src: '/images/ministry/dept_260.jpg',  label: '75세이상 어르신들야유회(전도부)' },
  { src: '/images/ministry/dept_65.jpg',   label: '제직회-25인승번호판(2018.8.31)' },
  { src: '/images/ministry/dept_53.jpg',   label: '전도부(75세어르신봄나들이)' },
  { src: '/images/ministry/dept_52.jpg',   label: '전도부(토요전도활동)' },
  { src: '/images/ministry/dept_49.jpg',   label: '제직회(패션쇼및바자회)' },
]

const PER_PAGE = 12

export default function Dept() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const pagePhotos = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="부서별">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p2_1_1.jpg" alt="부서별" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 부서 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
        {depts.map(dept => (
          <div key={dept.name} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>
            {/* 헤더 */}
            <div style={{ background: dept.color, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{dept.name}</h3>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 성경 말씀 */}
              <div style={{ background: '#f6f8fb', borderRadius: '10px', padding: '14px 16px', borderLeft: `3px solid ${dept.color}` }}>
                <p style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.8, fontStyle: 'italic' }}>{dept.verse}</p>
              </div>

              {/* 설명 */}
              <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9 }}>{dept.desc}</p>

              {/* 모임 일정 */}
              {dept.schedule.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>모임 일정</p>
                  {dept.schedule.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f6f8fb', borderRadius: '8px', padding: '12px 16px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dept.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>{s.time}</span>
                      <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{s.activity}</span>
                      {s.place && <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 'auto' }}>{s.place}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 활동 사진 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
          활동 사진
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {photos.length}장</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {pagePhotos.map((p, i) => {
            const globalIdx = (page - 1) * PER_PAGE + i
            return (
              <div key={globalIdx} onClick={() => setLightbox(globalIdx)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={p.src} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: '8px 10px', background: '#fff' }}>
                  <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: '36px', height: '36px', borderRadius: '8px', border: '1px solid',
                borderColor: p === page ? '#1d4ed8' : '#eaecf0',
                background: p === page ? '#1d4ed8' : '#fff',
                color: p === page ? '#fff' : '#374151',
                fontWeight: p === page ? 700 : 400,
                fontSize: '0.875rem', cursor: 'pointer'
              }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={photos[lightbox].src} alt="" style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>{photos[lightbox].label}</p>
            {lightbox > 0 && <button onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }} style={{ position: 'absolute', left: '-48px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>‹</button>}
            {lightbox < photos.length - 1 && <button onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }} style={{ position: 'absolute', right: '-48px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>›</button>}
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
