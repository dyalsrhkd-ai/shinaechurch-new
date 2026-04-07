import { useState, useEffect } from 'react'
import { collection, doc, getDoc, getDocs, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { useSettings } from '../contexts/SettingsContext'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import ImageWithFallback from '../components/ui/ImageWithFallback'
import MapPlaceholderNotice from '../components/ui/MapPlaceholderNotice'
import { SkeletonBlock } from '../components/ui/Skeleton'

/* ────────── 데이터 ────────── */

const defaultSlides = [
  { img: '/images/main1.jpg', title: '하나님의 은혜 안에서\n함께 자라는 교회', sub: '신애교회가 당신을 환영합니다' },
  { img: '/images/main2.jpg', title: '말씀 위에\n세워진 공동체',               sub: '매주일 은혜로운 예배로 초대합니다' },
  { img: '/images/main3.jpg', title: '사랑으로\n섬기는 신애교회',              sub: '함께 성장하고 나누는 공동체' },
  { img: '/images/main4.jpg', title: '온 가족이\n함께하는 교회',               sub: '모든 세대를 품는 신앙 공동체' },
]

const quickCards = [
  { ko: '주일예배',    en: 'Sunday Service',  to: '/media/sunday' },
  { ko: '실시간 설교영상', en: 'Live Sermon', to: '/media/live/main' },
  { ko: '교회소식',    en: 'Church News',     to: '/community/news' },
  { ko: '예배 안내',   en: 'Worship Guide',   to: '/intro/worship' },
  { ko: '주보보기',    en: 'Bulletin',        to: '/community/bulletin' },
  { ko: '행사갤러리',  en: 'Gallery',         to: '/community/gallery' },
  { ko: '오시는길',    en: 'Location',        to: '/intro/location' },
]

const wordPraiseItems = [
  {
    vid: 'aRKmAyzEVHY',
    thumb: 'https://img.youtube.com/vi/aRKmAyzEVHY/hqdefault.jpg',
    category: '주일예배',
    title: '벽을 깨는 치유',
    meta: '눅 17:11-19',
    to: '/media/sunday',
  },
  {
    vid: 'EYIet64lGy0',
    thumb: 'https://img.youtube.com/vi/EYIet64lGy0/hqdefault.jpg',
    category: '특별설교',
    title: '특별설교',
    meta: '창 3:1-10',
    to: '/media/special',
  },
  {
    vid: 'X4nCDhXGJ3o',
    thumb: 'https://img.youtube.com/vi/X4nCDhXGJ3o/hqdefault.jpg',
    category: '성가대',
    title: '봉헌송',
    meta: '변지은',
    to: '/media/choir',
  },
]

const wordPraiseBadgeStyles = {
  주일예배: { background: '#dc2626', color: '#fff' },
  특별설교: { background: '#7c3aed', color: '#fff' },
  성가대: { background: '#16a34a', color: '#fff' },
}

function formatNoticeDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}.${day}`
}


const depts = [
  { label: '아동부',    sub: '어린이를 위한 신앙교육',   img: '/images/main1.jpg',           to: '/school/children' },
  { label: '중·고등부', sub: '청소년 신앙 성장 공동체', img: '/images/main2.jpg',           to: '/school/youth' },
  { label: '청년부',    sub: '청년들의 역동적인 신앙',   img: '/images/main3.jpg',           to: '/school/young' },
  { label: '남전도회',  sub: '형제들이 함께하는 사역',   img: '/images/etc/corp6.jpg',       to: '/ministry/men' },
]

/* ────────── 메인 ────────── */

export default function Home() {
  const { address, phone, email } = useSettings()
  const [slides, setSlides] = useState(null)
  const [notices, setNotices] = useState([])
  const [openNotice, setOpenNotice] = useState(null)
  const [bulletins, setBulletins] = useState([])
  const [locationData, setLocationData] = useState(null)
  const [noticesLoading, setNoticesLoading] = useState(true)
  const [bulletinsLoading, setBulletinsLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem('mainSlides')
    if (cached) {
      try { setSlides(JSON.parse(cached)) } catch {}
    }
    const q = query(collection(db, 'slides'), orderBy('order'))
    getDocs(q).then(snap => {
      const active = snap.docs.map(d => d.data()).filter(d => d.active !== false)
      const result = active.length > 0
        ? active.map(d => ({ img: d.imgUrl, title: d.title, sub: d.sub }))
        : defaultSlides
      sessionStorage.setItem('mainSlides', JSON.stringify(result))
      setSlides(result)
    }).catch(() => {
      if (!sessionStorage.getItem('mainSlides')) setSlides(defaultSlides)
    })

    // 공지사항 최신 6개
    const cachedNotices = sessionStorage.getItem('mainNotices')
    if (cachedNotices) {
      try { setNotices(JSON.parse(cachedNotices)) } catch {}
    }
    const nq = query(collection(db, 'notices'), orderBy('date', 'desc'), limit(6))
    getDocs(nq).then(snap => {
      const result = snap.docs.map(d => {
        const data = d.data()
        return { id: d.id, title: data.title, badge: data.badge, date: formatNoticeDate(data.date), content: data.content || '', fileUrl: data.fileUrl || null, fileName: data.fileName || null }
      })
      sessionStorage.setItem('mainNotices', JSON.stringify(result))
      setNotices(result)
    }).catch(() => {}).finally(() => setNoticesLoading(false))

    // 주보 최신 5개
    const cachedBulletins = sessionStorage.getItem('mainBulletins')
    if (cachedBulletins) {
      try { setBulletins(JSON.parse(cachedBulletins)) } catch {}
    }
    getDocs(query(collection(db, 'bulletins'), orderBy('date', 'desc'), limit(5))).then(snap => {
      const result = snap.docs.map(d => {
        const data = d.data()
        return { id: d.id, title: data.title, fileUrl: data.fileUrl, fileType: data.fileType || 'hwp' }
      })
      sessionStorage.setItem('mainBulletins', JSON.stringify(result))
      setBulletins(result)
    }).catch(() => {}).finally(() => setBulletinsLoading(false))

    getDoc(doc(db, 'location', 'main'))
      .then(snap => {
        if (snap.exists()) setLocationData(snap.data())
      })
      .catch(console.error)
  }, [])

  return (
    <div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 1  HERO + LAYER CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative" style={{ background: '#0a1628' }}>

        {/* 슬라이더 */}
        {!slides && (
          <div style={{ height: 'clamp(520px, 65vw, 780px)', background: '#0a1628', padding: '0 clamp(2rem, 8vw, 8rem)', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '560px', display: 'grid', gap: '16px' }}>
              <SkeletonBlock width="180px" height="18px" radius="999px" style={{ background: 'linear-gradient(90deg, rgba(148,163,184,0.24) 0%, rgba(255,255,255,0.22) 50%, rgba(148,163,184,0.24) 100%)' }} />
              <SkeletonBlock width="100%" height="56px" style={{ background: 'linear-gradient(90deg, rgba(148,163,184,0.28) 0%, rgba(255,255,255,0.24) 50%, rgba(148,163,184,0.28) 100%)' }} />
              <SkeletonBlock width="82%" height="56px" style={{ background: 'linear-gradient(90deg, rgba(148,163,184,0.28) 0%, rgba(255,255,255,0.24) 50%, rgba(148,163,184,0.28) 100%)' }} />
              <SkeletonBlock width="55%" height="18px" style={{ background: 'linear-gradient(90deg, rgba(148,163,184,0.24) 0%, rgba(255,255,255,0.22) 50%, rgba(148,163,184,0.24) 100%)' }} />
              <SkeletonBlock width="146px" height="44px" radius="999px" style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.4) 0%, rgba(96,165,250,0.65) 50%, rgba(59,130,246,0.4) 100%)' }} />
            </div>
          </div>
        )}
        {slides && <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation
          pagination={{ clickable: true }}
          loop
          className="hero-swiper"
          style={{ height: 'clamp(520px, 65vw, 780px)' }}
        >
          {slides.map((s, i) => (
            <SwiperSlide key={i}>
              <div className="relative w-full h-full">
                <ImageWithFallback src={s.img} alt="" label="메인 이미지" className="w-full h-full object-cover" />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to right, rgba(5,15,35,0.72) 0%, rgba(5,15,35,0.45) 60%, rgba(5,15,35,0.2) 100%)' }}
                />
                <div className="absolute inset-0 flex flex-col justify-center" style={{ padding: '0 clamp(2rem, 8vw, 8rem)' }}>
                  <h2
                    className="font-black text-white mb-5"
                    style={{
                      fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
                      lineHeight: 1.15,
                      whiteSpace: 'pre-line',
                      letterSpacing: '-0.025em',
                      textShadow: '0 2px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    {s.title}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '2rem' }}>{s.sub}</p>
                  <div>
                    <Link
                      to="/intro/worship"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 32px',
                        background: '#1d4ed8',
                        color: '#fff',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      예배 안내
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>}

        {/* ── 레이어 카드 (히어로 하단 절반 걸치기) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'translateY(50%)',
            zIndex: 10,
            padding: '0 clamp(1rem, 4vw, 4rem)',
          }}
        >
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: `repeat(${quickCards.length}, 1fr)`,
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 12px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
            className="layer-grid"
          >
            {quickCards.map((c, i) => (
              <Link
                key={c.to}
                to={c.to}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '28px 12px',
                  borderRight: i < quickCards.length - 1 ? '1px solid #f0f2f5' : 'none',
                  transition: 'background 0.2s',
                  textDecoration: 'none',
                  gap: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3a5f', whiteSpace: 'nowrap' }}>{c.ko}</span>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{c.en}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 레이어 카드 여백 */}
      <div style={{ height: 'clamp(60px, 7vw, 90px)', background: '#f6f8fb' }} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 2  말씀 · 찬양
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#f6f8fb', padding: '20px 0 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f2040', letterSpacing: '-0.025em' }}>
              말씀 · 찬양
            </h2>
            <Link to="/media/sunday" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              전체보기
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
            </Link>
          </div>

          <div className="sermon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {wordPraiseItems.map((s, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/watch?v=${s.vid}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', borderRadius: '14px', overflow: 'hidden', background: '#fff', border: '1px solid #eaecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.25s, box-shadow 0.25s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                {/* 썸네일 */}
                <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                  <ImageWithFallback src={s.thumb} alt="" label={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                  {/* hover overlay */}
                  <div
                    className="play-overlay"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.25s' }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" fill="#0f2040" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', ...(wordPraiseBadgeStyles[s.category] || wordPraiseBadgeStyles['주일예배']) }}>
                    {s.category}
                  </span>
                </div>
                {/* 텍스트 */}
                <div style={{ padding: '18px 20px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f2040', lineHeight: 1.55, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.52 3.55 12 3.55 12 3.55s-7.52 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14C4.48 20.45 12 20.45 12 20.45s7.52 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>
                      <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.meta}</p>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', margin: 0 }}>
                      최신 {s.category}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 3  공지사항 + 주보
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="split-grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>

          {/* 공지사항 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f2040', letterSpacing: '-0.025em' }}>공지사항</h2>
              <Link to="/community/notice" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                전체보기 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
              </Link>
            </div>
            <ul style={{ listStyle: 'none' }}>
              {noticesLoading ? Array.from({ length: 4 }, (_, i) => (
                <li key={`notice-skeleton-${i}`} style={{ borderBottom: '1px solid #f0f2f5', padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <SkeletonBlock width="52px" height="22px" radius="999px" />
                    <SkeletonBlock width="100%" height="15px" />
                    <SkeletonBlock width="48px" height="14px" />
                  </div>
                </li>
              )) : notices.map((n, i) => (
                <li key={n.id || i} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <div
                    onClick={() => setOpenNotice(openNotice === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 0', cursor: 'pointer' }}
                  >
                    <span style={{
                      flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px',
                      background: n.badge === '모집' ? '#fff7ed' : n.badge === '안내' ? '#f0fdf4' : '#eff6ff',
                      color: n.badge === '모집' ? '#c2610c' : n.badge === '안내' ? '#15803d' : '#1d4ed8',
                    }}>
                      {n.badge}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#1e3a5f', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {n.title}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>{n.date}</span>
                    <span style={{ flexShrink: 0, fontSize: '0.7rem', color: '#9ca3af' }}>{openNotice === i ? '▲' : '▼'}</span>
                  </div>
                  {openNotice === i && (
                    <div style={{ padding: '12px 0 20px', borderTop: '1px solid #f0f2f5' }}>
                      {n.content
                        ? <pre style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{n.content}</pre>
                        : <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>내용이 없습니다.</p>
                      }
                      {n.fileUrl && (
                        <a
                          href={n.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '7px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
                        >
                          <svg width="13" height="13" fill="none" stroke="#1d4ed8" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {n.fileName || '첨부파일 다운로드'}
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 주보 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f2040', letterSpacing: '-0.025em' }}>주보</h2>
              <Link to="/community/bulletin" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                전체보기 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
              </Link>
            </div>
            <ul style={{ listStyle: 'none' }}>
              {bulletinsLoading ? Array.from({ length: 4 }, (_, i) => (
                <li key={`bulletin-skeleton-${i}`} style={{ borderBottom: '1px solid #f0f2f5', padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <SkeletonBlock width="36px" height="36px" radius="8px" />
                    <SkeletonBlock width="100%" height="15px" />
                    <SkeletonBlock width="32px" height="32px" radius="8px" />
                  </div>
                </li>
              )) : bulletins.map((b, i) => (
                <li key={b.id || i} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <a
                    href={b.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 0', textDecoration: 'none', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '8px', background: b.fileType === 'pdf' ? '#fee2e2' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" fill={b.fileType === 'pdf' ? '#dc2626' : '#0284c7'} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                    </div>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#1e3a5f' }}>{b.title}</span>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 4  교회학교 / 기관 소개
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#f6f8fb', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f2040', letterSpacing: '-0.025em' }}>
              교회학교 · 기관
            </h2>
            <Link to="/school/children" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              전체보기 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
            </Link>
          </div>

          <div className="dept-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {depts.map((d, i) => (
              <Link
                key={d.to}
                to={d.to}
                style={{ display: 'block', borderRadius: '14px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3', textDecoration: 'none', transition: 'transform 0.25s', }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ImageWithFallback src={d.img} alt="" label={d.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,15,40,0.80) 0%, rgba(5,15,40,0.1) 60%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>{d.label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>{d.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § 5  오시는길 (다크 섹션)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#0f2040', padding: '80px 0' }}>
        <div className="location-grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

          {/* 지도 */}
          {locationData?.mapEmbedUrl ? (
            <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '4/3' }}>
              <iframe
                src={locationData.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 'none', display: 'block' }}
                allowFullScreen
                loading="lazy"
                title="신애교회 위치"
              />
            </div>
          ) : (
            <MapPlaceholderNotice compact />
          )}

          {/* 정보 */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '12px' }}>Location</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', marginBottom: '32px' }}>오시는길</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
              {[
                { label: '주소',    value: address },
                { label: '전화',    value: phone },
                { label: '이메일',  value: email },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', width: '48px', flexShrink: 0, paddingTop: '2px' }}>{row.label}</span>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              to="/intro/location"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#1d4ed8', color: '#fff', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e40af'}
              onMouseLeave={e => e.currentTarget.style.background = '#1d4ed8'}
            >
              자세히 보기
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
