import { useEffect, useMemo, useRef, useState } from 'react'
import { createContentDocument, deleteContentDocument, getContentDocument, listContentDocuments, updateContentDocument } from '../../../api/contentApi'
import { deleteMedia, uploadMedia } from '../../../utils/mediaStorage'
import { extractYoutubeId, getYoutubeThumb } from '../../../data/media'
import { validateImageFile } from '../../../utils/fileValidation'

const PER_PAGE = 12

const stickyBarStyle = {
  position: 'sticky',
  top: '88px',
  zIndex: 8,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(14px)',
  border: '1px solid #dbe4f0',
  borderRadius: '16px',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
  boxShadow: '0 12px 28px rgba(15, 32, 64, 0.08)',
  marginBottom: '20px',
}

function serializePageInfo(info) {
  return JSON.stringify({
    choirHeroUrl: info.choirHeroUrl || '',
    choirIntroTitle: info.choirIntroTitle || '',
    choirIntroLead: info.choirIntroLead || '',
    choirIntroBody: info.choirIntroBody || '',
    choirIntroFootnote: info.choirIntroFootnote || '',
  })
}

function serializeVideos(list) {
  return JSON.stringify(list.map(item => ({
    id: item.id,
    title: item.title || '',
    singer: item.singer || '',
    youtubeId: item.youtubeId || '',
  })))
}

function serializeAlbums(list) {
  return JSON.stringify(list.map(item => ({
    id: item.id,
    label: item.label || '',
    imgUrl: item.imgUrl || '',
    storagePath: item.storagePath || '',
    pendingFileName: item.pendingFile?.name || '',
  })))
}

export default function ChoirManager() {
  const [videos, setVideos] = useState([])
  const [albums, setAlbums] = useState([])
  const [originalVideos, setOriginalVideos] = useState([])
  const [originalAlbums, setOriginalAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [videoPage, setVideoPage] = useState(1)
  const [albumPage, setAlbumPage] = useState(1)
  const [videoForm, setVideoForm] = useState({ title: '', singer: '', youtubeId: '' })
  const [albumForm, setAlbumForm] = useState({ label: '', file: null, preview: null })
  const [pageInfo, setPageInfo] = useState({
    choirHeroUrl: '',
    choirIntroTitle: '',
    choirIntroLead: '',
    choirIntroBody: '',
    choirIntroFootnote: '',
  })
  const [originalPageInfo, setOriginalPageInfo] = useState({
    choirHeroUrl: '',
    choirIntroTitle: '',
    choirIntroLead: '',
    choirIntroBody: '',
    choirIntroFootnote: '',
  })
  const [heroUploading, setHeroUploading] = useState(false)
  const fileRef = useRef(null)
  const heroRef = useRef(null)
  const editAlbumRefs = useRef({})

  const hasPageChanges = useMemo(() => serializePageInfo(pageInfo) !== serializePageInfo(originalPageInfo), [pageInfo, originalPageInfo])
  const hasVideoChanges = useMemo(() => serializeVideos(videos) !== serializeVideos(originalVideos), [videos, originalVideos])
  const hasAlbumChanges = useMemo(() => serializeAlbums(albums) !== serializeAlbums(originalAlbums), [albums, originalAlbums])
  const hasUnsavedChanges = hasPageChanges || hasVideoChanges || hasAlbumChanges

  const fetchItems = async () => {
    setLoading(true)
    try {
      const [nextVideos, albumDocuments, assets] = await Promise.all([
        listContentDocuments('choirVideos', { sort: 'order', direction: 'desc' }),
        listContentDocuments('choirGallery', { sort: 'order', direction: 'desc' }),
        getContentDocument('siteAssets', 'main'),
      ])

      const nextAlbums = albumDocuments.map(item => ({ ...item, pendingFile: null, previewUrl: '' }))
      const nextPageInfo = {
        choirHeroUrl: assets?.choirHeroUrl || '',
        choirIntroTitle: assets?.choirIntroTitle || '',
        choirIntroLead: assets?.choirIntroLead || '',
        choirIntroBody: assets?.choirIntroBody || '',
        choirIntroFootnote: assets?.choirIntroFootnote || '',
      }

      setVideos(nextVideos)
      setOriginalVideos(nextVideos.map(item => ({ ...item })))
      setAlbums(nextAlbums)
      setOriginalAlbums(nextAlbums.map(item => ({ ...item })))
      setPageInfo(nextPageInfo)
      setOriginalPageInfo(nextPageInfo)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const pagedVideos = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(videos.length / PER_PAGE))
    const safePage = Math.min(videoPage, totalPages)
    return { totalPages, safePage, items: videos.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE) }
  }, [videoPage, videos])

  const pagedAlbums = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(albums.length / PER_PAGE))
    const safePage = Math.min(albumPage, totalPages)
    return { totalPages, safePage, items: albums.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE) }
  }, [albumPage, albums])

  const handleVideoAdd = async () => {
    if (!videoForm.title.trim()) return alert('제목을 입력해 주세요.')
    if (!videoForm.youtubeId.trim()) return alert('YouTube ID 또는 URL을 입력해 주세요.')
    setSaving(true)
    try {
      await createContentDocument('choirVideos', {
        title: videoForm.title.trim(),
        singer: videoForm.singer.trim(),
        youtubeId: extractYoutubeId(videoForm.youtubeId),
        order: Date.now(),
      })
      setVideoForm({ title: '', singer: '', youtubeId: '' })
      await fetchItems()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '성가대 영상을 등록했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleAlbumFileChange = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = loadEvent => setAlbumForm(current => ({ ...current, file, preview: loadEvent.target.result }))
    reader.readAsDataURL(file)
  }

  const handleAlbumAdd = async () => {
    if (!albumForm.label.trim()) return alert('제목을 입력해 주세요.')
    if (!albumForm.file) return alert('이미지를 선택해 주세요.')
    setSaving(true)
    try {
      const uploaded = await uploadMedia(albumForm.file, 'gallery')
      await createContentDocument('choirGallery', {
        label: albumForm.label.trim(),
        imgUrl: uploaded.url,
        storagePath: uploaded.path,
        order: Date.now(),
      })
      setAlbumForm({ label: '', file: null, preview: null })
      if (fileRef.current) fileRef.current.value = ''
      await fetchItems()
      window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'create', message: '성가대 사진을 등록했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleVideoChange = (videoId, field, value) => {
    setVideos(current => current.map(item => (
      item.id === videoId ? { ...item, [field]: value } : item
    )))
  }

  const handleAlbumChange = (albumId, field, value) => {
    setAlbums(current => current.map(item => (
      item.id === albumId ? { ...item, [field]: value } : item
    )))
  }

  const handleAlbumReplace = (albumId, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }
    setAlbums(current => current.map(item => (
      item.id === albumId ? { ...item, pendingFile: file, previewUrl: URL.createObjectURL(file) } : item
    )))
    event.target.value = ''
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await updateContentDocument('siteAssets', 'main', {
        choirHeroUrl: pageInfo.choirHeroUrl || '',
        choirIntroTitle: pageInfo.choirIntroTitle || '',
        choirIntroLead: pageInfo.choirIntroLead || '',
        choirIntroBody: pageInfo.choirIntroBody || '',
        choirIntroFootnote: pageInfo.choirIntroFootnote || '',
      })

      await Promise.all(videos.map(item => updateContentDocument('choirVideos', item.id, {
        title: item.title?.trim() || '',
        singer: item.singer?.trim() || '',
        youtubeId: extractYoutubeId(item.youtubeId),
      })))

      const nextAlbums = []
      for (const item of albums) {
        let imgUrl = item.imgUrl || ''
        let storagePath = item.storagePath || ''
        if (item.pendingFile) {
          const uploaded = await uploadMedia(item.pendingFile, 'gallery')
          imgUrl = uploaded.url
          if (item.storagePath) {
            try { await deleteMedia(item.storagePath) } catch {}
          }
          storagePath = uploaded.path
        }
        await updateContentDocument('choirGallery', item.id, {
          label: item.label?.trim() || '',
          imgUrl,
          storagePath,
        })
        nextAlbums.push({
          ...item,
          label: item.label?.trim() || '',
          imgUrl,
          storagePath,
          pendingFile: null,
          previewUrl: '',
        })
      }

      const nextVideos = videos.map(item => ({
        ...item,
        title: item.title?.trim() || '',
        singer: item.singer?.trim() || '',
        youtubeId: extractYoutubeId(item.youtubeId),
      }))
      setVideos(nextVideos)
      setOriginalVideos(nextVideos.map(item => ({ ...item })))
      setAlbums(nextAlbums)
      setOriginalAlbums(nextAlbums.map(item => ({ ...item })))
      setOriginalPageInfo({ ...pageInfo })
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '성가대 내용을 저장했습니다.' } }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSaving(false)
  }

  const handleHeroUpload = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      event.target.value = ''
      return
    }
    setHeroUploading(true)
    try {
      const { url: choirHeroUrl } = await uploadMedia(file, 'site-assets')
      setPageInfo(current => ({ ...current, choirHeroUrl }))
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setHeroUploading(false)
    event.target.value = ''
  }

  const handleVideoDelete = async id => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteContentDocument('choirVideos', id)
    await fetchItems()
    window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: '성가대 영상을 삭제했습니다.' } }))
  }

  const handleAlbumDelete = async item => {
    if (!window.confirm('삭제하시겠습니까?')) return
    if (item.storagePath) {
      try { await deleteMedia(item.storagePath) } catch {}
    }
    await deleteContentDocument('choirGallery', item.id)
    await fetchItems()
    window.dispatchEvent(new CustomEvent('admin:activity', { detail: { action: 'delete', message: '성가대 사진을 삭제했습니다.' } }))
  }

  const pageButton = (number, currentPage, onClick) => (
    <button key={number} onClick={() => onClick(number)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', background: currentPage === number ? '#0f2040' : '#f3f4f6', color: currentPage === number ? '#fff' : '#374151', fontWeight: currentPage === number ? 700 : 400 }}>
      {number}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>성가대 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>상단 소개, 영상, 사진을 한 화면에서 바로 수정하고 상단 저장으로 한 번에 반영합니다.</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>성가대 전체 인라인 편집</p>
          <p style={{ fontSize: '0.76rem', color: hasUnsavedChanges ? '#1d4ed8' : '#6b7280', marginTop: '2px' }}>
            {hasUnsavedChanges ? '성가대 내용을 수정 중입니다. 저장 버튼으로 반영하세요.' : `영상 ${videos.length}건 · 사진 ${albums.length}건`}
          </p>
        </div>
        <button onClick={handleSaveAll} disabled={saving || !hasUnsavedChanges} style={{ padding: '11px 18px', background: saving || !hasUnsavedChanges ? '#cbd5e1' : '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving || !hasUnsavedChanges ? 'default' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#14532d', marginBottom: '14px' }}>성가대 상단 소개</p>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', alignItems: 'start' }}>
          <div>
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #bbf7d0', background: '#dcfce7', marginBottom: '10px' }}>
              {pageInfo.choirHeroUrl ? <img src={pageInfo.choirHeroUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </div>
            <input ref={heroRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleHeroUpload} style={{ display: 'none' }} />
            <button onClick={() => heroRef.current?.click()} disabled={heroUploading} style={{ width: '100%', padding: '9px 12px', background: '#fff', color: '#166534', border: '1px solid #86efac', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
              {heroUploading ? '업로드 중...' : '상단 이미지 변경'}
            </button>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <input value={pageInfo.choirIntroLead || ''} onChange={event => setPageInfo(current => ({ ...current, choirIntroLead: event.target.value }))} placeholder="도입 문구" style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.875rem' }} />
            <textarea value={pageInfo.choirIntroTitle || ''} onChange={event => setPageInfo(current => ({ ...current, choirIntroTitle: event.target.value }))} placeholder="소개 제목" rows={3} style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
            <textarea value={pageInfo.choirIntroBody || ''} onChange={event => setPageInfo(current => ({ ...current, choirIntroBody: event.target.value }))} placeholder="소개 본문" rows={4} style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
            <textarea value={pageInfo.choirIntroFootnote || ''} onChange={event => setPageInfo(current => ({ ...current, choirIntroFootnote: event.target.value }))} placeholder="하단 문구" rows={2} style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 성가대 영상 등록</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input value={videoForm.title} onChange={event => setVideoForm(current => ({ ...current, title: event.target.value }))} placeholder="영상 제목" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }} />
            <input value={videoForm.singer} onChange={event => setVideoForm(current => ({ ...current, singer: event.target.value }))} placeholder="찬양자 이름" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }} />
            <input value={videoForm.youtubeId} onChange={event => setVideoForm(current => ({ ...current, youtubeId: event.target.value }))} placeholder="YouTube ID 또는 URL" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }} />
            {videoForm.youtubeId ? <img src={getYoutubeThumb(extractYoutubeId(videoForm.youtubeId))} alt="" style={{ width: '140px', height: '79px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #fecaca' }} /> : null}
            <button onClick={handleVideoAdd} disabled={saving} style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              등록
            </button>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '20px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 성가대 사진 등록</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {albumForm.preview ? <img src={albumForm.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} /> : null}
            <input value={albumForm.label} onChange={event => setAlbumForm(current => ({ ...current, label: event.target.value }))} placeholder="사진 제목" style={{ flex: '1 1 160px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleAlbumFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
              {albumForm.file ? albumForm.file.name.slice(0, 12) : '이미지 선택'}
            </button>
            <button onClick={handleAlbumAdd} disabled={saving} style={{ padding: '8px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              등록
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px' }}>성가대 영상</h2>
            {videos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', border: '1px solid #eaecf0', borderRadius: '12px', background: '#fff' }}>등록된 성가대 영상이 없습니다.</div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pagedVideos.items.map(item => (
                    <div key={item.id} style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '14px', alignItems: 'center' }}>
                      <img src={getYoutubeThumb(extractYoutubeId(item.youtubeId))} alt="" style={{ width: '96px', height: '54px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', gap: '10px' }}>
                        <input value={item.title || ''} onChange={event => handleVideoChange(item.id, 'title', event.target.value)} placeholder="영상 제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                        <input value={item.singer || ''} onChange={event => handleVideoChange(item.id, 'singer', event.target.value)} placeholder="찬양자 이름" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                        <input value={item.youtubeId || ''} onChange={event => handleVideoChange(item.id, 'youtubeId', event.target.value)} placeholder="YouTube ID 또는 URL" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                      </div>
                      <button onClick={() => handleVideoDelete(item.id)} style={{ padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {Array.from({ length: pagedVideos.totalPages }, (_, index) => pageButton(index + 1, pagedVideos.safePage, setVideoPage))}
                </div>
              </>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px' }}>성가대 사진</h2>
            {albums.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', border: '1px solid #eaecf0', borderRadius: '12px', background: '#fff' }}>등록된 성가대 사진이 없습니다.</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {pagedAlbums.items.map(item => (
                    <div key={item.id} style={{ border: '1px solid #eaecf0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                        <img src={item.previewUrl || item.imgUrl} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '10px', display: 'grid', gap: '8px' }}>
                        <input value={item.label || ''} onChange={event => handleAlbumChange(item.id, 'label', event.target.value)} placeholder="사진 제목" style={{ padding: '9px 11px', border: '1px solid #dbe4f0', borderRadius: '8px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input ref={element => { editAlbumRefs.current[item.id] = element }} type="file" accept=".jpg,.jpeg,.png" onChange={event => handleAlbumReplace(item.id, event)} style={{ display: 'none' }} />
                          <button onClick={() => editAlbumRefs.current[item.id]?.click()} style={{ flex: 1, padding: '8px 10px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#fff', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}>이미지 변경</button>
                          <button onClick={() => handleAlbumDelete(item)} style={{ flex: 1, padding: '8px 10px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {Array.from({ length: pagedAlbums.totalPages }, (_, index) => pageButton(index + 1, pagedAlbums.safePage, setAlbumPage))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
