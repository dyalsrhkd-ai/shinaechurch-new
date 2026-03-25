import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase'

const DEFAULT_MONTHS = Array.from({ length: 12 }, (_, i) => ({ month: `${i + 1}월`, events: [] }))

export default function ScheduleManager() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingMotto, setSavingMotto] = useState(false)
  const [mottoForm, setMottoForm] = useState({ year: '', motto: '' })
  // 월별 새 항목 입력값: { [monthIndex]: string }
  const [newEvents, setNewEvents] = useState({})
  // 인라인 수정 중: { monthIndex, eventIndex } or null
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'schedule', 'main'))
      if (snap.exists()) {
        const d = snap.data()
        setData(d)
        setMottoForm({ year: d.year || '', motto: d.motto || '' })
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const months = data?.months || DEFAULT_MONTHS

  // 전체 저장 헬퍼
  const save = async (updatedMonths) => {
    await setDoc(doc(db, 'schedule', 'main'), {
      ...data,
      months: updatedMonths,
      updatedAt: serverTimestamp(),
    })
    await fetchData()
  }

  const saveMotto = async () => {
    setSavingMotto(true)
    try {
      await setDoc(doc(db, 'schedule', 'main'), {
        ...data,
        year: mottoForm.year.trim(),
        motto: mottoForm.motto.trim(),
        updatedAt: serverTimestamp(),
      })
      await fetchData()
    } catch (e) { alert('오류: ' + e.message) }
    setSavingMotto(false)
  }

  const handleAddEvent = async (monthIndex) => {
    const text = (newEvents[monthIndex] || '').trim()
    if (!text) return
    const updatedMonths = months.map((m, i) =>
      i === monthIndex ? { ...m, events: [...m.events, text] } : m
    )
    try {
      await save(updatedMonths)
      setNewEvents(n => ({ ...n, [monthIndex]: '' }))
    } catch (e) { alert('오류: ' + e.message) }
  }

  const handleDeleteEvent = async (monthIndex, eventIndex) => {
    const updatedMonths = months.map((m, i) =>
      i === monthIndex ? { ...m, events: m.events.filter((_, ei) => ei !== eventIndex) } : m
    )
    try { await save(updatedMonths) } catch (e) { alert('오류: ' + e.message) }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const { monthIndex, eventIndex } = editing
    const text = editValue.trim()
    if (!text) return alert('내용을 입력하세요')
    const updatedMonths = months.map((m, i) =>
      i === monthIndex
        ? { ...m, events: m.events.map((ev, ei) => ei === eventIndex ? text : ev) }
        : m
    )
    try {
      await save(updatedMonths)
      setEditing(null)
    } catch (e) { alert('오류: ' + e.message) }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>연간 일정 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>{data?.year || ''} 일정</p>
      </div>

      {/* 표어 편집 */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>연도 및 표어</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={mottoForm.year}
            onChange={e => setMottoForm(f => ({ ...f, year: e.target.value }))}
            placeholder="연도 (예: 2026)"
            style={{ width: '100px', flexShrink: 0, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={mottoForm.motto}
            onChange={e => setMottoForm(f => ({ ...f, motto: e.target.value }))}
            placeholder="표어"
            style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <button onClick={saveMotto} disabled={savingMotto}
            style={{ flexShrink: 0, padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            {savingMotto ? '저장 중...' : '저장'}
          </button>
        </div>
        <div style={{ marginTop: '14px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '10px', padding: '14px 18px', borderLeft: '4px solid #1d4ed8' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '4px' }}>{mottoForm.year}년 표어</p>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{mottoForm.motto || '표어를 입력하세요'}</p>
        </div>
      </div>

      {/* 월별 일정 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {months.map((m, monthIndex) => (
          <div key={m.month} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            {/* 월 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#0f2040' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{m.month}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{m.events.length}개</span>
            </div>

            {/* 일정 목록 */}
            <div style={{ padding: '8px 14px', minHeight: '48px' }}>
              {m.events.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#c9d0db', padding: '6px 0' }}>일정 없음</p>
              ) : (
                m.events.map((ev, ei) => {
                  const isEditing = editing?.monthIndex === monthIndex && editing?.eventIndex === ei
                  return (
                    <div key={ei} style={{ borderBottom: ei < m.events.length - 1 ? '1px solid #f0f2f5' : 'none', padding: '5px 0' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#fffbeb', borderRadius: '6px', padding: '4px 6px' }}>
                          <input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                            style={{ flex: 1, padding: '5px 7px', border: '1px solid #fbbf24', borderRadius: '5px', fontSize: '0.78rem' }}
                          />
                          <button onClick={handleSaveEdit}
                            style={{ flexShrink: 0, padding: '4px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}
                          >저장</button>
                          <button onClick={() => setEditing(null)}
                            style={{ flexShrink: 0, padding: '4px 8px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem' }}
                          >취소</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ flexShrink: 0, width: '5px', height: '5px', borderRadius: '50%', background: '#1d4ed8' }} />
                          <span style={{ flex: 1, fontSize: '0.8rem', color: '#374151', lineHeight: 1.4 }}>{ev}</span>
                          <button
                            onClick={() => { setEditing({ monthIndex, eventIndex: ei }); setEditValue(ev) }}
                            style={{ flexShrink: 0, fontSize: '0.65rem', color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                          >수정</button>
                          <button onClick={() => handleDeleteEvent(monthIndex, ei)}
                            style={{ flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.6rem', cursor: 'pointer', lineHeight: 1 }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* 일정 추가 */}
            <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', borderTop: '1px solid #f0f2f5', background: '#fafbfc' }}>
              <input
                value={newEvents[monthIndex] || ''}
                onChange={e => setNewEvents(n => ({ ...n, [monthIndex]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddEvent(monthIndex)}
                placeholder="일정 추가..."
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.78rem' }}
              />
              <button onClick={() => handleAddEvent(monthIndex)}
                style={{ flexShrink: 0, padding: '6px 10px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
