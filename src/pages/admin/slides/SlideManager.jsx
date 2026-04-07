import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

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

function serializeSlides(list) {
  return JSON.stringify(list.map(item => ({
    id: item.id,
    title: item.title || '',
    sub: item.sub || '',
    active: !!item.active,
    order: item.order ?? 0,
    imgUrl: item.imgUrl || '',
    storagePath: item.storagePath || '',
  })))
}

export default function SlideManager() {
  const [slides, setSlides] = useState([])
  const [originalSlides, setOriginalSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState([])
  const [queue, setQueue] = useState([])
  const fileRef = useRef(null)

  const hasUnsavedChanges = useMemo(
    () => serializeSlides(slides) !== serializeSlides(originalSlides),
    [slides, originalSlides]
  )

  const fetchSlides = async () => {
    setLoading(true)
    setError('')
    try {
      const snapshot = await getDocs(query(collection(db, 'slides'), orderBy('order')))
      const data = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      const needsFix = data.some((item, index) => item.order !== index)
      if (needsFix) {
        await Promise.all(data.map((item, index) => updateDoc(doc(db, 'slides', item.id), { order: index })))
      }
      const normalized = data.map((item, index) => ({ ...item, order: index, active: item.active !== false }))
      setSlides(normalized)
      setOriginalSlides(normalized.map(item => ({ ...item })))
    } catch (fetchError) {
      setError('슬라이드를 불러오지 못했습니다.')
      console.error(fetchError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  const handleFilesChange = event => {
    const files = Array.from(event.target.files || [])
    const invalid = files.map(file => validateImageFile(file)).find(Boolean)
    if (invalid) {
      alert(invalid)
      event.target.value = ''
      return
    }
    const newItems = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: '',
      sub: '',
    }))
    setQueue(current => [...current, ...newItems])
    event.target.value = ''
  }

  const updateQueue = (index, field, value) => {
    setQueue(current => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )))
  }

  const removeFromQueue = index => {
    setQueue(current => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleUploadAll = async () => {
    if (queue.length === 0) return
    setSaving(true)
    setUploadStatus(queue.map(item => ({ name: item.file.name, progress: 0, done: false })))
    try {
      const baseOrder = slides.length
      for (let index = 0; index < queue.length; index += 1) {
        const item = queue[index]
        const storageRef = ref(storage, `slides/${Date.now()}_${item.file.name}`)
        const task = uploadBytesResumable(storageRef, item.file)
        await new Promise((resolve, reject) => {
          task.on(
            'state_changed',
            snapshot => {
              const progress = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)
              setUploadStatus(current => current.map((status, statusIndex) => (
                statusIndex === index ? { ...status, progress } : status
              )))
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
          order: baseOrder + index,
          active: true,
        })
        setUploadStatus(current => current.map((status, statusIndex) => (
          statusIndex === index ? { ...status, progress: 100, done: true } : status
        )))
      }
      setQueue([])
      setUploadStatus([])
      sessionStorage.removeItem('mainSlides')
      await fetchSlides()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '메인 슬라이드를 등록했습니다.' } }))
    } catch (uploadError) {
      alert(`업로드 중 오류가 발생했습니다: ${uploadError.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSlideChange = (slideId, field, value) => {
    setSlides(current => current.map(item => (
      item.id === slideId ? { ...item, [field]: value } : item
    )))
  }

  const handleMove = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= slides.length) return
    const reordered = [...slides]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, moved)
    setSlides(reordered.map((item, itemIndex) => ({ ...item, order: itemIndex })))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await Promise.all(slides.map((item, index) => updateDoc(doc(db, 'slides', item.id), {
        title: item.title || '',
        sub: item.sub || '',
        active: item.active !== false,
        order: index,
      })))
      const normalized = slides.map((item, index) => ({ ...item, order: index }))
      setSlides(normalized)
      setOriginalSlides(normalized.map(item => ({ ...item })))
      sessionStorage.removeItem('mainSlides')
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '메인 슬라이드를 저장했습니다.' } }))
    } catch (saveError) {
      alert(`저장 중 오류가 발생했습니다: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async slide => {
    if (!window.confirm('슬라이드를 삭제할까요?')) return
    try {
      if (slide.storagePath) {
        try { await deleteObject(ref(storage, slide.storagePath)) } catch {}
      }
      await deleteDoc(doc(db, 'slides', slide.id))
      sessionStorage.removeItem('mainSlides')
      await fetchSlides()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: '메인 슬라이드를 삭제했습니다.' } }))
    } catch (deleteError) {
      alert(`삭제 중 오류가 발생했습니다: ${deleteError.message}`)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>슬라이드 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>상단에서 새 슬라이드를 등록하고, 기존 슬라이드는 목록에서 바로 수정합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>메인 슬라이드 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '기존 슬라이드를 수정 중입니다. 저장 버튼으로 반영하세요.' : `총 ${slides.length}장`}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {error ? <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div> : null}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2040' }}>새 슬라이드 등록</h3>
          <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px dashed #1d4ed8', borderRadius: '8px', background: '#fff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            + 이미지 선택
          </button>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" multiple style={{ display: 'none' }} onChange={handleFilesChange} />
        </div>

        {queue.length === 0 ? (
          <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '48px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', color: '#9ca3af' }}>
            업로드할 이미지를 선택해 주세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {queue.map((item, index) => (
              <div key={`${item.file.name}-${index}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start', background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
                <div style={{ width: '160px', flex: '0 0 160px', maxWidth: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={item.preview} alt="" style={{ width: '100%', aspectRatio: '16/7', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ display: 'grid', gap: '10px', flex: '1 1 320px', minWidth: '260px' }}>
                  <textarea value={item.title} onChange={event => updateQueue(index, 'title', event.target.value)} placeholder="슬라이드 제목" rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.825rem', resize: 'none', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
                  <input value={item.sub} onChange={event => updateQueue(index, 'sub', event.target.value)} placeholder="부제목" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.825rem', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
                  {uploadStatus[index] ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '3px' }}>
                        <span>{uploadStatus[index].done ? '완료' : '업로드 중'}</span>
                        <span>{uploadStatus[index].progress}%</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '9999px', height: '5px' }}>
                        <div style={{ background: uploadStatus[index].done ? '#059669' : '#1d4ed8', height: '5px', borderRadius: '9999px', width: `${uploadStatus[index].progress}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ) : null}
                </div>
                <button onClick={() => removeFromQueue(index)} disabled={saving} style={{ width: '32px', height: '32px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#dc2626', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
                  ×
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleUploadAll} disabled={saving || queue.length === 0} style={{ padding: '9px 20px', background: saving || queue.length === 0 ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: saving || queue.length === 0 ? 'default' : 'pointer', fontWeight: 700 }}>
                {saving ? '업로드 중...' : `${queue.length}장 등록`}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : slides.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px' }}>등록된 슬라이드가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {slides.map((slide, index) => (
            <div key={slide.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', opacity: slide.active ? 1 : 0.6 }}>
              <div style={{ width: '220px', flex: '0 0 220px', maxWidth: '100%', aspectRatio: '16/7', overflow: 'hidden' }}>
                <img src={slide.imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '16px', display: 'grid', gap: '10px', flex: '1 1 320px', minWidth: '260px' }}>
                <textarea value={slide.title || ''} onChange={event => handleSlideChange(slide.id, 'title', event.target.value)} placeholder="슬라이드 제목" rows={2} style={{ width: '100%', padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', resize: 'none', fontFamily: 'inherit' }} />
                <input value={slide.sub || ''} onChange={event => handleSlideChange(slide.id, 'sub', event.target.value)} placeholder="부제목" style={{ width: '100%', padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '16px', flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => handleMove(index, -1)} disabled={index === 0} style={{ width: '32px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => handleMove(index, 1)} disabled={index === slides.length - 1} style={{ width: '32px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: index === slides.length - 1 ? 'default' : 'pointer', opacity: index === slides.length - 1 ? 0.3 : 1 }}>↓</button>
                <button onClick={() => handleSlideChange(slide.id, 'active', !slide.active)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                  {slide.active ? '숨기기' : '표시'}
                </button>
                <button onClick={() => handleDelete(slide)} style={{ padding: '6px 12px', border: '1px solid #fee2e2', borderRadius: '6px', background: '#fff', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
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
