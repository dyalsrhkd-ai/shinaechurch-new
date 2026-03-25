import { useMemo, useRef, useState } from 'react'
import { getYoutubeThumb } from '../../data/media'

const schoolThemes = {
  'school-children': {
    label: '아동부',
    accent: '#16a34a',
    accentDark: '#14532d',
    introGradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
  },
  'school-youth': {
    label: '중·고등부',
    accent: '#ea580c',
    accentDark: '#7c2d12',
    introGradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
  },
  'school-young': {
    label: '청년부',
    accent: '#9333ea',
    accentDark: '#581c87',
    introGradient: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
  },
  'school-bible': {
    label: '성경대학',
    accent: '#0284c7',
    accentDark: '#0c4a6e',
    introGradient: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
  },
}

const defaultScheduleRows = Array.from({ length: 12 }, (_, index) => ({
  month: `${index + 1}월`,
  activity: '',
}))

function splitLines(text) {
  return (text || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function parseInfoRows(block) {
  return splitLines(block?.itemsText).map(line => {
    const [label = '', value = ''] = line.split('|').map(item => item.trim())
    return { label, value }
  })
}

function parseScheduleRows(block) {
  return splitLines(block?.itemsText).map(line => {
    const [month = '', activity = ''] = line.split('|').map(item => item.trim())
    return { month, activity }
  })
}

function parsePeopleRows(block) {
  return splitLines(block?.subtitle).map(line => {
    const [role = '', name = ''] = line.split('|').map(item => item.trim())
    return { role, name }
  })
}

function toInfoText(items) {
  return items.map(item => `${item.label || ''}|${item.value || ''}`).join('\n')
}

function toScheduleText(items) {
  return items.map(item => `${item.month || ''}|${item.activity || ''}`).join('\n')
}

function pairScheduleRows(items) {
  const rows = items.length > 0 ? items : defaultScheduleRows
  const pairs = []
  for (let index = 0; index < rows.length; index += 2) {
    pairs.push([rows[index], rows[index + 1] || null])
  }
  return pairs
}

function toPeopleText(items) {
  return items.map(item => `${item.role || ''}|${item.name || ''}`).join('\n')
}

function EditableInlineText({ value, placeholder, onChange, style, as = 'div' }) {
  const Tag = as
  const ref = useRef(null)

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onClick={event => event.stopPropagation()}
      onFocus={event => {
        if ((event.currentTarget.textContent || '') === placeholder) {
          event.currentTarget.textContent = ''
        }
      }}
      onBlur={() => {
        const nextValue = ref.current?.textContent || ''
        onChange(nextValue === placeholder ? '' : nextValue)
      }}
      style={{ ...style, outline: 'none', minHeight: '1em' }}
    >
      {value || placeholder}
    </Tag>
  )
}

export default function SchoolPageContent({
  pageState,
  pageId,
  photos = [],
  videos = [],
  editable = false,
  activeSection,
  onSectionClick,
  onHeroChange,
  onBlockChange,
  onAddBlock,
}) {
  const theme = schoolThemes[pageId]
  const [lightbox, setLightbox] = useState(null)
  const [playVid, setPlayVid] = useState(null)
  const introBlock = pageState.blocks.find(block => block.type === 'intro') || null
  const infoBlock = pageState.blocks.find(block => block.type === 'info') || null
  const noteBlock = pageState.blocks.find(block => block.type === 'note') || null
  const listBlock = pageState.blocks.find(block => block.type === 'list') || null
  const peopleBlock = pageState.blocks.find(block => block.type === 'people') || null
  const infoRows = useMemo(() => (infoBlock ? parseInfoRows(infoBlock) : []), [infoBlock])
  const scheduleRows = useMemo(() => (listBlock ? parseScheduleRows(listBlock) : []), [listBlock])
  const schedulePairs = useMemo(() => pairScheduleRows(scheduleRows), [scheduleRows])
  const scheduleBaseRows = scheduleRows.length > 0 ? scheduleRows : defaultScheduleRows
  const peopleRows = useMemo(() => (peopleBlock ? parsePeopleRows(peopleBlock) : []), [peopleBlock])

  const renderDeleteButton = (blockId) => (
    editable ? (
      <button
        onClick={event => {
          event.stopPropagation()
          if (!window.confirm('이 블록을 삭제하면 안의 모든 내용도 함께 삭제됩니다. 계속하시겠습니까?')) return
          onBlockChange(blockId, '__delete__', true)
        }}
        style={{ width: '22px', height: '22px', borderRadius: '999px', border: 'none', background: 'rgba(15,32,64,0.08)', color: theme.accentDark, fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0 }}
      >
        X
      </button>
    ) : null
  )

  const renderAddCard = (type, label) => {
    if (!editable) return null
    return (
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={event => {
            event.stopPropagation()
            onAddBlock(type)
          }}
          style={{ width: '100%', minHeight: '110px', borderRadius: '16px', border: '2px dashed #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <span style={{ fontSize: '1.8rem', color: '#94a3b8', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{label}</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div onClick={() => editable && onSectionClick('hero')} style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #eaecf0', position: 'relative', cursor: editable ? 'text' : 'default' }}>
        <img src={pageState.heroImage} alt={theme.label} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.72), rgba(15,23,42,0.18))' }} />
        <div style={{ position: 'absolute', left: '24px', right: '24px', bottom: '24px' }}>
          {editable && activeSection === 'hero' ? (
            <>
              <EditableInlineText value={pageState.heroTitle} placeholder="메인 제목" onChange={value => onHeroChange('heroTitle', value)} style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }} as="div" />
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
        <div onClick={() => editable && onSectionClick(introBlock.id)} style={{ background: theme.introGradient, borderRadius: '14px', padding: '28px', marginBottom: '32px', borderLeft: `4px solid ${theme.accent}`, cursor: editable ? 'text' : 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {editable && activeSection === introBlock.id ? (
                <>
                  <EditableInlineText value={introBlock.title} placeholder={`${theme.label} 소개`} onChange={value => onBlockChange(introBlock.id, 'title', value)} style={{ fontWeight: 800, fontSize: '1rem', color: theme.accentDark, marginBottom: '14px' }} as="div" />
                  <EditableInlineText value={introBlock.body} placeholder="소개 본문" onChange={value => onBlockChange(introBlock.id, 'body', value)} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }} as="div" />
                </>
              ) : (
                <>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: theme.accentDark, marginBottom: '14px' }}>{introBlock.title || ''}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{introBlock.body || ''}</p>
                </>
              )}
            </div>
            {renderDeleteButton(introBlock.id)}
          </div>
        </div>
      ) : renderAddCard('intro', '소개')}

      {infoBlock ? (
        <div onClick={() => editable && onSectionClick(infoBlock.id)} style={{ marginBottom: '32px', cursor: editable ? 'text' : 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
              {infoBlock.title || '안내'}
              {renderDeleteButton(infoBlock.id)}
            </h3>
          </div>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            {(infoRows.length > 0 ? infoRows : [{ label: '', value: '' }]).map((item, index) => (
              <div key={`${item.label}-${index}`} style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', padding: '14px 20px', borderBottom: index < infoRows.length - 1 ? '1px solid #f0f2f5' : 'none', background: index % 2 === 0 ? '#fff' : '#fafbfc', gap: '12px', alignItems: 'center' }}>
                {editable && activeSection === infoBlock.id ? (
                  <>
                    <EditableInlineText value={item.label} placeholder="항목" onChange={value => {
                      const next = [...(infoRows.length > 0 ? infoRows : [{ label: '', value: '' }])]
                      next[index] = { ...next[index], label: value }
                      onBlockChange(infoBlock.id, 'itemsText', toInfoText(next))
                    }} style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }} as="div" />
                    <EditableInlineText value={item.value} placeholder="내용" onChange={value => {
                      const next = [...(infoRows.length > 0 ? infoRows : [{ label: '', value: '' }])]
                      next[index] = { ...next[index], value }
                      onBlockChange(infoBlock.id, 'itemsText', toInfoText(next))
                    }} style={{ fontSize: '0.875rem', color: '#374151' }} as="div" />
                    <button onClick={event => {
                      event.stopPropagation()
                      onBlockChange(infoBlock.id, 'itemsText', toInfoText(infoRows.filter((_, rowIndex) => rowIndex !== index)))
                    }} style={{ width: '18px', height: '18px', borderRadius: '999px', border: 'none', background: '#e2e8f0', color: '#334155', fontSize: '0.68rem', cursor: 'pointer', lineHeight: 1 }}>X</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{item.label}</span>
                    <span style={{ fontSize: '0.875rem', color: '#374151', gridColumn: 'span 2' }}>{item.value}</span>
                  </>
                )}
              </div>
            ))}
            {editable && activeSection === infoBlock.id ? (
              <div style={{ padding: '14px 20px', background: '#fff' }}>
                <button onClick={event => {
                  event.stopPropagation()
                  onBlockChange(infoBlock.id, 'itemsText', toInfoText([...infoRows, { label: '', value: '' }]))
                }} style={{ padding: '8px 14px', borderRadius: '999px', border: `1px dashed ${theme.accent}`, background: '#fff', color: theme.accent, fontWeight: 700, cursor: 'pointer' }}>+ 추가</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : renderAddCard('info', '안내')}

      {noteBlock ? (
        <div onClick={() => editable && onSectionClick(noteBlock.id)} style={{ marginBottom: '32px', cursor: editable ? 'text' : 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
              {noteBlock.title || '주요 활동'}
              {renderDeleteButton(noteBlock.id)}
            </h3>
          </div>
          <div style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0' }}>
            {editable && activeSection === noteBlock.id ? (
              <EditableInlineText value={noteBlock.body} placeholder="활동 설명" onChange={value => onBlockChange(noteBlock.id, 'body', value)} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }} as="div" />
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{noteBlock.body || ''}</p>
            )}
          </div>
        </div>
      ) : (pageId !== 'school-bible' ? renderAddCard('note', '주요활동') : null)}

      {listBlock ? (
        <div onClick={() => editable && onSectionClick(listBlock.id)} style={{ marginBottom: '32px', cursor: editable ? 'text' : 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
              {listBlock.title || '연간일정'}
              {renderDeleteButton(listBlock.id)}
            </h3>
          </div>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {schedulePairs.flatMap((pair, pairIndex) => (
                pair.map((item, cellIndex) => {
                  if (!item) {
                    return (
                      <div
                        key={`schedule-empty-${pairIndex}-${cellIndex}`}
                        style={{
                          minHeight: '49px',
                          borderBottom: pairIndex < schedulePairs.length - 1 ? '1px solid #f0f2f5' : 'none',
                          borderRight: cellIndex === 0 ? '1px solid #f0f2f5' : 'none',
                          background: pairIndex % 2 === 0 ? '#fff' : '#fafbfc',
                        }}
                      />
                    )
                  }

                  const itemIndex = pairIndex * 2 + cellIndex

                  return (
                    <div
                      key={`${item.month}-${itemIndex}`}
                      style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr',
                        padding: '12px 16px',
                        borderBottom: pairIndex < schedulePairs.length - 1 ? '1px solid #f0f2f5' : 'none',
                        borderRight: cellIndex === 0 ? '1px solid #f0f2f5' : 'none',
                        background: pairIndex % 2 === 0 ? '#fff' : '#fafbfc',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      {editable && activeSection === listBlock.id ? (
                        <>
                          <EditableInlineText
                            value={item.month}
                            placeholder="월"
                            onChange={value => {
                              const next = [...scheduleBaseRows]
                              next[itemIndex] = { ...next[itemIndex], month: value }
                              onBlockChange(listBlock.id, 'itemsText', toScheduleText(next))
                            }}
                            style={{ fontWeight: 800, fontSize: '0.82rem', color: theme.accent }}
                            as="div"
                          />
                          <EditableInlineText
                            value={item.activity}
                            placeholder="일정"
                          onChange={value => {
                            const next = [...scheduleBaseRows]
                            next[itemIndex] = { ...next[itemIndex], activity: value }
                            onBlockChange(listBlock.id, 'itemsText', toScheduleText(next))
                          }}
                          style={{ fontSize: '0.82rem', color: '#374151' }}
                          as="div"
                        />
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 800, fontSize: '0.82rem', color: theme.accent }}>{item.month}</span>
                          <span style={{ fontSize: '0.82rem', color: '#374151' }}>{item.activity}</span>
                        </>
                      )}
                    </div>
                  )
                })
              ))}
            </div>
          </div>
        </div>
      ) : (pageId !== 'school-bible' ? renderAddCard('list', '연간일정') : null)}

      {peopleBlock ? (
        <div onClick={() => editable && onSectionClick(peopleBlock.id)} style={{ marginBottom: '32px', cursor: editable ? 'text' : 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
              {peopleBlock.title || '임원 현황'}
              {renderDeleteButton(peopleBlock.id)}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(peopleRows.length > 0 ? peopleRows : [{ role: '', name: '' }]).map((item, index) => (
              <div key={`${item.role}-${index}`} style={{ position: 'relative', background: '#0f2040', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '132px' }}>
                {editable && activeSection === peopleBlock.id ? (
                  <>
                    <button onClick={event => {
                      event.stopPropagation()
                      onBlockChange(peopleBlock.id, 'subtitle', toPeopleText(peopleRows.filter((_, rowIndex) => rowIndex !== index)))
                    }} style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', lineHeight: 1 }}>X</button>
                    <EditableInlineText value={item.role} placeholder="직책" onChange={value => {
                      const next = [...(peopleRows.length > 0 ? peopleRows : [{ role: '', name: '' }])]
                      next[index] = { ...next[index], role: value }
                      onBlockChange(peopleBlock.id, 'subtitle', toPeopleText(next))
                    }} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }} as="div" />
                    <EditableInlineText value={item.name} placeholder="이름" onChange={value => {
                      const next = [...(peopleRows.length > 0 ? peopleRows : [{ role: '', name: '' }])]
                      next[index] = { ...next[index], name: value }
                      onBlockChange(peopleBlock.id, 'subtitle', toPeopleText(next))
                    }} style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }} as="div" />
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{item.role}</p>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{item.name}</p>
                  </>
                )}
              </div>
            ))}
            {editable && activeSection === peopleBlock.id ? (
              <button onClick={event => {
                event.stopPropagation()
                onBlockChange(peopleBlock.id, 'subtitle', toPeopleText([...peopleRows, { role: '', name: '' }]))
              }} style={{ minWidth: '132px', background: '#fff', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', border: `1px dashed ${theme.accent}`, color: theme.accent, fontWeight: 700, cursor: 'pointer' }}>+ 추가</button>
            ) : null}
          </div>
        </div>
      ) : (pageId === 'school-bible' ? renderAddCard('people', '임원현황') : null)}

      {!editable && videos.length > 0 ? (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
            행사 동영상
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {videos.length}개</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: videos.length > 2 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '12px' }}>
            {videos.map(video => (
              <div key={video.youtubeId} onClick={() => setPlayVid(video)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0', background: '#fff' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                  <img src={getYoutubeThumb(video.youtubeId)} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!editable ? (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: theme.accent, borderRadius: '4px' }} />
            행사 사진
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {photos.length}장</span>
          </h3>
          {photos.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px dashed #dbe3ef', borderRadius: '12px', padding: '28px', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>등록된 행사 사진이 없습니다.</div>
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

      {lightbox !== null && photos[lightbox] ? (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={event => event.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={photos[lightbox].imgUrl} alt={photos[lightbox].label} style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>{photos[lightbox].label}</p>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ) : null}
    </>
  )
}
