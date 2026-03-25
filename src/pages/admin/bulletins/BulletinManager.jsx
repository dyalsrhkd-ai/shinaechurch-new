import { useState, useEffect, useRef } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, orderBy, query, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateDocFile } from '../../../utils/fileValidation'

export default function BulletinManager() {
  const [bulletins, setBulletins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [page, setPage] = useState(1)
  const PER_PAGE = 15
  const fileRef = useRef()

  const fetchBulletins = async () => {
    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'bulletins'), orderBy('date', 'desc'))
      const snap = await getDocs(q)
      setBulletins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      setError('주보를 불러오지 못했습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBulletins() }, [])

  const handleUpload = async e => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    const err = validateDocFile(file)
    if (err) { alert(err); return }

    setUploading(true)
    setUploadProgress(0)
    try {
      const storageRef = ref(storage, `bulletins/${Date.now()}_${file.name}`)
      const task = uploadBytesResumable(storageRef, file, {
        contentDisposition: `attachment; filename="${file.name}"`,
      })
      await new Promise((resolve, reject) => {
        task.on('state_changed',
          snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject, resolve
        )
      })
      const fileUrl = await getDownloadURL(storageRef)

      // 날짜 자동 추출 (파일명에서 YYYY-MM-DD 패턴)
      const match = file.name.match(/(\d{4})[.\-_](\d{2})[.\-_](\d{2})/)
      const dateStr = match ? `${match[1]}-${match[2]}-${match[3]}` : new Date().toISOString().slice(0, 10)
      const title = `${dateStr.replace(/-/g, '.')} 주보`

      await addDoc(collection(db, 'bulletins'), {
        title,
        date: Timestamp.fromDate(new Date(dateStr)),
        fileUrl,
        fileName: file.name,
        fileType: file.name.split('.').pop().toLowerCase(),
        storagePath: storageRef.fullPath,
      })
      sessionStorage.removeItem('mainBulletins')
      fetchBulletins()
    } catch (err) {
      console.error(err)
      setError('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async b => {
    if (!window.confirm(`"${b.title}"를 삭제할까요?`)) return
    if (b.storagePath) {
      try { await deleteObject(ref(storage, b.storagePath)) } catch {}
    }
    await deleteDoc(doc(db, 'bulletins', b.id))
    sessionStorage.removeItem('mainBulletins')
    fetchBulletins()
  }

  const totalPages = Math.ceil(bulletins.length / PER_PAGE)
  const slice = bulletins.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>주보 관리</h1>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>HWP, PDF, DOC, XLS, PPT 등 문서 파일 (최대 200MB) · 파일명에 날짜 포함 시 자동 설정</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input ref={fileRef} type="file" accept=".hwp,.hwpx,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={handleUpload} />
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: uploading ? '#c4b5fd' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: uploading ? 'default' : 'pointer' }}
          >
            {uploading ? `업로드 중 ${uploadProgress}%` : '+ 주보 업로드'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
        </div>
      ) : bulletins.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 주보가 없습니다</p>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 80px', background: '#0f2040', padding: '12px 20px' }}>
              {['제목', '형식', '등록일', ''].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
              ))}
            </div>
            {slice.map((b, i) => (
              <div
                key={b.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 80px', padding: '13px 20px', borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}
              >
                <a
                  href={b.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0f2040'}
                >
                  {b.title}
                </a>
                <span style={{ fontSize: '0.72rem', color: '#fff', background: { pdf: '#dc2626', xls: '#16a34a', xlsx: '#16a34a', ppt: '#ea580c', pptx: '#ea580c', doc: '#2563eb', docx: '#2563eb' }[b.fileType] || '#0284c7', padding: '2px 8px', borderRadius: '9999px', textAlign: 'center', width: 'fit-content' }}>
                  {b.fileType?.toUpperCase() || 'HWP'}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  {b.date?.toDate ? b.date.toDate().toISOString().slice(0, 10) : ''}
                </span>
                <button
                  onClick={() => handleDelete(b)}
                  style={{ padding: '5px 12px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626', width: 'fit-content' }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid', borderColor: p === page ? '#1d4ed8' : '#e5e7eb', background: p === page ? '#1d4ed8' : '#fff', color: p === page ? '#fff' : '#374151', fontSize: '0.825rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
