import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '인사말',        path: '/intro/greeting' },
  { label: '교회 연혁',     path: '/intro/history' },
  { label: '섬기는 사람들', path: '/intro/staff' },
  { label: '교회 연간 일정', path: '/intro/schedule' },
  { label: '예배 안내',     path: '/intro/worship' },
  { label: '오시는길',      path: '/intro/location' },
  { label: '교회시설물 안내', path: '/intro/facility' },
]

const FALLBACK_PHOTO = '/images/corp_new/mem8.jpg'

export default function Greeting() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'greeting', 'main'))
      .then(snap => { if (snap.exists()) setData(snap.data()) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <SubLayout section="교회 소개" menus={menus} title="인사말">
      <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
    </SubLayout>
  )

  const photoUrl = data?.photoUrl || FALLBACK_PHOTO
  const name = data?.name || '우용녀'
  const nameTitle = data?.nameTitle || '목사'
  const role = data?.role || '신애교회 담임목사'
  const greetingTitle = data?.greetingTitle || '신애교회에 오신 것을\n주님의 이름으로 환영합니다.'
  const paragraphs = data?.paragraphs || []
  const signatureRole = data?.signatureRole || ''
  const signatureName = data?.signatureName || ''
  const visions = data?.visions || []

  return (
    <SubLayout section="교회 소개" menus={menus} title="인사말">
      {/* 목사 사진 + 인사말 */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 사진 */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: '200px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eaecf0', background: '#f6f8fb' }}>
            <img
              src={photoUrl}
              alt={`${name} ${nameTitle}`}
              style={{ width: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.src = FALLBACK_PHOTO }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0f2040' }}>{name} {nameTitle}</p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>{role}</p>
          </div>
        </div>

        {/* 인사 글 */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ borderLeft: '4px solid #1d4ed8', paddingLeft: '20px', marginBottom: '28px' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f2040', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {greetingTitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', color: '#374151', lineHeight: 1.9 }}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {(signatureRole || signatureName) && (
            <div style={{ marginTop: '36px', textAlign: 'right' }}>
              {signatureRole && <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>{signatureRole}</p>}
              {signatureName && <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f2040', fontFamily: 'serif' }}>{signatureName}</p>}
            </div>
          )}
        </div>
      </div>

      {/* 교회 비전 */}
      {visions.length > 0 && (
        <div style={{ marginTop: '48px', borderTop: '1px solid #f0f2f5', paddingTop: '40px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2040', marginBottom: '24px' }}>교회 비전</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {visions.map((v, i) => (
              <div key={i} style={{ background: '#f6f8fb', borderRadius: '12px', padding: '24px 20px', borderTop: '3px solid #1d4ed8' }}>
                <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2040', marginBottom: '8px' }}>{v.label}</p>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SubLayout>
  )
}
