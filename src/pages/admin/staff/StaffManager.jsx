import { useEffect, useMemo, useRef, useState } from 'react'
import { createContentDocument, deleteContentDocument, getContentDocument, listContentDocuments, updateContentDocument, upsertContentDocument } from '../../../api/contentApi'
import { uploadMedia } from '../../../utils/mediaStorage'
import { validateImageFile } from '../../../utils/fileValidation'

const DEFAULT_SECTIONS = ['담임목사', '교역자', '시무장로', '안수집사']
const GROUP_COLORS = {
  '담임목사': '#1d4ed8',
  '교역자': '#0369a1',
  '시무장로': '#7c3aed',
  '안수집사': '#059669',
}
const DEFAULT_COLOR = '#64748b'

function buildSectionEntry(name, order) {
  return {
    id: `section-${name}`,
    name,
    order,
    color: GROUP_COLORS[name] ?? DEFAULT_COLOR,
    rowPattern: '',
  }
}

function cloneSections(list) {
  return list.map(section => ({ ...section }))
}

function cloneStaff(list) {
  return list.map(member => ({ ...member }))
}

function normalizeSections(list) {
  return [...list].map((section, index) => ({
    id: section.id || `section-${section.name}`,
    name: section.name,
    order: index,
    color: section.color || GROUP_COLORS[section.name] || DEFAULT_COLOR,
    rowPattern: section.rowPattern || '',
  }))
}

function normalizeStaffBySections(list, sections) {
  const grouped = new Map()
  list.forEach(member => {
    const groupName = member.group
    if (!grouped.has(groupName)) grouped.set(groupName, [])
    grouped.get(groupName).push(member)
  })

  const normalized = []
  sections.forEach((section, sectionIndex) => {
    const members = [...(grouped.get(section.name) || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    members.forEach((member, memberIndex) => {
      normalized.push({
        ...member,
        group: section.name,
        groupOrder: sectionIndex,
        order: memberIndex,
      })
    })
    grouped.delete(section.name)
  })

  return normalized
}

function sortMembers(list, sections) {
  const orderMap = new Map(sections.map(section => [section.name, section.order ?? 99]))
  return [...list].sort((a, b) => {
    const ao = orderMap.get(a.group) ?? 99
    const bo = orderMap.get(b.group) ?? 99
    return ao - bo || (a.order ?? 0) - (b.order ?? 0)
  })
}

export default function StaffManager() {
  const [staff, setStaff] = useState([])
  const [sections, setSections] = useState([])
  const [originalStaff, setOriginalStaff] = useState([])
  const [originalSections, setOriginalSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSection, setNewSection] = useState('')
  const [form, setForm] = useState({
    name: '',
    role: '',
    group: DEFAULT_SECTIONS[0],
    file: null,
    preview: null,
  })
  const [draggingMemberId, setDraggingMemberId] = useState('')
  const fileRef = useRef()

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify({ staff, sections }) !== JSON.stringify({ staff: originalStaff, sections: originalSections })
  }, [originalSections, originalStaff, sections, staff])

  const sectionNames = useMemo(() => sections.map(section => section.name), [sections])

  const grouped = useMemo(() => {
    return staff.reduce((accumulator, member) => {
      if (!accumulator[member.group]) accumulator[member.group] = []
      accumulator[member.group].push(member)
      return accumulator
    }, {})
  }, [staff])

  const markSaved = (message = '섬기는 사람들 정보를 저장했습니다.', action = 'save') => {
    window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message, action } }))
  }

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const [fetchedStaff, settings] = await Promise.all([
        listContentDocuments('staff'),
        getContentDocument('staff_settings', 'main'),
      ])

      const storedSections = settings?.sections || []
      const fallbackSections = DEFAULT_SECTIONS.map((name, index) => buildSectionEntry(name, index))
      const baseSections = normalizeSections(
        [...(storedSections.length > 0 ? storedSections : fallbackSections)]
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      )

      const knownNames = new Set(baseSections.map(section => section.name))
      fetchedStaff.forEach(member => {
        if (member.group && !knownNames.has(member.group)) {
          knownNames.add(member.group)
          baseSections.push(buildSectionEntry(member.group, baseSections.length))
        }
      })

      const normalizedSections = normalizeSections(baseSections)
      const normalizedStaff = normalizeStaffBySections(
        fetchedStaff.map(member => ({
          ...member,
          group: member.group || normalizedSections[0]?.name || DEFAULT_SECTIONS[0],
        })),
        normalizedSections
      )

      setSections(cloneSections(normalizedSections))
      setOriginalSections(cloneSections(normalizedSections))
      setStaff(cloneStaff(normalizedStaff))
      setOriginalStaff(cloneStaff(normalizedStaff))
      setForm(current => ({
        ...current,
        group: normalizedSections[0]?.name || DEFAULT_SECTIONS[0],
      }))

      await upsertContentDocument('staff_settings', 'main', { sections: normalizedSections })
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const error = validateImageFile(file)
    if (error) {
      alert(error)
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = loadEvent => {
      setForm(current => ({ ...current, file, preview: loadEvent.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleAddSection = () => {
    const name = newSection.trim()
    if (!name) return alert('섹션명을 입력하세요')
    if (sections.some(section => section.name === name)) return alert('이미 있는 섹션입니다')

    const nextSections = normalizeSections([...sections, buildSectionEntry(name, sections.length)])
    setSections(nextSections)
    setStaff(current => normalizeStaffBySections(current, nextSections))
    setNewSection('')
  }

  const handleSectionNameChange = (sectionId, value) => {
    const trimmedStart = value.replace(/^\s+/, '')
    setSections(current => {
      const target = current.find(section => section.id === sectionId)
      if (!target) return current

      const previousName = target.name
      const nextSections = current.map(section => (
        section.id === sectionId ? { ...section, name: trimmedStart } : section
      ))

      setStaff(staffCurrent => normalizeStaffBySections(
        staffCurrent.map(member => (
          member.group === previousName ? { ...member, group: trimmedStart } : member
        )),
        normalizeSections(nextSections)
      ))
      setForm(formCurrent => ({
        ...formCurrent,
        group: formCurrent.group === previousName ? trimmedStart : formCurrent.group,
      }))

      return nextSections
    })
  }

  const handleSectionDelete = async (sectionId) => {
    const target = sections.find(section => section.id === sectionId)
    if (!target) return
    const memberCount = staff.filter(member => member.group === target.name).length
    if (memberCount > 0) {
      return alert('인원이 남아 있는 섹션은 삭제할 수 없습니다. 먼저 인원을 다른 섹션으로 옮겨주세요.')
    }
    if (!window.confirm(`'${target.name}' 섹션을 삭제하시겠습니까?`)) return

    const nextSections = normalizeSections(sections.filter(section => section.id !== sectionId))
    setSections(nextSections)
    setStaff(current => normalizeStaffBySections(current, nextSections))
    setForm(current => ({
      ...current,
      group: current.group === target.name ? (nextSections[0]?.name || '') : current.group,
    }))
  }

  const handleSectionFieldChange = (sectionId, field, value) => {
    setSections(current => current.map(section => (
      section.id === sectionId ? { ...section, [field]: value } : section
    )))
  }

  const handleMemberChange = (memberId, field, value) => {
    setStaff(current => {
      const target = current.find(member => member.id === memberId)
      if (!target) return current

      if (field !== 'group') {
        return current.map(member => (
          member.id === memberId ? { ...member, [field]: value } : member
        ))
      }

      const moved = current.map(member => (
        member.id === memberId ? { ...member, group: value } : member
      ))
      return normalizeStaffBySections(moved, sections)
    })
  }

  const handleAdd = async () => {
    if (!form.name.trim()) return alert('이름을 입력하세요')
    if (!form.role.trim()) return alert('직책을 입력하세요')
    if (!form.group) return alert('섹션을 선택하세요')

    setSaving(true)
    try {
      let imgUrl = ''
      if (form.file) {
        imgUrl = (await uploadMedia(form.file, 'staff')).url
      }

      const groupMembers = staff.filter(member => member.group === form.group)
      const maxOrder = groupMembers.length > 0 ? Math.max(...groupMembers.map(member => member.order ?? 0)) + 1 : 0
      const groupOrder = sections.find(section => section.name === form.group)?.order ?? 99

      await createContentDocument('staff', {
        name: form.name.trim(),
        role: form.role.trim(),
        group: form.group,
        groupOrder,
        order: maxOrder,
        imgUrl,
      })

      setForm({
        name: '',
        role: '',
        group: sections[0]?.name || DEFAULT_SECTIONS[0],
        file: null,
        preview: null,
      })
      if (fileRef.current) fileRef.current.value = ''

      await fetchStaff()
      markSaved('섬기는 사람들 인원을 등록했습니다.')
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteContentDocument('staff', id)
    await fetchStaff()
    markSaved('섬기는 사람들 인원을 삭제했습니다.', 'delete')
  }

  const handleMemberDragStart = (event, memberId) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', memberId)
    setDraggingMemberId(memberId)
  }

  const handleMemberDragEnd = () => {
    setDraggingMemberId('')
  }

  const handleMemberDrop = (groupName, targetId) => {
    if (!draggingMemberId || draggingMemberId === targetId) return

    const groupMembers = [...(grouped[groupName] || [])]
    const fromIndex = groupMembers.findIndex(member => member.id === draggingMemberId)
    const toIndex = groupMembers.findIndex(member => member.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const reordered = [...groupMembers]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    const nextStaff = staff.map(member => {
      if (member.group !== groupName) return member
      const nextOrder = reordered.findIndex(item => item.id === member.id)
      return nextOrder === -1 ? member : { ...member, order: nextOrder }
    })

    setStaff(sortMembers(nextStaff, sections))
    setDraggingMemberId('')
  }

  const moveSection = (sectionId, direction) => {
    const fromIndex = sections.findIndex(section => section.id === sectionId)
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (fromIndex === -1 || toIndex < 0 || toIndex >= sections.length) return
    const reordered = [...sections]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    const normalizedSections = normalizeSections(reordered)
    setSections(normalizedSections)
    setStaff(current => normalizeStaffBySections(current, normalizedSections))
  }

  const handleSaveAll = async () => {
    const invalidSection = sections.find(section => !section.name.trim())
    if (invalidSection) return alert('비어 있는 섹션명이 있습니다.')

    const sectionNameSet = new Set()
    for (const section of sections) {
      const name = section.name.trim()
      if (sectionNameSet.has(name)) return alert('중복된 섹션명이 있습니다.')
      sectionNameSet.add(name)
    }

    const invalidMember = staff.find(member => !member.name?.trim() || !member.role?.trim() || !member.group?.trim())
    if (invalidMember) return alert('이름, 직책, 섹션이 비어 있는 인원이 있습니다.')

    setSaving(true)
    try {
      const normalizedSections = normalizeSections(sections.map(section => ({
        ...section,
        name: section.name.trim(),
        rowPattern: (section.rowPattern || '').replace(/\s+/g, ''),
      })))
      const normalizedStaff = normalizeStaffBySections(
        staff.map(member => ({
          ...member,
          name: member.name.trim(),
          role: member.role.trim(),
          group: member.group.trim(),
        })),
        normalizedSections
      )

      await upsertContentDocument('staff_settings', 'main', { sections: normalizedSections })
      await Promise.all(normalizedStaff.map(member => (
        updateContentDocument('staff', member.id, {
          ...member,
          name: member.name,
          role: member.role,
          group: member.group,
          groupOrder: member.groupOrder,
          order: member.order,
        })
      )))

      setSections(cloneSections(normalizedSections))
      setOriginalSections(cloneSections(normalizedSections))
      setStaff(cloneStaff(normalizedStaff))
      setOriginalStaff(cloneStaff(normalizedStaff))
      markSaved('섬기는 사람들 정보를 저장했습니다.')
      alert('섬기는 사람들 정보가 저장되었습니다.')
    } catch (error) {
      alert(`저장 오류: ${error.message}`)
    }
    setSaving(false)
  }

  const groupColor = (name) => {
    const section = sections.find(item => item.name === name)
    return section?.color || GROUP_COLORS[name] || DEFAULT_COLOR
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
          <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2040' }}>섬기는 사람들 관리</p>
          <p style={{ fontSize: '0.78rem', color: hasUnsavedChanges ? '#1d4ed8' : '#64748b', marginTop: '4px' }}>
            {hasUnsavedChanges ? '공개 페이지와 같은 배치로 편집 중입니다. 상단 저장 버튼으로 한 번에 반영하세요.' : `총 ${staff.length}명 · 변경사항 없음`}
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

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2040', marginBottom: '14px' }}>섹션 관리</p>
        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px' }}>섹션 이름, 색상, 배치 패턴을 바로 수정하고 순서는 화살표 버튼으로 바꾸면 됩니다. `2,3`은 첫 줄 2명 둘째 줄 3명이고, `2,1-1,4`는 둘째 줄 두 사람 사이를 한 칸 띄웁니다.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            value={newSection}
            onChange={event => setNewSection(event.target.value)}
            placeholder="새 섹션명 입력"
            style={{ flex: '1 1 240px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <button
            onClick={handleAddSection}
            disabled={saving}
            style={{ padding: '10px 16px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
          >
            섹션 추가
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.map(section => (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 12px',
              }}
            >
              <input
                value={section.name}
                onChange={event => handleSectionNameChange(section.id, event.target.value)}
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.76rem', color: '#64748b' }}>
                색상
                <input
                  type="color"
                  value={section.color || groupColor(section.name)}
                  onChange={event => handleSectionFieldChange(section.id, 'color', event.target.value)}
                  style={{ width: '38px', height: '32px', padding: 0, border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}
                />
              </label>
                <input
                  value={section.rowPattern || ''}
                  onChange={event => handleSectionFieldChange(section.id, 'rowPattern', event.target.value)}
                placeholder="배치 예: 2,3 또는 2,1-1,4"
                  style={{ width: '120px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem' }}
                />
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {staff.filter(member => member.group === section.name).length}명
              </span>
              <button
                type="button"
                onClick={() => moveSection(section.id, 'up')}
                disabled={sections[0]?.id === section.id}
                style={{ padding: '8px 10px', background: '#fff', color: sections[0]?.id === section.id ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: sections[0]?.id === section.id ? 'default' : 'pointer', fontSize: '0.78rem' }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSection(section.id, 'down')}
                disabled={sections[sections.length - 1]?.id === section.id}
                style={{ padding: '8px 10px', background: '#fff', color: sections[sections.length - 1]?.id === section.id ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: sections[sections.length - 1]?.id === section.id ? 'default' : 'pointer', fontSize: '0.78rem' }}
              >
                ↓
              </button>
              <button
                onClick={() => handleSectionDelete(section.id)}
                disabled={saving}
                style={{ padding: '8px 12px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2040', marginBottom: '14px' }}>새 인원 등록</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <input
            value={form.name}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            placeholder="이름"
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={form.role}
            onChange={event => setForm(current => ({ ...current, role: event.target.value }))}
            placeholder="직책"
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <select
            value={form.group}
            onChange={event => setForm(current => ({ ...current, group: event.target.value }))}
            style={{ padding: '10px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem', background: '#fff' }}
          >
            {sectionNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {form.preview ? (
            <img src={form.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', objectPosition: 'top', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />
          ) : null}
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}
          >
            {form.file ? `✓ ${form.file.name.slice(0, 12)}…` : '사진 선택'}
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            style={{ padding: '8px 20px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}
          >
            {saving ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {sections.map(section => {
            const groupName = section.name
            const color = groupColor(groupName)

            return (
              <div
                key={section.id}
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid #e7edf5',
                  boxShadow: '0 10px 32px rgba(15,23,42,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '4px', height: '24px', background: color, borderRadius: '4px' }} />
                  <input
                    value={groupName}
                    onChange={event => handleSectionNameChange(section.id, event.target.value)}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#0f2040',
                      border: '1px solid #dbe4f0',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      minWidth: '180px',
                      background: '#fff',
                    }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748b' }}>
                    색상
                    <input
                      type="color"
                      value={section.color || color}
                      onChange={event => handleSectionFieldChange(section.id, 'color', event.target.value)}
                      style={{ width: '38px', height: '32px', padding: 0, border: '1px solid #dbe4f0', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}
                    />
                  </label>
                  <input
                    value={section.rowPattern || ''}
                    onChange={event => handleSectionFieldChange(section.id, 'rowPattern', event.target.value)}
                    placeholder="배치 예: 2,3 또는 2,1-1,4"
                    style={{
                      width: '168px',
                      padding: '8px 10px',
                      border: '1px solid #dbe4f0',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      background: '#fff',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{(grouped[groupName] || []).length}명</span>
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={sections[0]?.id === section.id}
                    style={{ padding: '8px 10px', background: '#fff', color: sections[0]?.id === section.id ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: sections[0]?.id === section.id ? 'default' : 'pointer', fontSize: '0.78rem' }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={sections[sections.length - 1]?.id === section.id}
                    style={{ padding: '8px 10px', background: '#fff', color: sections[sections.length - 1]?.id === section.id ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: sections[sections.length - 1]?.id === section.id ? 'default' : 'pointer', fontSize: '0.78rem' }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleSectionDelete(section.id)}
                    disabled={saving}
                    style={{ marginLeft: 'auto', padding: '8px 12px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                  >
                    섹션 삭제
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                  {(grouped[groupName] || []).map(member => (
                    <div
                      key={member.id}
                      draggable
                      onDragStart={event => handleMemberDragStart(event, member.id)}
                      onDragEnd={handleMemberDragEnd}
                      onDragOver={event => event.preventDefault()}
                      onDrop={() => handleMemberDrop(groupName, member.id)}
                      style={{
                        background: '#f6f8fb',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: draggingMemberId === member.id ? '1px solid #93c5fd' : '1px solid #eaecf0',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        boxShadow: draggingMemberId === member.id ? '0 8px 24px rgba(59,130,246,0.18)' : 'none',
                        opacity: draggingMemberId === member.id ? 0.72 : 1,
                        position: 'relative',
                        cursor: 'grab',
                      }}
                    >
                      <button
                        onClick={() => handleDelete(member.id)}
                        style={{
                          position: 'absolute',
                          top: '7px',
                          right: '7px',
                          zIndex: 1,
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(220,38,38,0.85)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>

                      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#e8edf5', overflow: 'hidden' }}>
                        {member.imgUrl ? (
                          <img
                            src={member.imgUrl}
                            alt={member.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            onError={event => { event.target.style.display = 'none' }}
                          />
                        ) : null}
                        {!member.imgUrl ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="36" height="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                        <input
                          value={member.name || ''}
                          onChange={event => handleMemberChange(member.id, 'name', event.target.value)}
                          placeholder="이름"
                          style={{ padding: '8px 10px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, color: '#0f2040', textAlign: 'center', background: '#fff' }}
                        />
                        <input
                          value={member.role || ''}
                          onChange={event => handleMemberChange(member.id, 'role', event.target.value)}
                          placeholder="직책"
                          style={{ padding: '8px 10px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.72rem', color, fontWeight: 700, textAlign: 'center', background: '#fff' }}
                        />
                        <select
                          value={member.group || ''}
                          onChange={event => handleMemberChange(member.id, 'group', event.target.value)}
                          style={{ padding: '8px 10px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.78rem', color: groupColor(member.group), fontWeight: 700, background: '#fff' }}
                        >
                          {sectionNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
