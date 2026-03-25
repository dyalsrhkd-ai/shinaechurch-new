import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '인사말',          path: '/intro/greeting' },
  { label: '교회 연혁',       path: '/intro/history' },
  { label: '섬기는 사람들',   path: '/intro/staff' },
  { label: '교회 연간 일정',  path: '/intro/schedule' },
  { label: '예배 안내',       path: '/intro/worship' },
  { label: '오시는길',        path: '/intro/location' },
  { label: '교회시설물 안내', path: '/intro/facility' },
]

const MONTH_COLORS = [
  '#1d4ed8','#0369a1','#7c3aed','#059669',
  '#dc2626','#d97706','#0891b2','#65a30d',
  '#9333ea','#e11d48','#0284c7','#16a34a',
]

export default function Schedule() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'schedule', 'main'))
      .then(snap => { if (snap.exists()) setData(snap.data()) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggle = (i) => setOpenIndex(prev => prev === i ? null : i)

  if (loading) return (
    <SubLayout section="교회 소개" menus={menus} title="교회 연간 일정">
      <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
    </SubLayout>
  )

  const months = data?.months || []

  return (
    <SubLayout section="교회 소개" menus={menus} title="교회 연간 일정">
      <div>
        {/* 표어 */}
        {data?.motto && (
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', borderLeft: '4px solid #1d4ed8' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.1em', marginBottom: '6px' }}>{data.year}년 표어</p>
            <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2040' }}>{data.motto}</p>
          </div>
        )}

        {/* 월별 아코디언 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {months.map((m, i) => {
            const color = MONTH_COLORS[i] ?? '#1d4ed8'
            const isOpen = openIndex === i
            const hasEvents = m.events?.length > 0

            return (
              <div
                key={m.month}
                onClick={() => hasEvents && toggle(i)}
                style={{
                  borderRadius: '14px',
                  border: `1.5px solid ${isOpen ? color : '#eaecf0'}`,
                  background: isOpen ? '#fff' : '#f6f8fb',
                  overflow: 'hidden',
                  cursor: hasEvents ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: isOpen ? `0 8px 24px ${color}22` : 'none',
                  gridColumn: isOpen ? 'span 3' : 'span 1',
                }}
              >
                {/* 월 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isOpen ? '18px 24px' : '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: isOpen ? '48px' : '40px',
                      height: isOpen ? '48px' : '40px',
                      borderRadius: '12px',
                      background: isOpen ? color : `${color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: isOpen ? '0.9rem' : '0.78rem', fontWeight: 900, color: isOpen ? '#fff' : color, transition: 'all 0.2s' }}>
                        {m.month}
                      </span>
                    </div>
                    {!isOpen && hasEvents && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {m.events.length}개 일정
                      </span>
                    )}
                    {!isOpen && !hasEvents && (
                      <span style={{ fontSize: '0.75rem', color: '#c9d0db' }}>일정 없음</span>
                    )}
                    {isOpen && (
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>
                        {m.month} 일정
                      </span>
                    )}
                  </div>
                  {hasEvents && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isOpen ? `${color}15` : '#eaecf0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.25s, background 0.2s',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}>
                      <svg width="12" height="12" fill="none" stroke={isOpen ? color : '#9ca3af'} strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* 펼쳐진 일정 목록 */}
                {isOpen && (
                  <div style={{ padding: '0 24px 20px', borderTop: `1px solid ${color}20` }}>
                    <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginTop: '16px' }}>
                      {m.events.map((ev, ei) => (
                        <li key={ei} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          background: `${color}08`, borderRadius: '10px',
                          padding: '12px 14px', border: `1px solid ${color}18`,
                        }}>
                          <span style={{ flexShrink: 0, width: '8px', height: '8px', borderRadius: '50%', background: color, marginTop: '5px' }} />
                          <span style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5, fontWeight: 500 }}>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
          * 일정은 교회 사정에 따라 변경될 수 있습니다. 자세한 내용은 주보 및 공지사항을 확인하세요.
        </p>
      </div>
    </SubLayout>
  )
}
