import { useState } from 'react'
import SubLayout from '../../components/SubLayout'
import { sermons } from '../../data/sermons'

const menus = [
  { label: '주일예배', path: '/media/sunday' },
  { label: '특별설교', path: '/media/special' },
  { label: '성가대',   path: '/media/choir' },
]

const PER_PAGE = 12

function VideoModal({ vid, title, ref: bibleRef, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '860px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{title}</p>
            {bibleRef && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '4px' }}>{bibleRef} · 우용녀 목사</p>}
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

function SermonCard({ s, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaecf0', background: '#fff', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a1628', overflow: 'hidden' }}>
        <img
          src={`https://i.ytimg.com/vi/${s.vid}/hqdefault.jpg`}
          alt={s.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
        />
        <div className="play-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" fill="#0f2040" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2040', lineHeight: 1.5, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.title}</p>
        {s.ref && <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.ref}</p>}
      </div>
    </div>
  )
}

export default function Sunday() {
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(sermons.length / PER_PAGE)
  const pageSermons = sermons.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const featured = page === 1 ? sermons[0] : null
  const gridSermons = page === 1 ? pageSermons.slice(1) : pageSermons

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <SubLayout section="말씀 · 찬양" menus={menus} title="주일예배">

      {/* 총 개수 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
          총 <strong style={{ color: '#0f2040' }}>{sermons.length}</strong>개 설교
        </p>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{page} / {totalPages} 페이지</p>
      </div>

      {/* 1페이지 최신 대표 영상 */}
      {featured && (
        <div
          onClick={() => setModal(featured)}
          style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer', marginBottom: '24px', background: '#000' }}
        >
          <img
            src={`https://i.ytimg.com/vi/${featured.vid}/maxresdefault.jpg`}
            alt={featured.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            onError={e => { e.target.src = `https://i.ytimg.com/vi/${featured.vid}/hqdefault.jpg` }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,15,40,0.85) 0%, rgba(5,15,40,0.2) 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <svg width="28" height="28" fill="#0f2040" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
            <span style={{ display: 'inline-block', background: '#1d4ed8', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', marginBottom: '10px' }}>주일예배 최신</span>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1.4 }}>{featured.title}</p>
            {featured.ref && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '4px' }}>{featured.ref} · 우용녀 목사</p>}
          </div>
        </div>
      )}

      {/* 설교 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {gridSermons.map((s, i) => (
          <SermonCard key={i} s={s} onClick={() => setModal(s)} />
        ))}
      </div>

      {/* 페이지네이션 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* 이전 */}
        <button
          onClick={() => { setPage(p => Math.max(1, p - 1)); scrollTop() }}
          disabled={page === 1}
          style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #eaecf0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="14" height="14" fill="none" stroke="#374151" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" strokeLinecap="round"/></svg>
        </button>

        {/* 페이지 번호 */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#9ca3af', fontSize: '0.85rem' }}>···</span>
            ) : (
              <button
                key={p}
                onClick={() => { setPage(p); scrollTop() }}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  border: p === page ? 'none' : '1px solid #eaecf0',
                  background: p === page ? '#1d4ed8' : '#fff',
                  color: p === page ? '#fff' : '#374151',
                  fontWeight: p === page ? 700 : 400,
                  fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                {p}
              </button>
            )
          )
        }

        {/* 다음 */}
        <button
          onClick={() => { setPage(p => Math.min(totalPages, p + 1)); scrollTop() }}
          disabled={page === totalPages}
          style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #eaecf0', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="14" height="14" fill="none" stroke="#374151" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round"/></svg>
        </button>
      </div>

      {modal && <VideoModal {...modal} onClose={() => setModal(null)} />}
    </SubLayout>
  )
}
