import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '아동부',    path: '/school/children' },
  { label: '중·고등부', path: '/school/youth' },
  { label: '청년부',    path: '/school/young' },
  { label: '성경대학',  path: '/school/bible' },
]

const schedule = [
  { month: '1월',  activity: '전교인 민속놀이' },
  { month: '2월',  activity: '졸업예배 및 교사헌신예배' },
  { month: '3월',  activity: '부활절전시회준비' },
  { month: '4월',  activity: '부활주일' },
  { month: '5월',  activity: '전교인찬양대회' },
  { month: '6월',  activity: '교육부 연합헌신예배' },
  { month: '7월',  activity: '교육부연합수련회' },
  { month: '8월',  activity: '생일파티' },
  { month: '9월',  activity: '생일파티' },
  { month: '10월', activity: '전교인체육대회 / 감사일기노트시작' },
  { month: '11월', activity: '추수감사절준비' },
  { month: '12월', activity: '성탄절데코설치 / 정기총회준비' },
]

const videos = [
  { vid: 'M78mK_UUVQI', title: 'I love Jesus' },
  { vid: 'gZu_QixE194', title: '믿음의 달인' },
  { vid: 'dhVtuZWNz2o', title: '2019.8. 청년부 산티아고 순례길' },
  { vid: 'cFFfcZD2jwg', title: 'Joy to the World 워십' },
]

const photos = [
  { src: '/images/school/young_922.jpg', label: '팥빙수. 교육부가 쏩니다' },
  { src: '/images/school/young_892.jpg', label: '교육부 아이스크림 파티' },
  { src: '/images/school/young_891.jpg', label: '교육부 연합헌신예배' },
  { src: '/images/school/young_462.jpg', label: '청년부(스키장)' },
  { src: '/images/school/young_461.jpg', label: '청년부단합회' },
  { src: '/images/school/young_338.jpg', label: '문화가있는 날' },
  { src: '/images/school/young_335.jpg', label: '전도사송별회' },
  { src: '/images/school/young_319.jpg', label: '산티아고순례길' },
  { src: '/images/school/young_305.jpg', label: '청년부헌신예배' },
  { src: '/images/school/young_184.jpg', label: '청년부 스키장' },
  { src: '/images/school/young_168.jpg', label: '성탄예배사회와 워십' },
  { src: '/images/school/young_158.jpg', label: '성탄포토존' },
  { src: '/images/school/young_153.jpg', label: '고마워 고마워 찬양' },
  { src: '/images/school/young_110.jpg', label: '문화가있는날(청년부공연)' },
  { src: '/images/school/young_108.jpg', label: '문화가있는날(불량식품)' },
  { src: '/images/school/young_97.jpg',  label: '의왕시 찬양제관람' },
  { src: '/images/school/young_59.jpg',  label: '청년부 문화가있는날(꽃)' },
  { src: '/images/school/young_57.jpg',  label: '청년부찬양인도' },
  { src: '/images/school/young_56.jpg',  label: '전교인 성경퀴즈대회' },
]

const PER_PAGE = 12
const COLOR = '#9333ea'

export default function Young() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)
  const [playVid, setPlayVid] = useState(null)

  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const pagePhotos = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교회 학교" menus={menus} title="청년부">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p5_1.jpg" alt="청년부" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: `4px solid ${COLOR}` }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#581c87', marginBottom: '14px' }}>청년부 소개</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: '예배시간', value: '주일 오전 11시' },
            { label: '표어',     value: 'I love Jesus' },
            { label: '대상',     value: '20살 ~ 결혼하기 전' },
            { label: '장소',     value: '청년부 예배실' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '12px', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 700, color: COLOR, minWidth: '60px' }}>{item.label}</span>
              <span style={{ color: '#374151' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9 }}>
          20대부터 결혼하기 전까지 청년으로써 하나님께 함께 예배드리는 공동체입니다.
          하나님의 다음 세대로 성장하는 만큼 믿음 안에서 주님만 바라보고, 주님께 기도하고
          내 이웃을 내몸과 같이 사랑하는 성숙한 신앙인으로 주의 영으로 충만한 청년부가
          되도록 노력하고 있습니다.
        </p>
      </div>

      {/* 주요 활동 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: COLOR, borderRadius: '4px' }} />
          주요 활동
        </h3>
        <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0', marginBottom: '12px' }}>
          <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9 }}>
            매달 첫째 주 주일 2시 예배와 교회 부흥회 때 찬양인도를 함으로써 주를 입술로 고백하는
            은혜로운 찬양인도를 하고, 각 청년부 주최로 이루어진 전교인성경퀴즈대회,
            문화가 있는 날 행사를 통해 성경에 대해 공부하고, 하나님께 영광 돌리는
            귀한 재능을 양육합니다.
          </p>
        </div>
      </div>

      {/* 연간 일정 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: COLOR, borderRadius: '4px' }} />
          2025년도 연간일정
        </h3>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {schedule.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '56px 1fr',
                padding: '12px 16px',
                borderBottom: i < schedule.length - 2 ? '1px solid #f0f2f5' : 'none',
                borderRight: i % 2 === 0 ? '1px solid #f0f2f5' : 'none',
                background: i % 4 < 2 ? '#fff' : '#fafbfc'
              }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: COLOR }}>{s.month}</span>
                <span style={{ fontSize: '0.82rem', color: '#374151' }}>{s.activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 행사 동영상 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: COLOR, borderRadius: '4px' }} />
          행사 동영상
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {videos.length}개</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {videos.map(v => (
            <div key={v.vid} onClick={() => setPlayVid(v)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0', background: '#fff' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                <img src={`https://img.youtube.com/vi/${v.vid}/mqdefault.jpg`} alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.target.style.opacity = '1'}
                  onMouseLeave={e => e.target.style.opacity = '0.85'}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(220,38,38,0.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '1.1rem', marginLeft: '3px' }}>▶</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 행사 사진 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: COLOR, borderRadius: '4px' }} />
          행사 사진
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
                borderColor: p === page ? COLOR : '#eaecf0',
                background: p === page ? COLOR : '#fff',
                color: p === page ? '#fff' : '#374151',
                fontWeight: p === page ? 700 : 400,
                fontSize: '0.875rem', cursor: 'pointer'
              }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* 동영상 모달 */}
      {playVid && (
        <div onClick={() => setPlayVid(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '860px', width: '100%' }}>
            <button onClick={() => setPlayVid(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            <div style={{ aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube.com/embed/${playVid.vid}?autoplay=1`}
                title={playVid.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>{playVid.title}</p>
          </div>
        </div>
      )}

      {/* 사진 라이트박스 */}
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
