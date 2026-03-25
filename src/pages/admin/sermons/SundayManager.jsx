import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase'
import { extractYoutubeId, getYoutubeThumb } from '../../../data/media'

const PER_PAGE = 15

export default function SundayManager() {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ title: '', ref: '', date: '', youtubeId: '' })

  const fetchSermons = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'sundaySermons'), orderBy('order', 'desc')))
      setSermons(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSermons() }, [])

  const paged = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(sermons.length / PER_PAGE))
    const safePage = Math.min(page, totalPages)
    return { totalPages, safePage, items: sermons.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE) }
  }, [page, sermons])

  const handleAdd = async () => {
    if (!form.title.trim()) return alert('제목을 입력하세요')
    if (!form.youtubeId.trim()) return alert('YouTube ID 또는 URL을 입력하세요')
    setSaving(true)
    try {
      await addDoc(collection(db, 'sundaySermons'), {
        title: form.title.trim(),
        ref: form.ref.trim(),
        date: form.date.trim(),
        youtubeId: extractYoutubeId(form.youtubeId),
        order: Date.now(),
        createdAt: serverTimestamp(),
      })
      setForm({ title: '', ref: '', date: '', youtubeId: '' })
      await fetchSermons()
    } catch (e) {
      alert('오류: ' + e.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'sundaySermons', id))
    fetchSermons()
  }

  const previewId = form.youtubeId ? extractYoutubeId(form.youtubeId) : ''

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>주일설교 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>총 {sermons.length}개 설교</p>
      </div>

      {/* 등록 폼 */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '14px' }}>주일설교 등록</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="설교 제목 *"
            style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={form.ref}
            onChange={e => setForm(f => ({ ...f, ref: e.target.value }))}
            placeholder="성경 구절 (예: 요 3:16)"
            style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            placeholder="설교 날짜 (예: 2025.03.23)"
            style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }}
          />
          <input
            value={form.youtubeId}
            onChange={e => setForm(f => ({ ...f, youtubeId: e.target.value }))}
            placeholder="YouTube ID 또는 URL *"
            style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px' }}>
          {previewId && (
            <img
              src={getYoutubeThumb(previewId)}
              alt=""
              style={{ width: '140px', height: '79px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #fecaca', flexShrink: 0 }}
            />
          )}
          <button
            onClick={handleAdd}
            disabled={saving}
            style={{ padding: '10px 28px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            {saving ? '저장 중...' : '등록'}
          </button>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : sermons.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', border: '1px solid #eaecf0', borderRadius: '12px', background: '#fff' }}>
          등록된 주일설교가 없습니다.
        </div>
      ) : (
        <>
          <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 120px 80px', background: '#0f2040', padding: '10px 16px' }}>
              {['썸네일', '제목', '성경 구절', '날짜', ''].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
              ))}
            </div>
            {paged.items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 140px 120px 80px',
                  padding: '10px 16px', borderBottom: index < paged.items.length - 1 ? '1px solid #f0f2f5' : 'none',
                  background: index % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', gap: '8px',
                }}
              >
                <img src={getYoutubeThumb(item.youtubeId)} alt="" style={{ width: '70px', height: '39px', objectFit: 'cover', borderRadius: '4px' }} />
                <span style={{ fontSize: '0.82rem', color: '#0f2040', fontWeight: 500 }}>{item.title}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.ref || '-'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.date || '-'}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {Array.from({ length: paged.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem',
                  background: paged.safePage === p ? '#0f2040' : '#f3f4f6',
                  color: paged.safePage === p ? '#fff' : '#374151',
                  fontWeight: paged.safePage === p ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
