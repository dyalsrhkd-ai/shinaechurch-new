import { useState } from 'react'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '주일예배', path: '/media/sunday' },
  { label: '특별설교', path: '/media/special' },
  { label: '성가대',   path: '/media/choir' },
]

const sermons = [
  { vid: 'EYIet64lGy0', title: '특별설교',               ref: '창 3:1-10' },
  { vid: 'CxL5otxFCko', title: '금요예배 설교',          ref: '수 14:6-15' },
  { vid: 'D6tRT7p6aw0', title: '오후 예배 설교',         ref: '요 10:18' },
  { vid: 'YtAcl-pKbYE', title: '신년 축복 성회',         ref: '신 28:1-3' },
  { vid: 'IusoDXVJcXg', title: '신년 축복 성회 새벽',    ref: '2019.1.3' },
  { vid: 'SwJ90VWrESk', title: '신년 축복 성회',         ref: '행 2:1-4' },
  { vid: 'O1qMp-vrYP8', title: '신년 축복 성회 새벽',    ref: '2019.1.2' },
  { vid: '_qmtI1SiuUo', title: '신년 축복 성회',         ref: '왕하 2:11-14' },
  { vid: 'dChiNqZjNu4', title: '아름다운 기적들이 일어난다', ref: '신년예배' },
  { vid: 'fp5Sio756pI', title: '하계 부흥 성회',         ref: '2018.7.31' },
  { vid: '_xhUAaWpFTI', title: '하계 부흥 성회 새벽',    ref: '2018.8.1' },
]

function VideoModal({ vid, title, ref: bibleRef, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '860px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '4px' }}>{bibleRef} · 우용녀 목사</p>
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

export default function Special() {
  const [modal, setModal] = useState(null)

  return (
    <SubLayout section="말씀 · 찬양" menus={menus} title="특별설교">
      {/* 대표 영상 */}
      <div
        onClick={() => setModal(sermons[0])}
        style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer', marginBottom: '32px', background: '#000' }}
      >
        <img
          src={`https://i.ytimg.com/vi/${sermons[0].vid}/maxresdefault.jpg`}
          alt={sermons[0].title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
          onError={e => { e.target.src = `https://i.ytimg.com/vi/${sermons[0].vid}/hqdefault.jpg` }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,15,40,0.85) 0%, rgba(5,15,40,0.2) 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <svg width="28" height="28" fill="#0f2040" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
          <span style={{ display: 'inline-block', background: '#7c3aed', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', marginBottom: '10px' }}>특별설교</span>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1.4 }}>{sermons[0].title}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '4px' }}>{sermons[0].ref} · 우용녀 목사</p>
        </div>
      </div>

      {/* 설교 그리드 */}
      <div className="sermon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {sermons.slice(1).map((s, i) => (
          <div
            key={i}
            onClick={() => setModal(s)}
            style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaecf0', background: '#fff', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a1628', overflow: 'hidden' }}>
              <img
                src={`https://i.ytimg.com/vi/${s.vid}/hqdefault.jpg`}
                alt={s.title}
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
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2040', lineHeight: 1.5, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.title}</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.ref}</p>
            </div>
          </div>
        ))}
      </div>

      {modal && <VideoModal {...modal} onClose={() => setModal(null)} />}
    </SubLayout>
  )
}
