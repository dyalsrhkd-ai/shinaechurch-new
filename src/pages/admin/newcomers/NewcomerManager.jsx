import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

const PER_PAGE = 15

export default function NewcomerManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ name: '', date: '', file: null, fileName: '', preview: null })
  const fileRef = useRef()

  const fetchItems = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'newcomers'), orderBy('date', 'desc')))
      setItems(snap.docs.map(item => ({ id: item.id, ...item.data() })))
    } catch (error) {
      console.error(error)
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); event.target.value = ''; return }
    setForm(current => ({ ...current, file, fileName: file.name, preview: URL.createObjectURL(file) }))
    event.target.value = ''
  }

  const handleAdd = async () => {
    if (!form.name.trim()) return alert('이름 또는 내용을 입력하세요')
    if (!form.date) return alert('날짜를 입력하세요')

    setSaving(true)
    setProgress(0)
    try {
      let imgUrl = null
      let storagePath = null

      if (form.file) {
        const storageRef = ref(storage, `newcomers/${Date.now()}_${form.file.name}`)
        const task = uploadBytesResumable(storageRef, form.file)
        await new Promise((resolve, reject) => {
          task.on(
            'state_changed',
            snapshot => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
            reject,
            resolve
          )
        })
        imgUrl = await getDownloadURL(storageRef)
        storagePath = storageRef.fullPath
      }

      await addDoc(collection(db, 'newcomers'), {
        name: form.name.trim(),
        date: Timestamp.fromDate(new Date(form.date)),
        imgUrl,
        storagePath,
      })

      if (form.preview) URL.revokeObjectURL(form.preview)
      setForm({ name: '', date: '', file: null, fileName: '', preview: null })
      await fetchItems()
    } catch (error) {
      alert('오류: ' + error.message)
    }
    setSaving(false)
    setProgress(0)
  }

  const handleDelete = async (item) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    if (item.storagePath) {
      try { await deleteObject(ref(storage, item.storagePath)) } catch {}
    }
    await deleteDoc(doc(db, 'newcomers', item.id))
    fetchItems()
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = items.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>새신자소개 관리</h1>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>전체 {items.length}건</p>
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {form.preview && <img src={form.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />}
          <input value={form.name} onChange={e => setForm(c => ({ ...c, name: e.target.value }))} placeholder="이름 또는 내용"
            style={{ flex: '1 1 160px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
          <input type="date" value={form.date} onChange={e => setForm(c => ({ ...c, date: e.target.value }))}
            style={{ padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {form.file ? '✓ ' + form.file.name.slice(0, 12) + '…' : '이미지 선택'}
          </button>
          <button onClick={handleAdd} disabled={saving}
            style={{ padding: '8px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {saving ? `${progress}%` : '+ 등록'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>등록된 새신자가 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px', background: '#0f2040', padding: '10px 16px' }}>
              {['이미지', '이름/내용', '날짜', ''].map(header => (
                <span key={header} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{header}</span>
              ))}
            </div>
            {slice.map((item, index) => (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px',
                padding: '10px 16px', borderBottom: index < slice.length - 1 ? '1px solid #f0f2f5' : 'none',
                background: index % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', gap: '8px'
              }}>
                {item.imgUrl ? (
                  <img src={item.imgUrl} alt={item.name} style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                ) : (
                  <div style={{ width: '70px', height: '50px', borderRadius: '6px', background: '#f3f4f6', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>없음</div>
                )}
                <span style={{ fontSize: '0.82rem', color: '#0f2040', fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.date?.toDate ? item.date.toDate().toISOString().slice(0, 10) : ''}</span>
                <button onClick={() => handleDelete(item)}
                  style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(nextPage => (
              <button key={nextPage} onClick={() => setPage(nextPage)} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem',
                background: safePage === nextPage ? '#0f2040' : '#f3f4f6', color: safePage === nextPage ? '#fff' : '#374151', fontWeight: safePage === nextPage ? 700 : 400
              }}>{nextPage}</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
