import { useEffect, useMemo, useState } from 'react'
import { getContentDocument, upsertContentDocument } from '../../../api/contentApi'

const EMPTY_ROW = { name: '', time: '', place: '' }

function cloneRows(list) {
  return (list || []).map(row => ({ ...row }))
}

function ServiceTable({ title, color, rows, onChange, onAdd, onDelete }) {
  const [newRow, setNewRow] = useState(EMPTY_ROW)

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '4px', height: '20px', background: color, borderRadius: '4px' }} />
        {title}
      </h3>

      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', background: '#0f2040', padding: '10px 16px' }}>
          {['예배', '시간', '장소', ''].map(header => (
            <span key={header} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{header}</span>
          ))}
        </div>

        {rows.map((row, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', padding: '10px 16px', gap: '8px', background: index % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', borderBottom: '1px solid #f0f2f5' }}>
            <input
              value={row.name}
              onChange={event => onChange(index, { ...row, name: event.target.value })}
              style={{ padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#0f2040' }}
            />
            <input
              value={row.time}
              onChange={event => onChange(index, { ...row, time: event.target.value })}
              style={{ padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', color, fontWeight: 600 }}
            />
            <input
              value={row.place}
              onChange={event => onChange(index, { ...row, place: event.target.value })}
              style={{ padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', color: '#6b7280' }}
            />
            <button
              onClick={() => onDelete(index)}
              style={{ fontSize: '0.72rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 0', cursor: 'pointer' }}
            >
              삭제
            </button>
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 88px', padding: '10px 16px', gap: '8px', background: '#f0fdf4', alignItems: 'center' }}>
          <input
            value={newRow.name}
            onChange={event => setNewRow(current => ({ ...current, name: event.target.value }))}
            placeholder="예배명"
            style={{ padding: '7px 9px', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '0.82rem' }}
          />
          <input
            value={newRow.time}
            onChange={event => setNewRow(current => ({ ...current, time: event.target.value }))}
            placeholder="오전 00:00"
            style={{ padding: '7px 9px', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '0.82rem' }}
          />
          <input
            value={newRow.place}
            onChange={event => setNewRow(current => ({ ...current, place: event.target.value }))}
            placeholder="장소"
            onKeyDown={event => {
              if (event.key !== 'Enter') return
              onAdd(newRow)
              setNewRow(EMPTY_ROW)
            }}
            style={{ padding: '7px 9px', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '0.82rem' }}
          />
          <button
            onClick={() => {
              onAdd(newRow)
              setNewRow(EMPTY_ROW)
            }}
            style={{ padding: '6px 0', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorshipManager() {
  const [data, setData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(originalData)
  }, [data, originalData])

  const fetchData = async () => {
    setLoading(true)
    try {
      const next = await getContentDocument('worship', 'main')
      if (next) {
        const normalized = {
          ...next,
          year: next.year || '',
          motto: next.motto || '',
          notice: next.notice || '',
          mainServices: cloneRows(next.mainServices),
          deptServices: cloneRows(next.deptServices),
        }
        setData(normalized)
        setOriginalData({
          ...normalized,
          mainServices: cloneRows(normalized.mainServices),
          deptServices: cloneRows(normalized.deptServices),
        })
      } else {
        const fallback = { year: '', motto: '', notice: '', mainServices: [], deptServices: [] }
        setData(fallback)
        setOriginalData({ ...fallback, mainServices: [], deptServices: [] })
      }
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updateRow = (field, rowIndex, value) => {
    setData(current => ({
      ...current,
      [field]: current[field].map((row, index) => index === rowIndex ? value : row),
    }))
  }

  const addRow = (field, row) => {
    if (!row.name.trim()) return alert('예배명을 입력하세요')
    if (!row.time.trim()) return alert('시간을 입력하세요')
    if (!row.place.trim()) return alert('장소를 입력하세요')
    setData(current => ({
      ...current,
      [field]: [...current[field], { name: row.name.trim(), time: row.time.trim(), place: row.place.trim() }],
    }))
  }

  const deleteRow = (field, rowIndex) => {
    setData(current => ({
      ...current,
      [field]: current[field].filter((_, index) => index !== rowIndex),
    }))
  }

  const handleSaveAll = async () => {
    const invalidRow = [...(data.mainServices || []), ...(data.deptServices || [])].find(row => !row.name?.trim() || !row.time?.trim() || !row.place?.trim())
    if (invalidRow) return alert('비어 있는 예배 항목이 있습니다.')

    setSaving(true)
    try {
      const payload = {
        ...data,
        year: String(data.year || '').trim(),
        motto: String(data.motto || '').trim(),
        notice: String(data.notice || '').trim(),
        mainServices: cloneRows(data.mainServices).map(row => ({
          name: row.name.trim(),
          time: row.time.trim(),
          place: row.place.trim(),
        })),
        deptServices: cloneRows(data.deptServices).map(row => ({
          name: row.name.trim(),
          time: row.time.trim(),
          place: row.place.trim(),
        })),
      }
      await upsertContentDocument('worship', 'main', payload)
      await fetchData()
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '예배 안내를 저장했습니다.' } }))
      alert('예배 안내가 저장되었습니다.')
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
  }

  return (
    <div>
      <div style={{
        position: 'sticky',
        top: '80px',
        zIndex: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        borderRadius: '16px',
        border: hasUnsavedChanges ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
        background: hasUnsavedChanges ? 'rgba(239,246,255,0.96)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
      }}>
        <div>
          <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2040' }}>예배 안내 관리</p>
          <p style={{ fontSize: '0.78rem', color: hasUnsavedChanges ? '#1d4ed8' : '#64748b', marginTop: '4px' }}>
            {hasUnsavedChanges ? '수정된 예배 안내 내용이 있습니다. 상단 저장 버튼으로 반영하세요.' : '변경사항 없음'}
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || !hasUnsavedChanges}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040',
            color: '#fff',
            fontWeight: 800,
            cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>연도 및 표어</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={data.year}
            onChange={event => setData(current => ({ ...current, year: event.target.value }))}
            placeholder="연도"
            style={{ width: '90px', flexShrink: 0, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={data.motto}
            onChange={event => setData(current => ({ ...current, motto: event.target.value }))}
            placeholder="표어"
            style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '10px', padding: '12px 16px', borderLeft: '4px solid #1d4ed8' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '3px' }}>{data.year}년 표어</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2040' }}>{data.motto || '표어를 입력하세요'}</p>
        </div>
      </div>

      <ServiceTable
        title="주요 예배"
        color="#1d4ed8"
        rows={data.mainServices || []}
        onChange={(index, value) => updateRow('mainServices', index, value)}
        onAdd={row => addRow('mainServices', row)}
        onDelete={index => deleteRow('mainServices', index)}
      />

      <ServiceTable
        title="부서 예배"
        color="#7c3aed"
        rows={data.deptServices || []}
        onChange={(index, value) => updateRow('deptServices', index, value)}
        onAdd={row => addRow('deptServices', row)}
        onDelete={index => deleteRow('deptServices', index)}
      />

      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', background: '#059669', borderRadius: '4px' }} />
          안내 문구
        </h3>
        <textarea
          value={data.notice}
          onChange={event => setData(current => ({ ...current, notice: event.target.value }))}
          rows={3}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '0.875rem', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  )
}
