import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

const FALLBACK_PHOTO = '/images/corp_new/mem8.jpg'

export default function GreetingManager() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef()

  // 편집 상태
  const [photoUrl, setPhotoUrl] = useState('')
  const [name, setName] = useState('')
  const [nameTitle, setNameTitle] = useState('')
  const [role, setRole] = useState('')
  const [greetingTitle, setGreetingTitle] = useState('')
  const [paragraphs, setParagraphs] = useState([])
  const [signatureRole, setSignatureRole] = useState('')
  const [signatureName, setSignatureName] = useState('')
  const [visions, setVisions] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'greeting', 'main'))
      if (snap.exists()) {
        const d = snap.data()
        setData(d)
        setPhotoUrl(d.photoUrl || '')
        setName(d.name || '')
        setNameTitle(d.nameTitle || '')
        setRole(d.role || '')
        setGreetingTitle(d.greetingTitle || '')
        setParagraphs(d.paragraphs || [])
        setSignatureRole(d.signatureRole || '')
        setSignatureName(d.signatureName || '')
        setVisions(d.visions || [])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const saveAll = async (overrides = {}) => {
    await setDoc(doc(db, 'greeting', 'main'), {
      photoUrl,
      name,
      nameTitle,
      role,
      greetingTitle,
      paragraphs,
      signatureRole,
      signatureName,
      visions,
      ...overrides,
      updatedAt: serverTimestamp(),
    })
    await fetchData()
    window.dispatchEvent(new Event('admin:changes-saved'))
  }

  const handleSave = async () => {
    setSaving(true)
    try { await saveAll() }
    catch (e) { alert('오류: ' + e.message) }
    setSaving(false)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `greeting/photo_${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setPhotoUrl(url)
      await saveAll({ photoUrl: url })
      alert('사진이 업데이트되었습니다.')
    } catch (e) { alert('오류: ' + e.message) }
    setUploadingPhoto(false)
    e.target.value = ''
  }

  // 본문 단락
  const addParagraph = () => setParagraphs(p => [...p, ''])
  const updateParagraph = (i, val) => setParagraphs(p => p.map((x, idx) => idx === i ? val : x))
  const deleteParagraph = (i) => setParagraphs(p => p.filter((_, idx) => idx !== i))
  const moveParagraph = (i, dir) => {
    const arr = [...paragraphs]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setParagraphs(arr)
  }

  // 비전 카드
  const addVision = () => setVisions(v => [...v, { label: '', desc: '' }])
  const updateVision = (i, field, val) => setVisions(v => v.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  const deleteVision = (i) => setVisions(v => v.filter((_, idx) => idx !== i))

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  const displayPhoto = photoUrl || FALLBACK_PHOTO

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>인사말 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>담임목사 사진·인사글·비전 카드 수정</p>
      </div>

      {/* ── 목사 사진 + 기본 정보 ─────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '16px' }}>목사 사진 및 기본 정보</p>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* 사진 */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ width: '120px', height: '144px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaecf0', background: '#e8edf5', marginBottom: '10px' }}>
              <img src={displayPhoto} alt="목사 사진" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }} />
            </div>
            <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
              style={{ padding: '6px 14px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', width: '100%' }}>
              {uploadingPhoto ? '업로드 중...' : '사진 변경'}
            </button>
          </div>

          {/* 이름/직책 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>이름</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="우용녀"
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ width: '80px', flexShrink: 0 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>호칭</label>
                <input value={nameTitle} onChange={e => setNameTitle(e.target.value)}
                  placeholder="목사"
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>직책 (사진 아래 표시)</label>
              <input value={role} onChange={e => setRole(e.target.value)}
                placeholder="신애교회 담임목사"
                style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 인사말 제목 ────────────────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '10px' }}>인사말 제목</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>줄바꿈은 Enter(\\n)로 처리됩니다</p>
        <textarea
          value={greetingTitle}
          onChange={e => setGreetingTitle(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', fontWeight: 800, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
        {/* 미리보기 */}
        <div style={{ marginTop: '10px', borderLeft: '4px solid #1d4ed8', paddingLeft: '16px', background: '#eff6ff', padding: '12px 12px 12px 16px', borderRadius: '0 8px 8px 0' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2040', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{greetingTitle || '제목을 입력하세요'}</p>
        </div>
      </div>

      {/* ── 본문 단락 ───────────────────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>본문 단락</p>
          <button onClick={addParagraph}
            style={{ fontSize: '0.78rem', color: '#1d4ed8', background: 'none', border: '1px dashed #1d4ed8', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700 }}>
            + 단락 추가
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paragraphs.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, paddingTop: '4px' }}>
                <button onClick={() => moveParagraph(i, -1)} disabled={i === 0}
                  style={{ width: '22px', height: '22px', background: i === 0 ? '#f3f4f6' : '#e0e7ff', border: 'none', borderRadius: '4px', cursor: i === 0 ? 'default' : 'pointer', fontSize: '0.65rem', color: i === 0 ? '#c9d0db' : '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                <button onClick={() => moveParagraph(i, 1)} disabled={i === paragraphs.length - 1}
                  style={{ width: '22px', height: '22px', background: i === paragraphs.length - 1 ? '#f3f4f6' : '#e0e7ff', border: 'none', borderRadius: '4px', cursor: i === paragraphs.length - 1 ? 'default' : 'pointer', fontSize: '0.65rem', color: i === paragraphs.length - 1 ? '#c9d0db' : '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
              </div>
              <textarea
                value={p}
                onChange={e => updateParagraph(i, e.target.value)}
                rows={3}
                style={{ flex: 1, padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', lineHeight: 1.8, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button onClick={() => deleteParagraph(i)}
                style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', marginTop: '4px' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 서명 ────────────────────────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '12px' }}>서명 (오른쪽 하단)</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>직함</label>
            <input value={signatureRole} onChange={e => setSignatureRole(e.target.value)}
              placeholder="신애교회 담임목사"
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ width: '120px', flexShrink: 0 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>이름</label>
            <input value={signatureName} onChange={e => setSignatureName(e.target.value)}
              placeholder="우용녀"
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
        </div>
        {/* 미리보기 */}
        <div style={{ marginTop: '12px', textAlign: 'right', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid #eaecf0' }}>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>{signatureRole}</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f2040', fontFamily: 'serif' }}>{signatureName}</p>
        </div>
      </div>

      {/* ── 비전 카드 ───────────────────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>교회 비전 카드</p>
          <button onClick={addVision}
            style={{ fontSize: '0.78rem', color: '#1d4ed8', background: 'none', border: '1px dashed #1d4ed8', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700 }}>
            + 카드 추가
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visions.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #eaecf0' }}>
              <div style={{ width: '4px', height: '36px', background: '#1d4ed8', borderRadius: '4px', flexShrink: 0 }} />
              <input value={v.label} onChange={e => updateVision(i, 'label', e.target.value)}
                placeholder="비전 제목"
                style={{ width: '120px', flexShrink: 0, padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700 }} />
              <input value={v.desc} onChange={e => updateVision(i, 'desc', e.target.value)}
                placeholder="설명"
                style={{ flex: 1, padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} />
              <button onClick={() => deleteVision(i)}
                style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 저장 버튼 ───────────────────────────────── */}
      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '13px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
        {saving ? '저장 중...' : '전체 저장'}
      </button>
    </div>
  )
}
