import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { EVENT_DEPTS, extractYoutubeId } from '../../../data/media'
const PER_PAGE = 20


export default function VideoManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState('전체')
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', youtubeId: '', dept: '기타' })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'videos'), orderBy('order', 'desc'))
      const snap = await getDocs(q)
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const eventItems = items.filter(item => item.dept !== '성가대')
  const filtered = filterDept === '전체' ? eventItems : eventItems.filter(i => i.dept === filterDept)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleAdd = async () => {
    if (!form.title.trim()) return alert('제목을 입력하세요')
    if (!form.youtubeId.trim()) return alert('YouTube ID 또는 URL을 입력하세요')
    setSaving(true)
    try {
      const youtubeId = extractYoutubeId(form.youtubeId)
      await addDoc(collection(db, 'videos'), {
        title: form.title.trim(), youtubeId, dept: form.dept,
        order: Date.now(), createdAt: serverTimestamp(),
      })
      setForm({ title: '', youtubeId: '', dept: '기타' })
      await fetchItems()
    } catch (e) { alert('오류: ' + e.message) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'videos', id))
    fetchItems()
  }

  const handleDeptChange = async (id, dept) => {
    try {
      await updateDoc(doc(db, 'videos', id), { dept })
      setItems(current => current.map(item => item.id === id ? { ...item, dept } : item))
    } catch (e) {
      alert('오류: ' + e.message)
    }
  }

  const btn = (active, onClick, children) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 700 : 400,
      background: active ? '#0f2040' : '#f3f4f6', color: active ? '#fff' : '#374151'
    }}>{children}</button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>행사동영상 관리</h1>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>전체 {eventItems.length}개</p>
        </div>
      </div>

      {/* 등록 폼 */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>새 영상 등록</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>제목</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="영상 제목"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>YouTube ID 또는 URL</label>
            <input value={form.youtubeId} onChange={e => setForm(f => ({ ...f, youtubeId: e.target.value }))} placeholder="예: dQw4w9WgXcQ"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>부서</label>
            <select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
              style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }}>
              {EVENT_DEPTS.filter(d => d !== '전체').map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          {form.youtubeId && (
            <img src={`https://img.youtube.com/vi/${extractYoutubeId(form.youtubeId)}/mqdefault.jpg`} alt=""
              style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #fecaca' }} />
          )}
          <button onClick={handleAdd} disabled={saving}
            style={{ padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {saving ? '저장 중...' : '등록'}
          </button>
        </div>
      </div>

      {/* 부서 필터 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {EVENT_DEPTS.map(d => btn(filterDept === d, () => { setFilterDept(d); setPage(1) }, d))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>항목이 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 80px', background: '#0f2040', padding: '10px 16px' }}>
              {['썸네일', '제목', '부서', ''].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
              ))}
            </div>
            {slice.map((item, i) => (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 130px 80px',
                padding: '10px 16px', borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', gap: '8px'
              }}>
                <img src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`} alt=""
                  style={{ width: '70px', height: '39px', objectFit: 'cover', borderRadius: '4px' }} />
                <span style={{ fontSize: '0.82rem', color: '#0f2040', fontWeight: 500 }}>{item.title}</span>
                <select
                  value={item.dept}
                  onChange={(e) => handleDeptChange(item.id, e.target.value)}
                  style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.75rem', background: '#fff' }}
                >
                  {EVENT_DEPTS.filter(d => d !== '전체').map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={() => handleDelete(item.id)}
                  style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem',
                background: page === p ? '#0f2040' : '#f3f4f6', color: page === p ? '#fff' : '#374151', fontWeight: page === p ? 700 : 400
              }}>{p}</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
