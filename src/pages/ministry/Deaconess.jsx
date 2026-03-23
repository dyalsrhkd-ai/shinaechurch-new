import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회',   path: '/ministry/deaconess' },
  { label: '부서별',   path: '/ministry/dept' },
]

const groups = [
  { name: '제1여권사회', target: '고령자', meeting: '매월 셋째 주', place: '본당' },
  { name: '제2여권사회', target: '',       meeting: '매월 셋째 주', place: '본당' },
  { name: '제3여권사회', target: '',       meeting: '매월 셋째 주', place: '본당' },
]

const activities = [
  '연말연초 떡국 판매',
  '농장물 관리 협력',
  '연꽃 축제',
  '교회 화단 및 크리스마스 트리 관리',
  '김장 김치 판매',
  '설·추석 명절 (식혜 및 전)',
  '기타 먹거리 사업',
]

const photos = [
  { src: '/images/ministry/deaconess_976.jpg', label: '권사회-오곡밥과나물 준비' },
  { src: '/images/ministry/deaconess_972.jpg', label: '설명절음식준비' },
  { src: '/images/ministry/deaconess_850.jpg', label: '화단잡초뽑기' },
  { src: '/images/ministry/deaconess_797.jpg', label: '설명절 전부침' },
  { src: '/images/ministry/deaconess_500.jpg', label: '부활절 꽃꽂이와포토존' },
  { src: '/images/ministry/deaconess_418.jpg', label: '워십-찬양이 언제나 넘치면' },
  { src: '/images/ministry/deaconess_386.jpg', label: '2019년김장준비' },
  { src: '/images/ministry/deaconess_289.jpg', label: '연꽃축제2019.7.7' },
  { src: '/images/ministry/deaconess_166.jpg', label: '워십-주의친절한 팔에안기세' },
  { src: '/images/ministry/deaconess_127.jpg', label: '추수감사절' },
  { src: '/images/ministry/deaconess_126.jpg', label: '성탄추리' },
  { src: '/images/ministry/deaconess_125.jpg', label: '김장김치(2018.11.10이후)' },
  { src: '/images/ministry/deaconess_104.jpg', label: '추석맞이 백운산 산행' },
  { src: '/images/ministry/deaconess_68.jpg',  label: '권사회-백운사산행' },
  { src: '/images/ministry/deaconess_45.jpg',  label: '권사회김장배추심기' },
  { src: '/images/ministry/deaconess_43.jpg',  label: '권사회특별바자회' },
  { src: '/images/ministry/deaconess_42.jpg',  label: '연꽃축제' },
]

const PER_PAGE = 12

export default function Deaconess() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const pagePhotos = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="권사회">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p1_1.jpg" alt="권사회" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: '4px solid #d97706' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#78350f', marginBottom: '14px' }}>권사회 소개</h3>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2 }}>
          권사회는 새벽예배와 매일 저녁마다 기도로 교회가 하나님 앞에 더욱
          확장될 수 있도록 겸손한 마음으로 섬김과 봉사로 매일 매일 주님께 나아가고 있습니다.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600, marginTop: '14px' }}>
          교회의 어머니로써 항상 낮은 곳에서 섬김으로 봉사하고 있습니다.
        </p>
      </div>

      {/* 모임 안내 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#d97706', borderRadius: '4px' }} />
          권사회 모임 안내
        </h3>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', background: '#78350f', padding: '12px 20px' }}>
            {['권사회', '대상', '모임안내', '장소'].map(h => (
              <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
            ))}
          </div>
          {groups.map((g, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', padding: '14px 20px', borderBottom: i < groups.length - 1 ? '1px solid #f0f2f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{g.name}</span>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{g.target}</span>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{g.meeting}</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{g.place}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 주요 활동 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#d97706', borderRadius: '4px' }} />
          주요 활동
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {activities.map(a => (
            <div key={a} style={{ background: '#f6f8fb', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eaecf0' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 활동 사진 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#d97706', borderRadius: '4px' }} />
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
                borderColor: p === page ? '#d97706' : '#eaecf0',
                background: p === page ? '#d97706' : '#fff',
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
