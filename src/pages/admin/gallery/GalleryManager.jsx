import { useEffect, useMemo, useRef, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { deleteMedia, uploadMedia } from '../../../utils/mediaStorage'
import { EVENT_DEPTS } from '../../../data/media'
import { validateImageFile } from '../../../utils/fileValidation'

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
    label: item.label || '',
    dept: item.dept || '',
    imgUrl: item.imgUrl || '',
    storagePath: item.storagePath || '',
    pendingFileName: item.pendingFile?.name || '',
  })))
}

export default function GalleryManager() {
  const [items, setItems] = useState([])
  const [originalItems, setOriginalItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState('전체')
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [form, setForm] = useState({ label: '', dept: '기타', file: null, preview: null })
  const fileRef = useRef(null)
  const editFileRefs = useRef({})

  const hasUnsavedChanges = useMemo(
    () => serializeItems(items) !== serializeItems(originalItems),
    [items, originalItems]
  )

  const fetchItems = async () => {
    setLoading(true)
    try {
      const documents = await listContentDocuments('gallery', { sort: 'order', direction: 'desc' })
      const mapped = documents.map(item => ({ ...item, pendingFile: null, previewUrl: '' }))
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

  const handleFileChange = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }
    setForm(current => ({ ...current, file, preview: URL.createObjectURL(file) }))
    event.target.value = ''
  }

  const handleUpload = async () => {
    if (!form.label.trim()) return alert('제목을 입력해 주세요.')
    if (!form.file) return alert('이미지를 선택해 주세요.')
    setSaving(true)
    setProgress(0)
    try {
      const uploaded = await uploadMedia(form.file, 'gallery', setProgress)
      await createContentDocument('gallery', {
        label: form.label.trim(),
        dept: form.dept,
        imgUrl: uploaded.url,
        storagePath: uploaded.path,
        order: Date.now(),
      })
      setForm({ label: '', dept: '기타', file: null, preview: null })
      await fetchItems()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '행사 갤러리를 등록했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
    setProgress(0)
  }

  const handleItemChange = (itemId, field, value) => {
    setItems(current => current.map(item => (
      item.id === itemId ? { ...item, [field]: value } : item
    )))
  }

  const handleReplaceImage = (itemId, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }
    setItems(current => current.map(item => (
      item.id === itemId ? { ...item, pendingFile: file, previewUrl: URL.createObjectURL(file) } : item
    )))
    event.target.value = ''
  }

  const handleSaveAll = async () => {
    const invalidItem = items.find(item => !item.label?.trim() || !item.dept)
    if (invalidItem) return alert('제목 또는 부서가 비어 있는 항목이 있습니다.')

    setSaving(true)
    setProgress(0)
    try {
      const total = items.length || 1
      const nextItems = []
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        let imgUrl = item.imgUrl || ''
        let storagePath = item.storagePath || ''

        if (item.pendingFile) {
          const uploaded = await uploadMedia(item.pendingFile, 'gallery', (fileProgress) => {
            setProgress(Math.round(((index + fileProgress / 100) / total) * 100))
          })
          imgUrl = uploaded.url
          if (item.storagePath) {
            try { await deleteMedia(item.storagePath) } catch {}
          }
          storagePath = uploaded.path
        }

        await updateContentDocument('gallery', item.id, {
          label: item.label.trim(),
          dept: item.dept,
          imgUrl,
          storagePath,
        })

        nextItems.push({
          ...item,
          label: item.label.trim(),
          imgUrl,
          storagePath,
          pendingFile: null,
          previewUrl: '',
        })
      }
      setItems(nextItems)
      setOriginalItems(nextItems.map(item => ({ ...item })))
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '행사 갤러리를 저장했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
    setProgress(0)
  }

  const handleDelete = async item => {
    if (!window.confirm('삭제하시겠습니까?')) return
    if (item.storagePath) {
      try { await deleteMedia(item.storagePath) } catch {}
    }
    await deleteContentDocument('gallery', item.id)
    await fetchItems()
    window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: '행사 갤러리를 삭제했습니다.' } }))
  }

  const filterButton = (active, onClick, children) => (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 700 : 400, background: active ? '#0f2040' : '#f3f4f6', color: active ? '#fff' : '#374151' }}>{children}</button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>행사갤러리 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>기존 사진 항목을 바로 수정하고 상단 저장으로 한 번에 반영합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>행사갤러리 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 사진 항목을 수정 중입니다. 저장 버튼으로 반영하세요.' : `전체 ${eventItems.length}건`}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? `${progress}%` : '저장'}
        </button>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {form.preview ? <img src={form.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} /> : null}
          <input value={form.label} onChange={event => setForm(current => ({ ...current, label: event.target.value }))} placeholder="사진 제목" style={{ flex: '1 1 160px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
          <select value={form.dept} onChange={event => setForm(current => ({ ...current, dept: event.target.value }))} style={{ padding: '8px 10px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem', background: '#fff' }}>
            {EVENT_DEPTS.filter(item => item !== '전체').map(item => <option key={item}>{item}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {form.file ? form.file.name.slice(0, 12) : '이미지 선택'}
          </button>
          <button onClick={handleUpload} disabled={saving} style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            등록
          </button>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {slice.map(item => (
              <div key={item.id} style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={item.previewUrl || item.imgUrl} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '12px', display: 'grid', gap: '8px' }}>
                  <input value={item.label || ''} onChange={event => handleItemChange(item.id, 'label', event.target.value)} placeholder="사진 제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px' }}>
                    <select value={item.dept} onChange={event => handleItemChange(item.id, 'dept', event.target.value)} style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', background: '#fff' }}>
                      {EVENT_DEPTS.filter(dept => dept !== '전체').map(dept => <option key={dept}>{dept}</option>)}
                    </select>
                    <input ref={element => { editFileRefs.current[item.id] = element }} type="file" accept=".jpg,.jpeg,.png" onChange={event => handleReplaceImage(item.id, event)} style={{ display: 'none' }} />
                    <button onClick={() => editFileRefs.current[item.id]?.click()} style={{ padding: '8px 10px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#fff', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}>이미지</button>
                    <button onClick={() => handleDelete(item)} style={{ padding: '8px 10px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 ? <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>{Array.from({ length: totalPages }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', background: safePage === number ? '#0f2040' : '#f3f4f6', color: safePage === number ? '#fff' : '#374151', fontWeight: safePage === number ? 700 : 400 }}>{number}</button>)}</div> : null}
        </>
      )}
    </div>
  )
}
