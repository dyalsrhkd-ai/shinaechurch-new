import { useEffect, useMemo, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'

const ERA_COLORS = ['#1d4ed8', '#0369a1', '#7c3aed', '#059669', '#dc2626', '#d97706']
const EMPTY_ERA_FORM = { period: '', color: '#1d4ed8' }

function cloneEras(list) {
  return list.map(era => ({
    ...era,
    events: (era.events || []).map(event => ({ ...event })),
  }))
}

export default function HistoryManager() {
  const [eras, setEras] = useState([])
  const [originalEras, setOriginalEras] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eraForm, setEraForm] = useState(EMPTY_ERA_FORM)
  const [addingEra, setAddingEra] = useState(false)
  const [eventForms, setEventForms] = useState({})

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(eras) !== JSON.stringify(originalEras)
  }, [eras, originalEras])

  const fetchEras = async () => {
    setLoading(true)
    try {
      const list = await listContentDocuments('history')
      list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      const cloned = cloneEras(list)
      setEras(cloned)
      setOriginalEras(cloneEras(cloned))
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEras()
  }, [])

  const handleAddEra = async () => {
    if (!eraForm.period.trim()) return alert('기간을 입력하세요')
    setAddingEra(true)
    try {
      await createContentDocument('history', {
        period: eraForm.period.trim(),
        color: eraForm.color,
        order: eras.length,
        events: [],
      })
      setEraForm(EMPTY_ERA_FORM)
      await fetchEras()
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '교회 연혁 시대 구분을 추가했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setAddingEra(false)
  }

  const handleDeleteEra = async (eraId) => {
    if (!window.confirm('이 시대 구분과 모든 연혁을 삭제하시겠습니까?')) return
    await deleteContentDocument('history', eraId)
    await fetchEras()
    window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { action: 'delete', message: '교회 연혁 시대 구분을 삭제했습니다.' } }))
  }

  const handleEraChange = (eraId, field, value) => {
    setEras(current => current.map(era => (
      era.id === eraId ? { ...era, [field]: value } : era
    )))
  }

  const handleEventChange = (eraId, eventIndex, field, value) => {
    setEras(current => current.map(era => {
      if (era.id !== eraId) return era
      return {
        ...era,
        events: (era.events || []).map((event, index) => (
          index === eventIndex ? { ...event, [field]: value } : event
        )),
      }
    }))
  }

  const handleDeleteEvent = (eraId, eventIndex) => {
    setEras(current => current.map(era => (
      era.id === eraId
        ? { ...era, events: (era.events || []).filter((_, index) => index !== eventIndex) }
        : era
    )))
  }

  const setEventForm = (eraId, field, value) => {
    setEventForms(current => ({
      ...current,
      [eraId]: { ...(current[eraId] || { date: '', desc: '' }), [field]: value },
    }))
  }

  const handleAddEvent = (eraId) => {
    const form = eventForms[eraId] || { date: '', desc: '' }
    if (!form.date.trim()) return alert('날짜를 입력하세요')
    if (!form.desc.trim()) return alert('내용을 입력하세요')

    setEras(current => current.map(era => (
      era.id === eraId
        ? { ...era, events: [...(era.events || []), { date: form.date.trim(), desc: form.desc.trim() }] }
        : era
    )))
    setEventForms(current => ({ ...current, [eraId]: { date: '', desc: '' } }))
  }

  const handleSaveAll = async () => {
    const invalidEra = eras.find(era => !era.period?.trim())
    if (invalidEra) return alert('비어 있는 시대 구분이 있습니다.')

    const invalidEvent = eras
      .flatMap(era => (era.events || []).map(event => ({ ...event, eraId: era.id })))
      .find(event => !event.date?.trim() || !event.desc?.trim())

    if (invalidEvent) return alert('날짜 또는 내용이 비어 있는 연혁 항목이 있습니다.')

    setSaving(true)
    try {
      await Promise.all(eras.map((era, index) => (
        updateContentDocument('history', era.id, {
          period: era.period.trim(),
          color: era.color,
          order: index,
          events: (era.events || []).map(event => ({
            date: event.date.trim(),
            desc: event.desc.trim(),
          })),
        })
      )))
      await fetchEras()
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '교회 연혁을 저장했습니다.' } }))
      alert('교회 연혁이 저장되었습니다.')
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
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
          <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2040' }}>교회 연혁 관리</p>
          <p style={{ fontSize: '0.78rem', color: hasUnsavedChanges ? '#1d4ed8' : '#64748b', marginTop: '4px' }}>
            {hasUnsavedChanges ? '수정된 연혁 내용이 있습니다. 상단 저장 버튼으로 반영하세요.' : `총 ${eras.reduce((sum, era) => sum + (era.events?.length || 0), 0)}건 · 변경사항 없음`}
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
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 시대 구분 추가</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={eraForm.period}
            onChange={event => setEraForm(current => ({ ...current, period: event.target.value }))}
            placeholder="기간 (예: 2021 — 현재)"
            style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>색상</span>
            {ERA_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setEraForm(current => ({ ...current, color }))}
                style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, border: eraForm.color === color ? '3px solid #0f2040' : '2px solid transparent', cursor: 'pointer' }}
              />
            ))}
          </div>
          <button
            onClick={handleAddEra}
            disabled={addingEra}
            style={{ padding: '10px 24px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            {addingEra ? '추가 중...' : '+ 추가'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {eras.map(era => (
            <div key={era.id} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: '#fff', borderBottom: '1px solid #f0f2f5', flexWrap: 'wrap' }}>
                <div style={{ width: '4px', height: '22px', background: era.color, borderRadius: '4px' }} />
                <input
                  value={era.period || ''}
                  onChange={event => handleEraChange(era.id, 'period', event.target.value)}
                  style={{ flex: 1, minWidth: '180px', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.875rem', fontWeight: 700 }}
                />
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {ERA_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleEraChange(era.id, 'color', color)}
                      style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, border: era.color === color ? '3px solid #0f2040' : '2px solid transparent', cursor: 'pointer' }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{era.events?.length || 0}건</span>
                <button
                  onClick={() => handleDeleteEra(era.id)}
                  style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
                >
                  삭제
                </button>
              </div>

              <div style={{ background: '#fafbfc' }}>
                {(era.events || []).map((event, index) => (
                  <div key={index} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px' }}>
                      <input
                        value={event.date || ''}
                        onChange={inputEvent => handleEventChange(era.id, index, 'date', inputEvent.target.value)}
                        style={{ width: '140px', flexShrink: 0, padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: era.color }}
                      />
                      <input
                        value={event.desc || ''}
                        onChange={inputEvent => handleEventChange(era.id, index, 'desc', inputEvent.target.value)}
                        style={{ flex: 1, padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                      />
                      <button
                        onClick={() => handleDeleteEvent(era.id, index)}
                        style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '10px', padding: '12px 20px', background: '#fff', alignItems: 'center' }}>
                  <input
                    value={eventForms[era.id]?.date || ''}
                    onChange={event => setEventForm(era.id, 'date', event.target.value)}
                    placeholder="날짜 (예: 2025.03.01)"
                    style={{ width: '150px', flexShrink: 0, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.82rem' }}
                  />
                  <input
                    value={eventForms[era.id]?.desc || ''}
                    onChange={event => setEventForm(era.id, 'desc', event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && handleAddEvent(era.id)}
                    placeholder="내용"
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.82rem' }}
                  />
                  <button
                    onClick={() => handleAddEvent(era.id)}
                    style={{ flexShrink: 0, padding: '8px 16px', background: era.color, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
