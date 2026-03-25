import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase'

export default function LocationManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [mapEmbedUrl, setMapEmbedUrl] = useState('')
  const [kakaoMapUrl, setKakaoMapUrl] = useState('')
  const [naverMapUrl, setNaverMapUrl] = useState('')
  const [transportSections, setTransportSections] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'location', 'main'))
      if (snap.exists()) {
        const d = snap.data()
        setMapEmbedUrl(d.mapEmbedUrl || '')
        setKakaoMapUrl(d.kakaoMapUrl || '')
        setNaverMapUrl(d.naverMapUrl || '')
        setTransportSections(d.transportSections || [])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'location', 'main'), {
        mapEmbedUrl: mapEmbedUrl.trim(),
        kakaoMapUrl: kakaoMapUrl.trim(),
        naverMapUrl: naverMapUrl.trim(),
        transportSections,
        updatedAt: serverTimestamp(),
      })
      await fetchData()
      window.dispatchEvent(new Event('admin:changes-saved'))
      alert('저장되었습니다.')
    } catch (e) { alert('오류: ' + e.message) }
    setSaving(false)
  }

  // 교통 섹션 CRUD
  const addSection = () =>
    setTransportSections(s => [...s, { lineName: '', lineColor: '#1d63c0', stationInfo: '', routes: [] }])
  const deleteSection = (i) =>
    setTransportSections(s => s.filter((_, idx) => idx !== i))
  const updateSection = (i, field, val) =>
    setTransportSections(s => s.map((x, idx) => idx === i ? { ...x, [field]: val } : x))

  const addRoute = (si) =>
    setTransportSections(s => s.map((x, idx) => idx === si ? { ...x, routes: [...x.routes, ''] } : x))
  const updateRoute = (si, ri, val) =>
    setTransportSections(s => s.map((x, idx) => idx === si
      ? { ...x, routes: x.routes.map((r, ri2) => ri2 === ri ? val : r) }
      : x))
  const deleteRoute = (si, ri) =>
    setTransportSections(s => s.map((x, idx) => idx === si
      ? { ...x, routes: x.routes.filter((_, ri2) => ri2 !== ri) }
      : x))

  const LINE_COLORS = ['#1d63c0', '#00a2e8', '#ef7c1c', '#00a650', '#996cac', '#cd7c2f', '#e51e24']

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>오시는 길 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>지도·카카오맵·교통안내 수정 · 주소·전화는 기본 정보에서 수정</p>
      </div>

      {/* ── 지도 embed URL ──────────────────────── */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '6px' }}>지도 embed URL</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '12px', lineHeight: 1.6 }}>
          Google Maps에서 장소 검색 → <b>공유</b> → <b>지도 퍼가기</b> → iframe 코드에서 <code style={{ background: '#e8edf5', padding: '1px 5px', borderRadius: '4px' }}>src="..."</code> 안의 URL만 붙여넣으세요.<br />
          비워두면 현재 기본 지도(Daum)가 그대로 표시됩니다.
        </p>
        <input
          value={mapEmbedUrl}
          onChange={e => setMapEmbedUrl(e.target.value)}
          placeholder="https://www.google.com/maps/embed?pb=..."
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
        />
        {/* 미리보기 */}
        {mapEmbedUrl && (
          <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eaecf0', height: '280px' }}>
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="280"
              style={{ border: 'none', display: 'block' }}
              allowFullScreen
              loading="lazy"
              title="지도 미리보기"
            />
          </div>
        )}
        <div style={{ marginTop: '14px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>카카오맵 길찾기 URL</label>
          <input value={kakaoMapUrl} onChange={e => setKakaoMapUrl(e.target.value)}
            placeholder="https://map.kakao.com/link/search/..."
            style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>네이버지도 길찾기 URL</label>
          <input value={naverMapUrl} onChange={e => setNaverMapUrl(e.target.value)}
            placeholder="https://map.naver.com/..."
            style={{ width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
        </div>
      </div>

      {/* ── 교통 안내 섹션 ──────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
            교통 안내
          </h3>
          <button onClick={addSection}
            style={{ fontSize: '0.82rem', color: '#1d4ed8', background: 'none', border: '1px dashed #1d4ed8', borderRadius: '7px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>
            + 노선 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transportSections.map((sec, si) => (
            <div key={si} style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
              {/* 노선 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #eaecf0', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '3px' }}>노선명</label>
                  <input value={sec.lineName} onChange={e => updateSection(si, 'lineName', e.target.value)}
                    placeholder="1호선"
                    style={{ width: '80px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: sec.lineColor }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '3px' }}>노선 색상</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {LINE_COLORS.map(c => (
                      <button key={c} onClick={() => updateSection(si, 'lineColor', c)}
                        style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: sec.lineColor === c ? '2px solid #0f2040' : '2px solid transparent', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '3px' }}>역/정류장 안내</label>
                  <input value={sec.stationInfo} onChange={e => updateSection(si, 'stationInfo', e.target.value)}
                    placeholder="의왕역 하차"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => deleteSection(si)}
                  style={{ flexShrink: 0, padding: '6px 12px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-end' }}>
                  노선 삭제
                </button>
              </div>

              {/* 버스 노선 목록 */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sec.routes.map((route, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ flexShrink: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{ri + 1}.</span>
                    <input value={route} onChange={e => updateRoute(si, ri, e.target.value)}
                      style={{ flex: 1, padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', lineHeight: 1.5 }} />
                    <button onClick={() => deleteRoute(si, ri)}
                      style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: 'none', color: '#dc2626', fontSize: '0.7rem', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addRoute(si)}
                  style={{ fontSize: '0.78rem', color: sec.lineColor || '#1d4ed8', background: 'none', border: `1px dashed ${sec.lineColor || '#1d4ed8'}`, borderRadius: '6px', padding: '6px', cursor: 'pointer', fontWeight: 700, marginTop: '4px' }}>
                  + 노선 경로 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 저장 ──────────────────────────────────── */}
      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '13px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
        {saving ? '저장 중...' : '전체 저장'}
      </button>
    </div>
  )
}
