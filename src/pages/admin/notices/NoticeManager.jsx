import { useEffect, useMemo, useRef, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { deleteMedia, uploadMedia } from '../../../utils/mediaStorage'

const BADGES = ['공지', '모집', '안내']
const defaultForm = { title: '', badge: '공지', date: '', content: '', file: null, fileName: '' }

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

function mapNotice(data) {
  return {
    id: data.id,
    title: data.title || '',
    badge: data.badge || '공지',
    dateValue: toInputDate(data.date),
    content: data.content || '',
    fileUrl: data.fileUrl || '',
    fileStoragePath: data.fileStoragePath || '',
    fileName: data.fileName || '',
    pendingFile: null,
  }
}

function serializeNotices(list) {
  return JSON.stringify(list.map(item => ({
    id: item.id,
    title: item.title || '',
    badge: item.badge || '',
    dateValue: item.dateValue || '',
    content: item.content || '',
    fileUrl: item.fileUrl || '',
    fileStoragePath: item.fileStoragePath || '',
    fileName: item.fileName || '',
    pendingFileName: item.pendingFile?.name || '',
  })))
}

export default function NoticeManager() {
  const [notices, setNotices] = useState([])
  const [originalNotices, setOriginalNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form, setForm] = useState(defaultForm)
  const fileRef = useRef(null)
  const editFileRefs = useRef({})

  const hasUnsavedChanges = useMemo(
    () => serializeNotices(notices) !== serializeNotices(originalNotices),
    [notices, originalNotices]
  )

  const fetchNotices = async () => {
    setLoading(true)
    setError('')
    try {
      const mapped = (await listContentDocuments('notices', { sort: 'date', direction: 'desc' })).map(mapNotice)
      setNotices(mapped)
      setOriginalNotices(mapped.map(item => ({ ...item })))
    } catch (fetchError) {
      console.error(fetchError)
      setError('공지사항을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleNewFileChange = event => {
    const file = event.target.files?.[0]
    if (!file) return
    setForm(current => ({ ...current, file, fileName: file.name }))
    event.target.value = ''
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.date) {
      alert('제목과 날짜를 입력해 주세요.')
      return
    }

    setSaving(true)
    setUploadProgress(0)
    try {
      const payload = {
        title: form.title.trim(),
        badge: form.badge,
        date: form.date,
        content: form.content.trim(),
      }

      if (form.file) {
        const uploaded = await uploadMedia(form.file, 'notices', setUploadProgress)
        payload.fileUrl = uploaded.url
        payload.fileStoragePath = uploaded.path
        payload.fileName = form.file.name
      }

      await createContentDocument('notices', payload)
      sessionStorage.removeItem('mainNotices')
      setForm(defaultForm)
      await fetchNotices()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '공지사항을 등록했습니다.' } }))
    } catch (saveError) {
      console.error(saveError)
      alert(`등록 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleNoticeChange = (noticeId, field, value) => {
    setNotices(current => current.map(item => (
      item.id === noticeId ? { ...item, [field]: value } : item
    )))
  }

  const handleReplaceFile = (noticeId, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setNotices(current => current.map(item => (
      item.id === noticeId ? { ...item, pendingFile: file, fileName: file.name } : item
    )))
    event.target.value = ''
  }

  const handleRemoveFile = noticeId => {
    setNotices(current => current.map(item => (
      item.id === noticeId ? { ...item, fileUrl: '', fileStoragePath: '', fileName: '', pendingFile: null } : item
    )))
  }

  const handleSaveAll = async () => {
    const invalidNotice = notices.find(item => !item.title.trim() || !item.dateValue)
    if (invalidNotice) {
      alert('제목과 날짜가 비어 있는 공지사항이 있습니다.')
      return
    }

    setSaving(true)
    setUploadProgress(0)
    try {
      const total = notices.length || 1
      const nextNotices = []

      for (let index = 0; index < notices.length; index += 1) {
        const item = notices[index]
        let fileUrl = item.fileUrl
        let fileStoragePath = item.fileStoragePath
        let fileName = item.fileName

        if (item.pendingFile) {
          const uploaded = await uploadMedia(item.pendingFile, 'notices', (fileProgress) => {
            setUploadProgress(Math.round(((index + fileProgress / 100) / total) * 100))
          })
          fileUrl = uploaded.url
          if (item.fileStoragePath) {
            try { await deleteMedia(item.fileStoragePath) } catch {}
          }
          fileStoragePath = uploaded.path
          fileName = item.pendingFile.name
        }

        const payload = {
          title: item.title.trim(),
          badge: item.badge,
          date: item.dateValue,
          content: item.content.trim(),
          fileUrl: fileUrl || null,
          fileStoragePath: fileStoragePath || null,
          fileName: fileName || null,
        }

        await updateContentDocument('notices', item.id, payload)
        nextNotices.push({
          ...item,
          title: payload.title,
          content: payload.content,
          fileUrl: payload.fileUrl || '',
          fileStoragePath: payload.fileStoragePath || '',
          fileName: payload.fileName || '',
          pendingFile: null,
        })
      }

      sessionStorage.removeItem('mainNotices')
      setNotices(nextNotices)
      setOriginalNotices(nextNotices.map(item => ({ ...item })))
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '공지사항을 저장했습니다.' } }))
    } catch (saveError) {
      console.error(saveError)
      alert(`저장 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async notice => {
    if (!window.confirm(`"${notice.title}"을 삭제할까요?`)) return
    try {
      if (notice.fileStoragePath) {
        try { await deleteMedia(notice.fileStoragePath) } catch {}
      }
      await deleteContentDocument('notices', notice.id)
      sessionStorage.removeItem('mainNotices')
      await fetchNotices()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: `공지사항을 삭제했습니다. (${notice.title})` } }))
    } catch (deleteError) {
      alert(`삭제 중 오류가 발생했습니다: ${deleteError.message}`)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>공지사항 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>상단 등록 폼으로 새 공지를 만들고, 기존 공지는 목록에서 바로 수정합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>공지사항 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 공지사항을 수정 중입니다. 저장 버튼으로 한 번에 반영하세요.' : '새 공지는 아래 폼으로 바로 등록할 수 있습니다.'}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? `${uploadProgress}%` : '저장'}
        </button>
      </div>

      {error ? <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div> : null}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2040', marginBottom: '14px' }}>새 공지 등록</p>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 160px 1fr auto', gap: '12px', marginBottom: '12px' }}>
          <select value={form.badge} onChange={event => setForm(current => ({ ...current, badge: event.target.value }))} style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#fff' }}>
            {BADGES.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px' }} />
          <input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="공지 제목" style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px' }} />
          <button onClick={handleCreate} disabled={saving} style={{ padding: '10px 18px', border: 'none', borderRadius: '8px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>등록</button>
        </div>
        <textarea value={form.content} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} placeholder="공지 내용을 입력하세요." rows={4} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', resize: 'vertical', marginBottom: '10px', fontFamily: 'inherit', lineHeight: 1.7 }} />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleNewFileChange} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}>첨부파일 선택</button>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{form.fileName || '선택된 파일 없음'}</span>
          {form.fileName ? <button onClick={() => setForm(current => ({ ...current, file: null, fileName: '' }))} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#64748b', cursor: 'pointer' }}>파일 제거</button> : null}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : notices.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px' }}>등록된 공지사항이 없습니다.</div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {notices.map(item => (
            <div key={item.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 160px 1fr auto', gap: '10px' }}>
                <select value={item.badge} onChange={event => handleNoticeChange(item.id, 'badge', event.target.value)} style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', background: '#fff' }}>
                  {BADGES.map(badge => <option key={badge} value={badge}>{badge}</option>)}
                </select>
                <input type="date" value={item.dateValue || ''} onChange={event => handleNoticeChange(item.id, 'dateValue', event.target.value)} style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                <input value={item.title || ''} onChange={event => handleNoticeChange(item.id, 'title', event.target.value)} placeholder="공지 제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <input ref={element => { editFileRefs.current[item.id] = element }} type="file" style={{ display: 'none' }} onChange={event => handleReplaceFile(item.id, event)} />
                  <button onClick={() => editFileRefs.current[item.id]?.click()} style={{ padding: '8px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#fff', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}>파일 변경</button>
                  <button onClick={() => handleDelete(item)} style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                </div>
              </div>
              <textarea value={item.content || ''} onChange={event => handleNoticeChange(item.id, 'content', event.target.value)} rows={4} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #dbe4f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{item.fileName ? `첨부: ${item.fileName}` : '첨부파일 없음'}</span>
                  {item.fileName ? <button onClick={() => handleRemoveFile(item.id)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#64748b', cursor: 'pointer' }}>파일 제거</button> : null}
                  {item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>현재 파일 열기</a> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
