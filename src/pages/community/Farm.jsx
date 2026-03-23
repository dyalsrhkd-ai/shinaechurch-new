import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '교회소식',   path: '/community/news' },
  { label: '주보보기',   path: '/community/bulletin' },
  { label: '행사갤러리', path: '/community/gallery' },
  { label: '행사동영상', path: '/community/video' },
  { label: '새가족소개', path: '/community/newcomer' },
  { label: '부서자료실', path: '/community/resources' },
  { label: '공지사항',   path: '/community/notice' },
  { label: '영선관리',   path: '/community/farm' },
]

const photos = [
  { src: '/images/community/farm_1003.jpg', label: '농장부헌신예배' },
  { src: '/images/community/farm_954.jpg',  label: '10.04 고구마캐기' },
  { src: '/images/community/farm_920.jpg',  label: '김장배추심는날' },
  { src: '/images/community/farm_916.jpg',  label: '쪽파와무우짱아치나눔' },
  { src: '/images/community/farm_914.jpg',  label: '농장활동' },
  { src: '/images/community/farm_908.jpg',  label: '농장활동' },
  { src: '/images/community/farm_906.jpg',  label: '농장활동' },
  { src: '/images/community/farm_904.jpg',  label: '농장활동' },
  { src: '/images/community/farm_898.jpg',  label: '농장활동' },
  { src: '/images/community/farm_896.jpg',  label: '농장활동' },
  { src: '/images/community/farm_895.jpg',  label: '농장활동' },
  { src: '/images/community/farm_884.jpg',  label: '농장활동' },
  { src: '/images/community/farm_883.jpg',  label: '농장활동' },
  { src: '/images/community/farm_882.jpg',  label: '농장활동' },
  { src: '/images/community/farm_881.jpg',  label: '농장활동' },
  { src: '/images/community/farm_854.jpg',  label: '농장활동' },
  { src: '/images/community/farm_839.jpg',  label: '농장활동' },
  { src: '/images/community/farm_827.jpg',  label: '농장활동' },
  { src: '/images/community/farm_824.jpg',  label: '농장활동' },
  { src: '/images/community/farm_817.jpg',  label: '농장활동' },
  { src: '/images/community/farm_807.jpg',  label: '농장활동' },
  { src: '/images/community/farm_806.jpg',  label: '농장활동' },
  { src: '/images/community/farm_804.jpg',  label: '사순절본당꽃꽂이' },
  { src: '/images/community/farm_523.jpg',  label: '농장활동' },
  { src: '/images/community/farm_522.jpg',  label: '농장활동' },
  { src: '/images/community/farm_488.jpg',  label: '농장활동' },
  { src: '/images/community/farm_381.jpg',  label: '농장활동' },
  { src: '/images/community/farm_297.jpg',  label: '농장활동' },
  { src: '/images/community/farm_274.jpg',  label: '농장활동' },
  { src: '/images/community/farm_89.jpg',   label: '농장활동' },
  { src: '/images/community/farm_46.jpg',   label: '농장활동' },
  { src: '/images/community/farm_44.jpg',   label: '농장-감자수확' },
]

const PER_PAGE = 12

export default function Farm() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const slice = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="영선관리">
      {/* 배너 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p7_1.jpg" alt="영선관리" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: '4px solid #16a34a' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#14532d', marginBottom: '14px' }}>영선관리 소개</h3>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, marginBottom: '12px' }}>
          신애교회 연합남전도회에서 관리하는 교회 농장입니다. 농장에서는 채소, 마늘, 고구마, 상추 등
          다양한 작물을 재배하여 수확한 후 교인들과 이웃에게 나누어 드리고 있습니다.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2 }}>
          또한 연못에는 미꾸라지, 붕어, 잉어, 뱀장어 등을 방류하여 교인들과 인근 마을 주민들의
          휴식처로 활용하고 있습니다.
        </p>
      </div>

      {/* 담당 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#16a34a', borderRadius: '4px' }} />
          담당
        </h3>
        <div style={{ background: '#f6f8fb', borderRadius: '10px', padding: '14px 20px', border: '1px solid #eaecf0', display: 'inline-block' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f2040' }}>김강석 장로</p>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>연합남전도회 관리</p>
        </div>
      </div>

      {/* 활동 사진 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#16a34a', borderRadius: '4px' }} />
          활동 사진
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {photos.length}장</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {slice.map((p, i) => (
            <div key={i} onClick={() => setLightbox((page - 1) * PER_PAGE + i)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}>
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
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => { setPage(p); setLightbox(null) }} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid', borderColor: p === page ? '#16a34a' : '#e5e7eb', background: p === page ? '#16a34a' : '#fff', color: p === page ? '#fff' : '#374151', fontWeight: p === page ? 700 : 400, fontSize: '0.85rem', cursor: 'pointer' }}>{p}</button>
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
