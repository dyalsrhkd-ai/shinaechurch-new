import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

export default function SlideManager() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [queue, setQueue] = useState([]) // [{ file, preview, title, sub }]
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState([]) // [{ name, progress, done }]
  const fileRef = useRef()

  const fetchSlides = async () => {
    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'slides'), orderBy('order'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // order 값이 꼬여 있으면 인덱스 기준으로 재정렬
      const needsFix = data.some((s, i) => s.order !== i)
      if (needsFix) {
        await Promise.all(data.map((s, i) => updateDoc(doc(db, 'slides', s.id), { order: i })))
        sessionStorage.removeItem('mainSlides')
      }
      setSlides(data)
    } catch (e) {
      setError('슬라이드를 불러오지 못했습니다. Firebase 규칙을 확인해주세요.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSlides() }, [])

  const handleFilesChange = e => {
    const files = Array.from(e.target.files)
    const invalid = files.map(f => validateImageFile(f)).filter(Boolean)
    if (invalid.length > 0) { alert(invalid[0]); e.target.value = ''; return }
    const newItems = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: '',
      sub: '',
    }))
    setQueue(q => [...q, ...newItems])
    e.target.value = ''
  }

  const updateQueue = (i, field, value) => {
    setQueue(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const removeFromQueue = i => {
    setQueue(q => q.filter((_, idx) => idx !== i))
  }

  const handleUploadAll = async () => {
    if (queue.length === 0) return
    setUploading(true)
    setUploadStatus(queue.map(item => ({ name: item.file.name, progress: 0, done: false })))

    let baseOrder = slides.length
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      try {
        const storageRef = ref(storage, `slides/${Date.now()}_${item.file.name}`)
        const task = uploadBytesResumable(storageRef, item.file)
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            snap => {
              const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100)
              setUploadStatus(s => s.map((u, idx) => idx === i ? { ...u, progress: pct } : u))
            },
            reject,
            resolve
          )
        })
        const imgUrl = await getDownloadURL(storageRef)
        await addDoc(collection(db, 'slides'), {
          imgUrl,
          storagePath: storageRef.fullPath,
          title: item.title,
          sub: item.sub,
          order: baseOrder + i,
          active: true,
        })
        setUploadStatus(s => s.map((u, idx) => idx === i ? { ...u, done: true, progress: 100 } : u))
      } catch (e) {
        console.error(e)
      }
    }

    setUploading(false)
    setQueue([])
    setUploadStatus([])
    setShowForm(false)
    clearCache()
    fetchSlides()
  }

  const clearCache = () => sessionStorage.removeItem('mainSlides')

  const handleDelete = async slide => {
    if (!window.confirm(`"${slide.title || '이 슬라이드'}"를 삭제할까요?`)) return
    if (slide.storagePath) {
      try { await deleteObject(ref(storage, slide.storagePath)) } catch {}
    }
    await deleteDoc(doc(db, 'slides', slide.id))
    clearCache()
    fetchSlides()
  }

  const handleToggle = async slide => {
    await updateDoc(doc(db, 'slides', slide.id), { active: !slide.active })
    clearCache()
    fetchSlides()
  }

  const handleMove = async (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= slides.length) return
    // order 값이 중복일 수 있으므로 인덱스 기반으로 재할당
    const reordered = [...slides]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(next, 0, moved)
    await Promise.all(
      reordered.map((s, idx) => updateDoc(doc(db, 'slides', s.id), { order: idx }))
    )
    clearCache()
    fetchSlides()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>슬라이더 관리</h1>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>메인 화면 자동 슬라이더 이미지를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          + 슬라이드 추가
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* 추가 폼 */}
      {showForm && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2040' }}>슬라이드 추가</h3>
            <button
              onClick={() => fileRef.current.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px dashed #1d4ed8', borderRadius: '8px', background: '#fff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              + 이미지 선택 (여러 장 가능)
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" multiple style={{ display: 'none' }} onChange={handleFilesChange} />
          </div>

          {queue.length === 0 ? (
            <div
              onClick={() => fileRef.current.click()}
              style={{ border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '48px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb' }}
            >
              <svg width="40" height="40" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>클릭하여 이미지 선택</p>
              <p style={{ color: '#d1d5db', fontSize: '0.775rem', marginTop: '4px' }}>여러 장을 한 번에 선택할 수 있습니다</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {queue.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '16px', alignItems: 'start', background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
                  <img src={item.preview} alt="" style={{ width: '100%', aspectRatio: '16/7', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>제목 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(줄바꿈: Enter)</span></label>
                      <textarea
                        value={item.title}
                        onChange={e => updateQueue(i, 'title', e.target.value)}
                        placeholder={'하나님의 은혜 안에서\n함께 자라는 교회'}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.825rem', resize: 'none', boxSizing: 'border-box', outline: 'none', background: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>부제목</label>
                      <input
                        type="text"
                        value={item.sub}
                        onChange={e => updateQueue(i, 'sub', e.target.value)}
                        placeholder="신애교회가 당신을 환영합니다"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.825rem', boxSizing: 'border-box', outline: 'none', background: '#fff' }}
                      />
                    </div>
                    {uploadStatus[i] && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '3px' }}>
                          <span>{uploadStatus[i].done ? '완료!' : '업로드 중...'}</span>
                          <span>{uploadStatus[i].progress}%</span>
                        </div>
                        <div style={{ background: '#e5e7eb', borderRadius: '9999px', height: '5px' }}>
                          <div style={{ background: uploadStatus[i].done ? '#059669' : '#1d4ed8', height: '5px', borderRadius: '9999px', width: `${uploadStatus[i].progress}%`, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeFromQueue(i)} disabled={uploading}
                    style={{ width: '32px', height: '32px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#dc2626', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setQueue([]) }} disabled={uploading}
              style={{ padding: '9px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
              취소
            </button>
            <button onClick={handleUploadAll} disabled={uploading || queue.length === 0}
              style={{ padding: '9px 20px', background: uploading || queue.length === 0 ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: uploading || queue.length === 0 ? 'default' : 'pointer', fontWeight: 700 }}>
              {uploading ? '업로드 중...' : `${queue.length}개 추가`}
            </button>
          </div>
        </div>
      )}

      {/* 슬라이드 목록 */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
        </div>
      ) : slides.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 슬라이드가 없습니다</p>
          <p style={{ color: '#d1d5db', fontSize: '0.8rem', marginTop: '4px' }}>위 버튼으로 슬라이드를 추가해보세요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {slides.map((slide, i) => (
            <div key={slide.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden', display: 'flex', alignItems: 'center', opacity: slide.active ? 1 : 0.5 }}>
              <div style={{ width: '180px', flexShrink: 0, aspectRatio: '16/7', overflow: 'hidden' }}>
                <img src={slide.imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, padding: '16px 20px' }}>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2040', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{slide.title || <span style={{ color: '#d1d5db' }}>제목 없음</span>}</p>
                {slide.sub && <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>{slide.sub}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '16px 20px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: slide.active ? '#059669' : '#9ca3af', background: slide.active ? '#d1fae5' : '#f3f4f6', padding: '3px 10px', borderRadius: '9999px' }}>
                  {slide.active ? '표시 중' : '숨김'}
                </span>
                <button onClick={() => handleMove(i, -1)} disabled={i === 0}
                  style={{ width: '32px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => handleMove(i, 1)} disabled={i === slides.length - 1}
                  style={{ width: '32px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: i === slides.length - 1 ? 'default' : 'pointer', opacity: i === slides.length - 1 ? 0.3 : 1 }}>↓</button>
                <button onClick={() => handleToggle(slide)}
                  style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                  {slide.active ? '숨기기' : '표시'}
                </button>
                <button onClick={() => handleDelete(slide)}
                  style={{ padding: '6px 12px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
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
