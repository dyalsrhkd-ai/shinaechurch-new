import { useEffect, useMemo, useRef, useState } from 'react'
import { getYoutubeThumb } from '../../data/media'

const ministryThemes = {
  'ministry-men': {
    label: '남전도회',
    accent: '#1d4ed8',
    accentDark: '#0f2040',
    introGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    introTitleColor: '#1e3a5f',
    introHighlightColor: '#1d4ed8',
    introBorderColor: '#1d4ed8',
    photoTitle: '활동 사진',
    infoHeaders: ['전도회', '대상', '모임안내', '장소'],
    defaultTitles: {
      intro: '남전도회 소개',
      info: '모임 안내',
      list: '주요 활동',
      people: '임원 현황',
    },
  },
  'ministry-women': {
    label: '여전도회',
    accent: '#db2777',
    accentDark: '#831843',
    introGradient: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
    introTitleColor: '#831843',
    introHighlightColor: '#db2777',
    introBorderColor: '#db2777',
    photoTitle: '활동 사진',
    infoHeaders: ['전도회', '대상', '모임안내', '장소'],
    defaultTitles: {
      intro: '여전도회 소개',
      info: '모임 안내',
      list: '주요 활동',
      people: '임원 현황',
    },
  },
  'ministry-deaconess': {
    label: '권사회',
    accent: '#d97706',
    accentDark: '#78350f',
    introGradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    introTitleColor: '#78350f',
    introHighlightColor: '#d97706',
    introBorderColor: '#d97706',
    photoTitle: '활동 사진',
    infoHeaders: ['권사회', '대상', '모임안내', '장소'],
    defaultTitles: {
      intro: '권사회 소개',
      info: '권사회 모임 안내',
      list: '주요 활동',
      people: '임원 현황',
    },
  },
}

function splitLines(text) {
  return (text || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function parseActivities(block) {
  const lines = splitLines(block?.itemsText)
  if (lines.length === 0) return []

  return lines.map(line => {
    const [label = '', desc = ''] = line.split('|').map(item => item.trim())
    return { label, desc }
  })
}

function parseOfficers(block) {
  const lines = splitLines(block?.subtitle)
  if (lines.length === 0) return []

  return lines.map(line => {
    const [role = '', name = ''] = line.split('|').map(item => item.trim())
    return { role, name }
  })
}

function parseMembers(block) {
  return (block?.body || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function toActivitiesText(items) {
  return items
    .map(item => `${item.label || '새 활동'}|${item.desc || ''}`.trim())
    .join('\n')
}

function toOfficersText(items) {
  return items
    .map(item => `${item.role || '직책'}|${item.name || '이름'}`.trim())
    .join('\n')
}

function toMembersText(items) {
  return items
    .map(item => (item || '새 회원').trim())
    .join('\n')
}

function EditableInlineText({ value, placeholder, onChange, style, as = 'div', innerRef = null }) {
  const Tag = as
  const ref = useRef(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused && ref.current && ref.current.textContent !== (value || placeholder || '')) {
      ref.current.textContent = value || placeholder || ''
    }
  }, [focused, placeholder, value])

  return (
    <Tag
      ref={node => {
        ref.current = node
        if (typeof innerRef === 'function') innerRef(node)
        else if (innerRef) innerRef.current = node
      }}
      contentEditable
      suppressContentEditableWarning
      onClick={event => event.stopPropagation()}
      onFocus={event => {
        setFocused(true)
        if ((event.currentTarget.textContent || '') === placeholder) {
          event.currentTarget.textContent = ''
        }
      }}
      onBlur={() => {
        setFocused(false)
        const nextValue = ref.current?.textContent || ''
        onChange(nextValue === placeholder ? '' : nextValue)
      }}
      style={{ ...style, outline: 'none', minHeight: '1em' }}
    >
      {value || placeholder}
    </Tag>
  )
}

export default function MenPageContent({
  pageState,
  pageId = 'ministry-men',
  photos = [],
  videos = [],
  editable = false,
  activeSection,
  onSectionClick,
  onHeroChange,
  onBlockChange,
  onAddBlock,
}) {
  const theme = ministryThemes[pageId] || ministryThemes['ministry-men']
  const [lightbox, setLightbox] = useState(null)
  const [playVid, setPlayVid] = useState(null)
  const [hoveredOfficerIndex, setHoveredOfficerIndex] = useState(null)
  const [hoveredActivityIndex, setHoveredActivityIndex] = useState(null)
  const [hoveredMemberIndex, setHoveredMemberIndex] = useState(null)
  const heroTitleRef = useRef(null)

  const introBlock = pageState.blocks.find(block => block.type === 'intro') || null
  const activityBlock = pageState.blocks.find(block => block.type === 'list') || null
  const peopleBlock = pageState.blocks.find(block => block.type === 'people') || null
  const infoBlocks = pageState.blocks.filter(block => block.type === 'info')
  const noteBlocks = pageState.blocks.filter(block => block.type === 'note')
  const activities = useMemo(() => (activityBlock ? parseActivities(activityBlock) : []), [activityBlock])
  const officers = useMemo(() => (peopleBlock ? parseOfficers(peopleBlock) : []), [peopleBlock])
  const members = useMemo(() => (peopleBlock ? parseMembers(peopleBlock) : []), [peopleBlock])
  const showPeopleSection = ['ministry-men', 'ministry-women', 'ministry-deaconess'].includes(pageId)

  useEffect(() => {
    if (activeSection === 'hero' && heroTitleRef.current) {
      heroTitleRef.current.focus()
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(heroTitleRef.current)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [activeSection])

  const sectionStyle = {
    marginBottom: '32px',
    borderRadius: '18px',
    outline: 'none',
    cursor: editable ? 'text' : 'default',
  }

  const handleDeleteBlock = (blockId) => {
    if (!window.confirm('이 블록을 삭제하면 안의 모든 내용도 함께 삭제됩니다. 계속하시겠습니까?')) return
    onBlockChange(blockId, '__delete__', true)
  }

  const renderDeleteButton = (blockId) => (
    editable ? (
      <button
        onClick={event => {
          event.stopPropagation()
          handleDeleteBlock(blockId)
        }}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '999px',
          border: 'none',
          background: 'rgba(15,32,64,0.08)',
          color: theme.introTitleColor,
          fontSize: '0.72rem',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        X
      </button>
    ) : null
  )

  const renderAddCard = (type, label) => {
    if (!editable || !onAddBlock) return null

    return (
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={event => {
            event.stopPropagation()
            onAddBlock(type)
          }}
          style={{
            width: '100%',
            minHeight: '110px',
            borderRadius: '16px',
            border: '2px dashed #cbd5e1',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '1.8rem', color: '#94a3b8', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{label}</span>
        </button>
      </div>
    )
  }

  const updateInfoRows = (blockId, rows) => {
    onBlockChange(blockId, 'itemsText', rows.map(item => [item.name, item.target, item.meeting, item.place].join('|')).join('\n'))
  }

  const renderInfoBlock = (block) => {
    const rows = splitLines(block.itemsText).map(line => {
      const [name = '', target = '', meeting = '', place = ''] = line.split('|').map(item => item.trim())
      return { name, target, meeting, place }
    })

    return (
      <div key={block.id} onClick={() => editable && onSectionClick(block.id)} style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
            {block.title || theme.defaultTitles.info}
            {renderDeleteButton(block.id)}
          </h3>
        </div>
        <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', background: theme.accentDark, padding: '12px 20px' }}>
            {theme.infoHeaders.map(header => (
              <span key={header} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>{header}</span>
            ))}
          </div>
          {(rows.length > 0 ? rows : [{ name: '', target: '', meeting: '', place: '' }]).map((row, index) => (
            <div
              key={`${row.name}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 80px',
                padding: '14px 20px',
                borderBottom: index < rows.length - 1 ? '1px solid #f0f2f5' : 'none',
                background: index % 2 === 0 ? '#fff' : '#fafbfc',
                alignItems: 'center',
              }}
            >
              {editable && activeSection === block.id ? (
                <>
                  <EditableInlineText value={row.name} placeholder={theme.infoHeaders[0]} onChange={value => {
                    const nextRows = [...rows]
                    nextRows[index] = { ...nextRows[index], name: value }
                    updateInfoRows(block.id, nextRows)
                  }} style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }} as="div" />
                  <EditableInlineText value={row.target} placeholder="대상" onChange={value => {
                    const nextRows = [...rows]
                    nextRows[index] = { ...nextRows[index], target: value }
                    updateInfoRows(block.id, nextRows)
                  }} style={{ fontSize: '0.875rem', color: '#374151' }} as="div" />
                  <EditableInlineText value={row.meeting} placeholder="모임안내" onChange={value => {
                    const nextRows = [...rows]
                    nextRows[index] = { ...nextRows[index], meeting: value }
                    updateInfoRows(block.id, nextRows)
                  }} style={{ fontSize: '0.875rem', color: '#374151' }} as="div" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <EditableInlineText value={row.place} placeholder="장소" onChange={value => {
                      const nextRows = [...rows]
                      nextRows[index] = { ...nextRows[index], place: value }
                      updateInfoRows(block.id, nextRows)
                    }} style={{ fontSize: '0.875rem', color: '#6b7280' }} as="div" />
                    <button
                      onClick={event => {
                        event.stopPropagation()
                        updateInfoRows(block.id, rows.filter((_, rowIndex) => rowIndex !== index))
                      }}
                      style={{ width: '18px', height: '18px', borderRadius: '999px', border: 'none', background: '#e2e8f0', color: '#334155', fontSize: '0.68rem', cursor: 'pointer', lineHeight: 1 }}
                    >
                      X
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{row.name}</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{row.target}</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{row.meeting}</span>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{row.place}</span>
                </>
              )}
            </div>
          ))}
          {editable && activeSection === block.id ? (
            <div style={{ padding: '14px 20px', background: '#fff' }}>
              <button
                onClick={event => {
                  event.stopPropagation()
                  updateInfoRows(block.id, [...rows, { name: '', target: '', meeting: '', place: '' }])
                }}
                style={{ padding: '8px 14px', borderRadius: '999px', border: `1px dashed ${theme.accent}`, background: '#fff', color: theme.accent, fontWeight: 700, cursor: 'pointer' }}
              >
                + 추가
              </button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  const renderNoteBlock = (block) => (
    <div key={block.id} onClick={() => editable && onSectionClick(block.id)} style={{ ...sectionStyle, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px', padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {editable && activeSection === block.id ? (
            <>
              <EditableInlineText value={block.title} placeholder="추가 문단 제목" onChange={value => onBlockChange(block.id, 'title', value)} style={{ fontSize: '1rem', fontWeight: 800, color: '#9a3412', marginBottom: '12px' }} as="div" />
              <EditableInlineText value={block.body} placeholder="추가 문단 내용" onChange={value => onBlockChange(block.id, 'body', value)} style={{ fontSize: '0.88rem', color: '#7c2d12', lineHeight: 1.8, whiteSpace: 'pre-wrap' }} as="div" />
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#9a3412', marginBottom: '12px' }}>{block.title || ''}</h3>
              <p style={{ fontSize: '0.88rem', color: '#7c2d12', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{block.body || ''}</p>
            </>
          )}
        </div>
        {renderDeleteButton(block.id)}
      </div>
    </div>
  )

  const updateActivityItem = (index, key, value) => {
    const nextItems = activities.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    onBlockChange(activityBlock.id, 'itemsText', toActivitiesText(nextItems))
  }

  const updateOfficerItem = (index, key, value) => {
    const nextItems = officers.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    onBlockChange(peopleBlock.id, 'subtitle', toOfficersText(nextItems))
  }

  const updateMemberItem = (index, value) => {
    const nextItems = members.map((item, itemIndex) => (itemIndex === index ? value : item))
    onBlockChange(peopleBlock.id, 'body', toMembersText(nextItems))
  }

  return (
    <>
      <div onClick={() => editable && onSectionClick('hero')} style={{ ...sectionStyle, borderRadius: '14px', overflow: 'hidden', border: '1px solid #eaecf0', position: 'relative' }}>
        <img src={pageState.heroImage} alt={theme.label} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.72), rgba(15,23,42,0.18))' }} />
        <div style={{ position: 'absolute', left: '24px', right: '24px', bottom: '24px' }}>
          {editable && activeSection === 'hero' ? (
            <>
              <EditableInlineText innerRef={heroTitleRef} value={pageState.heroTitle} placeholder="메인 제목" onChange={value => onHeroChange('heroTitle', value)} style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }} as="div" />
              <EditableInlineText value={pageState.heroSubtitle} placeholder="메인 설명" onChange={value => onHeroChange('heroSubtitle', value)} style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.86)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }} as="div" />
            </>
          ) : (
            <>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{pageState.heroTitle || ''}</p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.86)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{pageState.heroSubtitle || ''}</p>
            </>
          )}
        </div>
      </div>

      {introBlock ? (
        <div onClick={() => editable && onSectionClick(introBlock.id)} style={{ ...sectionStyle, background: theme.introGradient, borderRadius: '14px', padding: '28px', borderLeft: `4px solid ${theme.introBorderColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              {editable && activeSection === introBlock.id ? (
                <>
                  <EditableInlineText value={introBlock.title} placeholder={theme.defaultTitles.intro} onChange={value => onBlockChange(introBlock.id, 'title', value)} style={{ fontWeight: 800, fontSize: '1rem', color: theme.introTitleColor, marginBottom: '14px' }} as="div" />
                  <EditableInlineText value={introBlock.body} placeholder="소개 본문" onChange={value => onBlockChange(introBlock.id, 'body', value)} style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, whiteSpace: 'pre-wrap' }} as="div" />
                  <EditableInlineText value={introBlock.subtitle} placeholder="강조 문구" onChange={value => onBlockChange(introBlock.id, 'subtitle', value)} style={{ fontSize: '0.85rem', color: theme.introHighlightColor, fontWeight: 600, marginTop: '14px' }} as="div" />
                </>
              ) : (
                <>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: theme.introTitleColor, marginBottom: '14px' }}>{introBlock.title || ''}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{introBlock.body || ''}</p>
                  <p style={{ fontSize: '0.85rem', color: theme.introHighlightColor, fontWeight: 600, marginTop: '14px' }}>{introBlock.subtitle || ''}</p>
                </>
              )}
            </div>
            {renderDeleteButton(introBlock.id)}
          </div>
        </div>
      ) : renderAddCard('intro', '소개')}

      {infoBlocks.length === 0 ? renderAddCard('info', '모임안내') : null}
      {infoBlocks.map(renderInfoBlock)}

      {activityBlock ? (
        <div onClick={() => editable && onSectionClick(activityBlock.id)} style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
              {activityBlock.title || theme.defaultTitles.list}
              {renderDeleteButton(activityBlock.id)}
            </h3>
          </div>
          <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map((activity, index) => (
              <div key={`${activity.label}-${index}`} onMouseEnter={() => setHoveredActivityIndex(index)} onMouseLeave={() => setHoveredActivityIndex(current => (current === index ? null : current))} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '28px' }}>
                {editable && activeSection === activityBlock.id && hoveredActivityIndex === index ? (
                  <button
                    onClick={event => {
                      event.stopPropagation()
                      onBlockChange(activityBlock.id, 'itemsText', toActivitiesText(activities.filter((_, itemIndex) => itemIndex !== index)))
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '999px', border: 'none', background: '#e2e8f0', color: '#334155', fontSize: '0.72rem', cursor: 'pointer', lineHeight: 1 }}
                  >
                    X
                  </button>
                ) : null}
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent, marginTop: '9px', flexShrink: 0 }} />
                <div>
                  {editable && activeSection === activityBlock.id ? (
                    <>
                      <EditableInlineText value={activity.label} placeholder="활동명" onChange={value => updateActivityItem(index, 'label', value)} style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '2px' }} as="div" />
                      <EditableInlineText value={activity.desc} placeholder="설명" onChange={value => updateActivityItem(index, 'desc', value)} style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.6 }} as="div" />
                    </>
                  ) : (
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{activity.label}{activity.desc ? ` (${activity.desc})` : ''}</span>
                  )}
                </div>
              </div>
            ))}
            {editable && activeSection === activityBlock.id ? (
              <button
                onClick={event => {
                  event.stopPropagation()
                  onBlockChange(activityBlock.id, 'itemsText', toActivitiesText([...activities, { label: '새 활동', desc: '' }]))
                }}
                style={{ alignSelf: 'center', background: 'transparent', borderRadius: '999px', padding: '6px 12px', border: `1px dashed ${theme.accent}`, color: theme.accent, fontWeight: 700, cursor: 'pointer' }}
              >
                + 추가
              </button>
            ) : null}
          </div>
        </div>
      ) : renderAddCard('list', '주요활동')}

      {showPeopleSection ? (
        peopleBlock ? (
          <div onClick={() => editable && onSectionClick(peopleBlock.id)} style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
                {peopleBlock.title || theme.defaultTitles.people}
                {renderDeleteButton(peopleBlock.id)}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {officers.map((member, index) => (
                <div key={`${member.role}-${member.name}-${index}`} onMouseEnter={() => setHoveredOfficerIndex(index)} onMouseLeave={() => setHoveredOfficerIndex(current => (current === index ? null : current))} style={{ position: 'relative', background: theme.accentDark, borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '132px', minHeight: '62px' }}>
                  {editable && activeSection === peopleBlock.id && hoveredOfficerIndex === index ? (
                    <button
                      onClick={event => {
                        event.stopPropagation()
                        onBlockChange(peopleBlock.id, 'subtitle', toOfficersText(officers.filter((_, itemIndex) => itemIndex !== index)))
                      }}
                      style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', lineHeight: 1 }}
                    >
                      X
                    </button>
                  ) : null}
                  {editable && activeSection === peopleBlock.id ? (
                    <>
                      <EditableInlineText value={member.role} placeholder="직책" onChange={value => updateOfficerItem(index, 'role', value)} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }} as="div" />
                      <EditableInlineText value={member.name} placeholder="이름" onChange={value => updateOfficerItem(index, 'name', value)} style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }} as="div" />
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{member.role}</p>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{member.name}</p>
                    </>
                  )}
                </div>
              ))}
              {editable && activeSection === peopleBlock.id ? (
                <button
                  onClick={event => {
                    event.stopPropagation()
                    onBlockChange(peopleBlock.id, 'subtitle', toOfficersText([...officers, { role: '직책', name: '이름' }]))
                  }}
                  style={{ minWidth: '132px', minHeight: '62px', background: '#fff', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', border: `1px dashed ${theme.accent}`, color: theme.accent, fontWeight: 700, cursor: 'pointer' }}
                >
                  + 추가
                </button>
              ) : null}
            </div>
            <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '16px 20px', border: '1px solid #eaecf0' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '10px' }}>회원</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {members.map((name, index) => (
                  <div key={`${name}-${index}`} onMouseEnter={() => setHoveredMemberIndex(index)} onMouseLeave={() => setHoveredMemberIndex(current => (current === index ? null : current))} style={{ position: 'relative' }}>
                    {editable && activeSection === peopleBlock.id ? (
                      <>
                        {hoveredMemberIndex === index ? (
                          <button
                            onClick={event => {
                              event.stopPropagation()
                              onBlockChange(peopleBlock.id, 'body', toMembersText(members.filter((_, itemIndex) => itemIndex !== index)))
                            }}
                            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '999px', border: 'none', background: '#e2e8f0', color: '#334155', fontSize: '0.68rem', cursor: 'pointer', lineHeight: 1 }}
                          >
                            X
                          </button>
                        ) : null}
                        <EditableInlineText value={name} placeholder="회원 이름" onChange={value => updateMemberItem(index, value)} style={{ fontSize: '0.82rem', color: '#374151', background: '#fff', border: '1px solid #eaecf0', padding: '4px 12px', borderRadius: '9999px', minWidth: '88px', textAlign: 'center' }} as="div" />
                      </>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#374151', background: '#fff', border: '1px solid #eaecf0', padding: '4px 12px', borderRadius: '9999px' }}>{name}</span>
                    )}
                  </div>
                ))}
                {editable && activeSection === peopleBlock.id ? (
                  <button
                    onClick={event => {
                      event.stopPropagation()
                      onBlockChange(peopleBlock.id, 'body', toMembersText([...members, '새 회원']))
                    }}
                    style={{ fontSize: '0.82rem', color: theme.accent, background: '#fff', border: `1px dashed ${theme.accent}`, padding: '4px 12px', borderRadius: '9999px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    + 추가
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : renderAddCard('people', '임원현황')
      ) : null}

      {noteBlocks.map(renderNoteBlock)}

      {!editable ? (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
            행사 동영상
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {videos.length}개</span>
          </h3>
          {videos.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px dashed #dbe3ef', borderRadius: '12px', padding: '28px', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>
              등록된 행사 동영상이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {videos.map(video => (
                <div key={video.youtubeId} onClick={() => setPlayVid(video)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0', background: '#fff' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                    <img src={getYoutubeThumb(video.youtubeId)} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: '44px', height: '44px', background: 'rgba(220,38,38,0.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '1.1rem', marginLeft: '3px' }}>▶</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {!editable ? (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
            {theme.photoTitle}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {photos.length}장</span>
          </h3>
          {photos.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px dashed #dbe3ef', borderRadius: '12px', padding: '28px', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>
              등록된 행사 사진이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {photos.map((photo, index) => (
                <div key={photo.id || index} onClick={() => setLightbox(index)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                    <img src={photo.imgUrl} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '8px 10px', background: '#fff' }}>
                    <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {lightbox !== null && photos[lightbox] ? (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={event => event.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={photos[lightbox].imgUrl} alt={photos[lightbox].label} style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>{photos[lightbox].label}</p>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ) : null}

      {playVid ? (
        <div onClick={() => setPlayVid(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={event => event.stopPropagation()} style={{ position: 'relative', maxWidth: '860px', width: '100%' }}>
            <button onClick={() => setPlayVid(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            <div style={{ aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe src={`https://www.youtube.com/embed/${playVid.youtubeId}?autoplay=1`} title={playVid.title} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; encrypted-media" allowFullScreen />
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>{playVid.title}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}
