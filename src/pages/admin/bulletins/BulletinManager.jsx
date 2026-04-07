import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateDocFile } from '../../../utils/fileValidation'

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

function serializeItems(list) {
  return JSON.stringify(list.map((item) => ({
    id: item.id,
    title: item.title || '',
    dateValue: item.dateValue || '',
    fileUrl: item.fileUrl || '',
    fileName: item.fileName || '',
    storagePath: item.storagePath || '',
    pendingFileName: item.pendingFile?.name || '',
  })))
}

export default function BulletinManager() {
  const [bulletins, setBulletins] = useState([])
  const [originalBulletins, setOriginalBulletins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ title: '', date: '', file: null, fileName: '' })
  const fileRef = useRef(null)
  const editFileRefs = useRef({})

  const hasUnsavedChanges = useMemo(
    () => serializeItems(bulletins) !== serializeItems(originalBulletins),
    [bulletins, originalBulletins],
  )

  const fetchBulletins = async () => {
    setLoading(true)
    setError('')
    try {
      const snapshot = await getDocs(query(collection(db, 'bulletins'), orderBy('date', 'desc')))
      const mapped = snapshot.docs.map((item) => {
        const data = item.data()
        return {
          id: item.id,
          ...data,
          dateValue: toInputDate(data.date),
          pendingFile: null,
        }
      })
      setBulletins(mapped)
      setOriginalBulletins(mapped.map((item) => ({ ...item })))
    } catch (fetchError) {
      console.error(fetchError)
      setError('주보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBulletins()
  }, [])

  const handleNewFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateDocFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }

    const match = file.name.match(/(\d{4})[.\-_](\d{2})[.\-_](\d{2})/)
    const dateValue = match ? `${match[1]}-${match[2]}-${match[3]}` : new Date().toISOString().slice(0, 10)

    setForm({
      title: `${dateValue.replace(/-/g, '.')} 주보`,
      date: dateValue,
      file,
      fileName: file.name,
    })
    event.target.value = ''
  }

  const handleCreate = async () => {
    if (!form.file) {
      alert('문서 파일을 선택해 주세요.')
      return
    }

    if (!form.date) {
      alert('날짜를 입력해 주세요.')
      return
    }

    setSaving(true)
    setUploadProgress(0)
    try {
      const storageRef = ref(storage, `bulletins/${Date.now()}_${form.file.name}`)
      const task = uploadBytesResumable(storageRef, form.file, {
        contentDisposition: `attachment; filename="${form.file.name}"`,
      })

      await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
          reject,
          resolve,
        )
      })

      const fileUrl = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'bulletins'), {
        title: form.title.trim() || `${form.date.replace(/-/g, '.')} 주보`,
        date: Timestamp.fromDate(new Date(form.date)),
        fileUrl,
        fileName: form.file.name,
        fileType: form.file.name.split('.').pop()?.toLowerCase() || '',
        storagePath: storageRef.fullPath,
      })

      sessionStorage.removeItem('mainBulletins')
      setForm({ title: '', date: '', file: null, fileName: '' })
      await fetchBulletins()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '주보를 등록했습니다.' } }))
    } catch (saveError) {
      setError(`등록 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleItemChange = (itemId, field, value) => {
    setBulletins((current) => current.map((item) => (
      item.id === itemId ? { ...item, [field]: value } : item
    )))
  }

  const handleReplaceFile = (itemId, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateDocFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }

    setBulletins((current) => current.map((item) => (
      item.id === itemId ? { ...item, pendingFile: file, fileName: file.name } : item
    )))
    event.target.value = ''
  }

  const handleSaveAll = async () => {
    const invalidItem = bulletins.find((item) => !item.title?.trim() || !item.dateValue)
    if (invalidItem) {
      alert('제목 또는 날짜가 비어 있는 주보가 있습니다.')
      return
    }

    setSaving(true)
    setUploadProgress(0)
    try {
      const total = bulletins.length || 1
      const nextItems = []

      for (let index = 0; index < bulletins.length; index += 1) {
        const item = bulletins[index]
        let fileUrl = item.fileUrl || ''
        let fileName = item.fileName || ''
        let fileType = item.fileType || ''
        let storagePath = item.storagePath || ''

        if (item.pendingFile) {
          const storageRef = ref(storage, `bulletins/${Date.now()}_${item.pendingFile.name}`)
          const task = uploadBytesResumable(storageRef, item.pendingFile, {
            contentDisposition: `attachment; filename="${item.pendingFile.name}"`,
          })

          await new Promise((resolve, reject) => {
            task.on(
              'state_changed',
              (snapshot) => {
                const fileProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                const totalProgress = Math.round(((index + fileProgress / 100) / total) * 100)
                setUploadProgress(totalProgress)
              },
              reject,
              resolve,
            )
          })

          fileUrl = await getDownloadURL(storageRef)
          if (item.storagePath) {
            try { await deleteObject(ref(storage, item.storagePath)) } catch {}
          }
          storagePath = storageRef.fullPath
          fileName = item.pendingFile.name
          fileType = item.pendingFile.name.split('.').pop()?.toLowerCase() || ''
        }

        await updateDoc(doc(db, 'bulletins', item.id), {
          title: item.title.trim(),
          date: Timestamp.fromDate(new Date(item.dateValue)),
          fileUrl,
          fileName,
          fileType,
          storagePath,
        })

        nextItems.push({
          ...item,
          title: item.title.trim(),
          fileUrl,
          fileName,
          fileType,
          storagePath,
          pendingFile: null,
        })
      }

      sessionStorage.removeItem('mainBulletins')
      setBulletins(nextItems)
      setOriginalBulletins(nextItems.map((item) => ({ ...item })))
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '주보를 저장했습니다.' } }))
    } catch (saveError) {
      setError(`저장 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}"을(를) 삭제할까요?`)) return

    try {
      if (item.storagePath) {
        try { await deleteObject(ref(storage, item.storagePath)) } catch {}
      }
      await deleteDoc(doc(db, 'bulletins', item.id))
      sessionStorage.removeItem('mainBulletins')
      await fetchBulletins()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: `주보를 삭제했습니다. (${item.title})` } }))
    } catch (deleteError) {
      setError(`삭제 중 오류가 발생했습니다: ${deleteError.message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(bulletins.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = bulletins.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>주보 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
          주보 파일을 상단에서 등록하고, 기존 항목은 아래 목록에서 바로 수정합니다.
        </p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>주보 리스트 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 주보를 수정 중입니다. 저장 버튼으로 한 번에 반영해 주세요.' : '새 주보는 아래 등록 카드에서 바로 추가할 수 있습니다.'}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? `${uploadProgress}%` : '저장'}
        </button>
      </div>

      {error ? <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div> : null}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <input ref={fileRef} type="file" accept=".hwp,.hwpx,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={handleNewFileChange} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((current) => ({
              ...current,
              date: event.target.value,
              title: event.target.value ? `${event.target.value.replace(/-/g, '.')} 주보` : current.title,
            }))}
            style={{ padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }}
          />
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="제목"
            style={{ flex: '1 1 180px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }}
          />
          <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {form.fileName ? form.fileName.slice(0, 18) : '문서 선택'}
          </button>
          <button onClick={handleCreate} disabled={saving || !form.file || !form.date} style={{ padding: '8px 18px', background: saving || !form.file || !form.date ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: saving || !form.file || !form.date ? 'default' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            등록
          </button>
        </div>
        {saving ? (
          <div style={{ marginTop: '10px' }}>
            <div style={{ background: '#dbeafe', borderRadius: '9999px', height: '4px' }}>
              <div style={{ background: '#1d4ed8', height: '4px', borderRadius: '9999px', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
        </div>
      ) : bulletins.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 주보가 없습니다.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
            {slice.map((item) => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '14px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <input type="date" value={item.dateValue || ''} onChange={(event) => handleItemChange(item.id, 'dateValue', event.target.value)} style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem' }} />
                  <div style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f8fafc', fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.fileName || '첨부 파일 없음'}
                  </div>
                </div>
                <input value={item.title || ''} onChange={(event) => handleItemChange(item.id, 'title', event.target.value)} placeholder="제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', color: '#374151', fontWeight: 700, textDecoration: 'none' }}>
                    열기
                  </a>
                  <input ref={(element) => { editFileRefs.current[item.id] = element }} type="file" accept=".hwp,.hwpx,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={(event) => handleReplaceFile(item.id, event)} />
                  <button onClick={() => editFileRefs.current[item.id]?.click()} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}>
                    파일 변경
                  </button>
                  <button onClick={() => handleDelete(item)} style={{ padding: '8px 12px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, color: '#dc2626' }}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button key={number} onClick={() => setPage(number)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid', borderColor: number === safePage ? '#1d4ed8' : '#e5e7eb', background: number === safePage ? '#1d4ed8' : '#fff', color: number === safePage ? '#fff' : '#374151', fontSize: '0.825rem', fontWeight: number === safePage ? 700 : 400, cursor: 'pointer' }}>
                  {number}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
