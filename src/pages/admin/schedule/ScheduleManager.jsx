import { useEffect, useMemo, useState } from 'react'
import { getContentDocument, upsertContentDocument } from '../../../api/contentApi'

const DEFAULT_MONTHS = Array.from({ length: 12 }, (_, index) => ({ month: `${index + 1}월`, events: [] }))

function cloneMonths(list) {
  return (list || DEFAULT_MONTHS).map(month => ({
    ...month,
    events: [...(month.events || [])],
  }))
}

export default function ScheduleManager() {
  const [data, setData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newEvents, setNewEvents] = useState({})

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(originalData)
  }, [data, originalData])

  const fetchData = async () => {
    setLoading(true)
    try {
      const next = await getContentDocument('schedule', 'main')
      if (next) {
        const normalized = {
          ...next,
          year: next.year || '',
          motto: next.motto || '',
          months: cloneMonths(next.months),
        }
        setData(normalized)
        setOriginalData({
          ...normalized,
          months: cloneMonths(normalized.months),
        })
      } else {
        const fallback = { year: '', motto: '', months: cloneMonths(DEFAULT_MONTHS) }
        setData(fallback)
        setOriginalData({ ...fallback, months: cloneMonths(fallback.months) })
      }
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const months = data?.months || DEFAULT_MONTHS

  const updateMonthEvent = (monthIndex, eventIndex, value) => {
    setData(current => ({
      ...current,
      months: current.months.map((month, index) => (
        index === monthIndex
          ? { ...month, events: month.events.map((event, idx) => idx === eventIndex ? value : event) }
          : month
      )),
    }))
  }

  const addMonthEvent = (monthIndex) => {
    const text = (newEvents[monthIndex] || '').trim()
    if (!text) return alert('일정 내용을 입력하세요')
    setData(current => ({
      ...current,
      months: current.months.map((month, index) => (
        index === monthIndex ? { ...month, events: [...month.events, text] } : month
      )),
    }))
    setNewEvents(current => ({ ...current, [monthIndex]: '' }))
  }

  const deleteMonthEvent = (monthIndex, eventIndex) => {
    setData(current => ({
      ...current,
      months: current.months.map((month, index) => (
        index === monthIndex ? { ...month, events: month.events.filter((_, idx) => idx !== eventIndex) } : month
      )),
    }))
  }

  const handleSaveAll = async () => {
    const invalidEvent = months.flatMap(month => month.events).find(event => !String(event || '').trim())
    if (invalidEvent !== undefined) return alert('비어 있는 일정 항목이 있습니다.')

    setSaving(true)
    try {
      const payload = {
        ...data,
        year: String(data.year || '').trim(),
        motto: String(data.motto || '').trim(),
        months: months.map(month => ({
          ...month,
          events: month.events.map(event => String(event || '').trim()),
        })),
      }
      await upsertContentDocument('schedule', 'main', payload)
      await fetchData()
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '연간 일정을 저장했습니다.' } }))
      alert('연간 일정이 저장되었습니다.')
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
          <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2040' }}>연간 일정 관리</p>
          <p style={{ fontSize: '0.78rem', color: hasUnsavedChanges ? '#1d4ed8' : '#64748b', marginTop: '4px' }}>
            {hasUnsavedChanges ? '수정된 일정 내용이 있습니다. 상단 저장 버튼으로 반영하세요.' : '변경사항 없음'}
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
            placeholder="연도 (예: 2026)"
            style={{ width: '100px', flexShrink: 0, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={data.motto}
            onChange={event => setData(current => ({ ...current, motto: event.target.value }))}
            placeholder="표어"
            style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ marginTop: '14px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '10px', padding: '14px 18px', borderLeft: '4px solid #1d4ed8' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '4px' }}>{data.year}년 표어</p>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{data.motto || '표어를 입력하세요'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {months.map((month, monthIndex) => (
          <div key={month.month} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#0f2040' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{month.month}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{month.events.length}개</span>
            </div>

            <div style={{ padding: '8px 14px', minHeight: '48px' }}>
              {month.events.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#c9d0db', padding: '6px 0' }}>일정 없음</p>
              ) : (
                month.events.map((event, eventIndex) => (
                  <div key={eventIndex} style={{ borderBottom: eventIndex < month.events.length - 1 ? '1px solid #f0f2f5' : 'none', padding: '5px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ flexShrink: 0, width: '5px', height: '5px', borderRadius: '50%', background: '#1d4ed8' }} />
                      <input
                        value={event}
                        onChange={inputEvent => updateMonthEvent(monthIndex, eventIndex, inputEvent.target.value)}
                        style={{ flex: 1, padding: '5px 7px', border: '1px solid #d1d5db', borderRadius: '5px', fontSize: '0.8rem', color: '#374151', lineHeight: 1.4 }}
                      />
                      <button
                        onClick={() => deleteMonthEvent(monthIndex, eventIndex)}
                        style={{ flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.6rem', cursor: 'pointer', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', borderTop: '1px solid #f0f2f5', background: '#fafbfc' }}>
              <input
                value={newEvents[monthIndex] || ''}
                onChange={event => setNewEvents(current => ({ ...current, [monthIndex]: event.target.value }))}
                onKeyDown={event => event.key === 'Enter' && addMonthEvent(monthIndex)}
                placeholder="일정 추가..."
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.78rem' }}
              />
              <button
                onClick={() => addMonthEvent(monthIndex)}
                style={{ flexShrink: 0, padding: '6px 10px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
