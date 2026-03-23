import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '아동부',    path: '/school/children' },
  { label: '중·고등부', path: '/school/youth' },
  { label: '청년부',    path: '/school/young' },
  { label: '성경대학',  path: '/school/bible' },
]

const schedule = [
  { month: '1월',  activity: '겨울수련회 / 민속놀이' },
  { month: '2월',  activity: '졸업 및 교사헌신예배' },
  { month: '3월',  activity: '우리지금만나 / 사순절준비' },
  { month: '4월',  activity: '부활주일연합예배' },
  { month: '5월',  activity: '전교인찬양대회' },
  { month: '6월',  activity: '심방' },
  { month: '7월',  activity: '중고등부 헌신예배' },
  { month: '8월',  activity: '하계수련회' },
  { month: '9월',  activity: '우리지금만나' },
  { month: '10월', activity: '전교인야외예배' },
  { month: '11월', activity: '추수감사절준비 / 성탄절전시회준비' },
  { month: '12월', activity: '성탄축하예배 / 송구영신예배' },
]

const videos = [
  { vid: 'cxVXuE7OBOc', title: '성경읽기미션' },
  { vid: 'eOQn61EdRgI', title: '드라이브스루배달' },
  { vid: 'MbO_70pn3bg', title: '겨울수련회첫째날(파자마파티)' },
  { vid: '7PB2Wx5HwT4', title: '겨울수련회 충주라이트월드' },
  { vid: 'IjkEIm2dvcI', title: 'Never Enough' },
  { vid: 'slOuts4IBrE', title: '14년지기의 찬양' },
  { vid: 'ctgcJtTCkkI', title: '외치세 깊은곳에서' },
  { vid: 'KNVuZTh0UPU', title: '작은것들을위한 시' },
  { vid: 'VZLneWJ7Mfw', title: '컵타' },
  { vid: 'XTvq7uuJNJQ', title: 'Because of you' },
  { vid: 'wQQmZW_ARiw', title: '오! 할렐루야(청소년음악축제)' },
  { vid: 'Sj_wfMBZlAw', title: '중·고등부를 소개합니다.' },
  { vid: 'DnDKhlHxqj0', title: 'This Christmas' },
  { vid: 'wtrQ3uVgJos', title: 'I love Jesus' },
]

const photos = [
  { src: '/images/school/youth_820.jpg', label: '사순절전시회(손바닥물감십자가)' },
  { src: '/images/school/youth_576.jpg', label: '드라이브스루 배달' },
  { src: '/images/school/youth_524.jpg', label: '만남데이트' },
  { src: '/images/school/youth_520.jpg', label: '음향기기교체' },
  { src: '/images/school/youth_518.jpg', label: '어버이날(카네이션석고방향제만들기)' },
  { src: '/images/school/youth_397.jpg', label: '중고등부교육및만남데이트' },
  { src: '/images/school/youth_382.jpg', label: '월미도테마파크(토요활동)' },
  { src: '/images/school/youth_380.jpg', label: '중고등부사진전시회' },
  { src: '/images/school/youth_315.jpg', label: '중고등부수련회' },
  { src: '/images/school/youth_309.jpg', label: '중등부 물놀이' },
  { src: '/images/school/youth_304.jpg', label: '중고등부 헌신예배' },
  { src: '/images/school/youth_284.jpg', label: '생일파티및특별활동' },
  { src: '/images/school/youth_264.jpg', label: '성막견학' },
  { src: '/images/school/youth_227.jpg', label: '부활절공연' },
  { src: '/images/school/youth_165.jpg', label: 'This Christmas' },
  { src: '/images/school/youth_154.jpg', label: 'I love Jesus' },
  { src: '/images/school/youth_146.jpg', label: '입교세례자' },
  { src: '/images/school/youth_111.jpg', label: '문화가있는날(중고공연)' },
  { src: '/images/school/youth_107.jpg', label: '문화가있는날(복고)' },
  { src: '/images/school/youth_72.jpg',  label: '중고등부 생일파티' },
  { src: '/images/school/youth_70.jpg',  label: '제주도수련회' },
  { src: '/images/school/youth_69.jpg',  label: '중고등부 토요활동' },
  { src: '/images/school/youth_55.jpg',  label: '수련회후원금마련회' },
  { src: '/images/school/youth_54.jpg',  label: '중고등부야유예배' },
]

const PER_PAGE = 12
const VID_PER_PAGE = 6
const COLOR = '#ea580c'

export default function Youth() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)
  const [vidPage, setVidPage] = useState(1)
  const [playVid, setPlayVid] = useState(null)

  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const pagePhotos = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalVidPages = Math.ceil(videos.length / VID_PER_PAGE)
  const pageVideos = videos.slice((vidPage - 1) * VID_PER_PAGE, vidPage * VID_PER_PAGE)

  return (
    <SubLayout section="교회 학교" menus={menus} title="중·고등부">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p4_1.jpg" alt="중·고등부" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: `4px solid ${COLOR}` }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#7c2d12', marginBottom: '14px' }}>중·고등부 소개</h3>
        <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, marginBottom: '16px' }}>
          중학교 1학년부터 고등학교 3학년까지 다같이 한 마음으로 모여 예배하는 공동체입니다.
          하나님의 다음 세대로 성장하는 만큼 믿음 안에서 주님만 바라보고, 주님께 기도하고
          내 이웃을 내 몸과 같이 사랑하는 성숙한 신앙인으로 자라나길 소망합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: '예배시간', value: '주일 오전 11시' },
            { label: '표어',    value: 'I love Jesus' },
            { label: '대상',    value: '중학교 1학년 ~ 고등학교 3학년' },
            { label: '장소',    value: '중,고등부 예배실' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '12px', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 700, color: COLOR, minWidth: '60px' }}>{item.label}</span>
              <span style={{ color: '#374151' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 주요 활동 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: COLOR, borderRadius: '4px' }} />
          주요 활동
        </h3>
        <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0' }}>
          <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9 }}>
            매 짝수달 셋째 주 토요활동에 새로운 친구들과 함께 여러 가지 체험활동을 통해
            예수 안에서 함께 협력되고 기쁨과 사랑을 나눔으로 사이가 더욱 돈독해지는 계기로 삼고,
            매달 생일파티를 통해 아이들과 함께 교회 안에서 교제하고 신앙을 양육하는데
            노력하고 있습니다.
          </p>
        </div>
      </div>

      {/* 연간 일정 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: COLOR, borderRadius: '4px' }} />
          연간일정
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {pageVideos.map(v => (
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
        {totalVidPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            {Array.from({ length: totalVidPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setVidPage(p)} style={{
                width: '36px', height: '36px', borderRadius: '8px', border: '1px solid',
                borderColor: p === vidPage ? COLOR : '#eaecf0',
                background: p === vidPage ? COLOR : '#fff',
                color: p === vidPage ? '#fff' : '#374151',
                fontWeight: p === vidPage ? 700 : 400,
                fontSize: '0.875rem', cursor: 'pointer'
              }}>{p}</button>
            ))}
          </div>
        )}
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
