import { useEffect, useState } from 'react'
import { getContentDocument, listContentDocuments } from '../../api/contentApi'
import SubLayout from '../../components/SubLayout'
import { introMenus } from '../../data/siteMenus'

const menus = introMenus

const GROUP_COLORS = {
  '담임목사': '#1d4ed8',
  '교역자':   '#0369a1',
  '시무장로': '#7c3aed',
  '안수집사': '#059669',
}
const DEFAULT_COLOR = '#64748b'

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listContentDocuments('staff'),
      getContentDocument('staff_settings', 'main'),
    ])
      .then(([documents, settings]) => {
        const list = [...documents]
        const sectionList = settings?.sections || []
        list.sort((a, b) => (a.groupOrder ?? 99) - (b.groupOrder ?? 99) || (a.order ?? 0) - (b.order ?? 0))
        setStaff(list)
        setSections(
          [...sectionList]
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
            .map((section, index) => ({
              ...section,
              order: section.order ?? index,
              color: section.color || GROUP_COLORS[section.name] || DEFAULT_COLOR,
              rowPattern: section.rowPattern || '',
            }))
        )
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 그룹별로 묶기
  const grouped = staff.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = []
    acc[m.group].push(m)
    return acc
  }, {})

  const sectionMap = new Map(sections.map(section => [section.name, section]))
  const orderedGroups = [
    ...sections
      .filter(section => grouped[section.name]?.length)
      .map(section => section.name),
    ...Object.keys(grouped).filter(groupName => !sectionMap.has(groupName)).sort((a, b) => {
      const ao = grouped[a][0]?.groupOrder ?? 99
      const bo = grouped[b][0]?.groupOrder ?? 99
      return ao - bo
    }),
  ]

  return (
    <SubLayout section="교회 소개" menus={menus} title="섬기는 사람들">
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {orderedGroups.map(groupName => {
            const section = sectionMap.get(groupName)
            const color = section?.color || GROUP_COLORS[groupName] || DEFAULT_COLOR
            const members = grouped[groupName] || []
            return (
              <div key={groupName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '4px', height: '24px', background: color, borderRadius: '4px' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{groupName}</h3>
                </div>

                <SectionRows
                  members={members}
                  color={color}
                  rowPattern={section?.rowPattern || ''}
                />
              </div>
            )
          })}
        </div>
      )}
    </SubLayout>
  )
}

function parseRowPattern(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item && !item.includes('-'))
    .map(item => Number(item))
    .filter(count => Number.isInteger(count) && count > 0)
}

function parseAdvancedLayout(value) {
  const source = String(value || '').trim()
  if (!source || !source.includes('-')) return null

  const rows = source
    .split(',')
    .map(row => row.trim())
    .filter(Boolean)
    .map(row => (
      row
        .split('-')
        .map(token => token.trim())
        .filter(Boolean)
        .flatMap((token, index, array) => {
          const slots = []
          const count = Number(token)
          if (Number.isInteger(count) && count > 0) {
            slots.push(...Array.from({ length: count }, () => ({ type: 'member' })))
            if (index < array.length - 1) slots.push({ type: 'blank' })
          }
          return slots
        })
    ))
    .filter(row => row.length > 0)

  return rows.length > 0 ? rows : null
}

function splitMembersByPattern(members, rowPattern) {
  const counts = parseRowPattern(rowPattern)
  if (counts.length === 0) return []

  const rows = []
  let cursor = 0
  counts.forEach(count => {
    if (cursor >= members.length) return
    rows.push(members.slice(cursor, cursor + count))
    cursor += count
  })
  if (cursor < members.length) rows.push(members.slice(cursor))
  return rows.filter(row => row.length > 0)
}

function SectionRows({ members, color, rowPattern }) {
  const advancedRows = parseAdvancedLayout(rowPattern)
  const rows = splitMembersByPattern(members, rowPattern)

  if (advancedRows) {
    let cursor = 0
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {advancedRows.map((row, rowIndex) => (
          <div key={`${rowPattern}-${rowIndex}`} style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', justifyContent: 'flex-start' }}>
            {row.map((slot, slotIndex) => {
              if (slot.type === 'blank') {
                return <div key={`blank-${rowIndex}-${slotIndex}`} style={{ width: '150px', flex: '0 0 150px' }} />
              }

              const member = members[cursor]
              cursor += 1
              if (!member) return null

              return <StaffCard key={member.id} member={member} color={color} fixedWidth />
            })}
          </div>
        ))}
        {cursor < members.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
            {members.slice(cursor).map(member => (
              <StaffCard key={member.id} member={member} color={color} fixedWidth />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (rows.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {rows.map((row, index) => (
          <div key={`${rowPattern}-${index}`} style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', justifyContent: 'flex-start' }}>
            {row.map(member => (
              <StaffCard key={member.id} member={member} color={color} fixedWidth />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
      {members.map(member => (
        <StaffCard key={member.id} member={member} color={color} />
      ))}
    </div>
  )
}

function StaffCard({ member, color, fixedWidth = false }) {
  return (
    <div
      style={{ width: fixedWidth ? '150px' : 'auto', background: '#f6f8fb', borderRadius: '14px', overflow: 'hidden', border: '1px solid #eaecf0', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#e8edf5', overflow: 'hidden' }}>
        {member.imgUrl ? (
          <img
            src={member.imgUrl}
            alt={member.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div style={{ display: member.imgUrl ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#e8edf5', position: member.imgUrl ? 'absolute' : 'static', inset: 0 }}>
          <svg width="36" height="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '3px' }}>{member.name}</p>
        <p style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{member.role}</p>
      </div>
    </div>
  )
}
