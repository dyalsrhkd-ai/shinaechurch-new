// 「신애교회 앱관리」 — 운영 관리자 화면(가짜 로그인, 쓰기 차단) + 로컬 다리/칸 스크립트 + 로컬 데모 앱
// 운영 파일은 바꾸지 않는다: 다리·칸 스크립트 요청만 로컬 파일로 바꿔 끼우고, 앱은 shinae-community 데모(5193)를 띄운다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
const APP_DIR = fileURLToPath(new URL('../../shinae-community/', import.meta.url))
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5193', '--strictPort'], { cwd: APP_DIR, stdio: 'ignore' })
await new Promise(r => setTimeout(r, 5000))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const problems = []
async function openAdmin(viewport) {
  const page = await browser.newPage({ viewport })
  await page.addInitScript(() => { window.CHURCH_APP_URL = 'http://app.test/?embed=admin' })
  // 공개 사이트가 127.0.0.1 을 품으면 브라우저가 막는다(사설망 차단) → 가짜 주소 app.test 로 띄우고 로컬 데모로 대신 받아 준다
  await page.route('http://app.test/**', async r => { const res = await r.fetch({ url: r.request().url().replace('http://app.test', 'http://127.0.0.1:5193') }); await r.fulfill({ response: res }) })
  await page.route('**/app-install-links-20261002.js*', r => r.fulfill({ contentType: 'text/javascript', body: readFileSync('public/app-install-links.js', 'utf8') }))
  await page.route('**/app-admin-panel.js*', r => r.fulfill({ contentType: 'text/javascript', body: readFileSync('public/app-admin-panel.js', 'utf8') }))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    // 10/8 계정 통일: 앱 관리자로 로그인하면 응답에 앱 토큰(appSession)이 온다
    if (url.pathname.endsWith('/auth.php') && url.searchParams.get('action') === 'login') return route.fulfill({ json: { ok: true, user: { uid: 'app-fixture', displayName: 'UI test', mustChangePassword: false }, csrfToken: 'test-only', appSession: { access_token: 'access-fixture', refresh_token: 'refresh-fixture' } } })
    if (url.pathname.endsWith('/auth.php') && url.searchParams.get('action') === 'me') return route.fulfill({ json: { ok: true, user: { uid: 'app-admin-fixture', displayName: 'UI test', mustChangePassword: false }, csrfToken: 'test-only' } })
    if (route.request().method() !== 'GET') return route.fulfill({ json: { ok: true } })
    if (url.pathname.endsWith('/runtime.php')) return route.fulfill({ json: { ok: true, summary: { todayVisits: 0, weekVisits: 0, monthVisits: 0, yearVisits: 0, totalVisits: 0 }, logs: [] } })
    if (url.pathname.endsWith('/live.php')) return route.fulfill({ json: { ok: true, live: {} } })
    return route.continue()
  })
  await page.goto(`http://www.shinaechurch.co.kr/?app-admin-test=${Date.now()}#/admin/dashboard`)
  await page.getByRole('heading', { name: '대시보드', exact: true }).waitFor()
  return page
}
const appFrame = page => page.frames().find(f => f.url().startsWith('http://app.test/'))
async function frameState(page) {
  return appFrame(page).evaluate(() => {
    const rail = document.querySelector('.right-column')
    return { w: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth, rail: !!rail && getComputedStyle(rail).display !== 'none', embed: document.documentElement.classList.contains('embed-admin') }
  })
}
const widthBox = page => page.getByLabel('앱 화면 폭(px)')
const shapeButton = (page, name) => page.locator('[data-church-app-admin] [role=group] button', { hasText: name })
try {
  // 데스크톱 1440: 메뉴 → 칸, 3모양 × 탭 5개
  let page = await openAdmin({ width: 1440, height: 900 })
  // 로그인 응답의 앱 토큰을 다리 스크립트가 이 탭에 보관한다(로그인 화면 대신 같은 요청을 직접 보냄)
  await page.evaluate(() => fetch('/api/auth.php?action=login', { method: 'POST', body: '{}' }))
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('church-app-session') || 'null')?.access_token === 'access-fixture')
  const menu = page.locator('aside [data-church-app-menu] a')
  await menu.waitFor({ timeout: 10000 })
  assert.equal(await menu.getAttribute('href'), '#/admin/dashboard?view=app')
  assert.match(await menu.textContent(), /신애교회 앱관리/)
  await menu.click()
  const host = page.locator('[data-church-app-admin]')
  await host.waitFor()
  assert.equal(await page.getByRole('heading', { name: '대시보드', exact: true }).isVisible(), false, '대시보드 본문은 숨김')
  assert.equal(await page.locator('[data-church-app-admin] [role=group] button').count(), 3)
  assert.equal(await widthBox(page).inputValue(), '412')
  await page.waitForFunction(() => document.querySelector('[data-church-app-admin] iframe')?.src.includes('embed=admin'))
  await page.waitForTimeout(3000)
  // 토큰을 넘겨받아 로그인 화면 없이 바로 관리자로 들어와 있어야 한다(데모는 관리자 데모로 입장)
  await appFrame(page).locator('.mobile-nav').getByRole('button', { name: '교인 관리' }).waitFor({ timeout: 10000 })
  assert.equal(await appFrame(page).getByRole('button', { name: /관리자로 입장/ }).count(), 0, '앱관리에서 다시 로그인하지 않음')
  for (const [shape, w] of [['작은 폰', 344], ['보통 폰', 412], ['넓은 화면', 860]]) {
    await shapeButton(page, shape).click(); await page.waitForTimeout(700)
    const s = await frameState(page)
    assert.equal(s.w, w, `${shape} 폭`); assert.equal(s.embed, true, '관리 모드')
    assert.equal(await page.locator('[data-church-app-admin] [data-device]').evaluate(e => getComputedStyle(e).transform), 'none', '흐림 금지: transform 없음')
    const navSel = w > 700 ? '.sidebar nav' : '.mobile-nav'
    for (const tab of ['나눔', '교회일정', '신애톡', '교회소식', '교인 관리']) {
      await appFrame(page).locator(navSel).getByRole('button', { name: tab }).click(); await page.waitForTimeout(600)
      const t = await frameState(page)
      if (t.overflow > 1) problems.push(`${shape}·${tab}: 가로 넘침 ${t.overflow}px`)
      if (t.rail) problems.push(`${shape}·${tab}: 함께 묵상해요 보임`)
      if (tab === '교회일정') await page.screenshot({ path: `dist-footer-backup/app-admin-${w}-calendar.png` })
    }
    await appFrame(page).locator(navSel).getByRole('button', { name: '나눔' }).click(); await page.waitForTimeout(500)
    await page.screenshot({ path: `dist-footer-backup/app-admin-${w}.png` })
  }
  // 폭 칸: 1500 → 1200 으로 묶이고, 줄여 그려도 앱 안 폭은 1200(zoom), 넓은 PC 칸 없음
  await widthBox(page).fill('1500'); await widthBox(page).press('Enter'); await page.waitForTimeout(800)
  assert.equal(await widthBox(page).inputValue(), '1200')
  const big = await frameState(page)
  assert.equal(big.w, 1200, '1200 폭'); assert.equal(big.rail, false, '1200 에서도 함께 묵상해요 없음')
  await page.screenshot({ path: 'dist-footer-backup/app-admin-1200.png' })
  // 손잡이 끌기: 넓어진다
  await shapeButton(page, '보통 폰').click(); await page.waitForTimeout(400)
  const grip = await page.locator('[data-church-app-admin] [data-grip]').boundingBox()
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2); await page.mouse.down()
  await page.mouse.move(grip.x + grip.width / 2 + 60, grip.y + grip.height / 2, { steps: 6 }); await page.mouse.up()
  assert.ok(Number(await widthBox(page).inputValue()) > 412, '손잡이로 넓어짐')
  // 고른 폭은 기억한다(다시 열면 그대로)
  const remembered = await widthBox(page).inputValue()
  // 대시보드로 돌아가면 원래 본문
  await page.locator('aside nav a[href="#/admin/dashboard"]').click(); await page.waitForTimeout(600)
  assert.equal(await host.count(), 0, '앱 칸 사라짐')
  assert.ok(await page.getByRole('heading', { name: '대시보드', exact: true }).isVisible(), '대시보드 복귀')
  await menu.click(); await host.waitFor(); await page.waitForTimeout(300)
  assert.equal(await widthBox(page).inputValue(), remembered, '고른 폭 기억')
  // 관리자 계정 설정 = 앱 관리자 연동 안내, 바로 아래 「비상용 계정 관리」 메뉴 → 홈페이지 계정 쪽(scope=emergency)으로 요청
  await page.evaluate(() => { location.hash = '#/admin/accounts' }); await page.waitForTimeout(1500)
  assert.match(await page.locator('#church-accounts-note').textContent(), /연동/)
  const emergencyMenu = page.locator('aside [data-church-emergency-menu] a')
  assert.match(await emergencyMenu.textContent(), /비상용 계정 관리/)
  const scoped = page.waitForRequest(r => r.url().includes('/api/admin-users.php') && r.url().includes('scope=emergency'), { timeout: 15000 })
  // 10/12 요셉님: 「바로 안 바뀐다」 — 페이지 전체를 새로고침하지 말고 그 화면만 다시 열어야 한다
  await page.evaluate(() => { window.__noReload = 1 })
  await emergencyMenu.click()
  await scoped
  await page.waitForTimeout(1500)
  assert.match(await page.locator('#church-accounts-note').textContent(), /비상용 계정/)
  assert.equal(await page.evaluate(() => window.__noReload), 1, '비상용 계정 관리로 갈 때 새로고침 없음')
  assert.equal(await page.evaluate(() => location.hash), '#/admin/accounts?scope=emergency', '주소 그대로')
  // 다시 관리자 계정 설정으로: 연동 목록을 새로 받는다(scope 없이)
  const unscoped = page.waitForRequest(r => r.url().includes('/api/admin-users.php') && !r.url().includes('scope=emergency'), { timeout: 15000 })
  await page.locator('aside a[href="#/admin/accounts"]').click()
  await unscoped
  await page.waitForTimeout(800)
  assert.match(await page.locator('#church-accounts-note').textContent(), /연동/)
  assert.equal(await page.evaluate(() => window.__noReload), 1, '관리자 계정 설정으로 돌아갈 때도 새로고침 없음')
  await page.locator('aside [data-church-emergency-menu] a').click(); await page.waitForTimeout(1500)
  assert.match(await page.locator('#church-accounts-note').textContent(), /비상용 계정/)
  await page.screenshot({ path: 'dist-footer-backup/admin-emergency-accounts.png' })
  // 로그아웃하면 보관한 앱 토큰을 지운다
  await page.evaluate(() => fetch('/api/auth.php?action=logout', { method: 'POST' }))
  await page.waitForFunction(() => sessionStorage.getItem('church-app-session') === null)
  await page.close()
  // 태블릿 1024·768: 넓은 화면은 zoom 으로 맞추고 앱 안 폭은 860, 페이지 가로 넘침 없음
  for (const vp of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
    page = await openAdmin(vp)
    // 900px 이하는 관리자 메뉴가 서랍(☰) — 사람처럼 열고 누른다(누르면 서랍이 닫힌다)
    if (vp.width <= 900) { await page.locator('.admin-nav-toggle').click(); await page.waitForTimeout(400) }
    await page.locator('aside [data-church-app-menu] a').click(); await page.locator('[data-church-app-admin]').waitFor(); await page.waitForTimeout(2500)
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('admin-nav-open')), false, '메뉴 누르면 서랍 닫힘')
    await shapeButton(page, '넓은 화면').click(); await page.waitForTimeout(800)
    assert.equal((await frameState(page)).w, 860, `${vp.width} 넓은 화면 앱 폭`)
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    if (pageOverflow > 1) problems.push(`관리자 ${vp.width}: 가로 넘침 ${pageOverflow}px`)
    await page.screenshot({ path: `dist-footer-backup/app-admin-tablet-${vp.width}.png` })
    await page.close()
  }
  assert.deepEqual(problems, [])
  console.log('app-admin-browser: PASS')
} finally { await browser.close(); vite.kill() }
