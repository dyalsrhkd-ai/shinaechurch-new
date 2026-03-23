import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '아동부',    path: '/school/children' },
  { label: '중·고등부', path: '/school/youth' },
  { label: '청년부',    path: '/school/young' },
  { label: '성경대학',  path: '/school/bible' },
]

const officers = [
  { role: '회장',    name: '김*석 장로' },
  { role: '부회장',  name: '이*연 안수집사' },
  { role: '총무·회계', name: '윤*자 안수집사' },
]

const lectures = [
  { no: '제1강의', lecturer: '우용녀 목사', desc: '신애교회 담임목사' },
  { no: '제2강의', lecturer: '우용석 목사', desc: '군산 진리있는교회 담임목사' },
]

const photos = [
  { src: '/images/school/bible_394.jpg', label: '2019년 2학기 종강예배' },
  { src: '/images/school/bible_229.jpg', label: '성막견학' },
  { src: '/images/school/bible_96.jpg',  label: '운두령횟집 식사' },
  { src: '/images/school/bible_95.jpg',  label: '강원도양떼목장' },
  { src: '/images/school/bible_94.jpg',  label: '강원도경포해수욕장' },
  { src: '/images/school/bible_93.jpg',  label: '2018 2학기 개강예배(장학생들)' },
  { src: '/images/school/bible_23.jpg',  label: '성경대학단합대회' },
  { src: '/images/school/bible_22.jpg',  label: '2018.5.15.스승의날' },
  { src: '/images/school/bible_21.jpg',  label: '성경대학MT' },
  { src: '/images/school/bible_18.jpg',  label: '성경대학 제1기 졸업 및 수료식' },
]

export default function Bible() {
  const [lightbox, setLightbox] = useState(null)

  return (
    <SubLayout section="교회 학교" menus={menus} title="성경대학">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p6_1.jpg" alt="성경대학" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: '4px solid #0284c7' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0c4a6e', marginBottom: '14px' }}>성경대학 소개</h3>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, marginBottom: '16px' }}>
          성경공부를 통해 하나님의 말씀을 배우고 믿음으로 하나 되는 것과 봉사자들을
          발굴하는 계기가 되고자 합니다. 신애교회 성도와 성경공부를 원하시는 많은 분들이
          참여하여 성경대학에서 배우는 말씀 가운데 주님 안에서 지혜와 지식을 얻는
          기회가 되시기 바랍니다.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#0284c7', fontWeight: 600 }}>
          신입생 여러분 환영합니다.
        </p>
      </div>

      {/* 강의 안내 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#0284c7', borderRadius: '4px' }} />
          강의 안내
        </h3>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          {[
            { label: '강의시간', value: '매주 화요일 19:30 ~ 22:00' },
            { label: '장소',     value: '본당' },
            { label: '대상',     value: '신애교회 성도 (성경공부를 원하시는 모든 분 참여 가능)' },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{item.label}</span>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* 강사진 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lectures.map(l => (
            <div key={l.no} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f6f8fb', borderRadius: '10px', padding: '14px 20px', border: '1px solid #eaecf0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '3px 10px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>{l.no}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f2040' }}>{l.lecturer}</p>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 임원 현황 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#0284c7', borderRadius: '4px' }} />
          임원 현황
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {officers.map(o => (
            <div key={o.role} style={{ background: '#0f2040', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{o.role}</p>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{o.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 활동 사진 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#0284c7', borderRadius: '4px' }} />
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
