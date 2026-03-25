import { useEffect, useRef, useState } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  orderBy, query, serverTimestamp, getDoc, setDoc,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

const DEFAULTS = {
  introTitle: '영선관리 소개',
  intro1: '신애교회 연합남전도회에서 관리하는 교회 농장입니다. 농장에서는 채소, 마늘, 고구마, 상추 등 다양한 작물을 재배하여 수확한 후 교인들과 이웃에게 나누어 드리고 있습니다.',
  intro2: '또한 연못에는 미꾸라지, 붕어, 잉어, 뱀장어 등을 방류하여 교인들과 인근 마을 주민들의 휴식처로 활용하고 있습니다.',
  manager: '김강석 장로',
  managerRole: '연합남전도회 관리',
}

const PER_PAGE = 12

// contentEditable 인라인 편집 컴포넌트
function Editable({ value, onChange, placeholder, style, as: Tag = 'p' }) {
  const ref = useRef(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused && ref.current) ref.current.textContent = value || placeholder || ''
  }, [focused, value, placeholder])

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => {
        setFocused(true)
        if (ref.current?.textContent === placeholder) ref.current.textContent = ''
      }}
      onBlur={() => {
        setFocused(false)
        onChange(ref.current?.textContent || '')
      }}
      style={{
        ...style,
        outline: 'none',
        borderBottom: '1.5px dashed rgba(22,163,74,0.4)',
        cursor: 'text',
        minHeight: '1em',
      }}
    >
      {value || placeholder}
    </Tag>
  )
}

export default function FarmManager() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState(DEFAULTS)
  const [form, setForm] = useState({ label: '', file: null, preview: null })
  const fileRef = useRef()

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'farm'), orderBy('order', 'desc')))
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    fetchPhotos()
    getDoc(doc(db, 'farm_info', 'main')).then(snap => {
      if (snap.exists()) setInfo({ ...DEFAULTS, ...snap.data() })
    }).catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'farm_info', 'main'), {
        introTitle: info.introTitle.trim(),
        intro1: info.intro1.trim(),
        intro2: info.intro2.trim(),
        manager: info.manager.trim(),
        managerRole: info.managerRole.trim(),
        updatedAt: serverTimestamp(),
      })
      window.dispatchEvent(new Event('admin:changes-saved'))
      alert('저장되었습니다.')
    } catch (e) { alert('오류: ' + e.message) }
    setSaving(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    setForm(f => ({ ...f, file, preview: URL.createObjectURL(file) }))
    e.target.value = ''
  }

  const handleAddPhoto = async () => {
    if (!form.file) return alert('이미지를 선택하세요')
    if (!form.label.trim()) return alert('사진 설명을 입력하세요')
    setUploading(true); setProgress(0)
    try {
      const storageRef = ref(storage, `farm/${Date.now()}_${form.file.name}`)
      const task = uploadBytesResumable(storageRef, form.file)
      await new Promise((resolve, reject) =>
        task.on('state_changed', s => setProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)), reject, resolve)
      )
      const imgUrl = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'farm'), {
        label: form.label.trim(), imgUrl, storagePath: storageRef.fullPath,
        order: Date.now(), createdAt: serverTimestamp(),
      })
      if (form.preview) URL.revokeObjectURL(form.preview)
      setForm({ label: '', file: null, preview: null })
      await fetchPhotos()
    } catch (e) { alert('오류: ' + e.message) }
    setUploading(false); setProgress(0)
  }

  const handleDelete = async (photo) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    if (photo.storagePath) { try { await deleteObject(ref(storage, photo.storagePath)) } catch {} }
    await deleteDoc(doc(db, 'farm', photo.id))
    fetchPhotos()
  }

  const totalPages = Math.max(1, Math.ceil(photos.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = photos.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>영선관리</h1>
          <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '3px' }}>밑줄 있는 텍스트를 클릭해서 바로 수정하고 저장하세요.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '9px 22px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* ── 실제 페이지와 동일한 레이아웃 ── */}

      {/* 소개 카드 */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '14px', padding: '28px', marginBottom: '28px', borderLeft: '4px solid #16a34a' }}>
        <Editable
          value={info.introTitle}
          onChange={v => setInfo(i => ({ ...i, introTitle: v }))}
          placeholder="소개 제목"
          as="h3"
          style={{ fontWeight: 800, fontSize: '1rem', color: '#14532d', marginBottom: '14px', display: 'block' }}
        />
        <Editable
          value={info.intro1}
          onChange={v => setInfo(i => ({ ...i, intro1: v }))}
          placeholder="소개글 1을 입력하세요"
          style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, marginBottom: '10px', display: 'block' }}
        />
        <Editable
          value={info.intro2}
          onChange={v => setInfo(i => ({ ...i, intro2: v }))}
          placeholder="소개글 2를 입력하세요"
          style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, display: 'block' }}
        />
      </div>

      {/* 담당 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#16a34a', borderRadius: '4px' }} />
          담당
        </h3>
        <div style={{ background: '#f6f8fb', borderRadius: '10px', padding: '14px 20px', border: '1px solid #eaecf0', display: 'inline-block', minWidth: '160px' }}>
          <Editable
            value={info.manager}
            onChange={v => setInfo(i => ({ ...i, manager: v }))}
            placeholder="담당자"
            style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f2040', display: 'block' }}
          />
          <Editable
            value={info.managerRole}
            onChange={v => setInfo(i => ({ ...i, managerRole: v }))}
            placeholder="역할"
            style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px', display: 'block' }}
          />
        </div>
      </div>

      {/* ── 활동 사진 ── */}
      <div style={{ borderTop: '1px solid #eaecf0', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#16a34a', borderRadius: '4px' }} />
          활동 사진
          {!loading && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>총 {photos.length}장</span>}
        </h3>

        {/* 사진 등록 폼 */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {form.preview && (
              <img src={form.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bbf7d0' }} />
            )}
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddPhoto()}
              placeholder="사진 설명"
              style={{ flex: '1 1 160px', padding: '8px 11px', border: '1px solid #86efac', borderRadius: '7px', fontSize: '0.875rem' }}
            />
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '8px 14px', background: '#fff', border: '1px solid #86efac', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#15803d', whiteSpace: 'nowrap' }}>
              {form.file ? '✓ ' + form.file.name.slice(0, 12) + '…' : '이미지 선택'}
            </button>
            <button onClick={handleAddPhoto} disabled={uploading}
              style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {uploading ? `${progress}%` : '+ 추가'}
            </button>
          </div>
        </div>

        {/* 사진 그리드 */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
        ) : photos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #d1fae5', borderRadius: '12px' }}>등록된 사진이 없습니다.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {slice.map(photo => (
                <div key={photo.id} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaecf0', position: 'relative' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                    <img src={photo.imgUrl} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '8px 10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{photo.label}</p>
                    <button onClick={() => handleDelete(photo)}
                      style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(220,38,38,0.08)', border: 'none', color: '#dc2626', fontSize: '0.65rem', cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', background: safePage === p ? '#16a34a' : '#f3f4f6', color: safePage === p ? '#fff' : '#374151', fontWeight: safePage === p ? 700 : 400 }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
