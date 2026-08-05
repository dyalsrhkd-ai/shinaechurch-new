import { useEffect, useMemo, useRef, useState } from 'react'
import { createContentDocument, deleteContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { deleteMedia, uploadMedia } from '../../../utils/mediaStorage'
import { validateImageFile } from '../../../utils/fileValidation'

const PER_PAGE = 15
const CATEGORY_OPTIONS = [
  { value: 'overseas', label: '해외선교' },
  { value: 'domestic', label: '국내선교' },
]

function serializeMissions(list) {
  return JSON.stringify(
    list.map(item => ({
      id: item.id,
      title: item.title || '',
      category: item.category || '',
      date: item.dateValue || '',
      imgUrl: item.imgUrl || '',
      storagePath: item.storagePath || '',
      pendingFileName: item.pendingFile?.name || '',
      previewUrl: item.previewUrl || '',
    }))
  )
}

function mapMission(data) {
  const dateValue = data.date ? new Date(data.date).toISOString().slice(0, 10) : ''
  return {
    id: data.id,
    title: data.title || '',
    category: data.category || 'overseas',
    date: data.date || null,
    dateValue,
    imgUrl: data.imgUrl || '',
    storagePath: data.storagePath || '',
    pendingFile: null,
    previewUrl: '',
  }
}

export default function MissionManager() {
  const [missions, setMissions] = useState([])
  const [originalMissions, setOriginalMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [page, setPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState('overseas')
  const [form, setForm] = useState({ date: '', title: '', category: 'overseas' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()
  const editFileRefs = useRef({})

  const fetchMissions = async () => {
    setLoading(true)
    setError('')
    try {
      const mapped = (await listContentDocuments('missions', { sort: 'date', direction: 'desc' })).map(mapMission)
      setMissions(mapped)
      setOriginalMissions(mapped.map(item => ({ ...item })))
    } catch (e) {
      setError('선교 기록을 불러오지 못했습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  const filteredMissions = useMemo(
    () => missions.filter(item => item.category === activeCategory),
    [activeCategory, missions]
  )

  const hasUnsavedChanges = useMemo(
    () => serializeMissions(missions) !== serializeMissions(originalMissions),
    [missions, originalMissions]
  )

  useEffect(() => {
    setPage(1)
  }, [activeCategory])

  const handleFileChange = event => {
    const file = event.target.files[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    const match = file.name.match(/(\d{4})[.\-_](\d{2})[.\-_](\d{2})/)
    if (match) {
      const dateStr = `${match[1]}-${match[2]}-${match[3]}`
      const categoryLabel = CATEGORY_OPTIONS.find(option => option.value === form.category)?.label || '선교'
      setForm(current => ({
        ...current,
        date: dateStr,
        title: `${match[1]}.${match[2]}.${match[3]} ${categoryLabel}`,
      }))
    }
    event.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile || !form.date) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const categoryLabel = CATEGORY_OPTIONS.find(option => option.value === form.category)?.label || '선교'
      const uploaded = await uploadMedia(selectedFile, 'missions', setUploadProgress)
      await createContentDocument('missions', {
        category: form.category,
        title: form.title || `${form.date.replace(/-/g, '.')} ${categoryLabel}`,
        date: form.date,
        imgUrl: uploaded.url,
        storagePath: uploaded.path,
      })

      setSelectedFile(null)
      setPreview(null)
      setForm({ date: '', title: '', category: activeCategory })
      await fetchMissions()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: `선교 기록을 등록했습니다. (${categoryLabel})` } }))
    } catch (err) {
      console.error(err)
      setError('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async mission => {
    if (!window.confirm(`"${mission.title}"를 삭제할까요?`)) return
    if (mission.storagePath) {
      try {
        await deleteMedia(mission.storagePath)
      } catch {}
    }
    await deleteContentDocument('missions', mission.id)
    await fetchMissions()
    window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: `선교 기록을 삭제했습니다. (${mission.title})` } }))
  }

  const handleMissionChange = (missionId, field, value) => {
    setMissions(current => current.map(item => (
      item.id === missionId ? { ...item, [field]: value } : item
    )))
  }

  const handleReplaceImage = (missionId, event) => {
    const file = event.target.files[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }

    setMissions(current => current.map(item => (
      item.id === missionId
        ? { ...item, pendingFile: file, previewUrl: URL.createObjectURL(file) }
        : item
    )))
    event.target.value = ''
  }

  const handleSaveAll = async () => {
    const invalidMission = missions.find(item => !item.title.trim() || !item.dateValue || !item.category)
    if (invalidMission) {
      alert('제목, 날짜, 구분이 비어 있는 항목이 있습니다.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const nextMissions = []
      const totalCount = missions.length || 1

      for (let index = 0; index < missions.length; index += 1) {
        const item = missions[index]
        let imgUrl = item.imgUrl
        let storagePath = item.storagePath

        if (item.pendingFile) {
          const uploaded = await uploadMedia(item.pendingFile, 'missions', (fileProgress) => {
            setUploadProgress(Math.round(((index + fileProgress / 100) / totalCount) * 100))
          })
          imgUrl = uploaded.url
          if (item.storagePath) {
            try {
              await deleteMedia(item.storagePath)
            } catch {}
          }
          storagePath = uploaded.path
        }

        nextMissions.push({
          ...item,
          title: item.title.trim(),
          dateValue: item.dateValue,
          imgUrl,
          storagePath,
          pendingFile: null,
          previewUrl: '',
        })
      }

      await Promise.all(nextMissions.map(item => (
        updateContentDocument('missions', item.id, {
          title: item.title,
          category: item.category,
          date: item.dateValue,
          imgUrl: item.imgUrl,
          storagePath: item.storagePath,
        })
      )))

      setMissions(nextMissions)
      setOriginalMissions(nextMissions.map(item => ({ ...item })))
      setUploadProgress(0)
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '선교 기록을 저장했습니다.' } }))
      alert('선교 기록이 저장되었습니다.')
    } catch (err) {
      console.error(err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const totalPages = Math.ceil(filteredMissions.length / PER_PAGE)
  const slice = filteredMissions.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
          <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2040' }}>선교 관리</p>
          <p style={{ fontSize: '0.78rem', color: hasUnsavedChanges ? '#1d4ed8' : '#64748b', marginTop: '4px' }}>
            {hasUnsavedChanges ? '기존 선교 기록을 수정 중입니다. 상단 저장 버튼으로 반영하세요.' : '해외선교와 국내선교 기록 이미지를 바로 등록합니다.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !form.date}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid #bfdbfe',
              background: uploading || !selectedFile || !form.date ? '#dbeafe' : '#eff6ff',
              color: uploading || !selectedFile || !form.date ? '#94a3b8' : '#1d4ed8',
              fontWeight: 800,
              cursor: uploading || !selectedFile || !form.date ? 'default' : 'pointer',
              fontSize: '0.84rem',
              whiteSpace: 'nowrap',
            }}
          >
            신규 등록
          </button>
          <button
            onClick={handleSaveAll}
            disabled={uploading || !hasUnsavedChanges}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: uploading || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040',
              color: '#fff',
              fontWeight: 800,
              cursor: uploading || !hasUnsavedChanges ? 'default' : 'pointer',
              fontSize: '0.84rem',
              whiteSpace: 'nowrap',
            }}
          >
            {uploading ? `${uploadProgress}%` : '저장'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        {CATEGORY_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setActiveCategory(option.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: option.value === activeCategory ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
              background: option.value === activeCategory ? '#eff6ff' : '#fff',
              color: option.value === activeCategory ? '#1d4ed8' : '#475569',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.84rem',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      ) : null}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {preview ? <img src={preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} /> : null}
          <select
            value={form.category}
            onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
            style={{ padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem', background: '#fff' }}
          >
            {CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={event => {
              const nextDate = event.target.value
              const categoryLabel = CATEGORY_OPTIONS.find(option => option.value === form.category)?.label || '선교'
              setForm(current => ({
                ...current,
                date: nextDate,
                title: nextDate ? `${nextDate.replace(/-/g, '.')} ${categoryLabel}` : '',
              }))
            }}
            style={{ padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }}
          />
          <input
            type="text"
            value={form.title}
            onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
            placeholder="제목"
            style={{ flex: '1 1 180px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}
          >
            {selectedFile ? `✓ ${selectedFile.name.slice(0, 12)}…` : '이미지 선택'}
          </button>
        </div>
        {uploading ? (
          <div style={{ marginTop: '10px' }}>
            <div style={{ background: '#dbeafe', borderRadius: '9999px', height: '4px' }}>
              <div style={{ background: '#1d4ed8', height: '4px', borderRadius: '9999px', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
        </div>
      ) : filteredMissions.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>등록된 {CATEGORY_OPTIONS.find(option => option.value === activeCategory)?.label} 기록이 없습니다</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {slice.map(mission => (
              <div key={mission.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '14px', alignItems: 'center' }}>
                <div>
                  {(mission.previewUrl || mission.imgUrl) ? (
                    <img src={mission.previewUrl || mission.imgUrl} alt="" style={{ width: '96px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ width: '96px', height: '72px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>이미지 없음</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 140px 1fr', gap: '10px' }}>
                  <select
                    value={mission.category}
                    onChange={event => handleMissionChange(mission.id, 'category', event.target.value)}
                    style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem', background: '#fff' }}
                  >
                    {CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <input
                    type="date"
                    value={mission.dateValue || ''}
                    onChange={event => handleMissionChange(mission.id, 'dateValue', event.target.value)}
                    style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem' }}
                  />
                  <input
                    type="text"
                    value={mission.title || ''}
                    onChange={event => handleMissionChange(mission.id, 'title', event.target.value)}
                    placeholder="제목"
                    style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px', fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    ref={element => { editFileRefs.current[mission.id] = element }}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={event => handleReplaceImage(mission.id, event)}
                  />
                  <button
                    onClick={() => editFileRefs.current[mission.id]?.click()}
                    style={{ padding: '8px 12px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}
                  >
                    이미지 변경
                  </button>
                  <button
                    onClick={() => handleDelete(mission)}
                    style={{ padding: '8px 12px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, color: '#dc2626' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(number => (
                <button key={number} onClick={() => setPage(number)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid', borderColor: number === page ? '#1d4ed8' : '#e5e7eb', background: number === page ? '#1d4ed8' : '#fff', color: number === page ? '#fff' : '#374151', fontSize: '0.825rem', fontWeight: number === page ? 700 : 400, cursor: 'pointer' }}>{number}</button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
