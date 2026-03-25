import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { CHOIR_DEPT, extractYoutubeId, getYoutubeThumb } from '../../../data/media'
import { validateImageFile } from '../../../utils/fileValidation'

const PER_PAGE = 12

export default function ChoirManager() {
  const [videos, setVideos] = useState([])
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [videoSaving, setVideoSaving] = useState(false)
  const [albumSaving, setAlbumSaving] = useState(false)
  const [videoPage, setVideoPage] = useState(1)
  const [albumPage, setAlbumPage] = useState(1)
  const [videoForm, setVideoForm] = useState({ title: '', singer: '', youtubeId: '' })
  const [albumForm, setAlbumForm] = useState({ label: '', file: null, preview: null })
  const fileRef = useRef()

  const fetchItems = async () => {
    setLoading(true)
    try {
      const [videoSnap, gallerySnap] = await Promise.all([
        getDocs(query(collection(db, 'choirVideos'), orderBy('order', 'desc'))),
        getDocs(query(collection(db, 'choirGallery'), orderBy('order', 'desc'))),
      ])

      setVideos(videoSnap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() })))
      setAlbums(gallerySnap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() })))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    let active = true

    async function migrateAndFetch() {
      setLoading(true)
      try {
        const [choirVideoSnap, choirGallerySnap, legacyVideoSnap, legacyGallerySnap] = await Promise.all([
          getDocs(query(collection(db, 'choirVideos'), orderBy('order', 'desc'))),
          getDocs(query(collection(db, 'choirGallery'), orderBy('order', 'desc'))),
          getDocs(query(collection(db, 'videos'), orderBy('order', 'desc'))),
          getDocs(query(collection(db, 'gallery'), orderBy('order', 'desc'))),
        ])

        const legacyVideos = legacyVideoSnap.docs.filter(item => item.data().dept === CHOIR_DEPT)
        const legacyAlbums = legacyGallerySnap.docs.filter(item => item.data().dept === CHOIR_DEPT)

        if (legacyVideos.length > 0 || legacyAlbums.length > 0) {
          setMigrating(true)

          await Promise.all(legacyVideos.map(async item => {
            const data = { ...item.data() }
            delete data.dept
            await setDoc(doc(db, 'choirVideos', item.id), data, { merge: true })
            await deleteDoc(doc(db, 'videos', item.id))
          }))

          await Promise.all(legacyAlbums.map(async item => {
            const data = { ...item.data() }
            delete data.dept
            await setDoc(doc(db, 'choirGallery', item.id), data, { merge: true })
            await deleteDoc(doc(db, 'gallery', item.id))
          }))
        }

        if (!active) return

        const nextChoirVideoSnap = legacyVideos.length > 0
          ? await getDocs(query(collection(db, 'choirVideos'), orderBy('order', 'desc')))
          : choirVideoSnap
        const nextChoirGallerySnap = legacyAlbums.length > 0
          ? await getDocs(query(collection(db, 'choirGallery'), orderBy('order', 'desc')))
          : choirGallerySnap

        if (!active) return
        setVideos(nextChoirVideoSnap.docs.map(item => ({ id: item.id, ...item.data() })))
        setAlbums(nextChoirGallerySnap.docs.map(item => ({ id: item.id, ...item.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        if (active) {
          setMigrating(false)
          setLoading(false)
        }
      }
    }

    migrateAndFetch()
    return () => { active = false }
  }, [])

  const pagedVideos = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(videos.length / PER_PAGE))
    const safePage = Math.min(videoPage, totalPages)
    return {
      totalPages,
      safePage,
      items: videos.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    }
  }, [videoPage, videos])

  const pagedAlbums = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(albums.length / PER_PAGE))
    const safePage = Math.min(albumPage, totalPages)
    return {
      totalPages,
      safePage,
      items: albums.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    }
  }, [albumPage, albums])

  const handleVideoAdd = async () => {
    if (!videoForm.title.trim()) return alert('제목을 입력하세요')
    if (!videoForm.youtubeId.trim()) return alert('YouTube ID 또는 URL을 입력하세요')
    setVideoSaving(true)
    try {
      await addDoc(collection(db, 'choirVideos'), {
        title: videoForm.title.trim(),
        singer: videoForm.singer.trim(),
        youtubeId: extractYoutubeId(videoForm.youtubeId),
        order: Date.now(),
        createdAt: serverTimestamp(),
      })
      setVideoForm({ title: '', singer: '', youtubeId: '' })
      await fetchItems()
    } catch (e) {
      alert('오류: ' + e.message)
    }
    setVideoSaving(false)
  }

  const handleAlbumFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); event.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = loadEvent => setAlbumForm(form => ({ ...form, file, preview: loadEvent.target.result }))
    reader.readAsDataURL(file)
  }

  const handleAlbumAdd = async () => {
    if (!albumForm.label.trim()) return alert('제목을 입력하세요')
    if (!albumForm.file) return alert('이미지를 선택하세요')
    setAlbumSaving(true)
    try {
      const storageRef = ref(storage, `gallery/${Date.now()}_${albumForm.file.name}`)
      await uploadBytes(storageRef, albumForm.file)
      const imgUrl = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'choirGallery'), {
        label: albumForm.label.trim(),
        imgUrl,
        order: Date.now(),
        createdAt: serverTimestamp(),
      })
      setAlbumForm({ label: '', file: null, preview: null })
      if (fileRef.current) fileRef.current.value = ''
      await fetchItems()
    } catch (e) {
      alert('오류: ' + e.message)
    }
    setAlbumSaving(false)
  }

  const handleVideoDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'choirVideos', id))
    fetchItems()
  }

  const handleAlbumDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'choirGallery', id))
    fetchItems()
  }

  const pageButton = (page, currentPage, onClick) => (
    <button
      key={page}
      onClick={() => onClick(page)}
      style={{
        width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem',
        background: currentPage === page ? '#0f2040' : '#f3f4f6', color: currentPage === page ? '#fff' : '#374151', fontWeight: currentPage === page ? 700 : 400,
      }}
    >
      {page}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>성가대 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>영상 {videos.length}개 · 사진 {albums.length}장</p>
        {migrating && <p style={{ fontSize: '0.8rem', color: '#059669', marginTop: '6px' }}>기존 성가대 자료를 별도 컬렉션으로 이관 중입니다...</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>성가대 영상 등록</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input value={videoForm.title} onChange={e => setVideoForm(form => ({ ...form, title: e.target.value }))} placeholder="영상 제목" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }} />
            <input value={videoForm.singer} onChange={e => setVideoForm(form => ({ ...form, singer: e.target.value }))} placeholder="찬양자 이름(선택)" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }} />
            <input value={videoForm.youtubeId} onChange={e => setVideoForm(form => ({ ...form, youtubeId: e.target.value }))} placeholder="YouTube ID 또는 URL" style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }} />
            {videoForm.youtubeId && <img src={getYoutubeThumb(extractYoutubeId(videoForm.youtubeId))} alt="" style={{ width: '140px', height: '79px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #fecaca' }} />}
            <button onClick={handleVideoAdd} disabled={videoSaving} style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              {videoSaving ? '저장 중...' : '영상 등록'}
            </button>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '20px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>성가대 사진 등록</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {albumForm.preview && <img src={albumForm.preview} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', flexShrink: 0 }} />}
            <input value={albumForm.label} onChange={e => setAlbumForm(form => ({ ...form, label: e.target.value }))} placeholder="사진 제목"
              style={{ flex: '1 1 160px', padding: '8px 11px', border: '1px solid #bfdbfe', borderRadius: '7px', fontSize: '0.875rem' }} />
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleAlbumFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '8px 14px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
              {albumForm.file ? '✓ ' + albumForm.file.name.slice(0, 12) + '…' : '이미지 선택'}
            </button>
            <button onClick={handleAlbumAdd} disabled={albumSaving}
              style={{ padding: '8px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {albumSaving ? '업로드 중...' : '+ 등록'}
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
                <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px', background: '#0f2040', padding: '10px 16px' }}>
                    {['썸네일', '제목', '찬양자', ''].map(header => (
                      <span key={header} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{header}</span>
                    ))}
                  </div>
                  {pagedVideos.items.map((item, index) => (
                    <div key={item.id} style={{
                      display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px', padding: '10px 16px',
                      borderBottom: index < pagedVideos.items.length - 1 ? '1px solid #f0f2f5' : 'none',
                      background: index % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', gap: '8px',
                    }}>
                      <img src={getYoutubeThumb(item.youtubeId)} alt="" style={{ width: '70px', height: '39px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.82rem', color: '#0f2040', fontWeight: 500 }}>{item.title}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.singer || '-'}</span>
                      <button onClick={() => handleVideoDelete(item.id)} style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>삭제</button>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
                  {pagedAlbums.items.map(item => (
                    <div key={item.id} style={{ border: '1px solid #eaecf0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                        <img src={item.imgUrl} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                        <button onClick={() => handleAlbumDelete(item.id)} style={{ fontSize: '0.7rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>삭제</button>
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
