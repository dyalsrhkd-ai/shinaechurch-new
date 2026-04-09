import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  DEFAULT_LIVE_STREAMS,
  LIVE_STREAM_CATEGORY_MAP,
  extractYoutubeChannelId,
  extractYoutubeVideoId,
  generateLiveAccessKey,
  hasLiveStreamTarget,
  normalizeLiveStreams,
} from '../../../utils/liveStream'
import {
  LIVE_STREAM_AGENT_COLLECTION,
  LIVE_STREAM_CONTROL_COLLECTION,
  createLiveControlRequestId,
} from '../../../utils/liveControl'

const stickyBarStyle = {
  position: 'sticky',
  top: '88px',
  zIndex: 8,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(14px)',
  border: '1px solid #dbe4f0',
  borderRadius: '16px',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
  boxShadow: '0 12px 28px rgba(15, 32, 64, 0.08)',
  marginBottom: '20px',
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
}

const PENDING_LOCK_MS = 30 * 1000

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
        {label}
        {hint ? <span style={{ marginLeft: '6px', fontWeight: 500, color: '#94a3b8' }}>{hint}</span> : null}
      </label>
      {children}
    </div>
  )
}

function StatusCard({ title, tone, children }) {
  const palette = {
    good: { border: '#bbf7d0', bg: '#f0fdf4', title: '#166534' },
    warn: { border: '#fde68a', bg: '#fffbeb', title: '#92400e' },
    idle: { border: '#dbe4f0', bg: '#f8fafc', title: '#334155' },
    bad: { border: '#fecaca', bg: '#fef2f2', title: '#b91c1c' },
  }[tone] || { border: '#dbe4f0', bg: '#f8fafc', title: '#334155' }

  return (
    <div style={{ borderRadius: '14px', border: `1px solid ${palette.border}`, background: palette.bg, padding: '14px 16px' }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.08em', color: palette.title }}>{title}</p>
      {children}
    </div>
  )
}

function formatStatusTime(value) {
  if (!value) return '-'
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isRecentPending(controlState) {
  if (controlState?.status !== 'pending') return false
  const requestedAt = controlState?.requestedAt?.toDate
    ? controlState.requestedAt.toDate()
    : new Date(controlState?.requestedAt || 0)
  if (Number.isNaN(requestedAt.getTime())) return false
  return Date.now() - requestedAt.getTime() < PENDING_LOCK_MS
}

function StreamSection({
  category,
  draftStream,
  savedStream,
  controlState,
  agentState,
  onChange,
  onGenerateKey,
  onToggle,
  generating,
  toggling,
}) {
  const draftTarget = useMemo(
    () => extractYoutubeChannelId(draftStream.youtubeUrl) || extractYoutubeVideoId(draftStream.youtubeUrl),
    [draftStream.youtubeUrl],
  )
  const savedTarget = useMemo(
    () => extractYoutubeChannelId(savedStream.youtubeUrl) || extractYoutubeVideoId(savedStream.youtubeUrl),
    [savedStream.youtubeUrl],
  )
  const hasInitialSetup = Boolean(savedTarget)
  const accessLink = typeof window !== 'undefined' && draftStream.accessKey
    ? `${window.location.origin}${window.location.pathname}#/media/live/${category.key}?access=${encodeURIComponent(draftStream.accessKey)}`
    : ''
  const pending = isRecentPending(controlState)
  const agentConnected = Boolean(agentState?.obsConnected)
  const streamActive = Boolean(agentState?.streamActive)
  const agentTone = agentConnected ? (streamActive ? 'good' : 'idle') : 'warn'
  const commandTone = controlState?.status === 'error'
    ? 'bad'
    : controlState?.status === 'completed'
      ? 'good'
      : pending
        ? 'warn'
        : 'idle'

  return (
    <section style={{ borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.08em', color: savedStream.enabled ? '#dc2626' : '#2563eb', marginBottom: '8px' }}>
            {category.label}
          </p>
          <p style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            {savedStream.enabled ? `${category.label} 라이브가 공개 중입니다.` : `${category.label} 라이브가 대기 중입니다.`}
          </p>
          <p style={{ marginTop: '6px', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.7 }}>
            유튜브 채널 ID를 저장한 뒤 송출 시작 버튼을 누르면 해당 부서 송출 PC의 OBS가 방송을 시작하도록 요청합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onToggle(category.key, true)}
            disabled={toggling || pending || !hasInitialSetup || streamActive}
            style={{ padding: '12px 18px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 900, cursor: toggling || pending || !hasInitialSetup || streamActive ? 'default' : 'pointer', opacity: toggling || pending || !hasInitialSetup || streamActive ? 0.45 : 1 }}
          >
            송출 시작
          </button>
          <button
            type="button"
            onClick={() => onToggle(category.key, false)}
            disabled={toggling || pending || !hasInitialSetup || !streamActive}
            style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 900, cursor: toggling || pending || !hasInitialSetup || !streamActive ? 'default' : 'pointer', opacity: toggling || pending || !hasInitialSetup || !streamActive ? 0.45 : 1 }}
          >
            송출 종료
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatusCard title="OBS 에이전트 상태" tone={agentTone}>
          <p style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
            {agentConnected ? (streamActive ? 'OBS 연결됨, 현재 송출 중' : 'OBS 연결됨, 대기 중') : 'OBS 에이전트 연결 안 됨'}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.7 }}>
            {agentState?.agentLabel || '해당 부서 PC에서 live-agent를 실행해야 합니다.'}
          </p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
            마지막 확인: {formatStatusTime(agentState?.lastSeenAt)}
          </p>
        </StatusCard>

        <StatusCard title="최근 제어 명령" tone={commandTone}>
          <p style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
            {pending
              ? '명령 전송됨, 에이전트 응답 대기 중'
              : controlState?.status === 'completed'
                ? '명령 완료'
                : controlState?.status === 'error'
                  ? '명령 실패'
                  : '대기 중'}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.7 }}>
            {controlState?.message || controlState?.error || '아직 실행된 제어 명령이 없습니다.'}
          </p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
            마지막 처리: {formatStatusTime(controlState?.processedAt)}
          </p>
        </StatusCard>
      </div>

      {!draftTarget ? (
        <div style={{ marginBottom: '18px', borderRadius: '14px', border: '1px solid #fde68a', background: '#fffbeb', padding: '14px 16px', color: '#92400e', fontSize: '0.82rem', lineHeight: 1.7 }}>
          유튜브 채널 ID를 먼저 저장해야 송출 시작 버튼을 사용할 수 있습니다.
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="방송 제목">
            <input value={draftStream.title} onChange={(event) => onChange(category.key, 'title', event.target.value)} placeholder={`${category.label} 라이브 제목`} style={inputStyle} />
          </Field>
          <Field label="유튜브 채널 ID" hint="예: UCxxxxxxxxxxxxxxxxxxxxxx">
            <input value={draftStream.youtubeUrl} onChange={(event) => onChange(category.key, 'youtubeUrl', event.target.value)} placeholder="유튜브 채널 ID를 입력해 주세요." style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="유튜브 자동화 크롬 프로필 폴더명" hint="예: Profile 3">
            <input value={draftStream.youtubeChromeProfileName || ''} onChange={(event) => onChange(category.key, 'youtubeChromeProfileName', event.target.value)} placeholder="Chrome User Data 폴더 안 프로필명" style={inputStyle} />
          </Field>
          <Field label="비밀번호" hint="일반 주소 접속용">
            <input type="password" value={draftStream.accessPassword} onChange={(event) => onChange(category.key, 'accessPassword', event.target.value)} placeholder={`${category.label} 비밀번호`} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="전용 링크 키" hint="카카오톡 공유용">
            <div style={{ display: 'flex', gap: '10px' }}>
              <input value={draftStream.accessKey} onChange={(event) => onChange(category.key, 'accessKey', event.target.value)} placeholder={`${category.label} 전용 링크 키`} style={{ ...inputStyle, flex: 1 }} />
              <button
                type="button"
                onClick={() => onGenerateKey(category.key)}
                disabled={generating}
                style={{ padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: generating ? 'default' : 'pointer', flexShrink: 0, opacity: generating ? 0.45 : 1 }}
              >
                {generating ? '생성 중..' : '새로 생성'}
              </button>
            </div>
          </Field>
          <div />
        </div>

        {draftStream.accessKey ? (
          <div style={{ borderRadius: '14px', border: '1px solid #dbe4f0', background: '#f8fafc', padding: '14px 16px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', marginBottom: '8px' }}>전용 링크 예시</p>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.7, color: '#334155', wordBreak: 'break-all' }}>{accessLink}</p>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="설교 제목">
            <input value={draftStream.sermonTitle} onChange={(event) => onChange(category.key, 'sermonTitle', event.target.value)} placeholder={`${category.label} 설교 제목`} style={inputStyle} />
          </Field>
          <Field label="오늘의 본문말씀">
            <input value={draftStream.scriptureTitle} onChange={(event) => onChange(category.key, 'scriptureTitle', event.target.value)} placeholder="예: 요한복음 3장 16절" style={inputStyle} />
          </Field>
        </div>
      </div>
    </section>
  )
}

export default function LiveStreamManager() {
  const { streamKey = 'main' } = useParams()
  const [loading, setLoading] = useState(true)
  const [savingStreamKey, setSavingStreamKey] = useState('')
  const [generatingStreamKey, setGeneratingStreamKey] = useState('')
  const [togglingStreamKey, setTogglingStreamKey] = useState('')
  const [draftStreams, setDraftStreams] = useState(DEFAULT_LIVE_STREAMS)
  const [savedStreams, setSavedStreams] = useState(DEFAULT_LIVE_STREAMS)
  const [controlState, setControlState] = useState(null)
  const [agentState, setAgentState] = useState(null)

  const activeCategory = LIVE_STREAM_CATEGORY_MAP[streamKey] || LIVE_STREAM_CATEGORY_MAP.main

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'main'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setDraftStreams(DEFAULT_LIVE_STREAMS)
          setSavedStreams(DEFAULT_LIVE_STREAMS)
          setLoading(false)
          return
        }

        const data = snapshot.data()
        const streams = normalizeLiveStreams(data.liveStreams, data.liveStreamTest, data.liveAccessPassword)
        setDraftStreams(streams)
        setSavedStreams(streams)
        setLoading(false)
      },
      (error) => {
        console.error(error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    const controlUnsubscribe = onSnapshot(
      doc(db, LIVE_STREAM_CONTROL_COLLECTION, activeCategory.key),
      (snapshot) => setControlState(snapshot.exists() ? snapshot.data() : null),
      console.error,
    )
    const agentUnsubscribe = onSnapshot(
      doc(db, LIVE_STREAM_AGENT_COLLECTION, activeCategory.key),
      (snapshot) => setAgentState(snapshot.exists() ? snapshot.data() : null),
      console.error,
    )

    return () => {
      controlUnsubscribe()
      agentUnsubscribe()
    }
  }, [activeCategory.key])

  const updateStreamField = (targetKey, field, value) => {
    setDraftStreams((current) => ({
      ...current,
      [targetKey]: {
        ...current[targetKey],
        [field]: value,
      },
    }))
  }

  const generateAccessKeyForStream = async (targetKey) => {
    const nextAccessKey = generateLiveAccessKey()
    setGeneratingStreamKey(targetKey)
    setDraftStreams((current) => ({
      ...current,
      [targetKey]: {
        ...current[targetKey],
        accessKey: nextAccessKey,
      },
    }))

    try {
      const nextStreams = {
        ...savedStreams,
        [targetKey]: {
          ...savedStreams[targetKey],
          accessKey: nextAccessKey,
        },
      }

      await setDoc(doc(db, 'settings', 'main'), {
        liveStreams: nextStreams,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      setSavedStreams(nextStreams)
      alert(`${LIVE_STREAM_CATEGORY_MAP[targetKey]?.label || '라이브'} 전용 링크 키를 생성했습니다.`)
    } catch (error) {
      setDraftStreams((current) => ({
        ...current,
        [targetKey]: {
          ...current[targetKey],
          accessKey: savedStreams[targetKey]?.accessKey || '',
        },
      }))
      alert(`오류: ${error.message}`)
    }

    setGeneratingStreamKey('')
  }

  const saveStream = async (targetKey) => {
    const draftStream = draftStreams[targetKey]
    if (!hasLiveStreamTarget(draftStream.youtubeUrl)) {
      alert('유튜브 채널 ID를 먼저 입력해 주세요.')
      return
    }

    setSavingStreamKey(targetKey)
    try {
      const nextStreams = {
        ...savedStreams,
        [targetKey]: {
          ...draftStream,
          enabled: savedStreams[targetKey]?.enabled || false,
          title: draftStream.title.trim(),
          youtubeUrl: draftStream.youtubeUrl.trim(),
          youtubeChromeProfileName: String(draftStream.youtubeChromeProfileName || '').trim(),
          accessPassword: draftStream.accessPassword.trim(),
          accessKey: draftStream.accessKey.trim(),
          sermonTitle: draftStream.sermonTitle.trim(),
          scriptureTitle: draftStream.scriptureTitle.trim(),
        },
      }

      await setDoc(doc(db, 'settings', 'main'), {
        liveStreams: nextStreams,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      setSavedStreams(nextStreams)
      setDraftStreams(nextStreams)
      alert(`${LIVE_STREAM_CATEGORY_MAP[targetKey]?.label || '라이브'} 설정을 저장했습니다.`)
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setSavingStreamKey('')
  }

  const toggleStream = async (targetKey, enabled) => {
    const savedStream = savedStreams[targetKey]
    if (!hasLiveStreamTarget(savedStream?.youtubeUrl)) {
      alert('먼저 유튜브 채널 ID를 저장해 주세요.')
      return
    }

    setTogglingStreamKey(targetKey)
    try {
      await setDoc(doc(db, LIVE_STREAM_CONTROL_COLLECTION, targetKey), {
        streamKey: targetKey,
        requestId: createLiveControlRequestId(),
        desiredState: enabled ? 'start' : 'stop',
        status: 'pending',
        requestedAt: serverTimestamp(),
        requestedBy: 'admin',
        processedAt: null,
        processedRequestId: '',
        processedBy: '',
        error: '',
        message: enabled ? '송출 시작 요청을 전송했습니다.' : '송출 종료 요청을 전송했습니다.',
        updatedAt: serverTimestamp(),
      }, { merge: true })

      alert(`${LIVE_STREAM_CATEGORY_MAP[targetKey]?.label || '라이브'} ${enabled ? '송출 시작' : '송출 종료'} 요청을 보냈습니다.`)
    } catch (error) {
      alert(`오류: ${error.message}`)
    }
    setTogglingStreamKey('')
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중..</div>
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>{activeCategory.label} 라이브 영상 관리</h1>
        <p style={{ marginTop: '6px', fontSize: '0.85rem', color: '#64748b' }}>
          관리자에서 시작/종료 명령을 보내면 해당 부서 송출 PC에서 실행 중인 OBS 에이전트가 방송을 제어합니다.
        </p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#2563eb' }}>{activeCategory.label}</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>현재 페이지는 이 부서의 라이브 설정만 다룹니다.</p>
        </div>
        <button
          type="button"
          onClick={() => saveStream(activeCategory.key)}
          disabled={savingStreamKey === activeCategory.key || !hasLiveStreamTarget(draftStreams[activeCategory.key]?.youtubeUrl)}
          style={{ padding: '12px 18px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: savingStreamKey === activeCategory.key || !hasLiveStreamTarget(draftStreams[activeCategory.key]?.youtubeUrl) ? 'default' : 'pointer', opacity: savingStreamKey === activeCategory.key || !hasLiveStreamTarget(draftStreams[activeCategory.key]?.youtubeUrl) ? 0.45 : 1 }}
        >
          {savingStreamKey === activeCategory.key ? '저장 중..' : '설정 저장'}
        </button>
      </div>

      <StreamSection
        category={activeCategory}
        draftStream={draftStreams[activeCategory.key]}
        savedStream={savedStreams[activeCategory.key]}
        controlState={controlState}
        agentState={agentState}
        onChange={updateStreamField}
        onGenerateKey={generateAccessKeyForStream}
        onToggle={toggleStream}
        generating={generatingStreamKey === activeCategory.key}
        toggling={togglingStreamKey === activeCategory.key}
      />
    </div>
  )
}
