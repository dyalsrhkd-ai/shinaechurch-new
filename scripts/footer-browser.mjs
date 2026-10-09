import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('http://www.shinaechurch.co.kr/', { waitUntil: 'domcontentloaded' })
    await page.locator('footer').waitFor({ timeout: 20000 })
    await page.waitForLoadState('networkidle')
    assert.equal(await page.locator('a[href*="shinae-community.pages.dev"]').count(), 0, 'No app links on public homepage')
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `dist-footer-backup/public-footer-restored-${width}.png` })
  }
  await page.goto('http://www.shinaechurch.co.kr/#/admin/dashboard')
  await page.waitForURL('**/#/admin/login')
  assert.equal(await page.locator('nav[aria-label="교인 소통 앱"]').count(), 0)
  // Existing protected dashboard rendering is tested with a controlled auth response.
  // No production login credentials are changed, and all API writes are intercepted.
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/auth.php') && url.searchParams.get('action') === 'me') {
      return route.fulfill({ json: { ok: true, user: { uid: 'dashboard-ui-fixture', displayName: 'UI test', mustChangePassword: false }, csrfToken: 'test-only' } })
    }
    if (route.request().method() !== 'GET') return route.fulfill({ json: { ok: true } })
    if (url.pathname.endsWith('/runtime.php')) return route.fulfill({ json: { ok: true, summary: { todayVisits: 0, weekVisits: 0, monthVisits: 0, yearVisits: 0, totalVisits: 0 }, logs: [] } })
    if (url.pathname.endsWith('/live.php')) return route.fulfill({ json: { ok: true, live: {} } })
    return route.continue()
  })
  // A changed query forces a document navigation so the auth provider reloads the fixture.
  await page.goto('http://www.shinaechurch.co.kr/?dashboard-link-test=1#/admin/dashboard')
  await page.getByRole('heading', { name: '대시보드', exact: true }).waitFor()
  const nav = page.locator('main nav[aria-label="교인 소통 앱"]')
  await nav.waitFor()
  assert.equal(await nav.locator('a').count(), 5)
  // 앱 관리는 앱 계정으로 — 홈페이지 관리자 계정과 별개라는 안내가 함께 있어야 한다
  // 10/8: 첫 링크는 관리자 화면 안 「신애교회 앱관리」로
  assert.equal(await nav.getByRole('link', { name: /신애교회 앱관리/ }).getAttribute('href'), '#/admin/dashboard?view=app')
  assert.ok(await page.getByText('홈페이지 관리자 계정과 별개', { exact: false }).count())
  assert.equal(await nav.getByRole('link', { name: /안드로이드/ }).getAttribute('href'), 'https://shinae-community.pages.dev/downloads/latest.apk')
  assert.equal(await nav.getByRole('link', { name: /아이폰/ }).getAttribute('href'), 'https://shinae-community.pages.dev/install-iphone.html')
  // The admin dashboard polls live state; wait for painting, not global network silence.
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await nav.scrollIntoViewIfNeeded()
  assert.deepEqual(errors, [])
  await page.screenshot({ path: 'dist-footer-backup/admin-dashboard-links.png', animations: 'disabled' })
  // 사이드바 「신애교회 앱관리」 → 앱(관리 모드)이 틀 안에 뜬다
  const appMenu = page.locator('aside [data-church-app-menu] a')
  await appMenu.waitFor()
  await appMenu.click()
  await page.locator('[data-church-app-admin] iframe[src*="embed=admin"]').waitFor()
  await page.screenshot({ path: 'dist-footer-backup/admin-app-panel.png' })
  await page.goto('http://www.shinaechurch.co.kr/')
  await page.locator('footer').waitFor()
  assert.equal(await page.locator('nav[aria-label="교인 소통 앱"]').count(), 0)
  const apkResponse = await page.request.get('https://shinae-community.pages.dev/downloads/latest.apk')
  assert.equal(apkResponse.status(), 200)
  assert.match(apkResponse.headers()['content-type'], /application\/vnd.android.package-archive/)
  assert.match(apkResponse.headers()['content-disposition'], /attachment/)
  const bytes = await apkResponse.body()
  assert.equal(bytes.length, 9851725)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '33ae8c3e67c1c028f2686cb1cc81e94cd95b0a0ad79d07530e9562ef471af434')
  await page.goto('https://shinae-community.pages.dev/install-iphone.html')
  assert.equal(await page.getByRole('link', { name: '아이폰 웹앱 열기' }).getAttribute('href'), 'https://shinae-community.pages.dev/')
  assert.ok(await page.getByText('홈 화면에 추가', { exact: false }).count())
  console.log('PASS public footer/login have no app links; dashboard links with auth fixture; real APK bytes/hash/headers; iPhone guide')
} finally { await browser.close() }
