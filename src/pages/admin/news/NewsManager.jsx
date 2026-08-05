import { useEffect, useMemo, useRef, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { deleteMedia, uploadMedia } from '../../../utils/mediaStorage'
import { validateImageFile } from '../../../utils/fileValidation'

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

function toInputDate(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toISOString().slice(0, 10)
}

function mapNews(data) {
  return {
    id: data.id,
    title: data.title || '',
    dateValue: toInputDate(data.date),
    imgUrl: data.imgUrl || '',
    storagePath: data.storagePath || '',
    pendingFile: null,
    previewUrl: '',
  }
}

function serializeNews(list) {
  return JSON.stringify(list.map(item => ({
    id: item.id,
    title: item.title || '',
    dateValue: item.dateValue || '',
    imgUrl: item.imgUrl || '',
    storagePath: item.storagePath || '',
    pendingFileName: item.pendingFile?.name || '',
  })))
}

export default function NewsManager() {
  const [news, setNews] = useState([])
  const [originalNews, setOriginalNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ date: '', title: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const editFileRefs = useRef({})

  const hasUnsavedChanges = useMemo(
    () => serializeNews(news) !== serializeNews(originalNews),
    [news, originalNews]
  )

  const fetchNews = async () => {
    setLoading(true)
    setError('')
    try {
      const mapped = (await listContentDocuments('news', { sort: 'date', direction: 'desc' })).map(mapNews)
      setNews(mapped)
      setOriginalNews(mapped.map(item => ({ ...item })))
    } catch (fetchError) {
      console.error(fetchError)
      setError('교회소식을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleFileChange = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))

    const match = file.name.match(/(\d{4})[.\-_](\d{2})[.\-_](\d{2})/)
    if (match) {
      const dateValue = `${match[1]}-${match[2]}-${match[3]}`
      setForm({ date: dateValue, title: `${match[1]}.${match[2]}.${match[3]} 교회소식` })
    }
    event.target.value = ''
  }

  const handleCreate = async () => {
    if (!selectedFile || !form.date) {
      alert('날짜와 이미지를 입력해 주세요.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const uploaded = await uploadMedia(selectedFile, 'news', setUploadProgress)
      await createContentDocument('news', {
        title: form.title || `${form.date.replace(/-/g, '.')} 교회소식`,
        date: form.date,
        imgUrl: uploaded.url,
        storagePath: uploaded.path,
      })

      setSelectedFile(null)
      setPreview(null)
      setForm({ date: '', title: '' })
      await fetchNews()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '교회소식을 등록했습니다.' } }))
    } catch (saveError) {
      console.error(saveError)
      setError(`등록 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleNewsChange = (newsId, field, value) => {
    setNews(current => current.map(item => (
      item.id === newsId ? { ...item, [field]: value } : item
    )))
  }

  const handleReplaceImage = (newsId, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }

    setNews(current => current.map(item => (
      item.id === newsId
        ? { ...item, pendingFile: file, previewUrl: URL.createObjectURL(file) }
        : item
    )))
    event.target.value = ''
  }

  const handleSaveAll = async () => {
    const invalidNews = news.find(item => !item.title.trim() || !item.dateValue)
    if (invalidNews) {
      alert('제목과 날짜가 비어 있는 교회소식이 있습니다.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const total = news.length || 1
      const nextNews = []

      for (let index = 0; index < news.length; index += 1) {
        const item = news[index]
        let imgUrl = item.imgUrl
        let storagePath = item.storagePath

        if (item.pendingFile) {
          const uploaded = await uploadMedia(item.pendingFile, 'news', (fileProgress) => {
            setUploadProgress(Math.round(((index + fileProgress / 100) / total) * 100))
          })
          imgUrl = uploaded.url
          if (item.storagePath) {
            try { await deleteMedia(item.storagePath) } catch {}
          }
          storagePath = uploaded.path
        }

        await updateContentDocument('news', item.id, {
          title: item.title.trim(),
          date: item.dateValue,
          imgUrl,
          storagePath,
        })

        nextNews.push({
          ...item,
          title: item.title.trim(),
          imgUrl,
          storagePath,
          pendingFile: null,
          previewUrl: '',
        })
      }

      setNews(nextNews)
      setOriginalNews(nextNews.map(item => ({ ...item })))
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '교회소식을 저장했습니다.' } }))
    } catch (saveError) {
      console.error(saveError)
      setError(`저장 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async item => {
    if (!window.confirm(`"${item.title}"을 삭제할까요?`)) return
    try {
      if (item.storagePath) {
        try { await deleteMedia(item.storagePath) } catch {}
      }
      await deleteContentDocument('news', item.id)
      await fetchNews()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: `교회소식을 삭제했습니다. (${item.title})` } }))
    } catch (deleteError) {
      setError(`삭제 중 오류가 발생했습니다: ${deleteError.message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(news.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = news.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>교회소식 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>주간 교회소식 이미지를 상단에서 등록하고, 기존 항목은 목록에서 바로 수정합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>교회소식 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 교회소식을 수정 중입니다. 저장 버튼으로 한 번에 반영하세요.' : '새 교회소식은 아래 폼에서 바로 등록할 수 있습니다.'}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={uploading || !hasUnsavedChanges} style={{ padding: '11px 18px', background: uploading || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: uploading || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {uploading ? `${uploadProgress}%` : '저장'}
        </button>
      </div>

      {error ? <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div> : null}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {preview ? <img src={preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} /> : null}
          <input type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value, title: event.target.value ? `${event.target.value.replace(/-/g, '.')} 교회소식` : '' }))} style={{ padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
          <input type="text" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="제목" style={{ flex: '1 1 180px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {selectedFile ? selectedFile.name.slice(0, 18) : '이미지 선택'}
          </button>
          <button onClick={handleCreate} disabled={uploading || !selectedFile || !form.date} style={{ padding: '8px 18px', background: uploading || !selectedFile || !form.date ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: uploading || !selectedFile || !form.date ? 'default' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            등록
          </button>
        </div>
        {uploading ? (
          <div style={{ marginTop: '10px' }}>
            <div style={{ background: '#dbeafe', borderRadius: '9999px', height: '4px' }}>
              <div style={{ background: '#1d4ed8', height: '4px', borderRadius: '9999px', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}><p style={{ color: '#9ca3af' }}>불러오는 중...</p></div>
      ) : news.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}><p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 교회소식이 없습니다.</p></div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
            {slice.map(item => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '14px', alignItems: 'center' }}>
                <div>
                  {(item.previewUrl || item.imgUrl) ? <img src={item.previewUrl || item.imgUrl} alt="" style={{ width: '96px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} /> : <div style={{ width: '96px', height: '72px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.72rem' }}>이미지 없음</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px' }}>
                  <input type="date" value={item.dateValue || ''} onChange={event => handleNewsChange(item.id, 'dateValue', event.target.value)} style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem' }} />
                  <input value={item.title || ''} onChange={event => handleNewsChange(item.id, 'title', event.target.value)} placeholder="제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input ref={element => { editFileRefs.current[item.id] = element }} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={event => handleReplaceImage(item.id, event)} />
                  <button onClick={() => editFileRefs.current[item.id]?.click()} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}>이미지 변경</button>
                  <button onClick={() => handleDelete(item)} style={{ padding: '8px 12px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, color: '#dc2626' }}>삭제</button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>{Array.from({ length: totalPages }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid', borderColor: number === safePage ? '#1d4ed8' : '#e5e7eb', background: number === safePage ? '#1d4ed8' : '#fff', color: number === safePage ? '#fff' : '#374151', fontSize: '0.825rem', fontWeight: number === safePage ? 700 : 400, cursor: 'pointer' }}>{number}</button>)}</div> : null}
        </>
      )}
    </div>
  )
}
