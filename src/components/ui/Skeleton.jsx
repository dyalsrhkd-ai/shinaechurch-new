export function SkeletonBlock({
  width = '100%',
  height = '16px',
  radius = '12px',
  style = {},
}) {
  return (
    <>
      <style>{'@keyframes shinae-skeleton{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
      <div
        style={{
          width,
          height,
          borderRadius: radius,
          background: 'linear-gradient(90deg, #e5e7eb 0%, #f8fafc 50%, #e5e7eb 100%)',
          backgroundSize: '200% 100%',
          animation: 'shinae-skeleton 1.6s ease-in-out infinite',
          ...style,
        }}
      />
    </>
  )
}

export function SkeletonCard({ style = {}, children }) {
  return (
    <div
      style={{
        borderRadius: '16px',
        border: '1px solid #eaecf0',
        background: '#fff',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
