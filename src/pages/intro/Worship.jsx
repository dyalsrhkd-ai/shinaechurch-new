import { useEffect, useState } from 'react'
import { getContentDocument } from '../../api/contentApi'
import SubLayout from '../../components/SubLayout'
import { introMenus } from '../../data/siteMenus'

const menus = introMenus

function ServiceTable({ rows, color, headerBg }) {
  return (
    <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: headerBg, padding: '12px 20px' }}>
        {['예배', '시간', '장소'].map(h => (
          <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>{h}</span>
        ))}
      </div>
      {rows.map((w, i) => (
        <div
          key={i}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: '16px 20px',
            borderBottom: i < rows.length - 1 ? '1px solid #f0f2f5' : 'none',
            background: i % 2 === 0 ? '#fff' : '#fafbfc',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{w.name}</span>
          <span style={{ fontSize: '0.875rem', color, fontWeight: 600 }}>{w.time}</span>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{w.place}</span>
        </div>
      ))}
    </div>
  )
}

export default function Worship() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContentDocument('worship', 'main')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <SubLayout section="교회 소개" menus={menus} title="예배 안내">
      <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
    </SubLayout>
  )

  const mainServices = data?.mainServices || []
  const deptServices = data?.deptServices || []
  const notice = data?.notice || ''

  return (
    <SubLayout section="교회 소개" menus={menus} title="예배 안내">
      <div>
        {/* 표어 */}
        {(data?.year || data?.motto) && (
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', padding: '20px 24px', marginBottom: '40px', borderLeft: '4px solid #1d4ed8' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '6px' }}>{data.year}년 표어</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2040' }}>{data.motto}</p>
          </div>
        )}

        {/* 주요 예배 */}
        {mainServices.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
              주요 예배
            </h3>
            <ServiceTable rows={mainServices} color="#1d4ed8" headerBg="#0f2040" />
          </div>
        )}

        {/* 부서 예배 */}
        {deptServices.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#7c3aed', borderRadius: '4px' }} />
              부서 예배
            </h3>
            <ServiceTable rows={deptServices} color="#7c3aed" headerBg="#4c1d95" />
          </div>
        )}

        {/* 안내 문구 */}
        {notice && (
          <div style={{ marginTop: '8px', background: '#f6f8fb', borderRadius: '12px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{notice}</p>
          </div>
        )}
      </div>
    </SubLayout>
  )
}
