import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import { validateImageFile } from '../../../utils/fileValidation'
import MenPageContent from '../../../components/content/MenPageContent'
import DeptPageContent from '../../../components/content/DeptPageContent'
import SchoolPageContent from '../../../components/content/SchoolPageContent'
import {
  blockTemplates,
  createBlock,
  createDefaultDeptGroups,
  createDefaultPageState,
  deptGroupColorPalette,
  normalizePageState,
} from '../../../data/pageContent'
import { useGalleryItems, useVideoItems } from '../../../hooks/useMediaItems'

const SCHOOL_SCHEDULE_TEMPLATE = Array.from({ length: 12 }, (_, index) => `${index + 1}월|`).join('\n')

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '0.875rem',
  background: '#fff',
  color: '#0f172a',
}

const textAreaStyle = {
  ...inputStyle,
  resize: 'vertical',
  lineHeight: 1.7,
}

const blockColors = {
  intro: '#1d4ed8',
  info: '#0891b2',
  list: '#059669',
  people: '#7c3aed',
  note: '#d97706',
}

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

function splitLines(text) {
  return (text || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function moveItem(items, from, to) {
  const next = [...items]
  const [picked] = next.splice(from, 1)
  next.splice(to, 0, picked)
  return next
}

function PreviewBlock({ block }) {
  const color = blockColors[block.type] || '#475569'
  const items = splitLines(block.itemsText)

  if (block.type === 'intro') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', borderRadius: '16px', padding: '24px', borderLeft: `4px solid ${color}` }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '12px' }}>{block.title || '소개 블록'}</h3>
        {block.subtitle && <p style={{ fontSize: '0.85rem', color: color, fontWeight: 700, marginBottom: '10px' }}>{block.subtitle}</p>}
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
          {block.body || '소개 문구를 입력하면 여기에 실제 페이지처럼 보입니다.'}
        </p>
      </div>
    )
  }

  if (block.type === 'info') {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '22px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px' }}>{block.title || '안내 정보'}</h3>
        {block.subtitle && <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{block.subtitle}</p>}
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', borderLeft: `4px solid ${color}` }}>
          <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {block.body || '예배시간, 장소, 담당자 같은 안내 정보를 넣으면 여기 표시됩니다.'}
          </p>
        </div>
      </div>
    )
  }

  if (block.type === 'list') {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '22px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px' }}>{block.title || '목록'}</h3>
        {block.body && <p style={{ fontSize: '0.84rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{block.body}</p>}
        <div style={{ display: 'grid', gap: '10px' }}>
          {(items.length > 0 ? items : ['항목을 줄바꿈으로 입력하면 목록으로 표시됩니다.']).map(item => (
            <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', color: '#334155' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'people') {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '22px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '14px' }}>{block.title || '구성원'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '10px' }}>임원 / 리더</p>
            <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {block.subtitle || '회장: 홍길동\n총무: 김신애'}
            </p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '10px' }}>회원 / 교사</p>
            <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {block.body || '구성원 명단을 입력하면 여기에 표시됩니다.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '22px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#9a3412', marginBottom: '12px' }}>{block.title || '추가 문단'}</h3>
      {block.subtitle && <p style={{ fontSize: '0.82rem', color: '#c2410c', marginBottom: '10px' }}>{block.subtitle}</p>}
      <p style={{ fontSize: '0.88rem', color: '#7c2d12', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        {block.body || '강조 문구나 추가 안내를 적는 블록입니다.'}
      </p>
    </div>
  )
}

export default function PageContentManager({ title, description, pages }) {
  const [selectedId, setSelectedId] = useState(pages[0]?.id || '')
  const [pageState, setPageState] = useState(createDefaultPageState(pages[0]))
  const [newBlockType, setNewBlockType] = useState(blockTemplates[0]?.type || 'intro')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState(null)
  const [draggingBlockId, setDraggingBlockId] = useState(null)
  const heroFileRef = useRef(null)
  const { items: galleryItems } = useGalleryItems()
  const { items: videoItems } = useVideoItems()

  const selectedPage = useMemo(
    () => pages.find(page => page.id === selectedId) || pages[0],
    [pages, selectedId]
  )
  const specialMinistryPageIds = useMemo(
    () => new Set(['ministry-men', 'ministry-women', 'ministry-deaconess', 'ministry-haenam']),
    []
  )
  const specialSchoolPageIds = useMemo(
    () => new Set(['school-children', 'school-youth', 'school-young', 'school-bible']),
    []
  )
  const isDeptGroupPage = selectedId === 'ministry-dept'
  const selectedPagePhotos = useMemo(
    () => galleryItems.filter(item => item.dept === selectedPage?.dept),
    [galleryItems, selectedPage]
  )
  const selectedPageVideos = useMemo(
    () => videoItems.filter(item => item.dept === selectedPage?.dept),
    [selectedPage, videoItems]
  )

  useEffect(() => {
    if (!selectedId || !selectedPage) return

    let active = true

    async function fetchContent() {
      setLoading(true)
      try {
        const snapshot = await getDoc(doc(db, 'pageContents', selectedId))
        if (!active) return
        setPageState(normalizePageState(selectedPage, snapshot.exists() ? snapshot.data() : null))
      } catch (error) {
        console.error(error)
        if (active) setPageState(createDefaultPageState(selectedPage))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchContent()
    return () => { active = false }
  }, [selectedId, selectedPage])

  const handleSave = async () => {
    if (!selectedPage) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'pageContents', selectedPage.id), {
        label: selectedPage.label,
        heroTitle: pageState.heroTitle,
        heroSubtitle: pageState.heroSubtitle,
        heroImage: pageState.heroImage,
        blocks: pageState.blocks,
        deptGroups: pageState.deptGroups || [],
        updatedAt: serverTimestamp(),
      }, { merge: true })
      window.dispatchEvent(new Event('admin:changes-saved'))
      alert('저장되었습니다.')
    } catch (error) {
      alert(`저장 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleBlockChange = (index, key, value) => {
    setPageState(current => ({
      ...current,
      blocks: current.blocks.map((block, blockIndex) => (
        blockIndex === index ? { ...block, [key]: value } : block
      )),
    }))
  }

  const handleBlockRemove = (index) => {
    setPageState(current => ({ ...current, blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index) }))
    if (pageState.blocks[index]?.id === editingBlockId) {
      setEditingBlockId(null)
    }
  }

  const handleBlockAdd = () => {
    setPageState(current => ({
      ...current,
      blocks: [...current.blocks, createBlock(newBlockType, current.blocks.length)],
    }))
  }

  const handleHeroFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedPage) return
    const err = validateImageFile(file)
    if (err) { alert(err); event.target.value = ''; return }

    setUploadingHero(true)
    try {
      const storageRef = ref(storage, `page-content/${selectedPage.id}/hero-${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(storageRef)
      setPageState(current => ({ ...current, heroImage: downloadUrl }))
    } catch (error) {
      alert(`이미지 업로드 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setUploadingHero(false)
      if (heroFileRef.current) heroFileRef.current.value = ''
    }
  }

  const handleDragStart = (blockId) => {
    setDraggingBlockId(blockId)
  }

  const handleDrop = (targetBlockId) => {
    if (!draggingBlockId || draggingBlockId === targetBlockId) {
      setDraggingBlockId(null)
      return
    }

    setPageState(current => {
      const fromIndex = current.blocks.findIndex(block => block.id === draggingBlockId)
      const toIndex = current.blocks.findIndex(block => block.id === targetBlockId)
      if (fromIndex === -1 || toIndex === -1) return current
      return { ...current, blocks: moveItem(current.blocks, fromIndex, toIndex) }
    })

    setDraggingBlockId(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f2040' }}>{title}</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>{description}</p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>{selectedPage?.label || '페이지 선택'}</p>
          <p style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: '2px' }}>
            {loading ? '페이지를 불러오는 중입니다.' : '수정한 내용을 바로 저장할 수 있습니다.'}
          </p>
        </div>
        <button onClick={handleSave} disabled={loading || saving} style={{ padding: '11px 18px', borderRadius: '10px', border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          {saving ? '저장 중...' : '페이지 저장'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        <aside style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '12px' }}>편집 페이지</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pages.map(page => {
              const active = page.id === selectedId
              return (
                <button
                  key={page.id}
                  onClick={() => setSelectedId(page.id)}
                  style={{
                    textAlign: 'left',
                    borderRadius: '12px',
                    border: active ? '1px solid #1d4ed8' : '1px solid #e5e7eb',
                    background: active ? '#eff6ff' : '#fff',
                    padding: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2040', marginBottom: '4px' }}>{page.label}</p>
                  <p style={{ fontSize: '0.76rem', color: '#6b7280', lineHeight: 1.5 }}>{page.description}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <section style={{ display: 'grid', gap: '18px' }}>
          <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>현재 편집 중</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{selectedPage?.label}</p>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#6b7280' }}>저장 버튼은 화면 상단에 고정되어 있습니다.</span>
            </div>

            {loading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {specialMinistryPageIds.has(selectedId) ? (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                    <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2040' }}>실제 {selectedPage?.label} 페이지 편집</p>
                        <p style={{ fontSize: '0.76rem', color: '#6b7280' }}>페이지 섹션을 그대로 눌러서 바로 수정합니다.</p>
                      </div>
                      <button
                        onClick={() => heroFileRef.current?.click()}
                        type="button"
                        style={{ padding: '9px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f2040', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {uploadingHero ? '업로드 중...' : '메인 이미지 변경'}
                      </button>
                      <input ref={heroFileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleHeroFileChange} style={{ display: 'none' }} />
                    </div>
                    <div style={{ padding: '20px' }}>
                      <MenPageContent
                        pageState={pageState}
                        pageId={selectedId}
                        photos={selectedPagePhotos}
                        editable
                        activeSection={editingBlockId}
                        onSectionClick={setEditingBlockId}
                        onHeroChange={(key, value) => setPageState(current => ({ ...current, [key]: value }))}
                        onBlockChange={(blockId, key, value) => {
                          if (key === '__delete__') {
                            setPageState(current => ({
                              ...current,
                              blocks: current.blocks.filter(block => block.id !== blockId),
                            }))
                            if (editingBlockId === blockId) setEditingBlockId(null)
                            return
                          }
                          setPageState(current => ({
                            ...current,
                            blocks: current.blocks.map(block => (
                              block.id === blockId ? { ...block, [key]: value } : block
                            )),
                          }))
                        }}
                        onAddBlock={(type) => {
                          const nextBlock = createBlock(type, pageState.blocks.length)
                          if (type === 'info') {
                            nextBlock.title = '모임 안내'
                          }
                          if (type === 'note') {
                            nextBlock.title = '추가 안내'
                          }
                          setPageState(current => ({
                            ...current,
                            blocks: [...current.blocks, nextBlock],
                          }))
                          setEditingBlockId(nextBlock.id)
                        }}
                      />
                    </div>
                  </div>
                ) : specialSchoolPageIds.has(selectedId) ? (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                    <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2040' }}>실제 {selectedPage?.label} 페이지 편집</p>
                        <p style={{ fontSize: '0.76rem', color: '#6b7280' }}>소개, 안내, 주요활동, 연간일정 구조를 그대로 눌러서 수정합니다.</p>
                      </div>
                      <button
                        onClick={() => heroFileRef.current?.click()}
                        type="button"
                        style={{ padding: '9px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f2040', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {uploadingHero ? '업로드 중...' : '메인 이미지 변경'}
                      </button>
                      <input ref={heroFileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleHeroFileChange} style={{ display: 'none' }} />
                    </div>
                    <div style={{ padding: '20px' }}>
                      <SchoolPageContent
                        pageState={pageState}
                        pageId={selectedId}
                        photos={selectedPagePhotos}
                        videos={selectedPageVideos}
                        editable
                        activeSection={editingBlockId}
                        onSectionClick={setEditingBlockId}
                        onHeroChange={(key, value) => setPageState(current => ({ ...current, [key]: value }))}
                        onBlockChange={(blockId, key, value) => {
                          if (key === '__delete__') {
                            setPageState(current => ({
                              ...current,
                              blocks: current.blocks.filter(block => block.id !== blockId),
                            }))
                            if (editingBlockId === blockId) setEditingBlockId(null)
                            return
                          }
                          setPageState(current => ({
                            ...current,
                            blocks: current.blocks.map(block => (
                              block.id === blockId ? { ...block, [key]: value } : block
                            )),
                          }))
                        }}
                        onAddBlock={(type) => {
                          const nextBlock = createBlock(type, pageState.blocks.length)
                          if (type === 'info') nextBlock.title = selectedId === 'school-bible' ? '강의 안내' : '예배 안내'
                          if (type === 'note') nextBlock.title = '주요 활동'
                          if (type === 'list') {
                            nextBlock.title = '연간일정'
                            nextBlock.itemsText = SCHOOL_SCHEDULE_TEMPLATE
                          }
                          if (type === 'people') nextBlock.title = '임원 현황'
                          setPageState(current => ({
                            ...current,
                            blocks: [...current.blocks, nextBlock],
                          }))
                          setEditingBlockId(nextBlock.id)
                        }}
                      />
                    </div>
                  </div>
                ) : isDeptGroupPage ? (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                    <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2040' }}>실제 부서별 페이지 편집</p>
                        <p style={{ fontSize: '0.76rem', color: '#6b7280' }}>전도부, 제직회, 재정부 카드를 그대로 눌러서 바로 수정합니다.</p>
                      </div>
                      <button
                        onClick={() => heroFileRef.current?.click()}
                        type="button"
                        style={{ padding: '9px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f2040', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {uploadingHero ? '업로드 중...' : '메인 이미지 변경'}
                      </button>
                      <input ref={heroFileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleHeroFileChange} style={{ display: 'none' }} />
                    </div>
                    <div style={{ padding: '20px' }}>
                      <DeptPageContent
                        pageState={pageState}
                        editable
                        activeSection={editingBlockId}
                        onSectionClick={setEditingBlockId}
                        onHeroChange={(key, value) => setPageState(current => ({ ...current, [key]: value }))}
                        onGroupChange={(groupId, key, value) => {
                          setPageState(current => ({
                            ...current,
                            deptGroups: (current.deptGroups || []).map(group => (
                              group.id === groupId ? { ...group, [key]: value } : group
                            )),
                          }))
                        }}
                        onGroupAdd={() => {
                          const nextIndex = (pageState.deptGroups || []).length + 1
                          const nextGroup = {
                            id: `dept-extra-${Date.now()}`,
                            dept: `부서 ${nextIndex}`,
                            title: `부서 ${nextIndex}`,
                            color: deptGroupColorPalette[(nextIndex - 1) % deptGroupColorPalette.length],
                            verse: '',
                            desc: '',
                            schedulesText: '',
                          }
                          setPageState(current => ({
                            ...current,
                            deptGroups: [...(current.deptGroups || []), nextGroup],
                          }))
                          setEditingBlockId(nextGroup.id)
                        }}
                        onGroupDelete={(groupId) => {
                          setPageState(current => ({
                            ...current,
                            deptGroups: (current.deptGroups || []).filter(group => group.id !== groupId),
                          }))
                          if (editingBlockId === groupId) setEditingBlockId(null)
                        }}
                      />
                    </div>
                  </div>
                ) : (
                <>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2040' }}>상단 메인 섹션</p>
                    <p style={{ fontSize: '0.76rem', color: '#6b7280' }}>홈페이지 첫 화면처럼 보이는 영역에서 바로 수정합니다.</p>
                  </div>
                  <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', minHeight: '220px', background: '#0f172a' }}>
                      {pageState.heroImage ? (
                        <img src={pageState.heroImage} alt="" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block', opacity: 0.7 }} />
                      ) : (
                        <div style={{ height: '220px', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.82), rgba(15,23,42,0.2))' }} />
                      <div style={{ position: 'absolute', left: '24px', right: '24px', bottom: '24px' }}>
                        <input
                          value={pageState.heroTitle}
                          onChange={event => setPageState(current => ({ ...current, heroTitle: event.target.value }))}
                          placeholder="메인 제목"
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px', outline: 'none' }}
                        />
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          <textarea
                            value={pageState.heroSubtitle}
                            onChange={event => setPageState(current => ({ ...current, heroSubtitle: event.target.value }))}
                            placeholder="메인 설명"
                            rows={3}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.82)', outline: 'none', resize: 'none', lineHeight: 1.7 }}
                          />
                        </p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => heroFileRef.current?.click()}
                            type="button"
                            style={{ padding: '9px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {uploadingHero ? '업로드 중...' : '메인 이미지 변경'}
                          </button>
                          <input ref={heroFileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleHeroFileChange} style={{ display: 'none' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                  <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2040' }}>블록 조립</p>
                    <p style={{ fontSize: '0.76rem', color: '#6b7280' }}>블록을 추가하고 순서를 바꾸면 공개 화면도 같은 순서로 렌더링할 수 있습니다.</p>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={newBlockType} onChange={event => setNewBlockType(event.target.value)} style={{ ...inputStyle, width: '220px' }}>
                      {blockTemplates.map(template => (
                        <option key={template.type} value={template.type}>{template.label}</option>
                      ))}
                    </select>
                    <button onClick={handleBlockAdd} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#0f2040', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                      블록 추가
                    </button>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>섹션 카드를 드래그해서 순서를 바꿀 수 있습니다.</span>
                  </div>
                </div>

                {pageState.blocks.length === 0 ? (
                  <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    아직 블록이 없습니다. 필요한 섹션을 추가하세요.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {pageState.blocks.map((block, index) => {
                      const isEditing = editingBlockId === block.id
                      const template = blockTemplates.find(item => item.type === block.type)
                      return (
                        <div
                          key={block.id}
                          draggable
                          onDragStart={() => handleDragStart(block.id)}
                          onDragOver={event => event.preventDefault()}
                          onDrop={() => handleDrop(block.id)}
                          style={{
                            borderRadius: '18px',
                            border: draggingBlockId === block.id ? '2px dashed #1d4ed8' : '1px solid #e5e7eb',
                            background: '#fff',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ cursor: 'grab', fontSize: '1rem', color: '#94a3b8' }}>⋮⋮</span>
                              <div>
                                <p style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f2040' }}>{template?.label || block.type}</p>
                                <p style={{ fontSize: '0.74rem', color: '#6b7280' }}>{template?.description}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.76rem', color: '#64748b', alignSelf: 'center' }}>
                                섹션을 누르면 바로 수정됩니다
                              </span>
                              <button
                                onClick={() => handleBlockRemove(index)}
                                style={{ padding: '7px 12px', borderRadius: '999px', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          <div style={{ padding: '18px', display: 'grid', gap: '14px' }}>
                            <div
                              onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                              style={{ cursor: 'text' }}
                            >
                              <PreviewBlock block={block} />
                            </div>

                            {isEditing && (
                              <div style={{ display: 'grid', gap: '12px', padding: '16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                                <label style={{ display: 'grid', gap: '6px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>섹션 제목</span>
                                  <input value={block.title} onChange={event => handleBlockChange(index, 'title', event.target.value)} style={inputStyle} placeholder="섹션 제목" />
                                </label>
                                <label style={{ display: 'grid', gap: '6px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>보조 문구</span>
                                  <input value={block.subtitle} onChange={event => handleBlockChange(index, 'subtitle', event.target.value)} style={inputStyle} placeholder="짧은 설명, 성구, 담당자 등" />
                                </label>
                                <label style={{ display: 'grid', gap: '6px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>본문</span>
                                  <textarea value={block.body} onChange={event => handleBlockChange(index, 'body', event.target.value)} style={textAreaStyle} rows={5} placeholder="문단 내용을 입력하세요." />
                                </label>
                                <label style={{ display: 'grid', gap: '6px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>목록 항목</span>
                                  <textarea value={block.itemsText} onChange={event => handleBlockChange(index, 'itemsText', event.target.value)} style={textAreaStyle} rows={5} placeholder="한 줄에 하나씩 입력하세요." />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
