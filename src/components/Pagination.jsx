export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null

  const delta = 2
  const pages = []
  const left = Math.max(2, page - delta)
  const right = Math.min(totalPages - 1, page + delta)

  pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < totalPages - 1) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  const btn = (label, target, active = false, disabled = false) => (
    <button
      key={label + target}
      onClick={() => !disabled && typeof target === 'number' && onPage(target)}
      disabled={disabled}
      style={{
        minWidth: '34px', height: '34px', padding: '0 6px',
        borderRadius: '8px', border: '1px solid',
        borderColor: active ? '#0284c7' : '#e5e7eb',
        background: active ? '#0284c7' : disabled ? '#f9fafb' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontWeight: active ? 700 : 400,
        fontSize: '0.85rem', cursor: disabled ? 'default' : 'pointer',
      }}
    >{label}</button>
  )

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '20px' }}>
      {btn('‹', page - 1, false, page === 1)}
      {pages.map((p, i) =>
        p === '...'
          ? <span key={'dot' + i} style={{ minWidth: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>…</span>
          : btn(p, p, p === page)
      )}
      {btn('›', page + 1, false, page === totalPages)}
    </div>
  )
}
