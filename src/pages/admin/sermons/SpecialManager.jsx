import { useEffect, useMemo, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { extractYoutubeId, getYoutubeThumb } from '../../../data/media'

const PER_PAGE = 15

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
    ref: item.ref || '',
    date: item.date || '',
    youtubeId: item.youtubeId || '',
  })))
}

export default function SpecialManager() {
  const [sermons, setSermons] = useState([])
  const [originalSermons, setOriginalSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ title: '', ref: '', date: '', youtubeId: '' })

  const hasUnsavedChanges = useMemo(
    () => serializeItems(sermons) !== serializeItems(originalSermons),
    [sermons, originalSermons]
  )

  const fetchSermons = async () => {
    setLoading(true)
    try {
      const mapped = await listContentDocuments('specialSermons', { sort: 'order', direction: 'desc' })
      setSermons(mapped)
      setOriginalSermons(mapped.map(item => ({ ...item })))
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSermons()
  }, [])

  const paged = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(sermons.length / PER_PAGE))
    const safePage = Math.min(page, totalPages)
    return { totalPages, safePage, items: sermons.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE) }
  }, [page, sermons])

  const handleAdd = async () => {
    if (!form.title.trim()) return alert('제목을 입력해 주세요.')
    if (!form.youtubeId.trim()) return alert('YouTube ID 또는 URL을 입력해 주세요.')
    setSaving(true)
    try {
      await createContentDocument('specialSermons', {
        title: form.title.trim(),
        ref: form.ref.trim(),
        date: form.date.trim(),
        youtubeId: extractYoutubeId(form.youtubeId),
        order: Date.now(),
      })
      setForm({ title: '', ref: '', date: '', youtubeId: '' })
      await fetchSermons()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '특별설교를 등록했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleItemChange = (itemId, field, value) => {
    setSermons(current => current.map(item => (
      item.id === itemId ? { ...item, [field]: value } : item
    )))
  }

  const handleSaveAll = async () => {
    const invalidItem = sermons.find(item => !item.title?.trim() || !item.youtubeId?.trim())
    if (invalidItem) return alert('제목 또는 유튜브 주소가 비어 있는 항목이 있습니다.')

    setSaving(true)
    try {
      await Promise.all(sermons.map(item => updateContentDocument('specialSermons', item.id, {
        title: item.title.trim(),
        ref: item.ref?.trim() || '',
        date: item.date?.trim() || '',
        youtubeId: extractYoutubeId(item.youtubeId),
      })))

      const normalized = sermons.map(item => ({
        ...item,
        title: item.title.trim(),
        ref: item.ref?.trim() || '',
        date: item.date?.trim() || '',
        youtubeId: extractYoutubeId(item.youtubeId),
      }))
      setSermons(normalized)
      setOriginalSermons(normalized.map(item => ({ ...item })))
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '특별설교를 저장했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteContentDocument('specialSermons', id)
    await fetchSermons()
    window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: '특별설교를 삭제했습니다.' } }))
  }

  const previewId = form.youtubeId ? extractYoutubeId(form.youtubeId) : ''

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>특별설교 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>설교 항목을 목록에서 바로 수정하고 상단 저장으로 한 번에 반영합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>특별설교 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 설교 항목을 수정 중입니다. 저장 버튼으로 반영하세요.' : `총 ${sermons.length}건`}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 특별설교 등록</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="설교 제목" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
          <input value={form.ref} onChange={event => setForm(current => ({ ...current, ref: event.target.value }))} placeholder="성경 구절" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
          <input value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} placeholder="설교 날짜" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
          <input value={form.youtubeId} onChange={event => setForm(current => ({ ...current, youtubeId: event.target.value }))} placeholder="YouTube ID 또는 URL" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px' }}>
          {previewId ? <img src={getYoutubeThumb(previewId)} alt="" style={{ width: '140px', height: '79px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eaecf0', flexShrink: 0 }} /> : null}
          <button onClick={handleAdd} disabled={saving} style={{ padding: '10px 28px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>등록</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : sermons.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', border: '1px solid #eaecf0', borderRadius: '12px', background: '#fff' }}>등록된 특별설교가 없습니다.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '12px' }}>
            {paged.items.map(item => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '14px', alignItems: 'center' }}>
                <img src={getYoutubeThumb(extractYoutubeId(item.youtubeId))} alt="" style={{ width: '96px', height: '54px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 1fr', gap: '10px' }}>
                  <input value={item.title || ''} onChange={event => handleItemChange(item.id, 'title', event.target.value)} placeholder="설교 제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                  <input value={item.ref || ''} onChange={event => handleItemChange(item.id, 'ref', event.target.value)} placeholder="성경 구절" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                  <input value={item.date || ''} onChange={event => handleItemChange(item.id, 'date', event.target.value)} placeholder="설교 날짜" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                  <input value={item.youtubeId || ''} onChange={event => handleItemChange(item.id, 'youtubeId', event.target.value)} placeholder="YouTube ID 또는 URL" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                </div>
                <button onClick={() => handleDelete(item.id)} style={{ padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
              </div>
            ))}
          </div>
          {paged.totalPages > 1 ? <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>{Array.from({ length: paged.totalPages }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', background: paged.safePage === number ? '#0f2040' : '#f3f4f6', color: paged.safePage === number ? '#fff' : '#374151', fontWeight: paged.safePage === number ? 700 : 400 }}>{number}</button>)}</div> : null}
        </>
      )}
    </div>
  )
}
