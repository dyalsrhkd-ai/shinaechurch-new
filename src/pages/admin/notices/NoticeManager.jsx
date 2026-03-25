import { useState, useEffect, useRef } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, orderBy, query, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, updateMetadata } from 'firebase/storage'
import { db, storage } from '../../../firebase'

const BADGES = ['공지', '모집', '안내']

const defaultForm = { title: '', badge: '공지', date: '', content: '', file: null, fileName: '' }

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}.${day}`
}

function toInputDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toISOString().slice(0, 10)
}

export default function NoticeManager() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [editId, setEditId] = useState(null)
  const [editOldFile, setEditOldFile] = useState(null) // 기존 첨부파일 storagePath
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef()

  const fetchNotices = async () => {
    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'notices'), orderBy('date', 'desc'))
      const snap = await getDocs(q)
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      setError('공지사항을 불러오지 못했습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotices() }, [])

  const openAdd = () => {
    setEditId(null)
    setEditOldFile(null)
    setForm(defaultForm)
    setUploadProgress(0)
    setShowForm(true)
  }

  const openEdit = notice => {
    setEditId(notice.id)
    setEditOldFile(notice.fileStoragePath || null)
    setForm({
      title: notice.title,
      badge: notice.badge,
      date: toInputDate(notice.date),
      content: notice.content || '',
      file: null,
      fileName: notice.fileName || '',
    })
    setUploadProgress(0)
    setShowForm(true)
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, file, fileName: file.name }))
    e.target.value = ''
  }

  const removeFile = () => setForm(f => ({ ...f, file: null, fileName: '' }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    setUploadProgress(0)
    try {
      const dateTs = Timestamp.fromDate(new Date(form.date))
      const data = { title: form.title.trim(), badge: form.badge, date: dateTs, content: form.content.trim() }

      if (form.file) {
        // 새 파일 업로드
        const storageRef = ref(storage, `notices/${Date.now()}_${form.file.name}`)
        const task = uploadBytesResumable(storageRef, form.file, {
          contentDisposition: `attachment; filename="${form.file.name}"`,
        })
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject,
            resolve
          )
        })
        data.fileUrl = await getDownloadURL(storageRef)
        data.fileStoragePath = storageRef.fullPath
        data.fileName = form.file.name
        // 기존 파일 삭제
        if (editOldFile) {
          try { await deleteObject(ref(storage, editOldFile)) } catch {}
        }
      } else if (editId && !form.fileName) {
        // 수정 시 파일을 제거한 경우
        data.fileUrl = null
        data.fileStoragePath = null
        data.fileName = null
        if (editOldFile) {
          try { await deleteObject(ref(storage, editOldFile)) } catch {}
        }
      }

      if (editId) {
        await updateDoc(doc(db, 'notices', editId), data)
      } else {
        await addDoc(collection(db, 'notices'), data)
      }

      sessionStorage.removeItem('mainNotices')
      setShowForm(false)
      setForm(defaultForm)
      setEditId(null)
      setEditOldFile(null)
      fetchNotices()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async notice => {
    if (!window.confirm(`"${notice.title}"를 삭제할까요?`)) return
    if (notice.fileStoragePath) {
      try { await deleteObject(ref(storage, notice.fileStoragePath)) } catch {}
    }
    await deleteDoc(doc(db, 'notices', notice.id))
    sessionStorage.removeItem('mainNotices')
    fetchNotices()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>공지사항 관리</h1>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>메인 화면 및 공지사항 페이지에 표시됩니다</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          + 공지 작성
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* 작성/수정 폼 */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2040', marginBottom: '20px' }}>
            {editId ? '공지 수정' : '공지 작성'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>제목</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="공지 제목을 입력하세요"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>구분</label>
                <select
                  value={form.badge}
                  onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', background: '#fff' }}
                >
                  {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>날짜</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            {/* 본문 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                본문 <span style={{ fontWeight: 400, color: '#9ca3af' }}>(선택)</span>
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="공지 내용을 입력하세요"
                rows={5}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
              />
            </div>

            {/* 파일 첨부 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                첨부파일 <span style={{ fontWeight: 400, color: '#9ca3af' }}>(선택)</span>
              </label>
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
              {form.fileName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <svg width="16" height="16" fill="#1d4ed8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                  <span style={{ flex: 1, fontSize: '0.825rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.fileName}</span>
                  <button
                    onClick={removeFile}
                    style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', lineHeight: 1 }}
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', border: '1px dashed #d1d5db', borderRadius: '8px', background: '#f9fafb', color: '#6b7280', fontSize: '0.825rem', cursor: 'pointer', width: '100%' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  파일 첨부하기
                </button>
              )}
              {saving && uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '3px' }}>
                    <span>업로드 중...</span><span>{uploadProgress}%</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '9999px', height: '5px' }}>
                    <div style={{ background: '#1d4ed8', height: '5px', borderRadius: '9999px', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowForm(false); setForm(defaultForm); setEditId(null); setEditOldFile(null) }}
              disabled={saving}
              style={{ padding: '9px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.date}
              style={{ padding: '9px 20px', background: saving || !form.title.trim() || !form.date ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 700 }}
            >
              {saving ? '저장 중...' : editId ? '수정 완료' : '등록'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
        </div>
      ) : notices.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 공지사항이 없습니다</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>
          {notices.map((n, i) => (
            <div
              key={n.id}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: i < notices.length - 1 ? '1px solid #f0f2f5' : 'none' }}
            >
              <span style={{
                flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px',
                background: n.badge === '모집' ? '#fff7ed' : n.badge === '안내' ? '#f0fdf4' : '#eff6ff',
                color: n.badge === '모집' ? '#c2610c' : n.badge === '안내' ? '#15803d' : '#1d4ed8',
              }}>
                {n.badge}
              </span>
              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#1e3a5f' }}>{n.title}</span>
              {n.fileUrl && (
                <a
                  href={n.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={n.fileName}
                  style={{ flexShrink: 0, color: '#1d4ed8', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="16" height="16" fill="#1d4ed8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                </a>
              )}
              <span style={{ flexShrink: 0, fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', minWidth: '40px' }}>
                {formatDate(n.date)}
              </span>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(n)}
                  style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(n)}
                  style={{ padding: '5px 12px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
