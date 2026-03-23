import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회',   path: '/ministry/deaconess' },
  { label: '부서별',   path: '/ministry/dept' },
]

const members = {
  임원: [
    { role: '회장',     name: '권OO일' },
    { role: '총무·서기', name: '이OO우' },
    { role: '회계',     name: '신OO식' },
  ],
  회원: ['윤OO균', '김OO현', '최OO근', '백OO경', '김OO엽', '서OO원', '권OO일', '권OO준', '신OO식'],
}

const photos = [
  { src: '/images/ministry/men_980.jpg', label: '밭밑거름뿌리기작업' },
  { src: '/images/ministry/men_975.jpg', label: '전교인윷놀이한마당(밤굽기)' },
  { src: '/images/ministry/men_955.jpg', label: '기도실작업과정' },
  { src: '/images/ministry/men_829.jpg', label: '남전도헌신예배' },
  { src: '/images/ministry/men_339.jpg', label: '제7회전교인체육대회' },
  { src: '/images/ministry/men_334.jpg', label: '2남전도헌신예배' },
  { src: '/images/ministry/men_270.jpg', label: '교육관 담장공사(2019.06.19)' },
  { src: '/images/ministry/men_231.jpg', label: '전교인찬양대회' },
  { src: '/images/ministry/men_157.jpg', label: '연합남전도회식' },
  { src: '/images/ministry/men_152.jpg', label: '찬양' },
  { src: '/images/ministry/men_130.jpg', label: '연합남전도회 고기파티(2018.11.3)' },
  { src: '/images/ministry/men_71.jpg',  label: '연합남전도회-헌신예배준비' },
  { src: '/images/ministry/men_63.jpg',  label: '남전도-섬김과 봉사의 모습' },
  { src: '/images/ministry/men_36.jpg',  label: '2018.5.13전교인찬양대회' },
]

const PER_PAGE = 12

export default function Men() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const pagePhotos = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="남전도회">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user1.jpg" alt="남전도회" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: '4px solid #1d4ed8' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3a5f', marginBottom: '14px' }}>남전도회 소개</h3>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2 }}>
          연합남전도회는 하나님을 경외하고 주님의 교회를 섬기는데 그 목적이 있습니다.
          교회 행사인 가족찬양대회와 전교인 체육대회를 통해 친교를 도모하고,
          농장에서 나오는 작물을 함께 나누며, 연못관리에 집중하여 연꽃과 함께
          왕곡마을을 찾는 이웃들에게 친환경 쉼터를 제공함으로 함께 나누는 교회가
          되도록 관리에 힘쓰고 있습니다. 그 외에 주님이 기뻐하시는 일이라면
          스스로 봉사하는 기관입니다.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 600, marginTop: '14px' }}>
          많이 참여하시고 기도로 협력해 주시면 감사하겠습니다.
        </p>
      </div>

      {/* 주요 활동 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
          주요 활동
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { icon: '♪', label: '가족찬양대회',         desc: '교인 가족들이 함께하는 찬양 행사' },
            { icon: '●', label: '전교인 체육대회',       desc: '친교를 위한 연례 체육 행사' },
            { icon: '▲', label: '농장 작물 나눔',        desc: '교회 농장 작물을 함께 나눔' },
            { icon: '◆', label: '연못 관리·연꽃 축제',   desc: '왕곡마을 친환경 쉼터 제공' },
          ].map(a => (
            <div key={a.label} style={{ background: '#f6f8fb', borderRadius: '12px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start', border: '1px solid #eaecf0' }}>
              <span style={{ fontSize: '1rem', color: '#1d4ed8', marginTop: '2px' }}>{a.icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '4px' }}>{a.label}</p>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.6 }}>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 임원 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
          임원 현황
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {members.임원.map(m => (
            <div key={m.role} style={{ background: '#0f2040', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{m.role}</p>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{m.name}</p>
            </div>
          ))}
        </div>
        <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '16px 20px', border: '1px solid #eaecf0' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '10px' }}>회원</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {members.회원.map(n => (
              <span key={n} style={{ fontSize: '0.82rem', color: '#374151', background: '#fff', border: '1px solid #eaecf0', padding: '4px 12px', borderRadius: '9999px' }}>{n}</span>
            ))}
          </div>
        </div>
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

        {/* 페이지네이션 */}
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

      {/* 라이트박스 */}
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
