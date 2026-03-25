import { useEffect, useState } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../../firebase'

const ERA_COLORS = ['#1d4ed8', '#0369a1', '#7c3aed', '#059669', '#dc2626', '#d97706']
const EMPTY_ERA_FORM = { period: '', color: '#1d4ed8' }

export default function HistoryManager() {
  const [eras, setEras] = useState([])
  const [loading, setLoading] = useState(true)
  const [eraForm, setEraForm] = useState(EMPTY_ERA_FORM)
  const [savingEra, setSavingEra] = useState(false)
  // 이벤트 추가 폼: { [eraId]: { date, desc } }
  const [eventForms, setEventForms] = useState({})
  // 인라인 수정 중인 항목: { eraId, eventIndex } or null
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState({ date: '', desc: '' })
  // 시대 이름 수정 중: eraId or null
  const [editingEra, setEditingEra] = useState(null)
  const [editEraValue, setEditEraValue] = useState({ period: '', color: '' })

  const fetchEras = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'history'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      setEras(list)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchEras() }, [])

  // ── 시대 추가 ──────────────────────────────
  const handleAddEra = async () => {
    if (!eraForm.period.trim()) return alert('기간을 입력하세요')
    setSavingEra(true)
    try {
      await addDoc(collection(db, 'history'), {
        period: eraForm.period.trim(),
        color: eraForm.color,
        order: eras.length,
        events: [],
        updatedAt: serverTimestamp(),
      })
      setEraForm(EMPTY_ERA_FORM)
      await fetchEras()
    } catch (e) { alert('오류: ' + e.message) }
    setSavingEra(false)
  }

  // ── 시대 삭제 ──────────────────────────────
  const handleDeleteEra = async (id) => {
    if (!window.confirm('이 시대 구분과 모든 연혁을 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'history', id))
    fetchEras()
  }

  // ── 시대 수정 저장 ──────────────────────────
  const handleSaveEra = async (eraId) => {
    if (!editEraValue.period.trim()) return alert('기간을 입력하세요')
    try {
      await updateDoc(doc(db, 'history', eraId), {
        period: editEraValue.period.trim(),
        color: editEraValue.color,
        updatedAt: serverTimestamp(),
      })
      setEditingEra(null)
      await fetchEras()
    } catch (e) { alert('오류: ' + e.message) }
  }

  // ── 이벤트 추가 ──────────────────────────────
  const handleAddEvent = async (eraId) => {
    const form = eventForms[eraId] || { date: '', desc: '' }
    if (!form.date.trim()) return alert('날짜를 입력하세요')
    if (!form.desc.trim()) return alert('내용을 입력하세요')
    const era = eras.find(e => e.id === eraId)
    if (!era) return
    const newEvents = [...(era.events || []), { date: form.date.trim(), desc: form.desc.trim() }]
    try {
      await updateDoc(doc(db, 'history', eraId), { events: newEvents, updatedAt: serverTimestamp() })
      setEventForms(f => ({ ...f, [eraId]: { date: '', desc: '' } }))
      await fetchEras()
    } catch (e) { alert('오류: ' + e.message) }
  }

  // ── 이벤트 수정 저장 ──────────────────────────
  const handleSaveEvent = async () => {
    if (!editing) return
    const { eraId, eventIndex } = editing
    if (!editValue.date.trim()) return alert('날짜를 입력하세요')
    if (!editValue.desc.trim()) return alert('내용을 입력하세요')
    const era = eras.find(e => e.id === eraId)
    if (!era) return
    const newEvents = era.events.map((ev, i) =>
      i === eventIndex ? { date: editValue.date.trim(), desc: editValue.desc.trim() } : ev
    )
    try {
      await updateDoc(doc(db, 'history', eraId), { events: newEvents, updatedAt: serverTimestamp() })
      setEditing(null)
      await fetchEras()
    } catch (e) { alert('오류: ' + e.message) }
  }

  // ── 이벤트 삭제 ──────────────────────────────
  const handleDeleteEvent = async (eraId, eventIndex) => {
    const era = eras.find(e => e.id === eraId)
    if (!era) return
    const newEvents = era.events.filter((_, i) => i !== eventIndex)
    await updateDoc(doc(db, 'history', eraId), { events: newEvents, updatedAt: serverTimestamp() })
    fetchEras()
  }

  const setEventForm = (eraId, field, value) =>
    setEventForms(f => ({ ...f, [eraId]: { ...(f[eraId] || { date: '', desc: '' }), [field]: value } }))

  const startEditEvent = (eraId, eventIndex, ev) => {
    setEditing({ eraId, eventIndex })
    setEditValue({ date: ev.date, desc: ev.desc })
  }

  const startEditEra = (era) => {
    setEditingEra(era.id)
    setEditEraValue({ period: era.period, color: era.color })
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>교회 연혁 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>총 {eras.reduce((s, e) => s + (e.events?.length || 0), 0)}건</p>
      </div>

      {/* 시대 구분 추가 */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 시대 구분 추가</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={eraForm.period}
            onChange={e => setEraForm(f => ({ ...f, period: e.target.value }))}
            placeholder="기간 (예: 2021 — 현재)"
            style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>색상</span>
            {ERA_COLORS.map(c => (
              <button key={c} onClick={() => setEraForm(f => ({ ...f, color: c }))}
                style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: eraForm.color === c ? '3px solid #0f2040' : '2px solid transparent', cursor: 'pointer', outline: 'none' }}
              />
            ))}
          </div>
          <button onClick={handleAddEra} disabled={savingEra}
            style={{ padding: '10px 24px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            {savingEra ? '추가 중...' : '+ 추가'}
          </button>
        </div>
      </div>

      {/* 연혁 목록 */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {eras.map(era => (
            <div key={era.id} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>

              {/* 시대 헤더 */}
              {editingEra === era.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: '#fff', borderBottom: '1px solid #f0f2f5', flexWrap: 'wrap' }}>
                  <input
                    value={editEraValue.period}
                    onChange={e => setEditEraValue(v => ({ ...v, period: e.target.value }))}
                    style={{ flex: 1, minWidth: '160px', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', fontWeight: 700 }}
                  />
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {ERA_COLORS.map(c => (
                      <button key={c} onClick={() => setEditEraValue(v => ({ ...v, color: c }))}
                        style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: editEraValue.color === c ? '3px solid #0f2040' : '2px solid transparent', cursor: 'pointer', outline: 'none' }}
                      />
                    ))}
                  </div>
                  <button onClick={() => handleSaveEra(era.id)}
                    style={{ padding: '7px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                  >저장</button>
                  <button onClick={() => setEditingEra(null)}
                    style={{ padding: '7px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem' }}
                  >취소</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f0f2f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '4px', height: '22px', background: era.color, borderRadius: '4px' }} />
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f2040' }}>{era.period}</span>
                    <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{era.events?.length || 0}건</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEditEra(era)}
                      style={{ fontSize: '0.78rem', color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
                    >수정</button>
                    <button onClick={() => handleDeleteEra(era.id)}
                      style={{ fontSize: '0.78rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
                    >삭제</button>
                  </div>
                </div>
              )}

              {/* 이벤트 목록 */}
              <div style={{ background: '#fafbfc' }}>
                {(era.events || []).map((ev, i) => {
                  const isEditing = editing?.eraId === era.id && editing?.eventIndex === i
                  return (
                    <div key={i} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '10px', padding: '10px 20px', alignItems: 'center', background: '#fffbeb' }}>
                          <input
                            value={editValue.date}
                            onChange={e => setEditValue(v => ({ ...v, date: e.target.value }))}
                            style={{ width: '140px', flexShrink: 0, padding: '7px 9px', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}
                          />
                          <input
                            value={editValue.desc}
                            onChange={e => setEditValue(v => ({ ...v, desc: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEvent()}
                            style={{ flex: 1, padding: '7px 9px', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.82rem' }}
                          />
                          <button onClick={handleSaveEvent}
                            style={{ flexShrink: 0, padding: '7px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                          >저장</button>
                          <button onClick={() => setEditing(null)}
                            style={{ flexShrink: 0, padding: '7px 12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
                          >취소</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 20px' }}>
                          <span style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: era.color, fontFamily: 'monospace', minWidth: '90px' }}>{ev.date}</span>
                          <span style={{ flex: 1, fontSize: '0.85rem', color: '#374151' }}>{ev.desc}</span>
                          <button onClick={() => startEditEvent(era.id, i, ev)}
                            style={{ flexShrink: 0, fontSize: '0.72rem', color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer' }}
                          >수정</button>
                          <button onClick={() => handleDeleteEvent(era.id, i)}
                            style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer' }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* 이벤트 추가 행 */}
                <div style={{ display: 'flex', gap: '10px', padding: '12px 20px', background: '#fff', alignItems: 'center' }}>
                  <input
                    value={eventForms[era.id]?.date || ''}
                    onChange={e => setEventForm(era.id, 'date', e.target.value)}
                    placeholder="날짜 (예: 2025.03.01)"
                    style={{ width: '150px', flexShrink: 0, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.82rem' }}
                  />
                  <input
                    value={eventForms[era.id]?.desc || ''}
                    onChange={e => setEventForm(era.id, 'desc', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddEvent(era.id)}
                    placeholder="내용"
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.82rem' }}
                  />
                  <button onClick={() => handleAddEvent(era.id)}
                    style={{ flexShrink: 0, padding: '8px 16px', background: era.color, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                  >추가</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
