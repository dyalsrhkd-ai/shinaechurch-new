import { useEffect, useState } from 'react'
import { collection, getDocs, query } from 'firebase/firestore'
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

const GROUP_COLORS = {
  '담임목사': '#1d4ed8',
  '교역자':   '#0369a1',
  '시무장로': '#7c3aed',
  '안수집사': '#059669',
}
const DEFAULT_COLOR = '#64748b'

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'staff')))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (a.groupOrder ?? 99) - (b.groupOrder ?? 99) || (a.order ?? 0) - (b.order ?? 0))
        setStaff(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 그룹별로 묶기
  const grouped = staff.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = []
    acc[m.group].push(m)
    return acc
  }, {})

  const groupOrder = Object.keys(grouped).sort((a, b) => {
    const ao = grouped[a][0]?.groupOrder ?? 99
    const bo = grouped[b][0]?.groupOrder ?? 99
    return ao - bo
  })

  return (
    <SubLayout section="교회 소개" menus={menus} title="섬기는 사람들">
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {groupOrder.map(groupName => {
            const color = GROUP_COLORS[groupName] ?? DEFAULT_COLOR
            return (
              <div key={groupName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '4px', height: '24px', background: color, borderRadius: '4px' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040' }}>{groupName}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                  {grouped[groupName].map(m => (
                    <div
                      key={m.id}
                      style={{ background: '#f6f8fb', borderRadius: '14px', overflow: 'hidden', border: '1px solid #eaecf0', transition: 'box-shadow 0.2s, transform 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#e8edf5', overflow: 'hidden' }}>
                        {m.imgUrl ? (
                          <img
                            src={m.imgUrl}
                            alt={m.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                          />
                        ) : null}
                        <div style={{ display: m.imgUrl ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#e8edf5', position: m.imgUrl ? 'absolute' : 'static', inset: 0 }}>
                          <svg width="36" height="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '3px' }}>{m.name}</p>
                        <p style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SubLayout>
  )
}
