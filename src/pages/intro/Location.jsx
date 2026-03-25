import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import SubLayout from '../../components/SubLayout'
import { useSettings } from '../../contexts/SettingsContext'
import MapPlaceholderNotice from '../../components/ui/MapPlaceholderNotice'
import { SkeletonBlock, SkeletonCard } from '../../components/ui/Skeleton'

const menus = [
  { label: '인사말',         path: '/intro/greeting' },
  { label: '교회 연혁',      path: '/intro/history' },
  { label: '섬기는 사람들',  path: '/intro/staff' },
  { label: '교회 연간 일정', path: '/intro/schedule' },
  { label: '예배 안내',      path: '/intro/worship' },
  { label: '오시는길',       path: '/intro/location' },
  { label: '교회시설물 안내', path: '/intro/facility' },
]

export default function Location() {
  const { address, phone } = useSettings()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'location', 'main'))
      .then(snap => { if (snap.exists()) setData(snap.data()) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <SubLayout section="교회 소개" menus={menus} title="오시는길">
      <div style={{ display: 'grid', gap: '20px' }}>
        <SkeletonCard style={{ height: '440px', padding: '0' }}>
          <SkeletonBlock width="100%" height="100%" radius="0" />
        </SkeletonCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {Array.from({ length: 2 }, (_, i) => (
            <SkeletonCard key={i} style={{ padding: '20px', display: 'grid', gap: '10px' }}>
              <SkeletonBlock width="42px" height="42px" radius="10px" />
              <SkeletonBlock width="80px" height="12px" />
              <SkeletonBlock width="85%" height="16px" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </SubLayout>
  )

  const kakaoMapUrl = data?.kakaoMapUrl || 'https://map.kakao.com/link/search/경기도 의왕시 왕곡로 187번지'
  const naverMapUrl = data?.naverMapUrl || ''
  const mapEmbedUrl = data?.mapEmbedUrl || ''
  const transportSections = data?.transportSections || []

  return (
    <SubLayout section="교회 소개" menus={menus} title="오시는길">
      <div>
        {/* 지도 */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', border: '1px solid #eaecf0', height: '440px' }}>
          {mapEmbedUrl ? (
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="440"
              style={{ border: 'none', display: 'block' }}
              allowFullScreen
              loading="lazy"
              title="교회 위치"
            />
          ) : (
            <MapPlaceholderNotice />
          )}
        </div>

        {/* 주소 정보 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {[
            {
              icon: (
                <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                </svg>
              ),
              label: '도로명 주소',
              value: address,
            },
            {
              icon: (
                <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.12 9.13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              ),
              label: '전화',
              value: phone,
            },
          ].map((item, i) => (
            <div key={i} style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start', border: '1px solid #eaecf0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f2040' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 교통 안내 */}
        {transportSections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f2040', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
              교통 안내
            </h3>

            {transportSections.map((sec, i) => (
              <div key={i} style={{ background: '#f6f8fb', borderRadius: '12px', padding: '20px', border: '1px solid #eaecf0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ background: sec.lineColor || '#1d63c0', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px' }}>
                    {sec.lineName}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040' }}>{sec.stationInfo}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(sec.routes || []).map((r, ri) => (
                    <li key={ri} style={{ display: 'flex', gap: '10px', fontSize: '0.82rem', color: '#374151', lineHeight: 1.7 }}>
                      <span style={{ flexShrink: 0, color: '#9ca3af' }}>·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {(kakaoMapUrl || naverMapUrl) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {kakaoMapUrl ? (
                  <a href={kakaoMapUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#FEE500', color: '#1a1a1a', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', alignSelf: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1a1a"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    카카오맵으로 길찾기
                  </a>
                ) : null}
                {naverMapUrl ? (
                  <a href={naverMapUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#03c75a', color: '#fff', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', alignSelf: 'flex-start' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>N</span>
                    네이버지도로 길찾기
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </SubLayout>
  )
}
