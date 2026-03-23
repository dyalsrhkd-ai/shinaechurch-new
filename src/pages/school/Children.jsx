import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '아동부',    path: '/school/children' },
  { label: '중·고등부', path: '/school/youth' },
  { label: '청년부',    path: '/school/young' },
  { label: '성경대학',  path: '/school/bible' },
]

const schedule = [
  { month: '1월',  activity: '겨울성경학교' },
  { month: '2월',  activity: '졸업 및 교사헌신예배' },
  { month: '3월',  activity: '사순절특별활동' },
  { month: '4월',  activity: '부활주일연합예배' },
  { month: '5월',  activity: '어린이주일 / 야외예배' },
  { month: '6월',  activity: '여름성경학교 교사강습회' },
  { month: '7월',  activity: '여름성경학교' },
  { month: '8월',  activity: '-' },
  { month: '9월',  activity: '특별활동' },
  { month: '10월', activity: '추수감사주일 작품만들기 및 전시회' },
  { month: '11월', activity: '추수감사주일' },
  { month: '12월', activity: '성탄축하예배 / 송구영신예배' },
]

const videos = [
  { vid: 'BkGU2o6bFeY', title: '토요활동-충주라이트월드(2020.1.10)' },
  { vid: 'GeJRW1K97dE', title: '2020.1.10.파자마파티' },
  { vid: 'NycR6EKl9rk', title: '촛불워십 "소원"' },
  { vid: 'bGRU8HeCwYY', title: '사랑(무언극)' },
  { vid: 'fVMdWfPVu-k', title: '비나리-태권무' },
  { vid: 'GZe6MZyORZ8', title: '부활절연합예배 아동부2018.4.8' },
  { vid: 'T0khc5C0z_Y', title: '청년부 문화가 있는날(아동부특별순서)' },
]

const photos = [
  { src: '/images/school/children_1005.jpg', label: '교육부토요활동' },
  { src: '/images/school/children_1002.jpg', label: '아동부 생일파티' },
  { src: '/images/school/children_974.jpg',  label: '아동부밤굽기' },
  { src: '/images/school/children_968.jpg',  label: '프로그램활동(쿠키만들기)' },
  { src: '/images/school/children_966.jpg',  label: '겨울성경학교(둘째날)' },
  { src: '/images/school/children_965.jpg',  label: '아동부 겨울성경학교(첫날)' },
  { src: '/images/school/children_953.jpg',  label: '전도사님 생일파티' },
  { src: '/images/school/children_930.jpg',  label: '상우친구생일파티' },
  { src: '/images/school/children_917.jpg',  label: '아동부부장집들이' },
  { src: '/images/school/children_865.jpg',  label: '어버이주일활동' },
  { src: '/images/school/children_861.jpg',  label: '어린이주일야외예배' },
  { src: '/images/school/children_845.jpg',  label: '부활절아동부활동' },
  { src: '/images/school/children_828.jpg',  label: '4월생일잔치및새친구' },
  { src: '/images/school/children_801.jpg',  label: '사순절 말씀읽고 묵상하기' },
  { src: '/images/school/children_798.jpg',  label: '부목사님 사랑이 가득담긴 세뱃돈받기' },
  { src: '/images/school/children_794.jpg',  label: '겨울성경학교 눈썰매장' },
  { src: '/images/school/children_791.jpg',  label: '입학선물증정' },
  { src: '/images/school/children_790.jpg',  label: '전도사님과 함께' },
  { src: '/images/school/children_517.jpg',  label: 'LED카네이션케익만들기' },
  { src: '/images/school/children_415.jpg',  label: '산타의 선물' },
  { src: '/images/school/children_336.jpg',  label: '토요활동에버랜드' },
  { src: '/images/school/children_296.jpg',  label: '여름성경학교' },
  { src: '/images/school/children_283.jpg',  label: '교사헌신예배' },
  { src: '/images/school/children_232.jpg',  label: '5월토요활동' },
  { src: '/images/school/children_228.jpg',  label: '어린이날' },
  { src: '/images/school/children_198.jpg',  label: '파자마파티' },
  { src: '/images/school/children_170.jpg',  label: '크리스마스 행사' },
  { src: '/images/school/children_151.jpg',  label: '태권무' },
  { src: '/images/school/children_149.jpg',  label: '사랑 무언극' },
  { src: '/images/school/children_148.jpg',  label: '율동' },
  { src: '/images/school/children_103.jpg',  label: '해바라기 꽃길' },
  { src: '/images/school/children_91.jpg',   label: '이색성경퀴즈(토요활동)' },
  { src: '/images/school/children_74.jpg',   label: '예배후 자유시간' },
  { src: '/images/school/children_58.jpg',   label: '민속촌-토요활동' },
  { src: '/images/school/children_41.jpg',   label: '신애교회워터슬라이드' },
  { src: '/images/school/children_40.jpg',   label: '여름성경학교' },
]

const PER_PAGE = 12
const COLOR = '#16a34a'

export default function Children() {
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)
  const [playVid, setPlayVid] = useState(null)

  const totalPages = Math.ceil(photos.length / PER_PAGE)
  const pagePhotos = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교회 학교" menus={menus} title="아동부">

      {/* 대표 사진 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/user/user_p3_1.jpg" alt="아동부" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: `4px solid ${COLOR}` }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#14532d', marginBottom: '14px' }}>아동부 소개</h3>
        <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, marginBottom: '16px' }}>
          유치부, 초등학교 1~6학년 어린이들이 모여 예배하는 공동체입니다.
          여호와를 경외하는 것이 지혜와 지식의 근본임을 알게 하고, 하나님의 영광을 나타내는데
          사용 받는 친구들로 성장하기 원합니다.
          믿음 안에서 주님나라에 소망을 갖고, 하나님을 사랑하고, 이웃을 사랑하는 신앙인으로
          자라나길 소망합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: '예배시간', value: '주일 오전 11시' },
            { label: '표어',    value: '믿음. 소망. 사랑이 넘치는 어린이' },
            { label: '대상',    value: '유치부, 초등학교 1~6학년' },
            { label: '장소',    value: '초등부실' },
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
            매월 셋째 주 토요활동에 새 친구들을 초대해 여러 가지 문화체험활동과 놀이활동을 통해
            예수 안에서 함께 기쁨과 사랑을 나눔으로 복음의 기쁜 소식을 전하는 계기로 삼고,
            교회 안에서 신앙과 인성을 겸하여 양육하는데 노력하고 있습니다.
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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

      {/* 활동 사진 */}
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
