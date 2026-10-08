// Dashboard-only deployment bridge. Future full builds use Dashboard.jsx / AppAdmin.jsx directly.
// 10/8 「신애교회 앱관리」: 사이드바 끝에 메뉴, #/admin/dashboard?view=app 이면 본문을 앱 띄우는 칸(app-admin-panel.js)으로
(() => {
  const APP_VIEW = '#/admin/dashboard?view=app'
  const route = () => location.hash.split('?')[0].replace(/\/$/, '')
  const isAppView = () => route() === '#/admin/dashboard' && new URLSearchParams(location.hash.split('?')[1] || '').get('view') === 'app'
  let panelLoading = null, unmount = null
  // 10/8 계정 통일: 홈페이지 로그인 응답의 앱 토큰(appSession)을 이 탭에만 보관 → 앱관리 칸이 다시 로그인하지 않게. 로그아웃하면 지운다
  const SESSION_KEY = 'church-app-session'
  if (window.fetch && !window.fetch.churchWrapped) {
    const original = window.fetch.bind(window)
    const wrapped = async (input, init) => {
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
    script.src = '/app-admin-panel.js?v=20261008'
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

  // 관리자 계정 설정(10/8): 정식 관리자는 앱에서, 여기서 만드는 계정은 비상용이라고 알린다. 앱 계정 줄은 「앱 계정」으로
  function attachAccountsNote() {
    const main = document.querySelector('main')
    const content = main?.children[1]
    const note = document.getElementById('church-accounts-note')
    if (route() !== '#/admin/accounts' || !content) { note?.remove(); return }
    if (!note) {
      const box = document.createElement('div')
      box.id = 'church-accounts-note'
      box.style.cssText = 'background:#ecfdf3;border:1px solid #b7e4c7;border-radius:12px;padding:14px 18px;margin:0 0 18px;color:#14532d;font-size:.85rem;line-height:1.7;'
      const title = document.createElement('strong')
      title.textContent = '관리자 계정은 교인앱 계정으로 통일했습니다'
      const body = document.createElement('p')
      body.style.cssText = 'margin:4px 0 0;'
      body.textContent = '정식 관리자는 교인앱에서 가입 → 승인 → 교인 관리에서 역할을 「관리자」로 지정하면 홈페이지에도 그 계정으로 들어옵니다. 여기서 만드는 계정은 앱 서버가 멈췄을 때만 쓰는 비상용입니다.'
      const link = document.createElement('a')
      link.href = APP_VIEW
      link.textContent = '신애교회 앱관리 열기 →'
      link.style.cssText = 'display:inline-block;margin-top:6px;color:#155e45;font-weight:700;'
      box.append(title, body, link)
      content.prepend(box)
    }
    for (const cell of content.querySelectorAll('td, span, p, div')) {
      if (cell.children.length === 0 && /^app-[0-9a-f-]{36}$/.test(cell.textContent.trim())) {
        cell.textContent = '앱 계정(앱 교인 관리에서 관리)'
        cell.style.color = '#155e45'
      }
    }
  }

  function update() { attachLinks(); attachMenu(); attachAppView(); attachAccountsNote() }
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('hashchange', update)
  update()
})()
