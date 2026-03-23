import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '주일예배', path: '/media/sunday' },
  { label: '특별설교', path: '/media/special' },
  { label: '성가대',   path: '/media/choir' },
]

const videos = [
  { vid: 'X4nCDhXGJ3o', title: '봉헌송',                         singer: '변지은' },
  { vid: 'NyCdmGh93LI', title: '봉헌송',                         singer: '유남정' },
  { vid: 'lvgM6LRURe8', title: '봉헌송',                         singer: '유남정' },
  { vid: 'kMkM1HYK7Ls', title: '봉헌송',                         singer: '주현' },
  { vid: 'u20LnfggGDs', title: '내가 천사의 말 한다 해도 — 봉헌찬양', singer: '유남정' },
  { vid: 'HH904-ZJTZM', title: '주 너를 지키리',                  singer: '주현' },
  { vid: 'UTuIRExF_X8', title: '주의 손에 나의 손을 포개고',      singer: '유남정' },
  { vid: 'fx00MxbvqTc', title: '주 은혜가 내게 족하네',           singer: '변지은' },
  { vid: 'gD1zaLRDGwE', title: '기름부으심',                      singer: '주현' },
  { vid: 'pcDKgPXPhcQ', title: '옷자락에서 전해지는 사랑',        singer: '변지은' },
]

const albums = [
  { id: '894', img: '/images/media/choir_894.jpg', title: '성가대 앨범' },
  { id: '337', img: '/images/media/choir_337.jpg', title: '성가대 앨범' },
  { id: '75',  img: '/images/media/choir_75.jpg',  title: '성가대 앨범' },
  { id: '62',  img: '/images/media/choir_62.jpg',  title: '성가대 앨범' },
  { id: '61',  img: '/images/media/choir_61.jpg',  title: '성가대 앨범' },
]

function VideoModal({ vid, title, singer, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '860px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '4px' }}>{singer} · 신애교회 성가대</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 16px' }}>✕</button>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Choir() {
  const [modal, setModal] = useState(null)
  const [albumModal, setAlbumModal] = useState(null)

  return (
    <SubLayout section="말씀 · 찬양" menus={menus} title="성가대">

      {/* 헤더 이미지 */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0' }}>
        <img src="/images/media/media1.jpg" alt="성가대" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
      </div>

      {/* 성가대 소개 */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '14px', padding: '28px 28px', marginBottom: '40px', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '24px', background: '#059669', borderRadius: '4px' }} />
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#065f46' }}>성가대 소개</h3>
        </div>
        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#065f46', marginBottom: '16px' }}>할렐루야!</p>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, marginBottom: '16px' }}>
          신애교회 성가대는 사랑으로 하나 되고 섬김과 봉사로 세워져가는 교회를
          성가대장 및 지휘자를 중심으로 소프라노, 엘토, 테너, 베이스 파트가 조화를 이루어
          신령과 진정으로 주님을 찬양하는 성가대입니다.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.8 }}>
          하나님께서 주신 은혜에 감사하며 믿음으로 주님을 찬양 할 수 있도록
          많은 기도와 관심 부탁드립니다.
        </p>
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #a7f3d0', display: 'flex', gap: '32px' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', marginBottom: '4px' }}>성가대장</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065f46' }}>최OO 집사</p>
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', marginBottom: '4px' }}>담당 예배</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065f46' }}>주일 2부 예배 (오전 11:00)</p>
          </div>
        </div>
      </div>

      {/* 찬양 영상 */}
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
        찬양 영상
      </h3>

      {/* 대표 영상 */}
      <div
        onClick={() => setModal(videos[0])}
        style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer', marginBottom: '20px', background: '#000' }}
      >
        <img
          src={`https://i.ytimg.com/vi/${videos[0].vid}/maxresdefault.jpg`}
          alt={videos[0].title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
          onError={e => { e.target.src = `https://i.ytimg.com/vi/${videos[0].vid}/hqdefault.jpg` }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,15,40,0.85) 0%, rgba(5,15,40,0.2) 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <svg width="28" height="28" fill="#0f2040" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
          <span style={{ display: 'inline-block', background: '#059669', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', marginBottom: '10px' }}>성가대 최신</span>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>{videos[0].title}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '4px' }}>{videos[0].singer} · 신애교회 성가대</p>
        </div>
      </div>

      <div className="sermon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '48px' }}>
        {videos.slice(1).map((v, i) => (
          <div
            key={i}
            onClick={() => setModal(v)}
            style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaecf0', background: '#fff', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a1628', overflow: 'hidden' }}>
              <img
                src={`https://i.ytimg.com/vi/${v.vid}/hqdefault.jpg`}
                alt={v.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
              <div className="play-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" fill="#0f2040" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f2040', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</p>
              <p style={{ fontSize: '0.73rem', color: '#9ca3af' }}>{v.singer}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 성가대 사진 앨범 */}
      <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '36px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#059669', borderRadius: '4px' }} />
          사진 앨범
        </h3>
        <div className="sermon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {albums.map((a, i) => (
            <div
              key={i}
              onClick={() => setAlbumModal(a)}
              style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}
              onMouseEnter={e => { e.currentTarget.querySelector('.album-overlay').style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.querySelector('.album-overlay').style.opacity = '0' }}
            >
              <img src={a.img} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
              <div className="album-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(5,15,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>성가대 사진</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 영상 모달 */}
      {modal && <VideoModal {...modal} onClose={() => setModal(null)} />}

      {/* 사진 라이트박스 */}
      {albumModal && (
        <div onClick={() => setAlbumModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={albumModal.img} alt={albumModal.title} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
            <button onClick={() => setAlbumModal(null)} style={{ position: 'absolute', top: '-44px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
