import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const email = `${id}@shinaechurch.com`
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin/dashboard')
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eaecf0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '48px 40px', width: '100%', maxWidth: '400px' }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '14px', padding: '8px 14px', marginBottom: '16px', border: '1px solid #eaecf0' }}>
            <img src="/images/logo.png" alt="신애교회" style={{ height: '40px', width: 'auto', display: 'block' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2040' }}>신애교회 관리자</h1>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>관리자 계정으로 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>아이디</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="아이디 입력"
              required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.8rem', color: '#dc2626', background: '#fee2e2', padding: '10px 14px', borderRadius: '8px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px', background: loading ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'default' : 'pointer', marginTop: '4px' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
