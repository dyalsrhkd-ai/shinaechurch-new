import { useEffect, useRef, useState } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'

const PRESET_GROUPS = ['담임목사', '교역자', '시무장로', '안수집사']
const GROUP_COLORS = {
  '담임목사': '#1d4ed8',
  '교역자':   '#0369a1',
  '시무장로': '#7c3aed',
  '안수집사': '#059669',
}
const DEFAULT_COLOR = '#64748b'

const EMPTY_FORM = { name: '', role: '', group: '담임목사', customGroup: '', file: null, preview: null }

export default function StaffManager() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const fileRef = useRef()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'staff')))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.groupOrder ?? 99) - (b.groupOrder ?? 99) || (a.order ?? 0) - (b.order ?? 0))
      setStaff(list)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  // 그룹별로 묶기
  const grouped = staff.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = []
    acc[m.group].push(m)
    return acc
  }, {})

  // 그룹 순서: groupOrder 기준
  const groupOrder = Object.keys(grouped).sort((a, b) => {
    const ao = grouped[a][0]?.groupOrder ?? 99
    const bo = grouped[b][0]?.groupOrder ?? 99
    return ao - bo
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, file, preview: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleAdd = async () => {
    const groupName = form.group === '__custom__' ? form.customGroup.trim() : form.group
    if (!form.name.trim()) return alert('이름을 입력하세요')
    if (!form.role.trim()) return alert('직책을 입력하세요')
    if (!groupName) return alert('그룹을 입력하세요')

    setSaving(true)
    try {
      let imgUrl = ''
      if (form.file) {
        const storageRef = ref(storage, `staff/${Date.now()}_${form.file.name}`)
        await uploadBytes(storageRef, form.file)
        imgUrl = await getDownloadURL(storageRef)
      }

      // 해당 그룹의 현재 최대 order 계산
      const groupMembers = staff.filter(m => m.group === groupName)
      const maxOrder = groupMembers.length > 0
        ? Math.max(...groupMembers.map(m => m.order ?? 0)) + 1
        : 0

      // groupOrder: preset이면 인덱스, 아니면 99
      const groupOrderVal = PRESET_GROUPS.indexOf(groupName) !== -1
        ? PRESET_GROUPS.indexOf(groupName)
        : 99

      await addDoc(collection(db, 'staff'), {
        name: form.name.trim(),
        role: form.role.trim(),
        group: groupName,
        groupOrder: groupOrderVal,
        order: maxOrder,
        imgUrl,
        createdAt: serverTimestamp(),
      })

      setForm(EMPTY_FORM)
      if (fileRef.current) fileRef.current.value = ''
      await fetchStaff()
    } catch (e) {
      alert('오류: ' + e.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'staff', id))
    fetchStaff()
  }

  const groupColor = (g) => GROUP_COLORS[g] ?? DEFAULT_COLOR

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>섬기는 사람들 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>총 {staff.length}명</p>
      </div>

      {/* 등록 폼 */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 인원 등록</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="이름 (예: 우용녀 목사)"
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            placeholder="직책 (예: 담임목사)"
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <select
            value={form.group}
            onChange={e => setForm(f => ({ ...f, group: e.target.value, customGroup: '' }))}
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem', background: '#fff' }}
          >
            {PRESET_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            {/* 현재 등록된 커스텀 그룹도 옵션에 표시 */}
            {groupOrder.filter(g => !PRESET_GROUPS.includes(g)).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
            <option value="__custom__">직접 입력...</option>
          </select>
        </div>
        {form.group === '__custom__' && (
          <input
            value={form.customGroup}
            onChange={e => setForm(f => ({ ...f, customGroup: e.target.value }))}
            placeholder="그룹명 직접 입력"
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '12px', width: '100%', boxSizing: 'border-box' }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {form.preview && (
            <img src={form.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', objectPosition: 'top', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />
          )}
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {form.file ? '✓ ' + form.file.name.slice(0, 12) + '…' : '사진 선택'}
          </button>
          <button onClick={handleAdd} disabled={saving}
            style={{ padding: '8px 20px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {saving ? '저장 중...' : '등록'}
          </button>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {groupOrder.map(groupName => (
            <div key={groupName}>
              {/* 그룹 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '4px', height: '22px', background: groupColor(groupName), borderRadius: '4px' }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{groupName}</h2>
                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{grouped[groupName].length}명</span>
              </div>

              {/* 멤버 카드 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
                {grouped[groupName].map(member => (
                  <div
                    key={member.id}
                    style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(member.id)}
                      style={{
                        position: 'absolute', top: '7px', right: '7px', zIndex: 1,
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(220,38,38,0.85)', border: 'none',
                        color: '#fff', fontSize: '0.72rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>

                    {/* 사진 */}
                    <div style={{ aspectRatio: '1/1', background: '#e8edf5', overflow: 'hidden' }}>
                      {member.imgUrl ? (
                        <img
                          src={member.imgUrl}
                          alt={member.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="36" height="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 이름·직책 */}
                    <div style={{ padding: '10px 12px 12px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f2040', marginBottom: '3px' }}>{member.name}</p>
                      <p style={{ fontSize: '0.72rem', color: groupColor(groupName), fontWeight: 600 }}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
