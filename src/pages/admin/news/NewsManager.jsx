import { useState, useEffect, useRef } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, orderBy, query, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

const PER_PAGE = 15


export default function NewsManager() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ date: '', title: '' })
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  const fetchNews = async () => {
    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'news'), orderBy('date', 'desc'))
      const snap = await getDocs(q)
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      setError('교회소식을 불러오지 못했습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    // 파일명에서 날짜 자동 추출
    const match = file.name.match(/(\d{4})[.\-_](\d{2})[.\-_](\d{2})/)
    if (match) {
      const dateStr = `${match[1]}-${match[2]}-${match[3]}`
      setForm({ date: dateStr, title: `${match[1]}.${match[2]}.${match[3]} 교회소식` })
    }
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile || !form.date) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const storageRef = ref(storage, `news/${Date.now()}_${selectedFile.name}`)
      const task = uploadBytesResumable(storageRef, selectedFile)
      await new Promise((resolve, reject) => {
        task.on('state_changed',
          snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject, resolve
        )
      })
      const imgUrl = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'news'), {
        title: form.title || `${form.date.replace(/-/g, '.')} 교회소식`,
        date: Timestamp.fromDate(new Date(form.date)),
        imgUrl,
        storagePath: storageRef.fullPath,
      })
      setShowForm(false)
      setSelectedFile(null)
      setPreview(null)
      setForm({ date: '', title: '' })
      fetchNews()
    } catch (err) {
      console.error(err)
      setError('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async n => {
    if (!window.confirm(`"${n.title}"를 삭제할까요?`)) return
    if (n.storagePath) {
      try { await deleteObject(ref(storage, n.storagePath)) } catch {}
    }
    await deleteDoc(doc(db, 'news', n.id))
    fetchNews()
  }

  const totalPages = Math.ceil(news.length / PER_PAGE)
  const slice = news.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>교회소식 관리</h1>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>주간 교회소식 이미지를 등록합니다</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setSelectedFile(null); setPreview(null); setForm({ date: '', title: '' }) }}
          style={{ padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          + 교회소식 등록
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* 등록 폼 */}
      {showForm && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {preview && <img src={preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />}
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value, title: e.target.value ? `${e.target.value.replace(/-/g, '.')} 교회소식` : '' }))}
              style={{ padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목"
              style={{ flex: '1 1 140px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
              {selectedFile ? '✓ ' + selectedFile.name.slice(0, 12) + '…' : '이미지 선택'}
            </button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile || !form.date}
              style={{ padding: '8px 18px', background: !selectedFile || !form.date ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {uploading ? `${uploadProgress}%` : '+ 등록'}
            </button>
          </div>
          {uploading && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ background: '#dbeafe', borderRadius: '9999px', height: '4px' }}>
                <div style={{ background: '#1d4ed8', height: '4px', borderRadius: '9999px', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
        </div>
      ) : news.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 교회소식이 없습니다</p>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 110px 70px', background: '#0f2040', padding: '12px 20px' }}>
              {['미리보기', '제목', '등록일', ''].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
              ))}
            </div>
            {slice.map((n, i) => (
              <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 110px 70px', padding: '12px 20px', borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', gap: '12px' }}>
                {n.imgUrl
                  ? <img src={n.imgUrl} alt="" style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                  : <div style={{ width: '64px', height: '40px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>없음</span>
                    </div>
                }
                <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500 }}>{n.title}</span>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{n.date?.toDate ? n.date.toDate().toISOString().slice(0, 10) : ''}</span>
                <button onClick={() => handleDelete(n)} style={{ padding: '5px 12px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626', width: 'fit-content' }}>삭제</button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid', borderColor: p === page ? '#1d4ed8' : '#e5e7eb', background: p === page ? '#1d4ed8' : '#fff', color: p === page ? '#fff' : '#374151', fontSize: '0.825rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
