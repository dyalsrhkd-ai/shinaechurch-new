import { useEffect, useState } from 'react'
import { getContentDocument, upsertContentDocument } from '../../../api/contentApi'
import { uploadMedia } from '../../../utils/mediaStorage'
import { validateImageFile } from '../../../utils/fileValidation'

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
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const inputStyle = {
    width: '100%',
    padding: '9px 11px',
    border: '1px solid #d1d5db',
    borderRadius: '7px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await getContentDocument('settings', 'main')
        if (data) {
          setChurchName(data.churchName || '')
          setRepresentative(data.representative || '')
          setPrivacyManager(data.privacyManager || '')
          setAddress(data.address || '')
          setPhone(data.phone || '')
          setFax(data.fax || '')
          setEmail(data.email || '')
          setTagline(data.tagline || '')
          setLogoUrl(data.logoUrl || '')
        }
      } catch (error) {
        console.error(error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertContentDocument('settings', 'main', {
        churchName: churchName.trim(),
        representative: representative.trim(),
        privacyManager: privacyManager.trim(),
        address: address.trim(),
        phone: phone.trim(),
        fax: fax.trim(),
        email: email.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl || '',
      })
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '기본 정보를 저장했습니다.' } }))
      alert('저장되었습니다. 공개 홈페이지에도 바로 반영됩니다.')
    } catch (error) {
      alert('오류: ' + error.message)
    }
    setSaving(false)
  }

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const errorMessage = validateImageFile(file)
    if (errorMessage) {
      alert(errorMessage)
      event.target.value = ''
      return
    }

    setUploadingLogo(true)
    try {
      const { url } = await uploadMedia(file, 'site-assets')
      setLogoUrl(url)
      await upsertContentDocument('settings', 'main', {
        churchName: churchName.trim(),
        representative: representative.trim(),
        privacyManager: privacyManager.trim(),
        address: address.trim(),
        phone: phone.trim(),
        fax: fax.trim(),
        email: email.trim(),
        tagline: tagline.trim(),
        logoUrl: url,
      })
      window.dispatchEvent(new CustomEvent('admin:changes-saved', { detail: { message: '로고 이미지를 저장했습니다.' } }))
      alert('로고가 저장되었습니다.')
    } catch (error) {
      alert('오류: ' + error.message)
    }
    setUploadingLogo(false)
    event.target.value = ''
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>기본 정보 관리</h1>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
          교회의 기본 정보만 관리합니다. 라이브 송출은 별도 메뉴에서 빠르게 제어할 수 있습니다.
        </p>
      </div>

      <div style={stickyBarStyle}>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '4px' }}>상단 저장</p>
          <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f2040' }}>기본 정보 반영</p>
          <p style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: '2px' }}>헤더와 푸터에 쓰이는 정보만 저장합니다.</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding: '11px 18px', background: '#0f2040', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
          {saving ? '저장 중...' : '전체 저장'}
        </button>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '16px' }}>교회 정보</p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '160px', minHeight: '64px', borderRadius: '12px', border: '1px solid #dbe4f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
            {logoUrl ? <img src={logoUrl} alt={churchName || '신애교회'} style={{ maxHeight: '44px', width: 'auto', display: 'block' }} /> : <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>로고 없음</span>}
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#0f2040' }}>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={handleLogoUpload} style={{ display: 'none' }} />
            {uploadingLogo ? '로고 업로드 중...' : '로고 이미지 변경'}
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="교회명"><input value={churchName} onChange={(event) => setChurchName(event.target.value)} placeholder="신애교회" style={inputStyle} /></Field>
          <Field label="대표자"><input value={representative} onChange={(event) => setRepresentative(event.target.value)} placeholder="담임목사" style={inputStyle} /></Field>
          <Field label="개인정보관리자"><input value={privacyManager} onChange={(event) => setPrivacyManager(event.target.value)} placeholder="관리자" style={inputStyle} /></Field>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '4px' }}>연락처</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '16px' }}>헤더 전화번호, 메인 안내 섹션, 푸터에 노출됩니다.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="주소"><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="경기도 군포시 번영로 187번길" style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="전화"><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="031-429-4557" style={inputStyle} /></Field>
            <Field label="팩스"><input value={fax} onChange={(event) => setFax(event.target.value)} placeholder="031-429-4557" style={inputStyle} /></Field>
          </div>
          <Field label="이메일"><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="shinaechurch@naver.com" style={inputStyle} /></Field>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f2040', marginBottom: '4px' }}>푸터 소개 문구</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '10px' }}>푸터 로고 아래에 표시됩니다. 줄바꿈은 Enter로 입력하세요.</p>
        <textarea value={tagline} onChange={(event) => setTagline(event.target.value)} rows={3} style={{ ...inputStyle, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ marginTop: '8px', padding: '10px 14px', background: '#0D1F40', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.75rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.45)', whiteSpace: 'pre-line' }}>{tagline}</p>
        </div>
      </div>
    </div>
  )
}
