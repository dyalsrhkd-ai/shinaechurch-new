import { useEffect, useMemo, useState } from 'react'
import { listContentDocuments } from '../../api/contentApi'
import Pagination from '../../components/Pagination'
import SubLayout from '../../components/SubLayout'
import ImageWithFallback from '../../components/ui/ImageWithFallback'
import { SkeletonBlock, SkeletonCard } from '../../components/ui/Skeleton'

const menus = [
  { label: '해외선교', path: '/mission/overseas' },
  { label: '국내선교', path: '/mission/domestic' },
]

const PER_PAGE = 15

export default function MissionBoard({ category, title }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    listContentDocuments('missions', { sort: 'date', direction: 'desc' })
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredEntries = useMemo(
    () => entries.filter(entry => entry.category === category),
    [category, entries]
  )

  const totalPages = Math.ceil(filteredEntries.length / PER_PAGE)
  const slice = filteredEntries.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const globalIdx = i => (page - 1) * PER_PAGE + i

  useEffect(() => {
    setPage(1)
    setOpen(null)
  }, [category])

  return (
    <SubLayout section="선교" menus={menus} title={title}>
      {loading ? (
        <SkeletonCard>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
            {['번호', '제목', '등록일'].map(header => (
              <span key={header} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{header}</span>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', padding: '14px 20px', borderBottom: index < 5 ? '1px solid #f0f2f5' : 'none', alignItems: 'center' }}>
              <SkeletonBlock width="18px" height="14px" />
              <SkeletonBlock width={`${78 - index * 4}%`} height="15px" />
              <SkeletonBlock width="72px" height="14px" />
            </div>
          ))}
        </SkeletonCard>
      ) : filteredEntries.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>등록된 {title} 내용이 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
              {['번호', '제목', '등록일'].map(header => (
                <span key={header} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{header}</span>
              ))}
            </div>
            {slice.map((entry, index) => (
              <div key={entry.id}>
                <div
                  onClick={() => setOpen(open === globalIdx(index) ? null : globalIdx(index))}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 110px',
                    padding: '14px 20px',
                    borderBottom: open === globalIdx(index) ? 'none' : (index < slice.length - 1 ? '1px solid #f0f2f5' : 'none'),
                    background: index % 2 === 0 ? '#fff' : '#fafbfc',
                    cursor: 'pointer',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={event => { event.currentTarget.style.background = '#f0f7ff' }}
                  onMouseLeave={event => { event.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafbfc' }}
                >
                  <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{filteredEntries.length - globalIdx(index)}</span>
                  <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {entry.title}
                    <span style={{ fontSize: '0.7rem', color: open === globalIdx(index) ? '#0284c7' : '#9ca3af' }}>
                      {open === globalIdx(index) ? '▲' : '▼'}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                    {entry.date ? new Date(entry.date).toISOString().slice(0, 10) : ''}
                  </span>
                </div>
                {open === globalIdx(index) && (
                  <div style={{ padding: '20px', background: '#f8fafc', borderBottom: index < slice.length - 1 ? '1px solid #f0f2f5' : 'none', display: 'flex', justifyContent: 'center' }}>
                    {entry.imgUrl
                      ? <ImageWithFallback src={entry.imgUrl} alt={entry.title} label={entry.title} style={{ maxWidth: '400px', width: '100%', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
                      : <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>이미지가 없습니다.</p>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={nextPage => { setPage(nextPage); setOpen(null) }} />
        </>
      )}
    </SubLayout>
  )
}
