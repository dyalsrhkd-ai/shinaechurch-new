import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import SubLayout from '../../components/SubLayout'
import { useSettings } from '../../contexts/SettingsContext'
import {
  LIVE_STREAM_CATEGORIES,
  LIVE_STREAM_CATEGORY_MAP,
  extractYoutubeVideoId,
} from '../../utils/liveStream'

const menus = LIVE_STREAM_CATEGORIES.map(({ label, path }) => ({ label, path }))

function getAccessKey(streamKey) {
  return `shinae_live_access_${streamKey}`
}

function InfoCard({ label, children }) {
  if (!children) return null

  return (
    <section style={{ borderRadius: '18px', border: '1px solid #e5e7eb', background: '#fff', padding: '24px' }}>
      <p style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
        {label}
      </p>
      <div style={{ fontSize: '0.97rem', lineHeight: 1.9, color: '#1f2937', whiteSpace: 'pre-line' }}>{children}</div>
    </section>
  )
}

function PasswordGate({ label, onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  return (
    <section style={{ maxWidth: '560px', margin: '0 auto', borderRadius: '24px', border: '1px solid #dbe4f0', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', padding: '32px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontSize: '0.95rem', fontWeight: 900, marginBottom: '20px' }}>
        방송
      </div>
      <p style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '12px' }}>
        비공개 입장
      </p>
      <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
        {label} 라이브는 비밀번호를 입력해야 볼 수 있습니다.
      </h2>
      <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: '#475569', marginBottom: '22px' }}>
        관리자에게 전달받은 비밀번호를 입력해 주세요. 부서마다 비밀번호가 다를 수 있습니다.
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
          라이브영상 입장
        </button>
      </form>
    </section>
  )
}

export default function Live() {
  const { streamKey = 'main' } = useParams()
  const { liveStreams } = useSettings()
  const category = LIVE_STREAM_CATEGORY_MAP[streamKey] || LIVE_STREAM_CATEGORY_MAP.main
  const stream = liveStreams?.[category.key] || liveStreams?.main || {}
  const password = String(stream.accessPassword || '').trim()
  const [hasAccess, setHasAccess] = useState(() => sessionStorage.getItem(getAccessKey(category.key)) === 'granted')

  useEffect(() => {
    const accessKey = getAccessKey(category.key)
    setHasAccess(!password || sessionStorage.getItem(accessKey) === 'granted')
  }, [category.key, password])

  const videoId = extractYoutubeVideoId(stream.youtubeUrl)
  const isLive = Boolean(stream.enabled && videoId)

  const scriptureContent = useMemo(() => {
    if (stream.scriptureTitle && stream.scriptureText) {
      return `${stream.scriptureTitle}\n${stream.scriptureText}`
    }

    return stream.scriptureTitle || stream.scriptureText || ''
  }, [stream.scriptureText, stream.scriptureTitle])

  const handleUnlock = (value) => {
    const success = String(value || '') === password
    if (!success) return false

    sessionStorage.setItem(getAccessKey(category.key), 'granted')
    setHasAccess(true)
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
                    방송실에서 송출 중인 유튜브 라이브가 이 페이지에 그대로 표시됩니다.
                  </p>
                </div>
              </>
            ) : (
              <div style={{ padding: '72px 24px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#fff', fontSize: '0.95rem', fontWeight: 900 }}>
                  방송
                </div>
                <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>현재 송출중인 영상이 없습니다.</p>
                <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto' }}>
                  예배 시작 전에는 관리자 페이지에서 {category.label} 설정을 저장하고 송출 시작을 눌러 주세요.
                </p>
              </div>
            )}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <InfoCard label="오늘의 본문말씀">{scriptureContent}</InfoCard>
            <InfoCard label="예배 안내">{stream.notice}</InfoCard>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
