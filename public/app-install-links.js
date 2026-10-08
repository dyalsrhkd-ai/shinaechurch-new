// Dashboard-only deployment bridge. Future full builds use Dashboard.jsx / AppAdmin.jsx directly.
// 10/8 「신애교회 앱관리」: 사이드바 끝에 메뉴, #/admin/dashboard?view=app 이면 본문을 앱 띄우는 칸(app-admin-panel.js)으로
(() => {
  // 이 스크립트를 부른 주소의 꼬리표(?v=) — 앱관리 칸 스크립트도 같은 꼬리표로 불러야 브라우저가 옛 파일을 쓰지 않는다(서버가 1년 보관 설정)
  const VERSION = (document.currentScript && new URL(document.currentScript.src, location.href).searchParams.get('v')) || 'dev'
  const APP_VIEW = '#/admin/dashboard?view=app'
  const route = () => location.hash.split('?')[0].replace(/\/$/, '')
  const EMERGENCY_VIEW = '#/admin/accounts?scope=emergency'
  const isEmergency = () => route() === '#/admin/accounts' && new URLSearchParams(location.hash.split('?')[1] || '').get('scope') === 'emergency'
  const isAppView = () => route() === '#/admin/dashboard' && new URLSearchParams(location.hash.split('?')[1] || '').get('view') === 'app'
  let panelLoading = null, unmount = null
  // 10/8 계정 통일: 홈페이지 로그인 응답의 앱 토큰(appSession)을 이 탭에만 보관 → 앱관리 칸이 다시 로그인하지 않게. 로그아웃하면 지운다
  const SESSION_KEY = 'church-app-session'
  if (window.fetch && !window.fetch.churchWrapped) {
    const original = window.fetch.bind(window)
    const wrapped = async (input, init) => {
      // 「비상용 계정 관리」 화면이면 관리자 계정 요청을 홈페이지 계정 쪽으로(scope=emergency)
      if (typeof input === 'string' && input.includes('/api/admin-users.php') && isEmergency()) input += (input.includes('?') ? '&' : '?') + 'scope=emergency'
      const response = await original(input, init)
      try {
        const url = String(input && input.url ? input.url : input)
        if (/\/api\/auth\.php\?action=logout/.test(url)) sessionStorage.removeItem(SESSION_KEY)
        else if (/\/api\/auth\.php\?action=login/.test(url) && response.ok) {
          response.clone().json().then(data => {
            if (data && data.appSession && data.appSession.access_token) sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.appSession))
            else sessionStorage.removeItem(SESSION_KEY)
          }).catch(() => {})
        }
      } catch { /* 토큰 보관은 편의일 뿐 — 로그인 자체는 그대로 */ }
      return response
    }
    wrapped.churchWrapped = true
    window.fetch = wrapped
  }
  const loadPanel = () => panelLoading || (panelLoading = new Promise((done, fail) => {
    if (window.ChurchAppAdmin) return done()
    const script = document.createElement('script')
    script.src = `/app-admin-panel.js?v=${encodeURIComponent(VERSION)}`
    script.onload = done
    script.onerror = () => { panelLoading = null; fail() }
    document.head.append(script)
  }))

  function attachLinks() {
    const dashboard = [...document.querySelectorAll('h1')].find(node => node.textContent.trim() === '대시보드')?.parentElement?.parentElement
    if (route() !== '#/admin/dashboard' || !dashboard) {
      document.getElementById('church-app-install')?.remove()
      return
    }
    if (dashboard.querySelector('[aria-label="교인 소통 앱"]')) return
    const section = document.createElement('section')
    section.id = 'church-app-install'
    section.style.cssText = 'background:#fff;border:1px solid #eaecf0;border-radius:14px;padding:24px;margin-bottom:24px;'
    const title = document.createElement('h2')
    title.textContent = '교인 소통 앱'
    title.style.cssText = 'font-size:1rem;font-weight:800;color:#0f2040;margin-bottom:12px;'
    const nav = document.createElement('nav')
    nav.setAttribute('aria-label', '교인 소통 앱')
    nav.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px 24px;'
    for (const [label, href] of [
      ['신애교회 앱관리 (회원 승인·공지·투표·일정)', APP_VIEW],
      ['안드로이드 앱 다운로드 (최신)', 'https://shinae-community.pages.dev/downloads/latest.apk'],
      ['아이폰 웹앱 설치 안내', 'https://shinae-community.pages.dev/install-iphone.html'],
      ['교인 가입 안내·QR (/join)', 'https://shinae-community.pages.dev/join'],
      ['교인앱 PC 백업 (PC 크롬·엣지)', 'https://shinae-community.pages.dev/?tab=backup'],
    ]) {
      const link = document.createElement('a')
      link.href = href
      link.textContent = label
      link.style.cssText = 'color:#155e45;font-size:.875rem;padding:12px 0;text-decoration:underline;text-underline-offset:4px;'
      nav.append(link)
    }
    const notice = document.createElement('p')
    notice.textContent = '교인앱 관리는 앱 관리자 계정으로 로그인합니다(홈페이지 관리자 계정과 별개). 아이폰은 Safari에서 홈 화면에 추가해 주세요.'
    notice.style.cssText = 'color:#667085;font-size:.8rem;line-height:1.8;margin-top:8px;'
    section.append(title, nav, notice)
    dashboard.insertBefore(section, dashboard.children[1] || null)
  }

  // 사이드바 끝에 「교인 소통 앱 › 신애교회 앱관리」 — 기존 묶음 이름·링크 모양을 그대로 복제한다
  const paint = (a, active) => {
    a.style.background = active ? 'rgba(29, 78, 216, 0.5)' : 'transparent'
    a.style.color = active ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.55)'
    a.style.fontWeight = active ? '700' : '400'
  }
  function attachMenu() {
    const nav = document.querySelector('aside nav')
    const home = nav?.querySelector('a[href="#/admin/dashboard"]')
    const label = nav?.querySelector(':scope > div > p')
    if (!nav || !home || !label) return
    let group = nav.querySelector('[data-church-app-menu]')
    if (!group) {
      group = document.createElement('div')
      group.setAttribute('data-church-app-menu', '')
      group.style.cssText = 'margin-bottom:24px;'
      const title = label.cloneNode(false)
      title.textContent = '교인 소통 앱'
      const link = home.cloneNode(false)
      link.href = APP_VIEW
      const icon = document.createElement('span')
      icon.style.cssText = 'font-size:.9rem;'
      icon.textContent = '📱'
      link.append(icon, '신애교회 앱관리')
      group.append(title, link)
    }
    if (nav.lastElementChild !== group) nav.append(group)
    // 「관리자 계정 설정」 바로 아래에 「비상용 계정 관리」(10/8) — 같은 모양을 복제
    const accounts = nav.querySelector('a[href="#/admin/accounts"]')
    const holder = accounts?.parentElement
    if (accounts && holder && holder.parentElement && !nav.querySelector('[data-church-emergency-menu]')) {
      const item = document.createElement('div')
      item.setAttribute('data-church-emergency-menu', '')
      item.style.cssText = holder.getAttribute('style') || ''
      const link = accounts.cloneNode(false)
      link.href = EMERGENCY_VIEW
      const icon = document.createElement('span')
      icon.style.cssText = 'font-size:.9rem;'
      icon.textContent = '🛟'
      link.append(icon, '비상용 계정 관리')
      item.append(link)
      holder.after(item)
    }
    const emergencyLink = nav.querySelector('[data-church-emergency-menu] a')
    if (emergencyLink) {
      const onEmergency = isEmergency()
      paint(emergencyLink, onEmergency)
      if (accounts && onEmergency) { accounts.dataset.churchDimmed = '1'; paint(accounts, false) }
      else if (accounts && accounts.dataset.churchDimmed) { delete accounts.dataset.churchDimmed; paint(accounts, route() === '#/admin/accounts') }
    }
    const on = isAppView()
    paint(group.querySelector('a'), on)
    if (on && !home.dataset.churchDimmed) { home.dataset.churchDimmed = '1'; paint(home, false) }
    else if (!on && home.dataset.churchDimmed) { delete home.dataset.churchDimmed; paint(home, route() === '#/admin/dashboard') }
  }

  // 본문: ?view=app 이면 원래 본문을 숨기고 앱 칸, 아니면 되돌린다
  function attachAppView() {
    const main = document.querySelector('main')
    const content = main?.querySelector(':scope > div:not([data-church-app-host]):nth-child(2)')
    const existing = document.querySelector('[data-church-app-host]')
    if (!isAppView() || !main || !content) {
      if (existing) { unmount?.(); unmount = null; existing.remove() }
      for (const node of document.querySelectorAll('[data-church-hidden]')) {
        node.style.display = node.dataset.churchDisplay || ''
        delete node.dataset.churchHidden; delete node.dataset.churchDisplay
      }
      return
    }
    if (!content.dataset.churchHidden) {
      content.dataset.churchDisplay = content.style.display
      content.dataset.churchHidden = '1'
      content.style.display = 'none'
    }
    if (existing) return
    const host = document.createElement('div')
    host.setAttribute('data-church-app-host', '')
    const top = main.children[0]?.getBoundingClientRect().height || 56
    host.style.cssText = `padding:16px 32px 20px;height:calc(100vh - ${Math.round(top)}px);display:flex;flex-direction:column;box-sizing:border-box;min-width:0;`
    content.after(host)
    loadPanel()
      .then(() => { if (host.isConnected) unmount = window.ChurchAppAdmin.mount(host) })
      .catch(() => { host.textContent = '앱관리 화면을 불러오지 못했습니다. 새로고침해 주세요.' })
  }

  // 관리자 계정 설정 = 앱 관리자(연동), 비상용 계정 관리 = 홈페이지 전용 계정(10/8)
  function attachAccountsNote() {
    const main = document.querySelector('main')
    const content = main?.children[1]
    const note = document.getElementById('church-accounts-note')
    if (route() !== '#/admin/accounts' || !content) { note?.remove(); return }
    const emergency = isEmergency()
    const kind = emergency ? 'emergency' : 'app'
    if (note && note.dataset.kind !== kind) note.remove()
    if (!document.getElementById('church-accounts-note')) {
      const box = document.createElement('div')
      box.id = 'church-accounts-note'
      box.dataset.kind = kind
      box.style.cssText = `background:${emergency ? '#fff7ed' : '#ecfdf3'};border:1px solid ${emergency ? '#fed7aa' : '#b7e4c7'};border-radius:12px;padding:14px 18px;margin:0 0 18px;color:${emergency ? '#7c2d12' : '#14532d'};font-size:.85rem;line-height:1.7;`
      const title = document.createElement('strong')
      const body = document.createElement('p')
      body.style.cssText = 'margin:4px 0 0;'
      if (emergency) {
        title.textContent = '비상용 계정 — 앱 서버가 멈췄을 때만 씁니다'
        body.textContent = '홈페이지 전용 계정입니다. 평소 관리자는 「관리자 계정 설정」(교인앱 관리자와 연동)에서 다루세요. 비상용 계정은 하나 이상 남겨 두어야 합니다.'
      } else {
        title.textContent = '교인앱 관리자와 연동된 목록입니다'
        body.textContent = '여기서 만들면 교인앱에도 관리자 계정이 생기고, 앱 교인 관리에서 관리자로 지정한 사람도 여기에 보입니다. 「삭제」는 관리자 자격만 빼고 앱 계정은 그대로 둡니다.'
      }
      box.append(title, body)
      content.prepend(box)
    }
    const heading = [...content.querySelectorAll('h1')].find(h => /관리자 계정 설정|비상용 계정 관리/.test(h.textContent))
    if (heading) {
      const want = emergency ? '비상용 계정 관리' : '관리자 계정 설정'
      if (heading.textContent.trim() !== want) heading.textContent = want
    }
  }

  // 같은 화면(관리자 계정)에서 연동 ↔ 비상용으로 바뀌면 목록을 새로 받도록 다시 연다(화면이 주소 뒷부분만 바뀌면 다시 안 부른다)
  let lastAccounts = route() === '#/admin/accounts' ? String(isEmergency()) : null
  window.addEventListener('hashchange', () => {
    const now = route() === '#/admin/accounts' ? String(isEmergency()) : null
    if (lastAccounts !== null && now !== null && now !== lastAccounts) location.reload()
    lastAccounts = now
  })

  function update() { attachLinks(); attachMenu(); attachAppView(); attachAccountsNote() }
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('hashchange', update)
  update()
})()
