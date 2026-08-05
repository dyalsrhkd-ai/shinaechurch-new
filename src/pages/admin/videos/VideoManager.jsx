import { useEffect, useMemo, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { EVENT_DEPTS, extractYoutubeId } from '../../../data/media'

const PER_PAGE = 20

const stickyBarStyle = {
  position: 'sticky',
  top: '88px',
  zIndex: 8,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(14px)',
  border: '1px solid #dbe4f0',
  borderRadius: '16px',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
  boxShadow: '0 12px 28px rgba(15, 32, 64, 0.08)',
  marginBottom: '20px',
}

function serializeItems(list) {
  return JSON.stringify(list.map(item => ({
    id: item.id,
    title: item.title || '',
    youtubeId: item.youtubeId || '',
    dept: item.dept || '',
  })))
}

export default function VideoManager() {
  const [items, setItems] = useState([])
  const [originalItems, setOriginalItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState('전체')
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', youtubeId: '', dept: '기타' })

  const hasUnsavedChanges = useMemo(
    () => serializeItems(items) !== serializeItems(originalItems),
    [items, originalItems]
  )

  const fetchItems = async () => {
    setLoading(true)
    try {
      const mapped = await listContentDocuments('videos', { sort: 'order', direction: 'desc' })
      setItems(mapped)
      setOriginalItems(mapped.map(item => ({ ...item })))
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const eventItems = items.filter(item => item.dept !== '성가대')
  const filtered = filterDept === '전체' ? eventItems : eventItems.filter(item => item.dept === filterDept)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleAdd = async () => {
    if (!form.title.trim()) return alert('제목을 입력해 주세요.')
    if (!form.youtubeId.trim()) return alert('YouTube ID 또는 URL을 입력해 주세요.')

    setSaving(true)
    try {
      await createContentDocument('videos', {
        title: form.title.trim(),
        youtubeId: extractYoutubeId(form.youtubeId),
        dept: form.dept,
        order: Date.now(),
      })
      setForm({ title: '', youtubeId: '', dept: '기타' })
      await fetchItems()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '행사 영상을 등록했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleItemChange = (itemId, field, value) => {
    setItems(current => current.map(item => (
      item.id === itemId ? { ...item, [field]: value } : item
    )))
  }

  const handleSaveAll = async () => {
    const invalidItem = items.find(item => !item.title?.trim() || !item.youtubeId?.trim())
    if (invalidItem) return alert('제목 또는 유튜브 주소가 비어 있는 항목이 있습니다.')

    setSaving(true)
    try {
      await Promise.all(items.map(item => updateContentDocument('videos', item.id, {
        title: item.title.trim(),
        youtubeId: extractYoutubeId(item.youtubeId),
        dept: item.dept,
      })))

      const normalized = items.map(item => ({
        ...item,
        title: item.title.trim(),
        youtubeId: extractYoutubeId(item.youtubeId),
      }))
      setItems(normalized)
      setOriginalItems(normalized.map(item => ({ ...item })))
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '행사 영상을 저장했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteContentDocument('videos', id)
    await fetchItems()
    window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: '행사 영상을 삭제했습니다.' } }))
  }

  const filterButton = (active, onClick, children) => (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 700 : 400, background: active ? '#0f2040' : '#f3f4f6', color: active ? '#fff' : '#374151' }}>{children}</button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>행사영상 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>기존 영상 항목을 바로 수정하고 상단 저장 버튼으로 한 번에 반영합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>행사영상 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 영상 항목을 수정 중입니다. 저장 버튼으로 반영하세요.' : `전체 ${eventItems.length}건`}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 영상 등록</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px auto', gap: '12px' }}>
          <input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="영상 제목" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px' }} />
          <input value={form.youtubeId} onChange={event => setForm(current => ({ ...current, youtubeId: event.target.value }))} placeholder="YouTube ID 또는 URL" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px' }} />
          <select value={form.dept} onChange={event => setForm(current => ({ ...current, dept: event.target.value }))} style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff' }}>
            {EVENT_DEPTS.filter(item => item !== '전체').map(item => <option key={item}>{item}</option>)}
          </select>
          <button onClick={handleAdd} disabled={saving} style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>등록</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {EVENT_DEPTS.map(item => filterButton(filterDept === item, () => { setFilterDept(item); setPage(1) }, item))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>항목이 없습니다.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '12px' }}>
            {slice.map(item => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '14px', alignItems: 'center' }}>
                <img src={`https://img.youtube.com/vi/${extractYoutubeId(item.youtubeId)}/mqdefault.jpg`} alt="" style={{ width: '96px', height: '54px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: '10px' }}>
                  <input value={item.title || ''} onChange={event => handleItemChange(item.id, 'title', event.target.value)} placeholder="제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                  <input value={item.youtubeId || ''} onChange={event => handleItemChange(item.id, 'youtubeId', event.target.value)} placeholder="YouTube ID 또는 URL" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                  <select value={item.dept} onChange={event => handleItemChange(item.id, 'dept', event.target.value)} style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', background: '#fff' }}>
                    {EVENT_DEPTS.filter(dept => dept !== '전체').map(dept => <option key={dept}>{dept}</option>)}
                  </select>
                </div>
                <button onClick={() => handleDelete(item.id)} style={{ padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
              </div>
            ))}
          </div>
          {totalPages > 1 ? <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>{Array.from({ length: totalPages }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', background: safePage === number ? '#0f2040' : '#f3f4f6', color: safePage === number ? '#fff' : '#374151', fontWeight: safePage === number ? 700 : 400 }}>{number}</button>)}</div> : null}
        </>
      )}
    </div>
  )
}
