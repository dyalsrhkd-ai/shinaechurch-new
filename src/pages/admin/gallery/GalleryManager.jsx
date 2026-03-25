import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { EVENT_DEPTS } from '../../../data/media'
import { validateImageFile } from '../../../utils/fileValidation'

const PER_PAGE = 20

export default function GalleryManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState('전체')
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ label: '', dept: '기타', file: null, preview: null })
  const fileRef = useRef()

  const fetchItems = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'gallery'), orderBy('order', 'desc'))
      const snap = await getDocs(q)
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const eventItems = items.filter(item => item.dept !== '성가대')
  const filtered = filterDept === '전체' ? eventItems : eventItems.filter(i => i.dept === filterDept)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, file, preview: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!form.label.trim()) return alert('제목을 입력하세요')
    if (!form.file) return alert('이미지를 선택하세요')
    setUploading(true)
    try {
      const storageRef = ref(storage, `gallery/${Date.now()}_${form.file.name}`)
      await uploadBytes(storageRef, form.file)
      const imgUrl = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'gallery'), {
        label: form.label.trim(),
        dept: form.dept,
        imgUrl,
        order: Date.now(),
        createdAt: serverTimestamp(),
      })
      setForm({ label: '', dept: '기타', file: null, preview: null })
      if (fileRef.current) fileRef.current.value = ''
      await fetchItems()
    } catch (e) { alert('오류: ' + e.message) }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'gallery', id))
    fetchItems()
  }

  const handleDeptChange = async (id, dept) => {
    try {
      await updateDoc(doc(db, 'gallery', id), { dept })
      setItems(current => current.map(item => item.id === id ? { ...item, dept } : item))
    } catch (e) {
      alert('오류: ' + e.message)
    }
  }

  const btn = (active, onClick, children) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 700 : 400,
      background: active ? '#0f2040' : '#f3f4f6', color: active ? '#fff' : '#374151'
    }}>{children}</button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>행사갤러리 관리</h1>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>전체 {eventItems.length}장</p>
        </div>
        <div />
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {form.preview && <img src={form.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />}
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="사진 제목"
            style={{ flex: '1 1 160px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
          <select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
            style={{ padding: '8px 10px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem', background: '#fff' }}>
            {EVENT_DEPTS.filter(d => d !== '전체').map(d => <option key={d}>{d}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {form.file ? '✓ ' + form.file.name.slice(0, 12) + '…' : '이미지 선택'}
          </button>
          <button onClick={handleUpload} disabled={uploading}
            style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {uploading ? '업로드 중...' : '+ 등록'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {EVENT_DEPTS.map(d => btn(filterDept === d, () => { setFilterDept(d); setPage(1) }, d))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>항목이 없습니다.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {slice.map(item => (
              <div key={item.id} style={{ border: '1px solid #eaecf0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={item.imgUrl} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <select
                      value={item.dept}
                      onChange={(e) => handleDeptChange(item.id, e.target.value)}
                      style={{ flex: 1, minWidth: 0, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.68rem', background: '#fff' }}
                    >
                      {EVENT_DEPTS.filter(d => d !== '전체').map(d => <option key={d}>{d}</option>)}
                    </select>
                    <button onClick={() => handleDelete(item.id)} style={{ fontSize: '0.7rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem',
                background: page === p ? '#0f2040' : '#f3f4f6', color: page === p ? '#fff' : '#374151', fontWeight: page === p ? 700 : 400
              }}>{p}</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
