import { useMemo, useRef, useState } from 'react'
import { getYoutubeThumb } from '../../data/media'

const colorInputStyle = {
  width: '44px',
  height: '32px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  background: '#fff',
  cursor: 'pointer',
  padding: '2px',
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

function parseSchedules(text) {
  return (text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [time = '', activity = '', place = ''] = line.split('|').map(item => item.trim())
      return { time, activity, place }
    })
}

function toSchedulesText(items) {
  return items
    .map(item => `${item.time || ''}|${item.activity || ''}|${item.place || ''}`)
    .join('\n')
}

export default function DeptPageContent({
  pageState,
  photos = [],
  videos = [],
  editable = false,
  activeSection,
  onSectionClick,
  onHeroChange,
  onGroupChange,
  onGroupAdd,
  onGroupDelete,
}) {
  const [lightbox, setLightbox] = useState(null)
  const [playVid, setPlayVid] = useState(null)
  const groups = pageState.deptGroups || []
  const deptColors = useMemo(
    () => Object.fromEntries(groups.map(group => [group.dept, group.color || '#475569'])),
    [groups]
  )

  return (
    <>
      <div onClick={() => editable && onSectionClick('hero')} style={{ marginBottom: '28px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #eaecf0', position: 'relative', cursor: editable ? 'text' : 'default' }}>
        {pageState.heroImage ? (
          <img src={pageState.heroImage} alt="부서별" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '300px', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }} />
        )}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
        {groups.map(group => {
          const schedules = parseSchedules(group.schedulesText)
          const isActive = activeSection === group.id

          return (
            <div key={group.id} onClick={() => editable && onSectionClick(group.id)} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden', cursor: editable ? 'text' : 'default' }}>
              <div style={{ background: group.color || '#1d4ed8', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                <div style={{ flex: 1 }}>
                  {editable && isActive ? (
                    <EditableInlineText value={group.title} placeholder={group.dept} onChange={value => onGroupChange(group.id, 'title', value)} style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }} as="div" />
                  ) : (
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{group.title || group.dept}</h3>
                  )}
                </div>
                {editable ? (
                  <button
                    onClick={event => {
                      event.stopPropagation()
                      if (!window.confirm('이 블록을 삭제하면 안의 모든 내용도 함께 삭제됩니다. 계속하시겠습니까?')) return
                      onGroupDelete(group.id)
                    }}
                    style={{ width: '22px', height: '22px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0 }}
                  >
                    X
                  </button>
                ) : null}
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {editable && isActive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>부서 색상</span>
                    <input
                      type="color"
                      value={group.color || '#1d4ed8'}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onGroupChange(group.id, 'color', event.target.value)}
                      style={colorInputStyle}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{group.color || '#1d4ed8'}</span>
                  </div>
                ) : null}

                <div style={{ background: '#f6f8fb', borderRadius: '10px', padding: '14px 16px', borderLeft: `3px solid ${group.color || '#1d4ed8'}` }}>
                  {editable && isActive ? (
                    <EditableInlineText value={group.verse} placeholder="성구 또는 핵심 문구" onChange={value => onGroupChange(group.id, 'verse', value)} style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-wrap' }} as="div" />
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{group.verse || ''}</p>
                  )}
                </div>

                {editable && isActive ? (
                  <EditableInlineText value={group.desc} placeholder="부서 소개" onChange={value => onGroupChange(group.id, 'desc', value)} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }} as="div" />
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{group.desc || ''}</p>
                )}

                {editable || schedules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>모임 일정</p>
                    {(schedules.length > 0 ? schedules : [{ time: '', activity: '', place: '' }]).map((schedule, index) => (
                      <div key={`${group.id}-schedule-${index}`} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f6f8fb', borderRadius: '8px', padding: '12px 16px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: group.color || '#1d4ed8', flexShrink: 0 }} />
                        {editable && isActive ? (
                          <>
                            <EditableInlineText
                              value={schedule.time}
                              placeholder="시간"
                              onChange={value => {
                                const next = [...(schedules.length > 0 ? schedules : [{ time: '', activity: '', place: '' }])]
                                next[index] = { ...next[index], time: value }
                                onGroupChange(group.id, 'schedulesText', toSchedulesText(next))
                              }}
                              style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}
                              as="div"
                            />
                            <EditableInlineText
                              value={schedule.activity}
                              placeholder="활동"
                              onChange={value => {
                                const next = [...(schedules.length > 0 ? schedules : [{ time: '', activity: '', place: '' }])]
                                next[index] = { ...next[index], activity: value }
                                onGroupChange(group.id, 'schedulesText', toSchedulesText(next))
                              }}
                              style={{ fontSize: '0.82rem', color: '#6b7280' }}
                              as="div"
                            />
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <EditableInlineText
                                value={schedule.place}
                                placeholder="장소"
                                onChange={value => {
                                  const next = [...(schedules.length > 0 ? schedules : [{ time: '', activity: '', place: '' }])]
                                  next[index] = { ...next[index], place: value }
                                  onGroupChange(group.id, 'schedulesText', toSchedulesText(next))
                                }}
                                style={{ fontSize: '0.78rem', color: '#9ca3af' }}
                                as="div"
                              />
                              <button
                                onClick={event => {
                                  event.stopPropagation()
                                  const next = schedules.filter((_, rowIndex) => rowIndex !== index)
                                  onGroupChange(group.id, 'schedulesText', toSchedulesText(next))
                                }}
                                style={{ width: '18px', height: '18px', borderRadius: '999px', border: 'none', background: '#e2e8f0', color: '#334155', fontSize: '0.68rem', cursor: 'pointer', lineHeight: 1 }}
                              >
                                X
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>{schedule.time}</span>
                            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{schedule.activity}</span>
                            {schedule.place ? <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 'auto' }}>{schedule.place}</span> : null}
                          </>
                        )}
                      </div>
                    ))}
                    {editable && isActive ? (
                      <button
                        onClick={event => {
                          event.stopPropagation()
                          onGroupChange(group.id, 'schedulesText', toSchedulesText([...schedules, { time: '', activity: '', place: '' }]))
                        }}
                        style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: '999px', border: `1px dashed ${group.color || '#1d4ed8'}`, background: '#fff', color: group.color || '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + 추가
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}

        {editable ? (
          <button
            onClick={event => {
              event.stopPropagation()
              onGroupAdd()
            }}
            style={{ width: '100%', minHeight: '110px', borderRadius: '16px', border: '2px dashed #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <span style={{ fontSize: '1.8rem', color: '#94a3b8', lineHeight: 1 }}>+</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>부서 추가</span>
          </button>
        ) : null}
      </div>

      {!editable ? (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
            행사 동영상
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {videos.length}개</span>
          </h3>
          {videos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #dbe3ef', borderRadius: '16px' }}>등록된 행사 동영상이 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {videos.map((video, index) => (
                <div key={video.id || video.youtubeId || index} onClick={() => setPlayVid(video)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0', background: '#fff' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                    <img src={getYoutubeThumb(video.youtubeId)} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '5px 9px', borderRadius: '999px', background: deptColors[video.dept] || '#475569', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{video.dept}</span>
                  </div>
                  <div style={{ padding: '8px 10px', background: '#fff' }}>
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
            <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
            행사 사진
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>총 {photos.length}장</span>
          </h3>
          {photos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #dbe3ef', borderRadius: '16px' }}>등록된 행사 사진이 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {photos.map((photo, index) => (
                <div key={photo.id || index} onClick={() => setLightbox(index)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                    <img src={photo.imgUrl} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '5px 9px', borderRadius: '999px', background: deptColors[photo.dept] || '#475569', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
                      {photo.dept}
                    </span>
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
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>
              [{photos[lightbox].dept}] {photos[lightbox].label}
            </p>
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
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '12px' }}>[{playVid.dept}] {playVid.title}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}
