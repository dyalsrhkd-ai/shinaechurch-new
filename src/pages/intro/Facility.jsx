import { useEffect, useMemo, useState } from 'react'
import { getContentDocument } from '../../api/contentApi'
import SubLayout from '../../components/SubLayout'
import { introMenus } from '../../data/siteMenus'

const BUILDING_ICONS = [
  <svg key="main" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 2L3 9v12h6v-7h6v7h6V9L12 2z" strokeLinejoin="round" />
  </svg>,
  <svg key="annex" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>,
  <svg key="hall" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
  </svg>,
  <svg key="tree" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 2l4 7H8l4-7z" />
    <rect x="10" y="9" width="4" height="13" rx="1" />
  </svg>,
]

export default function Facility() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    getContentDocument('facility', 'main')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const buildings = useMemo(() => data?.buildings || [], [data])

  const photos = data?.photos || []
  const heroUrl = data?.heroImageUrl || ''

  if (loading) {
    return (
      <SubLayout section="교회 소개" menus={introMenus} title="교회시설물 안내">
        <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
      </SubLayout>
    )
  }

  return (
    <SubLayout section="교회 소개" menus={introMenus} title="교회시설물 안내">
      <div>
        {heroUrl && (
          <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '36px', border: '1px solid #eaecf0' }}>
            <img
              src={heroUrl}
              alt="신애교회 전경"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {buildings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
            {buildings.map((building, buildingIndex) => (
              <div key={`${building.name}-${buildingIndex}`} style={{ border: '1px solid #eaecf0', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: building.color || '#0f2040',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#fff',
                  }}
                >
                  <div style={{ opacity: 0.9 }}>{BUILDING_ICONS[buildingIndex % BUILDING_ICONS.length]}</div>
                  <h3 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{building.name}</h3>
                </div>

                {(building.floors || []).map((floor, floorIndex) => (
                  <div
                    key={`${building.name}-${floor.floor || floorIndex}`}
                    style={{
                      display: 'flex',
                      borderBottom: floorIndex < building.floors.length - 1 ? '1px solid #f0f2f5' : 'none',
                    }}
                  >
                    {floor.floor && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: '72px',
                          padding: '14px 16px',
                          background: '#f6f8fb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRight: '1px solid #f0f2f5',
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: building.color || '#1d4ed8' }}>
                          {floor.floor}
                        </span>
                      </div>
                    )}

                    <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {(floor.rooms || []).map((room, roomIndex) => (
                        <span
                          key={`${building.name}-${floor.floor || floorIndex}-${roomIndex}`}
                          style={{
                            fontSize: '0.8rem',
                            color: '#374151',
                            background: '#f0f2f5',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontWeight: 500,
                          }}
                        >
                          {room}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '36px' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#0f2040',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '4px', height: '20px', background: '#1d4ed8', borderRadius: '4px' }} />
              시설 사진
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              {photos.map((photo, index) => (
                <button
                  key={`${photo.label}-${index}`}
                  type="button"
                  onClick={() => setLightbox(index)}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid #eaecf0',
                    padding: 0,
                    background: 'transparent',
                  }}
                >
                  <img src={photo.url} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px 12px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>{photo.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox !== null && photos[lightbox] && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div onClick={event => event.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <img src={photos[lightbox].url} alt={photos[lightbox].label} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />

            <div style={{ position: 'absolute', bottom: '-36px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{photos[lightbox].label}</span>
            </div>

            {lightbox > 0 && (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  setLightbox(lightbox - 1)
                }}
                style={{
                  position: 'absolute',
                  left: '-52px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ‹
              </button>
            )}

            {lightbox < photos.length - 1 && (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  setLightbox(lightbox + 1)
                }}
                style={{
                  position: 'absolute',
                  right: '-52px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ›
              </button>
            )}

            <button
              type="button"
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute',
                top: '-44px',
                right: 0,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
