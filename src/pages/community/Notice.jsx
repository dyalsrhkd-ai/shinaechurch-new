import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '교회소식',   path: '/community/news' },
  { label: '주보보기',   path: '/community/bulletin' },
  { label: '행사갤러리', path: '/community/gallery' },
  { label: '행사동영상', path: '/community/video' },
  { label: '새신자소개', path: '/community/newcomer' },
  { label: '부서자료실', path: '/community/resources' },
  { label: '공지사항',   path: '/community/notice' },
  { label: '영선관리',   path: '/community/farm' },
]


function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toISOString().slice(0, 10)
}

export default function Notice() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('date', 'desc'))
    getDocs(q)
      .then(snap => setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="공지사항">
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>등록된 공지사항이 없습니다.</div>
      ) : (
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
            {['번호', '제목', '등록일'].map(h => (
              <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
            ))}
          </div>
          {entries.map((e, i) => (
            <div key={e.id}>
              <div
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 110px',
                  padding: '14px 20px',
                  borderBottom: open === i ? 'none' : (i < entries.length - 1 ? '1px solid #f0f2f5' : 'none'),
                  background: i % 2 === 0 ? '#fff' : '#fafbfc',
                  cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s',
                }}
                onMouseEnter={el => el.currentTarget.style.background = '#f0f7ff'}
                onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
              >
                <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{entries.length - i}</span>
                <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {e.badge && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', flexShrink: 0,
                      background: e.badge === '모집' ? '#fff7ed' : e.badge === '안내' ? '#f0fdf4' : '#eff6ff',
                      color: e.badge === '모집' ? '#c2610c' : e.badge === '안내' ? '#15803d' : '#1d4ed8',
                    }}>{e.badge}</span>
                  )}
                  {e.title}
                  {e.fileUrl && (
                    <svg width="13" height="13" fill="#1d4ed8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                  )}
                  <span style={{ fontSize: '0.7rem', color: open === i ? '#0284c7' : '#9ca3af', marginLeft: 'auto' }}>{open === i ? '▲' : '▼'}</span>
                </span>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{formatDate(e.date)}</span>
              </div>
              {open === i && (
                <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: i < entries.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
                  {e.content ? (
                    <pre style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{e.content}</pre>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>내용이 없습니다.</p>
                  )}
                  {e.fileUrl && (
                    <a
                      href={e.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '8px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.825rem', color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <svg width="14" height="14" fill="none" stroke="#1d4ed8" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {e.fileName || '첨부파일 다운로드'}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SubLayout>
  )
}
