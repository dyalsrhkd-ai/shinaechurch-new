// 홈페이지 관리자 「신애교회 앱관리」(2026-10-08) — 교인앱을 관리 모드(?embed=admin)로 그대로 띄우는 칸.
// 운영 다리 스크립트(app-install-links.js)와 React 화면(AppAdmin.jsx)이 같이 쓴다 — 두 벌로 그리지 않는다.
// 기준은 폰·폴드 앱: 모양 3개 + 폭 320~1200. 줄일 때는 transform 이 아니라 zoom(transform 은 글씨가 흐려진다).
(() => {
  const MIN = 320, MAX = 1200, PAD = 24, KEY = 'church-app-admin-width'
  const SHAPES = [[344, '작은 폰', '폴드 접음'], [412, '보통 폰', '갤럭시·아이폰'], [860, '넓은 화면', '폴드 펼침·태블릿']]
  const appUrl = () => window.CHURCH_APP_URL || 'https://shinae-community.pages.dev/?embed=admin'
  const clamp = w => Math.max(MIN, Math.min(MAX, Math.round(Number(w) || 412)))
  const shapeOf = w => (w <= 360 ? '작은 폰 모양' : w <= 700 ? '보통 폰 모양' : '넓은 화면 모양(왼쪽 메뉴)')
  const read = () => { try { return clamp(localStorage.getItem(KEY) || 412) } catch { return 412 } }
  const save = w => { try { localStorage.setItem(KEY, String(w)) } catch { /* 기억 못 해도 지금 화면은 된다 */ } }
  const el = (tag, css, text) => { const n = document.createElement(tag); if (css) n.style.cssText = css; if (text != null) n.textContent = text; return n }

  function mount(host) {
    host.replaceChildren()
    host.setAttribute('data-church-app-admin', '')
    const bar = el('div', 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-bottom:14px;')
    const title = el('h1', 'font-size:1.25rem;font-weight:900;color:#0f2040;margin:0 auto 0 0;', '신애교회 앱관리')
    const group = el('div', 'display:inline-flex;background:#f2f4f7;border-radius:10px;padding:3px;')
    group.setAttribute('role', 'group'); group.setAttribute('aria-label', '화면 모양')
    const buttons = SHAPES.map(([w, name, hint]) => {
      const b = el('button', 'border:0;font:inherit;font-size:.8rem;padding:6px 12px;border-radius:8px;cursor:pointer;line-height:1.25;', name)
      b.type = 'button'; b.dataset.w = String(w)
      b.append(el('small', 'display:block;font-size:.65rem;color:#98a2b3;font-weight:400;', hint))
      b.onclick = () => set(w)
      group.append(b)
      return b
    })
    const label = el('label', 'font-size:.8rem;color:#475467;display:inline-flex;align-items:center;gap:6px;', '폭')
    const input = el('input', 'width:70px;padding:5px 6px;border:1px solid #d0d5dd;border-radius:6px;font:inherit;text-align:right;')
    input.type = 'number'; input.min = String(MIN); input.max = String(MAX); input.setAttribute('aria-label', '앱 화면 폭(px)')
    input.onchange = () => set(input.value)
    label.append(input, 'px')
    const open = el('a', 'font-size:.8rem;color:#155e45;border:1px solid #cfe3d8;border-radius:8px;padding:6px 12px;text-decoration:none;', '새 창으로 열기 ↗')
    open.href = 'https://shinae-community.pages.dev/'; open.target = '_blank'; open.rel = 'noreferrer'
    bar.append(title, group, label, open)

    const stage = el('div', 'flex:1;min-height:0;display:flex;justify-content:center;align-items:flex-start;overflow:hidden;padding-right:28px;')
    const wrap = el('div', 'position:relative;flex-shrink:0;')
    const device = el('div', 'background:#111;border-radius:34px;padding:12px;box-shadow:0 20px 50px rgba(15,32,64,.18);width:100%;height:100%;box-sizing:border-box;position:relative;')
    device.setAttribute('data-device', '')
    const frame = el('iframe', 'border:0;border-radius:24px;background:#fff;display:block;width:100%;height:100%;')
    frame.title = '신애교회 앱'; frame.src = appUrl()
    // 10/8 계정 통일: 홈페이지에 앱 관리자로 로그인했으면(다리 스크립트가 이 탭에 보관한 토큰) 앱이 「준비됨」이라 할 때 넘겨 다시 로그인하지 않게
    const onMessage = event => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'shinae-embed-ready') return
      let session = null
      try { session = JSON.parse(sessionStorage.getItem('church-app-session') || 'null') } catch { session = null }
      if (session?.access_token && session?.refresh_token) frame.contentWindow.postMessage({ type: 'shinae-embed-session', access_token: session.access_token, refresh_token: session.refresh_token }, new URL(appUrl()).origin)
    }
    window.addEventListener('message', onMessage)
    const fail = el('div', 'display:none;position:absolute;inset:12px;border-radius:24px;background:#fff;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#475467;font-size:.9rem;text-align:center;padding:20px;')
    const retry = el('button', 'border:1px solid #cfe3d8;background:#fff;color:#155e45;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer;', '다시 불러오기')
    retry.type = 'button'
    fail.append(el('p', 'margin:0;', '앱을 불러오지 못했습니다.'), retry, open.cloneNode(true))
    let loaded = false
    const watch = () => { loaded = false; setTimeout(() => { if (!loaded && host.isConnected) fail.style.display = 'flex' }, 15000) }
    frame.addEventListener('load', () => { loaded = true; fail.style.display = 'none' })
    retry.onclick = () => { fail.style.display = 'none'; frame.src = appUrl(); watch() }
    device.append(frame, fail)
    const grip = el('div', 'position:absolute;top:50%;right:-22px;width:14px;height:72px;margin-top:-36px;border-radius:8px;background:#d0d5dd;cursor:ew-resize;touch-action:none;')
    grip.setAttribute('data-grip', ''); grip.title = '끌어서 폭 바꾸기'
    wrap.append(device, grip)
    stage.append(wrap)
    const info = el('p', 'margin:8px 0 0;font-size:.75rem;color:#667085;text-align:right;')
    host.append(bar, stage, info)

    let w = read(), zoom = 1
    function render() {
      input.value = String(w)
      for (const b of buttons) {
        const on = Number(b.dataset.w) === w
        b.setAttribute('aria-pressed', String(on))
        b.style.background = on ? '#fff' : 'transparent'
        b.style.color = on ? '#155e45' : '#475467'
        b.style.fontWeight = on ? '700' : '400'
        b.style.boxShadow = on ? '0 1px 3px rgba(0,0,0,.1)' : 'none'
      }
      const availW = Math.max(200, stage.clientWidth - 28), availH = Math.max(300, stage.clientHeight)
      // 줄일 때 앱 칸 폭(w×zoom)이 정수 픽셀이 되게 고른다 — 아니면 앱 안 폭이 1px 어긋난다(1200 → 1199)
      zoom = Math.min(1, Math.floor((w * availW) / (w + PAD)) / w)
      wrap.style.zoom = zoom < 1 ? String(zoom) : ''
      wrap.style.width = `${w + PAD}px`
      wrap.style.height = `${Math.floor(availH / zoom)}px`
      info.textContent = `폭 ${w}px → 앱은 ${shapeOf(w)}${zoom < 1 ? ` · 화면에 맞춰 ${Math.round(zoom * 100)}%` : ''} · 오른쪽 손잡이를 끌어 폭을 바꿀 수 있습니다`
    }
    function set(next) { w = clamp(next); save(w); render() }
    grip.onpointerdown = e => {
      e.preventDefault(); grip.setPointerCapture(e.pointerId)
      const x0 = e.clientX, w0 = w
      grip.style.background = '#23594c'; frame.style.pointerEvents = 'none'
      grip.onpointermove = ev => set(w0 + ((ev.clientX - x0) * 2) / zoom)
      grip.onpointerup = () => { grip.onpointermove = null; grip.style.background = '#d0d5dd'; frame.style.pointerEvents = '' }
    }
    const ro = new ResizeObserver(render)
    ro.observe(stage)
    watch(); render()
    return () => { ro.disconnect(); window.removeEventListener('message', onMessage) }
  }
  window.ChurchAppAdmin = { mount, clamp, shapeOf, MIN, MAX }
})()
