import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  DEFAULT_LIVE_STREAMS,
  LIVE_STREAM_CATEGORIES,
  normalizeLiveStreams,
  extractYoutubeVideoId,
} from '../../../utils/liveStream'

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

function StreamSection({ category, draftStream, savedStream, onChange, onSave, onToggle, saving, toggling }) {
  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
  }

  const draftVideoId = useMemo(() => extractYoutubeVideoId(draftStream.youtubeUrl), [draftStream.youtubeUrl])
  const savedVideoId = useMemo(() => extractYoutubeVideoId(savedStream.youtubeUrl), [savedStream.youtubeUrl])
  const hasInitialSetup = Boolean(savedVideoId)

  return (
    <section style={{ borderRadius: '20px', border: '1px solid #e5e7eb', background: '#fff', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.08em', color: savedStream.enabled ? '#dc2626' : '#2563eb', textTransform: 'uppercase', marginBottom: '8px' }}>
            {category.label}
          </p>
          <p style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            {savedStream.enabled ? `${category.label} 라이브가 송출 중입니다.` : `${category.label} 라이브가 대기 중입니다.`}
          </p>
          <p style={{ marginTop: '6px', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.7 }}>
            {hasInitialSetup ? '주소가 저장되어 있습니다. 시작과 종료 버튼으로 바로 제어할 수 있습니다.' : '먼저 유튜브 주소를 저장해야 송출 시작 버튼을 사용할 수 있습니다.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onToggle(category.key, true)}
            disabled={toggling || !hasInitialSetup || savedStream.enabled}
            style={{ padding: '12px 18px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 900, cursor: toggling || !hasInitialSetup || savedStream.enabled ? 'default' : 'pointer', opacity: toggling || !hasInitialSetup || savedStream.enabled ? 0.45 : 1 }}
          >
            송출 시작
          </button>
          <button
            onClick={() => onToggle(category.key, false)}
            disabled={toggling || !hasInitialSetup || !savedStream.enabled}
            style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 900, cursor: toggling || !hasInitialSetup || !savedStream.enabled ? 'default' : 'pointer', opacity: toggling || !hasInitialSetup || !savedStream.enabled ? 0.45 : 1 }}
          >
            송출 종료
          </button>
        </div>
      </div>

      {!draftVideoId ? (
        <div style={{ marginBottom: '18px', borderRadius: '14px', border: '1px solid #fde68a', background: '#fffbeb', padding: '14px 16px', color: '#92400e', fontSize: '0.82rem', lineHeight: 1.7 }}>
          유튜브 라이브 주소 또는 영상 ID를 입력해야 {category.label} 설정을 저장할 수 있습니다.
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{category.label} 설정</p>
            <p style={{ marginTop: '4px', fontSize: '0.82rem', color: '#64748b' }}>
              주소와 안내 문구를 저장해두면 공개 페이지에 바로 반영됩니다.
            </p>
          </div>
          <button
            onClick={() => onSave(category.key)}
            disabled={saving || !draftVideoId}
            style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: saving || !draftVideoId ? 'default' : 'pointer', opacity: saving || !draftVideoId ? 0.45 : 1 }}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="방송 제목">
            <input value={draftStream.title} onChange={(event) => onChange(category.key, 'title', event.target.value)} placeholder={`${category.label} 라이브 제목`} style={inputStyle} />
          </Field>
          <Field label="유튜브 라이브 주소 또는 영상 ID">
            <input value={draftStream.youtubeUrl} onChange={(event) => onChange(category.key, 'youtubeUrl', event.target.value)} placeholder="유튜브 라이브 주소를 붙여넣으세요." style={inputStyle} />
          </Field>
        </div>

        <Field label="오늘의 본문말씀 제목" hint="예: 요한복음 3장 16절">
          <input value={draftStream.scriptureTitle} onChange={(event) => onChange(category.key, 'scriptureTitle', event.target.value)} placeholder="오늘의 본문말씀 제목" style={inputStyle} />
        </Field>

        <Field label="오늘의 본문말씀 내용">
          <textarea value={draftStream.scriptureText} onChange={(event) => onChange(category.key, 'scriptureText', event.target.value)} rows={5} style={{ ...inputStyle, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>

        <Field label="예배 안내 문구">
          <textarea value={draftStream.notice} onChange={(event) => onChange(category.key, 'notice', event.target.value)} rows={4} style={{ ...inputStyle, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
      </div>
    </section>
  )
}

export default function LiveStreamManager() {
  const [loading, setLoading] = useState(true)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingStreamKey, setSavingStreamKey] = useState('')
  const [togglingStreamKey, setTogglingStreamKey] = useState('')
  const [password, setPassword] = useState('')
  const [draftStreams, setDraftStreams] = useState(DEFAULT_LIVE_STREAMS)
  const [savedStreams, setSavedStreams] = useState(DEFAULT_LIVE_STREAMS)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'settings', 'main'))
        if (snap.exists()) {
          const data = snap.data()
          const streams = normalizeLiveStreams(data.liveStreams, data.liveStreamTest)
          setPassword(String(data.liveAccessPassword || ''))
          setDraftStreams(streams)
          setSavedStreams(streams)
        }
      } catch (error) {
        console.error(error)
      }
      setLoading(false)
    }

    load()
  }, [])

  const updateStreamField = (streamKey, field, value) => {
    setDraftStreams((current) => ({
      ...current,
      [streamKey]: {
        ...current[streamKey],
        [field]: value,
      },
    }))
  }

  const savePassword = async () => {
    setSavingPassword(true)
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        liveAccessPassword: password.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '라이브 비밀번호를 저장했습니다.' } }))
      alert(password.trim() ? '라이브 비밀번호를 저장했습니다.' : '라이브 비밀번호를 해제했습니다.')
    } catch (error) {
      alert('오류: ' + error.message)
    }
    setSavingPassword(false)
  }

  const saveStream = async (streamKey) => {
    const draftStream = draftStreams[streamKey]
    const videoId = extractYoutubeVideoId(draftStream.youtubeUrl)
    if (!videoId) {
      alert('유튜브 라이브 주소 또는 영상 ID를 먼저 입력하세요.')
      return
    }

    setSavingStreamKey(streamKey)
    try {
      const nextStreams = {
        ...savedStreams,
        [streamKey]: {
          ...draftStream,
          enabled: savedStreams[streamKey]?.enabled || false,
          title: draftStream.title.trim(),
          youtubeUrl: draftStream.youtubeUrl.trim(),
          scriptureTitle: draftStream.scriptureTitle.trim(),
          scriptureText: draftStream.scriptureText.trim(),
          notice: draftStream.notice.trim(),
        },
      }

      await setDoc(doc(db, 'settings', 'main'), {
        liveStreams: nextStreams,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      setSavedStreams(nextStreams)
      setDraftStreams(nextStreams)
      const label = LIVE_STREAM_CATEGORIES.find((item) => item.key === streamKey)?.label || '라이브'
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: `${label} 설정을 저장했습니다.` } }))
      alert(`${label} 설정을 저장했습니다.`)
    } catch (error) {
      alert('오류: ' + error.message)
    }
    setSavingStreamKey('')
  }

  const toggleStream = async (streamKey, enabled) => {
    const savedStream = savedStreams[streamKey]
    const videoId = extractYoutubeVideoId(savedStream?.youtubeUrl)
    if (!videoId) {
      alert('먼저 해당 라이브 주소를 저장하세요.')
      return
    }

    setTogglingStreamKey(streamKey)
    try {
      const nextStreams = {
        ...savedStreams,
        [streamKey]: {
          ...savedStream,
          enabled,
        },
      }

      await setDoc(doc(db, 'settings', 'main'), {
        liveStreams: nextStreams,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      setSavedStreams(nextStreams)
      setDraftStreams(nextStreams)
      const label = LIVE_STREAM_CATEGORIES.find((item) => item.key === streamKey)?.label || '라이브'
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: enabled ? `${label} 송출을 시작했습니다.` : `${label} 송출을 종료했습니다.` } }))
      alert(enabled ? `${label} 송출을 시작했습니다.` : `${label} 송출을 종료했습니다.`)
    } catch (error) {
      alert('오류: ' + error.message)
    }
    setTogglingStreamKey('')
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>라이브영상 관리</h1>
        <p style={{ marginTop: '6px', fontSize: '0.85rem', color: '#64748b' }}>
          공개 홈페이지의 라이브영상 비밀번호와 각 부서별 송출 주소를 이 화면에서 관리합니다.
        </p>
      </div>

      <section style={{ borderRadius: '20px', border: '1px solid #dbe4f0', background: '#f8fafc', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>공개 비밀번호</p>
            <p style={{ marginTop: '4px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7 }}>
              이 비밀번호를 알아야 공개 홈페이지에서 라이브영상을 볼 수 있습니다. 비워두면 바로 입장 가능합니다.
            </p>
          </div>
          <button onClick={savePassword} disabled={savingPassword} style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: savingPassword ? 'default' : 'pointer', opacity: savingPassword ? 0.45 : 1 }}>
            {savingPassword ? '저장 중...' : '비밀번호 저장'}
          </button>
        </div>

        <Field label="라이브 접속 비밀번호" hint="공개 홈페이지 공통 비밀번호">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력하세요."
            style={{ width: '100%', maxWidth: '440px', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </Field>
      </section>

      {LIVE_STREAM_CATEGORIES.map((category) => (
        <StreamSection
          key={category.key}
          category={category}
          draftStream={draftStreams[category.key]}
          savedStream={savedStreams[category.key]}
          onChange={updateStreamField}
          onSave={saveStream}
          onToggle={toggleStream}
          saving={savingStreamKey === category.key}
          toggling={togglingStreamKey === category.key}
        />
      ))}
    </div>
  )
}
