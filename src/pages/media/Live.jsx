import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getPublicLiveState, unlockLiveStream } from '../../api/liveApi'
import SubLayout from '../../components/SubLayout'
import {
  LIVE_STREAM_CATEGORIES,
  LIVE_STREAM_CATEGORY_MAP,
  normalizeLiveStreams,
} from '../../utils/liveStream'

const menus = LIVE_STREAM_CATEGORIES.map(({ label, path }) => ({ label, path }))

function PasswordGate({ label, onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  return (
    <section
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        borderRadius: '24px',
        border: '1px solid #dbe4f0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1d4ed8',
          fontSize: '0.95rem',
          fontWeight: 900,
          marginBottom: '20px',
        }}
      >
        입장
      </div>
      <p
        style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: '#2563eb',
          marginBottom: '12px',
        }}
      >
        비공개 입장
      </p>
      <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
        {label} 실시간 예배 영상을 보려면 비밀번호를 입력해야 합니다.
      </h2>
      <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: '#475569', marginBottom: '22px' }}>
        카카오톡이나 문자로 받은 전용 링크가 있으면 바로 입장되고, 일반 주소로 들어온 경우에는 비밀번호를 입력해야 합니다.
      </p>

      <form
        onSubmit={async (event) => {
          event.preventDefault()
          const success = await onUnlock(input)
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
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '14px',
            border: error ? '1px solid #fca5a5' : '1px solid #cbd5e1',
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error ? <p style={{ margin: 0, fontSize: '0.82rem', color: '#dc2626', fontWeight: 700 }}>{error}</p> : null}
        <button
          type="submit"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            border: 'none',
            background: '#0f172a',
            color: '#fff',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          실시간 예배 영상 보기
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

  const fallbackHash = location.hash && location.hash.includes('?')
    ? location.hash.slice(location.hash.indexOf('?') + 1)
    : ''
  return new URLSearchParams(fallbackHash).get('access')?.trim() || ''
}

export default function Live() {
  const { streamKey = 'main' } = useParams()
  const location = useLocation()
  const category = LIVE_STREAM_CATEGORY_MAP[streamKey] || LIVE_STREAM_CATEGORY_MAP.main
  const accessParam = getAccessParam(location)
  const [liveState, setLiveState] = useState(null)
  const [loading, setLoading] = useState(true)
  const playerSectionRef = useRef(null)
  const stream = normalizeLiveStreams({ [category.key]: liveState?.setting })[category.key]
  const agentState = liveState?.agent || null
  const controlState = liveState?.command || null
  const hasAccess = Boolean(stream.authorized || !stream.accessRequired)

  const currentVideoId = String(stream.currentVideoId || '').trim()
  const embedUrl = currentVideoId
    ? `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0`
    : ''
  const stopPending = ['pending', 'processing'].includes(controlState?.status) && controlState?.desiredState === 'stop'
  const isLive = Boolean(!stopPending && (agentState?.streamActive || stream.enabled) && embedUrl)

  useEffect(() => {
    let active = true

    const load = async (credential = '') => {
      try {
        const live = credential
          ? await unlockLiveStream(category.key, credential)
          : await getPublicLiveState(category.key)
        if (active) setLiveState(live)
      } catch (error) {
        if (credential) {
          try {
            const live = await getPublicLiveState(category.key)
            if (active) setLiveState(live)
          } catch (fallbackError) {
            console.error(fallbackError)
          }
        } else {
          console.error(error)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    setLoading(true)
    load(accessParam)
    const timer = setInterval(() => load(), 5000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [accessParam, category.key])

  const handleUnlock = async (value) => {
    try {
      setLiveState(await unlockLiveStream(category.key, value))
      return true
    } catch {
      return false
    }
  }

  const handleEnterFullscreen = async () => {
    const element = playerSectionRef.current
    if (!element) return

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
        return
      }

      if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const infoRows = useMemo(
    () => [
      { label: '설교 제목', value: stream.sermonTitle || '-' },
      { label: '오늘의 본문말씀', value: stream.scriptureTitle || '-' },
    ],
    [stream.scriptureTitle, stream.sermonTitle],
  )

  return (
    <SubLayout section="실시간 예배 영상" menus={menus} title={category.label}>
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중..</div>
      ) : !hasAccess ? (
        <PasswordGate label={category.label} onUnlock={handleUnlock} />
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          <section
            ref={playerSectionRef}
            style={{
              borderRadius: '22px',
              overflow: 'hidden',
              border: '1px solid #dbe4f0',
              background: '#0f172a',
            }}
          >
            {isLive ? (
              <>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                  <iframe
                    src={embedUrl}
                    title={stream.title || category.defaultTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
                <div style={{ padding: '18px 22px', display: 'grid', gap: '16px', background: '#111827' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '999px',
                          background: 'rgba(239,68,68,0.18)',
                          color: '#fecaca',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          marginBottom: '10px',
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#ef4444' }} />
                        현재 송출 중
                      </div>
                      <p style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800 }}>
                        {stream.title || category.defaultTitle}
                      </p>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.74)', fontSize: '0.92rem', lineHeight: 1.7, maxWidth: '460px' }}>
                      영상이 작게 보이면 아래의 크게 보기 버튼을 눌러 주세요.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleEnterFullscreen}
                    style={{
                      minHeight: '60px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    크게 보기
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '72px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                  }}
                >
                  종료
                </div>
                <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>
                  현재 송출 중인 영상이 없습니다.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto' }}>
                  방송이 시작되면 이 자리에서 바로 예배 영상을 볼 수 있습니다.
                </p>
              </div>
            )}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            {infoRows.map((item) => (
              <div
                key={item.label}
                style={{ borderRadius: '18px', border: '1px solid #e5e7eb', background: '#fff', padding: '20px 22px' }}
              >
                <p style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </section>
        </div>
      )}
    </SubLayout>
  )
}
