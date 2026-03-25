import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

// ── 색상 프리셋 ─────────────────────────────────
const COLORS = ['#1d4ed8', '#0369a1', '#7c3aed', '#059669', '#dc2626', '#d97706']

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

// ── 건물 섹션 편집 컴포넌트 ──────────────────────
function BuildingEditor({ building, onChange, onDelete }) {
  const [editFloorIdx, setEditFloorIdx] = useState(null)

  const setField = (field, value) => onChange({ ...building, [field]: value })

  const addFloor = () => {
    onChange({ ...building, floors: [...(building.floors || []), { floor: '', rooms: [] }] })
  }
  const deleteFloor = (fi) => {
    onChange({ ...building, floors: building.floors.filter((_, i) => i !== fi) })
  }
  const updateFloor = (fi, updated) => {
    onChange({ ...building, floors: building.floors.map((f, i) => i === fi ? updated : f) })
  }

  return (
    <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      {/* 건물 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: building.color || '#0f2040' }}>
        <input
          value={building.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="건물명"
          style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: 'none', fontWeight: 700, fontSize: '0.875rem', background: 'rgba(255,255,255,0.15)', color: '#fff' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setField('color', c)}
              style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: building.color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
            />
          ))}
        </div>
        <button onClick={onDelete}
          style={{ flexShrink: 0, padding: '5px 10px', background: 'rgba(220,38,38,0.3)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
          삭제
        </button>
      </div>

      {/* 층/공간 목록 */}
      <div style={{ background: '#fafbfc' }}>
        {(building.floors || []).map((fl, fi) => (
          <FloorEditor key={fi} floor={fl} color={building.color}
            onUpdate={updated => updateFloor(fi, updated)}
            onDelete={() => deleteFloor(fi)}
          />
        ))}
        <div style={{ padding: '10px 16px' }}>
          <button onClick={addFloor}
            style={{ fontSize: '0.8rem', color: building.color || '#1d4ed8', background: 'none', border: `1px dashed ${building.color || '#1d4ed8'}`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, width: '100%' }}>
            + 층/구역 추가
          </button>
        </div>
      </div>
    </div>
  )
}

function FloorEditor({ floor, color, onUpdate, onDelete }) {
  const [newRoom, setNewRoom] = useState('')

  const addRoom = () => {
    const t = newRoom.trim()
    if (!t) return
    onUpdate({ ...floor, rooms: [...(floor.rooms || []), t] })
    setNewRoom('')
  }
  const deleteRoom = (ri) => onUpdate({ ...floor, rooms: floor.rooms.filter((_, i) => i !== ri) })

  return (
    <div style={{ borderBottom: '1px solid #f0f2f5', padding: '10px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <input
          value={floor.floor}
          onChange={e => onUpdate({ ...floor, floor: e.target.value })}
          placeholder="층/구역명 (예: 1층, 101호, 비워두면 없음)"
          style={{ width: '200px', flexShrink: 0, padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: color }}
        />
        <button onClick={onDelete}
          style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.7rem', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {(floor.rooms || []).map((room, ri) => (
          <span key={ri} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: '9999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 500 }}>
            {room}
            <button onClick={() => deleteRoom(ri)}
              style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '0.65rem', padding: '0', lineHeight: 1 }}>✕</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={newRoom}
          onChange={e => setNewRoom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRoom()}
          placeholder="공간 추가..."
          style={{ flex: 1, padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.78rem' }}
        />
        <button onClick={addRoom}
          style={{ flexShrink: 0, padding: '5px 10px', background: color || '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>+</button>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────
export default function FacilityManager() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buildings, setBuildings] = useState([])
  const [photos, setPhotos] = useState([])
  const [heroUrl, setHeroUrl] = useState('')
  const [savingBuildings, setSavingBuildings] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const heroRef = useRef()
  const photoRef = useRef()
  const [newPhotoLabel, setNewPhotoLabel] = useState('')
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'facility', 'main'))
      if (snap.exists()) {
        const d = snap.data()
        setData(d)
        setBuildings(d.buildings || [])
        setPhotos(d.photos || [])
        setHeroUrl(d.heroImageUrl || '')
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const saveAll = async (overrides = {}) => {
    await setDoc(doc(db, 'facility', 'main'), {
      heroImageUrl: heroUrl,
      buildings,
      photos,
      ...overrides,
      updatedAt: serverTimestamp(),
    })
    await fetchData()
    window.dispatchEvent(new Event('admin:changes-saved'))
  }

  // ── 히어로 이미지 업로드 ──────────────────────
  const handleHeroUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    setUploadingHero(true)
    try {
      const storageRef = ref(storage, `facility/hero_${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setHeroUrl(url)
      await setDoc(doc(db, 'facility', 'main'), {
        ...(data || {}),
        heroImageUrl: url,
        buildings,
        photos,
        updatedAt: serverTimestamp(),
      })
      await fetchData()
      window.dispatchEvent(new Event('admin:changes-saved'))
      alert('대표 사진이 업데이트되었습니다.')
    } catch (e) { alert('오류: ' + e.message) }
    setUploadingHero(false)
    e.target.value = ''
  }

  // ── 건물 저장 ────────────────────────────────
  const handleSaveBuildings = async () => {
    setSavingBuildings(true)
    try { await saveAll({ buildings }) }
    catch (e) { alert('오류: ' + e.message) }
    setSavingBuildings(false)
  }

  const addBuilding = () => {
    setBuildings(b => [...b, { name: '새 건물', color: '#1d4ed8', floors: [] }])
  }

  // ── 사진 추가 ────────────────────────────────
  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    setNewPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setNewPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleAddPhoto = async () => {
    if (!newPhotoFile) return alert('사진을 선택하세요')
    if (!newPhotoLabel.trim()) return alert('라벨을 입력하세요')
    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `facility/photo_${Date.now()}_${newPhotoFile.name}`)
      await uploadBytes(storageRef, newPhotoFile)
      const url = await getDownloadURL(storageRef)
      const updatedPhotos = [...photos, { url, label: newPhotoLabel.trim() }]
      await setDoc(doc(db, 'facility', 'main'), {
        ...(data || {}),
        heroImageUrl: heroUrl,
        buildings,
        photos: updatedPhotos,
        updatedAt: serverTimestamp(),
      })
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      setNewPhotoLabel('')
      if (photoRef.current) photoRef.current.value = ''
      await fetchData()
    } catch (e) { alert('오류: ' + e.message) }
    setUploadingPhoto(false)
  }

  const handleDeletePhoto = async (idx) => {
    const updatedPhotos = photos.filter((_, i) => i !== idx)
    try {
      await setDoc(doc(db, 'facility', 'main'), {
        ...(data || {}),
        heroImageUrl: heroUrl,
        buildings,
        photos: updatedPhotos,
        updatedAt: serverTimestamp(),
      })
      await fetchData()
    } catch (e) { alert('오류: ' + e.message) }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>교회시설물 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
          건물 {buildings.length}개 · 시설 사진 {photos.length}장
        </p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>건물 및 시설 구성</p>
          <p style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: '2px' }}>건물 구조 수정 내용은 이 버튼으로 저장합니다. 사진 업로드는 바로 반영됩니다.</p>
        </div>
        <button onClick={handleSaveBuildings} disabled={savingBuildings}
          style={{ padding: '11px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          {savingBuildings ? '저장 중...' : '건물 구성 저장'}
        </button>
      </div>

      {/* ── 대표 사진 ─────────────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>대표 사진 (히어로)</p>
        {heroUrl && (
          <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #eaecf0', maxHeight: '200px' }}>
            <img src={heroUrl} alt="대표 사진" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input ref={heroRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleHeroUpload} style={{ display: 'none' }} />
          <button onClick={() => heroRef.current?.click()} disabled={uploadingHero}
            style={{ padding: '9px 20px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            {uploadingHero ? '업로드 중...' : '사진 변경'}
          </button>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>JPG, PNG 권장 (가로 900px 이상)</span>
        </div>
      </div>

      {/* ── 건물/층/공간 관리 ─────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
            건물 및 시설 구성
          </h3>
          <button onClick={addBuilding}
            style={{ fontSize: '0.82rem', color: '#1d4ed8', background: 'none', border: '1px dashed #1d4ed8', borderRadius: '7px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>
            + 건물 추가
          </button>
        </div>

        {buildings.map((b, bi) => (
          <BuildingEditor
            key={bi}
            building={b}
            onChange={updated => setBuildings(bs => bs.map((x, i) => i === bi ? updated : x))}
            onDelete={() => setBuildings(bs => bs.filter((_, i) => i !== bi))}
          />
        ))}

      </div>

      {/* ── 시설 사진 관리 ──────────────────────── */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#059669', borderRadius: '4px' }} />
          시설 사진
        </h3>

        {/* 사진 추가 폼 */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {newPhotoPreview && (
              <img src={newPhotoPreview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />
            )}
            <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png" onChange={handlePhotoFileChange} style={{ display: 'none' }} />
            <button onClick={() => photoRef.current?.click()}
              style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
              {newPhotoFile ? '✓ ' + newPhotoFile.name.slice(0, 12) + '…' : '이미지 선택'}
            </button>
            <input
              value={newPhotoLabel}
              onChange={e => setNewPhotoLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPhoto()}
              placeholder="라벨 (예: 본당, 소예배실)"
              style={{ flex: '1 1 150px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }}
            />
            <button onClick={handleAddPhoto} disabled={uploadingPhoto}
              style={{ padding: '8px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {uploadingPhoto ? '업로드 중...' : '+ 추가'}
            </button>
          </div>
        </div>

        {/* 사진 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eaecf0', aspectRatio: '4/3' }}>
              <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
                <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 600 }}>{p.label}</span>
              </div>
              <button onClick={() => handleDeletePhoto(i)}
                style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(220,38,38,0.85)', border: 'none', color: '#fff', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
        {photos.length === 0 && (
          <p style={{ textAlign: 'center', color: '#c9d0db', fontSize: '0.82rem', padding: '32px' }}>사진이 없습니다</p>
        )}
      </div>
    </div>
  )
}
