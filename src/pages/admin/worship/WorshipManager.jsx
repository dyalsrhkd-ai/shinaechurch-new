import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase'

const EMPTY_ROW = { name: '', time: '', place: '' }

function ServiceTable({ title, color, rows, onAdd, onDelete, onSave }) {
  const [editIdx, setEditIdx] = useState(null)
  const [editVal, setEditVal] = useState(EMPTY_ROW)
  const [newRow, setNewRow] = useState(EMPTY_ROW)
  const [adding, setAdding] = useState(false)

  const startEdit = (i) => { setEditIdx(i); setEditVal({ ...rows[i] }) }
  const cancelEdit = () => setEditIdx(null)
  const saveEdit = () => { onSave(editIdx, editVal); setEditIdx(null) }

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '4px', height: '20px', background: color, borderRadius: '4px' }} />
        {title}
      </h3>

      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        {/* 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', background: '#0f2040', padding: '10px 16px' }}>
          {['예배', '시간', '장소', ''].map(h => (
            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{h}</span>
          ))}
        </div>

        {/* 행 목록 */}
        {rows.map((row, i) => (
          <div key={i} style={{ borderBottom: '1px solid #f0f2f5' }}>
            {editIdx === i ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', padding: '10px 16px', gap: '8px', background: '#fffbeb', alignItems: 'center' }}>
                <input value={editVal.name}  onChange={e => setEditVal(v => ({ ...v, name: e.target.value }))}
                  style={{ padding: '7px 9px', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.82rem' }} />
                <input value={editVal.time}  onChange={e => setEditVal(v => ({ ...v, time: e.target.value }))}
                  style={{ padding: '7px 9px', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.82rem' }} />
                <input value={editVal.place} onChange={e => setEditVal(v => ({ ...v, place: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  style={{ padding: '7px 9px', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.82rem' }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={saveEdit}
                    style={{ flex: 1, padding: '6px 0', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>저장</button>
                  <button onClick={cancelEdit}
                    style={{ flex: 1, padding: '6px 0', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem' }}>취소</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', padding: '13px 16px', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{row.name}</span>
                <span style={{ fontSize: '0.875rem', color, fontWeight: 600 }}>{row.time}</span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{row.place}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => startEdit(i)}
                    style={{ flex: 1, fontSize: '0.72rem', color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 0', cursor: 'pointer' }}>수정</button>
                  <button onClick={() => onDelete(i)}
                    style={{ flex: 1, fontSize: '0.72rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 0', cursor: 'pointer' }}>삭제</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 추가 행 */}
        {adding ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', padding: '10px 16px', gap: '8px', background: '#f0fdf4', alignItems: 'center' }}>
            <input value={newRow.name}  onChange={e => setNewRow(v => ({ ...v, name: e.target.value }))}
              placeholder="예배명" style={{ padding: '7px 9px', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '0.82rem' }} autoFocus />
            <input value={newRow.time}  onChange={e => setNewRow(v => ({ ...v, time: e.target.value }))}
              placeholder="오전 00:00" style={{ padding: '7px 9px', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '0.82rem' }} />
            <input value={newRow.place} onChange={e => setNewRow(v => ({ ...v, place: e.target.value }))}
              placeholder="장소" onKeyDown={e => { if (e.key === 'Enter') { onAdd(newRow); setNewRow(EMPTY_ROW); setAdding(false) } }}
              style={{ padding: '7px 9px', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '0.82rem' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { onAdd(newRow); setNewRow(EMPTY_ROW); setAdding(false) }}
                style={{ flex: 1, padding: '6px 0', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>추가</button>
              <button onClick={() => { setAdding(false); setNewRow(EMPTY_ROW) }}
                style={{ flex: 1, padding: '6px 0', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem' }}>취소</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 16px', background: '#fff' }}>
            <button onClick={() => setAdding(true)}
              style={{ fontSize: '0.82rem', color, background: 'none', border: `1px dashed ${color}`, borderRadius: '7px', padding: '7px 16px', cursor: 'pointer', fontWeight: 700, width: '100%' }}>
              + 예배 추가
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorshipManager() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mottoForm, setMottoForm] = useState({ year: '', motto: '' })
  const [savingMotto, setSavingMotto] = useState(false)
  const [noticeText, setNoticeText] = useState('')
  const [savingNotice, setSavingNotice] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'worship', 'main'))
      if (snap.exists()) {
        const d = snap.data()
        setData(d)
        setMottoForm({ year: d.year || '', motto: d.motto || '' })
        setNoticeText(d.notice || '')
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const updateField = async (field, value) => {
    const updated = { ...data, [field]: value, updatedAt: serverTimestamp() }
    await setDoc(doc(db, 'worship', 'main'), updated)
    setData(updated)
  }

  const saveMotto = async () => {
    setSavingMotto(true)
    try { await updateField('year', mottoForm.year.trim()); await updateField('motto', mottoForm.motto.trim()); await fetchData() }
    catch (e) { alert('오류: ' + e.message) }
    setSavingMotto(false)
  }

  const saveNotice = async () => {
    setSavingNotice(true)
    try { await updateField('notice', noticeText.trim()); }
    catch (e) { alert('오류: ' + e.message) }
    setSavingNotice(false)
  }

  // 주요 예배 CRUD
  const addMain = async (row) => {
    if (!row.name.trim()) return alert('예배명을 입력하세요')
    const updated = [...(data.mainServices || []), row]
    await updateField('mainServices', updated)
    await fetchData()
  }
  const deleteMain = async (i) => {
    const updated = data.mainServices.filter((_, idx) => idx !== i)
    await updateField('mainServices', updated)
    await fetchData()
  }
  const saveMain = async (i, val) => {
    const updated = data.mainServices.map((r, idx) => idx === i ? val : r)
    await updateField('mainServices', updated)
    await fetchData()
  }

  // 부서 예배 CRUD
  const addDept = async (row) => {
    if (!row.name.trim()) return alert('예배명을 입력하세요')
    const updated = [...(data.deptServices || []), row]
    await updateField('deptServices', updated)
    await fetchData()
  }
  const deleteDept = async (i) => {
    const updated = data.deptServices.filter((_, idx) => idx !== i)
    await updateField('deptServices', updated)
    await fetchData()
  }
  const saveDept = async (i, val) => {
    const updated = data.deptServices.map((r, idx) => idx === i ? val : r)
    await updateField('deptServices', updated)
    await fetchData()
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>예배 안내 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
          주요 예배 {data?.mainServices?.length || 0}개 · 부서 예배 {data?.deptServices?.length || 0}개
        </p>
      </div>

      {/* 표어 */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>연도 및 표어</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={mottoForm.year} onChange={e => setMottoForm(f => ({ ...f, year: e.target.value }))}
            placeholder="연도" style={{ width: '90px', flexShrink: 0, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }} />
          <input value={mottoForm.motto} onChange={e => setMottoForm(f => ({ ...f, motto: e.target.value }))}
            placeholder="표어" style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }} />
          <button onClick={saveMotto} disabled={savingMotto}
            style={{ flexShrink: 0, padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            {savingMotto ? '저장 중...' : '저장'}
          </button>
        </div>
        <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '10px', padding: '12px 16px', borderLeft: '4px solid #1d4ed8' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '3px' }}>{mottoForm.year}년 표어</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2040' }}>{mottoForm.motto || '표어를 입력하세요'}</p>
        </div>
      </div>

      {/* 주요 예배 */}
      <ServiceTable
        title="주요 예배"
        color="#1d4ed8"
        rows={data?.mainServices || []}
        onAdd={addMain}
        onDelete={deleteMain}
        onSave={saveMain}
      />

      {/* 부서 예배 */}
      <ServiceTable
        title="부서 예배"
        color="#7c3aed"
        rows={data?.deptServices || []}
        onAdd={addDept}
        onDelete={deleteDept}
        onSave={saveDept}
      />

      {/* 안내 문구 */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#059669', borderRadius: '4px' }} />
          안내 문구
        </h3>
        <textarea
          value={noticeText}
          onChange={e => setNoticeText(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '0.875rem', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
        <button onClick={saveNotice} disabled={savingNotice}
          style={{ marginTop: '10px', padding: '9px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          {savingNotice ? '저장 중...' : '안내 문구 저장'}
        </button>
      </div>
    </div>
  )
}
