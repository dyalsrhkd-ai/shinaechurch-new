import { useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import SubLayout from '../../components/SubLayout'
import { EVENT_DEPTS, getYoutubeThumb } from '../../data/media'
import { useVideoItems } from '../../hooks/useMediaItems'

const menus = [
  { label: '교회소식', path: '/community/news' },
  { label: '주보보기', path: '/community/bulletin' },
  { label: '행사갤러리', path: '/community/gallery' },
  { label: '행사동영상', path: '/community/video' },
  { label: '새신자소개', path: '/community/newcomer' },
  { label: '부서자료실', path: '/community/resources' },
  { label: '공지사항', path: '/community/notice' },
  { label: '영선관리', path: '/community/farm' },
]

const PER_PAGE = 12

export default function Video() {
  const { items, loading } = useVideoItems()
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)
  const [selectedDept, setSelectedDept] = useState('전체')
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const lowered = keyword.trim().toLowerCase()
    return items.filter(item => {
      if (item.dept === '성가대') return false
      const matchesDept = selectedDept === '전체' || item.dept === selectedDept
      const matchesKeyword = !lowered || item.title.toLowerCase().includes(lowered) || item.dept.toLowerCase().includes(lowered)
      return matchesDept && matchesKeyword
    })
  }, [items, keyword, selectedDept])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="행사동영상">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>전체 {filtered.length}개</div>
        <input
          value={keyword}
          onChange={event => { setKeyword(event.target.value); setPage(1) }}
          placeholder="제목 또는 부서 검색"
          style={{ width: 'min(100%, 280px)', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dbe3ef', fontSize: '0.85rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {EVENT_DEPTS.map(dept => (
          <button
            key={dept}
            onClick={() => { setSelectedDept(dept); setPage(1) }}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: selectedDept === dept ? '#1d4ed8' : '#dbe3ef',
              background: selectedDept === dept ? '#1d4ed8' : '#fff',
              color: selectedDept === dept ? '#fff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: selectedDept === dept ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {dept}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#9ca3af', border: '1px dashed #dbe3ef', borderRadius: '16px' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {slice.map(item => (
              <div key={item.id} onClick={() => setModal(item)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0', background: '#fff' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                  <img
                    src={getYoutubeThumb(item.youtubeId)}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
                    onMouseEnter={event => { event.target.style.opacity = '0.75' }}
                    onMouseLeave={event => { event.target.style.opacity = '1' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(255,0,0,0.85)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '16px solid #fff', marginLeft: '4px' }} />
                    </div>
                  </div>
                  <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15,32,64,0.86)', color: '#fff', fontSize: '0.68rem', padding: '4px 8px', borderRadius: '9999px' }}>
                    {item.dept}
                  </span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={event => event.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <div style={{ aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${modal.youtubeId}?autoplay=1`} title={modal.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ display: 'block' }} />
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginTop: '12px' }}>{modal.title}</p>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: '6px' }}>{modal.dept}</p>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
