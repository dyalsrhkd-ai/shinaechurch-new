import { useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import SubLayout from '../../components/SubLayout'
import { EVENT_DEPTS } from '../../data/media'
import { useGalleryItems } from '../../hooks/useMediaItems'

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

export default function Gallery() {
  const { items, loading } = useGalleryItems()
  const [lightbox, setLightbox] = useState(null)
  const [page, setPage] = useState(1)
  const [selectedDept, setSelectedDept] = useState('전체')
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const lowered = keyword.trim().toLowerCase()
    return items.filter(item => {
      if (item.dept === '성가대') return false
      const matchesDept = selectedDept === '전체' || item.dept === selectedDept
      const matchesKeyword = !lowered || item.label.toLowerCase().includes(lowered) || item.dept.toLowerCase().includes(lowered)
      return matchesDept && matchesKeyword
    })
  }, [items, keyword, selectedDept])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const filterButton = (dept) => (
    <button
      key={dept}
      onClick={() => { setSelectedDept(dept); setPage(1); setLightbox(null) }}
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
  )

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="행사갤러리">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>전체 {filtered.length}장</div>
        <input
          value={keyword}
          onChange={event => { setKeyword(event.target.value); setPage(1) }}
          placeholder="제목 또는 부서 검색"
          style={{ width: 'min(100%, 280px)', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dbe3ef', fontSize: '0.85rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {EVENT_DEPTS.map(filterButton)}
      </div>

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#9ca3af', border: '1px dashed #dbe3ef', borderRadius: '16px' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        <>
          <div className="sermon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {slice.map((item, index) => {
              const globalIndex = (safePage - 1) * PER_PAGE + index
              return (
                <div key={item.id} onClick={() => setLightbox(globalIndex)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={item.imgUrl}
                      alt={item.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={event => { event.target.style.transform = 'scale(1.05)' }}
                      onMouseLeave={event => { event.target.style.transform = 'scale(1)' }}
                    />
                    <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15,32,64,0.86)', color: '#fff', fontSize: '0.68rem', padding: '4px 8px', borderRadius: '9999px' }}>
                      {item.dept}
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#fff' }}>
                    <p style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination page={safePage} totalPages={totalPages} onPage={(nextPage) => { setPage(nextPage); setLightbox(null) }} />
        </>
      )}

      {lightbox !== null && filtered[lightbox] && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={event => event.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={filtered[lightbox].imgUrl} alt={filtered[lightbox].label} style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>{filtered[lightbox].label}</p>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: '6px' }}>{filtered[lightbox].dept}</p>
            {lightbox > 0 && <button onClick={event => { event.stopPropagation(); setLightbox(lightbox - 1) }} style={{ position: 'absolute', left: '-48px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>‹</button>}
            {lightbox < filtered.length - 1 && <button onClick={event => { event.stopPropagation(); setLightbox(lightbox + 1) }} style={{ position: 'absolute', right: '-48px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>›</button>}
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
