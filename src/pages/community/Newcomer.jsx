import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import Pagination from '../../components/Pagination'
import SubLayout from '../../components/SubLayout'
import { db } from '../../firebase'

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

const PER_PAGE = 15

export default function Newcomer() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const q = query(collection(db, 'newcomers'), orderBy('date', 'desc'))
    getDocs(q)
      .then(snap => setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPages = Math.ceil(entries.length / PER_PAGE)
  const slice = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const globalIdx = i => (page - 1) * PER_PAGE + i

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="새신자소개">
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>등록된 새신자가 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
              {['번호', '제목', '등록일'].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
              ))}
            </div>
            {slice.map((e, i) => (
              <div key={e.id}>
                <div
                  onClick={() => setOpen(open === globalIdx(i) ? null : globalIdx(i))}
                  style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 110px',
                    padding: '14px 20px',
                    borderBottom: open === globalIdx(i) ? 'none' : (i < slice.length - 1 ? '1px solid #f0f2f5' : 'none'),
                    background: i % 2 === 0 ? '#fff' : '#fafbfc',
                    cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s',
                  }}
                  onMouseEnter={el => el.currentTarget.style.background = '#f0f7ff'}
                  onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                >
                  <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{entries.length - globalIdx(i)}</span>
                  <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {e.name}
                    <span style={{ fontSize: '0.7rem', color: open === globalIdx(i) ? '#0284c7' : '#9ca3af' }}>
                      {open === globalIdx(i) ? '▲' : '▼'}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                    {e.date?.toDate ? e.date.toDate().toISOString().slice(0, 10) : ''}
                  </span>
                </div>
                {open === globalIdx(i) && (
                  <div style={{ padding: '20px', background: '#f8fafc', borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none', display: 'flex', justifyContent: 'center' }}>
                    {e.imgUrl
                      ? <img src={e.imgUrl} alt={e.name} style={{ maxWidth: '400px', width: '100%', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
                      : <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>이미지가 없습니다.</p>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={p => { setPage(p); setOpen(null) }} />
        </>
      )}
    </SubLayout>
  )
}
