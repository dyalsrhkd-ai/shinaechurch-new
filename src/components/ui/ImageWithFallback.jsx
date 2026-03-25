import { useMemo, useState } from 'react'

function buildPlaceholder(label) {
  const safeLabel = label || 'IMAGE'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dbeafe" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      <circle cx="160" cy="140" r="72" fill="rgba(29,78,216,0.16)" />
      <circle cx="650" cy="120" r="52" fill="rgba(15,32,64,0.08)" />
      <rect x="120" y="360" width="560" height="16" rx="8" fill="rgba(15,32,64,0.12)" />
      <rect x="200" y="400" width="400" height="14" rx="7" fill="rgba(15,32,64,0.08)" />
      <path d="M160 420l120-132 104 98 92-76 164 110" fill="none" stroke="rgba(29,78,216,0.26)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
      <text x="400" y="260" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="700" fill="#1e3a5f">${safeLabel}</text>
      <text x="400" y="304" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#64748b">이미지가 준비되지 않았습니다</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export default function ImageWithFallback({
  src,
  alt,
  label,
  style,
  className,
  ...props
}) {
  const [failed, setFailed] = useState(false)
  const fallbackSrc = useMemo(() => buildPlaceholder(label || alt || 'IMAGE'), [alt, label])

  return (
    <img
      {...props}
      src={failed || !src ? fallbackSrc : src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
