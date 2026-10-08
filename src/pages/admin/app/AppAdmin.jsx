import { useEffect, useRef } from 'react'

// 「신애교회 앱관리」 — 운영 다리 스크립트와 같은 칸(public/app-admin-panel.js)을 그대로 쓴다. 두 벌로 그리지 않는다.
export default function AppAdmin() {
  const host = useRef(null)
  useEffect(() => {
    let alive = true
    let unmount = () => {}
    const start = () => { if (alive && host.current && window.ChurchAppAdmin) unmount = window.ChurchAppAdmin.mount(host.current) }
    if (window.ChurchAppAdmin) start()
    else {
      const script = document.createElement('script')
      script.src = '/app-admin-panel.js?v=20261008'
      script.onload = start
      document.head.append(script)
    }
    return () => { alive = false; unmount() }
  }, [])
  return <div ref={host} style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', minWidth: 0 }} />
}
