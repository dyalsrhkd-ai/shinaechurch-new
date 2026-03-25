import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
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

export default function History() {
  const [eras, setEras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(collection(db, 'history'))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        setEras(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <SubLayout section="교회 소개" menus={menus} title="교회 연혁">
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {eras.map(era => (
            <div key={era.id}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '4px', height: '28px', background: era.color, borderRadius: '4px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f2040' }}>{era.period}</h3>
              </div>

              <div style={{ borderLeft: `2px solid ${era.color}20`, marginLeft: '8px', paddingLeft: '28px', display: 'flex', flexDirection: 'column' }}>
                {(era.events || []).map((ev, i) => (
                  <div key={i} style={{ position: 'relative', paddingBottom: i < era.events.length - 1 ? '20px' : '0' }}>
                    <div style={{ position: 'absolute', left: '-36px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: era.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${era.color}40` }} />
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: era.color, fontFamily: 'monospace', paddingTop: '2px', minWidth: '90px' }}>
                        {ev.date}
                      </span>
                      <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.65 }}>{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SubLayout>
  )
}
