import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회',   path: '/ministry/deaconess' },
  { label: '부서별',   path: '/ministry/dept' },
]

const groups = [
  { name: '제1여전도회', target: '고령자',           meeting: '매월 둘째 주 월례회', place: '본당' },
  { name: '제2여전도회', target: '50대 이후',        meeting: '매월 둘째 주 월례회', place: '본당' },
  { name: '제3여전도회', target: '40대 이후',        meeting: '매월 둘째 주 월례회', place: '본당' },
  { name: '제4여전도회', target: '권찰 및 30대 이후', meeting: '매월 둘째 주 월례회', place: '본당' },
]

const activities = [
  '설·추석 명절 사업 (인삼 판매)',
  '만두 판매 (연 2회 이상)',
  '교회 화단 관리',
  '농작물 관리 협력',
  '기타 먹거리 판매 사업',
]

const photos = [
  { src: '/images/ministry/women_909.jpg', label: '패션후르츠에이드' },
  { src: '/images/ministry/women_893.jpg', label: '여전도회-패션후르츠' },
  { src: '/images/ministry/women_419.jpg', label: '천사들의 노래가' },
  { src: '/images/ministry/women_396.jpg', label: '연합여전도(만두)' },
  { src: '/images/ministry/women_150.jpg', label: '내영혼이 은총입어(워십팀)' },
  { src: '/images/ministry/women_67.jpg',  label: '여전도회-백운사산행' },
  { src: '/images/ministry/women_66.jpg',  label: '여전도-벼룩시장' },
  { src: '/images/ministry/women_64.jpg',  label: '연합여전도회 추석명절선물판매' },
  { src: '/images/ministry/women_37.jpg',  label: '군산진리가있는교회방문' },
]

export default function Women() {
  const [lightbox, setLightbox] = useState(null)

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="여전도회">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user2.jpg" alt="여전도회" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: '4px solid #db2777' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#831843', marginBottom: '14px' }}>여전도회 소개</h3>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2 }}>
          여전도회는 임원들과 회원들이 연합하여 봉사하고, 맡은 자리에서 열심히
          기도로 주님 안에서 감사하며, 영광 돌리는 신애교회 여전도회입니다.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#db2777', fontWeight: 600, marginTop: '14px' }}>
          많은 관심과 사랑으로 함께 여전도 회원으로 활동해 주세요.
        </p>
      </div>

      {/* 모임 안내 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#db2777', borderRadius: '4px' }} />
          모임 안내
        </h3>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', background: '#831843', padding: '12px 20px' }}>
            {['전도회', '대상', '모임안내', '장소'].map(h => (
              <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>{h}</span>
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
          <div style={{ width: '4px', height: '20px', background: '#db2777', borderRadius: '4px' }} />
          주요 활동
        </h3>
        <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map(a => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#db2777', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 활동 사진 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#db2777', borderRadius: '4px' }} />
          활동 사진
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {photos.length}장</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {photos.map((p, i) => (
            <div key={i} onClick={() => setLightbox(i)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}>
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
