import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import SubLayout from '../../components/SubLayout'
import { useSettings } from '../../contexts/SettingsContext'
import {
  LIVE_STREAM_CATEGORIES,
  LIVE_STREAM_CATEGORY_MAP,
  extractYoutubeVideoId,
} from '../../utils/liveStream'

const menus = LIVE_STREAM_CATEGORIES.map(({ label, path }) => ({ label, path }))

function PasswordGate({ label, onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  return (
    <section style={{ maxWidth: '560px', margin: '0 auto', borderRadius: '24px', border: '1px solid #dbe4f0', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', padding: '32px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontSize: '0.95rem', fontWeight: 900, marginBottom: '20px' }}>
        입장
      </div>
      <p style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', color: '#2563eb', marginBottom: '12px' }}>
        비공개 입장
      </p>
      <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
        {label} 라이브 영상은 비밀번호를 입력해야 볼 수 있습니다.
      </h2>
      <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: '#475569', marginBottom: '22px' }}>
        카카오톡이나 문자로 전달받은 전용 링크가 있으면 바로 입장할 수 있고, 일반 주소로 들어온 경우에는 비밀번호를 입력해야 합니다.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          const success = onUnlock(input)
          if (success) {
            setError('')
            setInput('')
            return
          }

          setError('비밀번호가 올바르지 않습니다.')
        }}
        style={{ display: 'grid', gap: '14px' }}
      >
        <input
          type="password"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            if (error) setError('')
          }}
          placeholder={`${label} 비밀번호 입력`}
          style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: error ? '1px solid #fca5a5' : '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
        />
        {error ? <p style={{ margin: 0, fontSize: '0.82rem', color: '#dc2626', fontWeight: 700 }}>{error}</p> : null}
        <button type="submit" style={{ padding: '14px 18px', borderRadius: '14px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer' }}>
          라이브 영상 보기
        </button>
      </form>
    </section>
  )
}

function getAccessParam(location) {
  const directParam = new URLSearchParams(location.search).get('access')?.trim()
  if (directParam) return directParam

  if (typeof window !== 'undefined') {
    const rawHash = window.location.hash || ''
    const hashQuery = rawHash.includes('?') ? rawHash.slice(rawHash.indexOf('?') + 1) : ''
    const hashParam = new URLSearchParams(hashQuery).get('access')?.trim()
    if (hashParam) return hashParam
  }

  const fallbackHash = location.hash && location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?') + 1) : ''
  return new URLSearchParams(fallbackHash).get('access')?.trim() || ''
}

export default function Live() {
  const { streamKey = 'main' } = useParams()
  const location = useLocation()
  const { liveStreams } = useSettings()
  const category = LIVE_STREAM_CATEGORY_MAP[streamKey] || LIVE_STREAM_CATEGORY_MAP.main
  const stream = liveStreams?.[category.key] || liveStreams?.main || {}
  const password = String(stream.accessPassword || '').trim()
  const accessKey = String(stream.accessKey || '').trim()
  const accessParam = getAccessParam(location)

  const hasLinkAccess = Boolean(accessKey && accessParam && accessParam === accessKey)
  const [passwordPassed, setPasswordPassed] = useState(false)
  const hasAccess = hasLinkAccess || !password || passwordPassed

  const videoId = extractYoutubeVideoId(stream.youtubeUrl)
  const isLive = Boolean(stream.enabled && videoId)

  const handleUnlock = (value) => {
    const success = String(value || '') === password
    if (!success) return false

    setPasswordPassed(true)
    return true
  }

  return (
    <SubLayout section="라이브영상" menus={menus} title={category.label}>
      {!hasAccess ? (
        <PasswordGate label={category.label} onUnlock={handleUnlock} />
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          <section style={{ borderRadius: '22px', overflow: 'hidden', border: '1px solid #dbe4f0', background: '#0f172a' }}>
            {isLive ? (
              <>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                    title={stream.title || category.defaultTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', background: '#111827' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.18)', color: '#fecaca', fontSize: '0.75rem', fontWeight: 800, marginBottom: '10px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#ef4444' }} />
                      현재 송출 중
                    </div>
                    <p style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800 }}>{stream.title || category.defaultTitle}</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '0.84rem', lineHeight: 1.7, maxWidth: '460px' }}>
                    방송 설정에 저장된 유튜브 라이브 영상을 이 페이지에서 바로 시청할 수 있습니다.
                  </p>
                </div>
              </>
            ) : (
              <div style={{ padding: '72px 24px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#fff', fontSize: '0.95rem', fontWeight: 900 }}>
                  대기
                </div>
                <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>현재 송출 중인 영상이 없습니다.</p>
                <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto' }}>
                  예배 시작 전에 관리자 페이지에서 {category.label} 영상을 저장하고 송출 시작을 눌러 주세요.
                </p>
              </div>
            )}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            <div style={{ borderRadius: '18px', border: '1px solid #e5e7eb', background: '#fff', padding: '20px 22px' }}>
              <p style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', marginBottom: '8px' }}>설교제목</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stream.sermonTitle || '-'}</p>
            </div>
            <div style={{ borderRadius: '18px', border: '1px solid #e5e7eb', background: '#fff', padding: '20px 22px' }}>
              <p style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', marginBottom: '8px' }}>오늘의 본문말씀</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stream.scriptureTitle || '-'}</p>
            </div>
          </section>
        </div>
      )}
    </SubLayout>
  )
}
