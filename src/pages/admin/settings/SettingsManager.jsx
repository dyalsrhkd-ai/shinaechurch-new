import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase'

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '6px' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export default function SettingsManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [churchName, setChurchName] = useState('')
  const [representative, setRepresentative] = useState('')
  const [privacyManager, setPrivacyManager] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [fax, setFax] = useState('')
  const [email, setEmail] = useState('')
  const [tagline, setTagline] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'settings', 'main'))
      if (snap.exists()) {
        const d = snap.data()
        setChurchName(d.churchName || '')
        setRepresentative(d.representative || '')
        setPrivacyManager(d.privacyManager || '')
        setAddress(d.address || '')
        setPhone(d.phone || '')
        setFax(d.fax || '')
        setEmail(d.email || '')
        setTagline(d.tagline || '')
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        churchName: churchName.trim(),
        representative: representative.trim(),
        privacyManager: privacyManager.trim(),
        address: address.trim(),
        phone: phone.trim(),
        fax: fax.trim(),
        email: email.trim(),
        tagline: tagline.trim(),
        updatedAt: serverTimestamp(),
      })
      window.dispatchEvent(new Event('admin:changes-saved'))
      alert('저장되었습니다. 홈페이지 새로고침 시 반영됩니다.')
    } catch (e) { alert('오류: ' + e.message) }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '9px 11px',
    border: '1px solid #d1d5db', borderRadius: '7px',
    fontSize: '0.875rem', boxSizing: 'border-box',
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>기본 정보 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
          헤더·푸터·메인 홈페이지에 표시되는 교회 기본 정보
        </p>
      </div>

      {/* 교회 기본 정보 */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '16px' }}>교회 정보</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="교회명">
            <input value={churchName} onChange={e => setChurchName(e.target.value)} placeholder="신애교회" style={inputStyle} />
          </Field>
          <Field label="대표자">
            <input value={representative} onChange={e => setRepresentative(e.target.value)} placeholder="우용녀 목사" style={inputStyle} />
          </Field>
          <Field label="개인정보관리자">
            <input value={privacyManager} onChange={e => setPrivacyManager(e.target.value)} placeholder="김영단" style={inputStyle} />
          </Field>
        </div>
      </div>

      {/* 연락처 */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '4px' }}>연락처</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '16px' }}>헤더 전화번호, 메인 홈페이지 오시는길 섹션, 푸터에 표시됩니다.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="주소">
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="경기도 의왕시 왕곡로 187번지 (왕곡동)" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="전화">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="031-429-4557" style={inputStyle} />
            </Field>
            <Field label="팩스">
              <input value={fax} onChange={e => setFax(e.target.value)} placeholder="031-429-4557" style={inputStyle} />
            </Field>
          </div>
          <Field label="이메일">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="shinaechurch@naver.com" style={inputStyle} />
          </Field>
        </div>
      </div>

      {/* 푸터 소개 문구 */}
      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '4px' }}>푸터 소개 문구</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '10px' }}>푸터 좌측 로고 아래에 표시됩니다. 줄바꿈(Enter) 가능.</p>
        <textarea
          value={tagline}
          onChange={e => setTagline(e.target.value)}
          rows={3}
          style={{ ...inputStyle, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }}
        />
        {/* 미리보기 */}
        <div style={{ marginTop: '8px', padding: '10px 14px', background: '#0D1F40', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.75rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.45)', whiteSpace: 'pre-line' }}>{tagline}</p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '13px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
        {saving ? '저장 중...' : '전체 저장'}
      </button>
    </div>
  )
}
