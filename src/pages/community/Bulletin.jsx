import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase'
import Pagination from '../../components/Pagination'
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

const PER_PAGE = 15

export default function Bulletin() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const q = query(collection(db, 'bulletins'), orderBy('date', 'desc'))
    getDocs(q)
      .then(snap => setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPages = Math.ceil(entries.length / PER_PAGE)
  const slice = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="주보보기">
      <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', borderLeft: '4px solid #0284c7' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0c4a6e', marginBottom: '4px' }}>주보 다운로드</p>
        <p style={{ fontSize: '0.82rem', color: '#374151' }}>주보는 HWP 또는 PDF 파일로 제공됩니다. 아래 목록에서 원하시는 주보를 클릭하여 다운로드하세요.</p>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>등록된 주보가 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px 110px', background: '#0f2040', padding: '12px 20px' }}>
              {['번호', '제목', '파일', '등록일'].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
              ))}
            </div>
            {slice.map((e, i) => (
              <a
                key={e.id}
                href={e.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 60px 110px',
                  padding: '14px 20px',
                  borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none',
                  background: i % 2 === 0 ? '#fff' : '#fafbfc',
                  textDecoration: 'none', transition: 'background 0.15s', alignItems: 'center',
                }}
                onMouseEnter={el => el.currentTarget.style.background = '#f0f7ff'}
                onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
              >
                <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{entries.length - ((page - 1) * PER_PAGE + i)}</span>
                <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500 }}>{e.title}</span>
                <span style={{ fontSize: '0.72rem', color: '#fff', background: e.fileType === 'pdf' ? '#dc2626' : '#0284c7', padding: '2px 8px', borderRadius: '9999px', textAlign: 'center', width: 'fit-content' }}>
                  {e.fileType?.toUpperCase() || 'HWP'}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  {e.date?.toDate ? e.date.toDate().toISOString().slice(0, 10) : ''}
                </span>
              </a>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={p => { setPage(p) }} />
        </>
      )}
    </SubLayout>
  )
}
