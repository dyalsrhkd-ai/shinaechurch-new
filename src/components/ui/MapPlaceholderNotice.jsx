export default function MapPlaceholderNotice({ compact = false }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: compact ? '280px' : '440px',
        borderRadius: '16px',
        background: compact
          ? 'linear-gradient(135deg, #dbeafe, #eff6ff)'
          : 'linear-gradient(135deg, #f8fafc, #dbeafe)',
        border: '1px dashed #93c5fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: compact ? '0.95rem' : '1rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
          지도 준비 중
        </p>
        <p style={{ fontSize: compact ? '0.8rem' : '0.86rem', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          관리자 페이지의 오시는 길 관리에서
          {'\n'}
          지도 embed URL을 등록하면 이 위치에 지도가 표시됩니다.
        </p>
      </div>
    </div>
  )
}
