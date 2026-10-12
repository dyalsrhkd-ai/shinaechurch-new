// 1.0.7(10/12) 홈페이지 공지 등록 → ☐ 교인 앱에도 올리기. 운영 관리자 화면 + 로컬 다리 스크립트, API 는 전부 가짜(운영에 안 씀)
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const sent = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.route('**/app-install-links-20261002.js*', r => r.fulfill({ contentType: 'text/javascript', body: readFileSync('public/app-install-links.js', 'utf8') }))
  await page.route('**/api/**', route => {
    const req = route.request(), url = new URL(req.url())
    const action = url.searchParams.get('action')
    if (url.pathname.endsWith('/auth.php') && action === 'me') return route.fulfill({ json: { ok: true, user: { uid: 'app-fixture', displayName: 'UI test', mustChangePassword: false }, csrfToken: 'csrf-test' } })
    if (url.pathname.endsWith('/content.php') && req.method() === 'POST') {
      sent.push({ kind: 'content', body: JSON.parse(req.postData()) })
      return route.fulfill({ status: 201, json: { ok: true, document: { id: 'n1', data: JSON.parse(req.postData()).data, versionNo: 1 } } })
    }
    if (url.pathname.endsWith('/app-notice.php')) {
      sent.push({ kind: 'app', action, body: JSON.parse(req.postData()), csrf: req.headers()['x-csrf-token'] })
      return route.fulfill({ status: 201, json: { ok: true, id: 'app-notice-1' } })
    }
    if (url.pathname.endsWith('/content.php')) return route.fulfill({ json: { ok: true, documents: [] } })
    if (url.pathname.endsWith('/runtime.php') && /^lock-/.test(action || '')) return route.fulfill({ json: { ok: true, acquired: true, owned: true } }) // 편집 잠금은 내가 가진 것으로
    if (req.method() !== 'GET') return route.fulfill({ json: { ok: true } })
    if (url.pathname.endsWith('/runtime.php')) return route.fulfill({ json: { ok: true, summary: { todayVisits: 0, weekVisits: 0, monthVisits: 0, yearVisits: 0, totalVisits: 0 }, logs: [] } })
    return route.continue()
  })
  await page.goto(`http://www.shinaechurch.co.kr/?notice-test=${Date.now()}#/admin/notices`)
  const check = page.locator('#church-notice-to-app')
  await check.waitFor({ timeout: 20000 })
  assert.equal(await check.isChecked(), false, '기본은 홈페이지에만')

  const box = page.locator('main p', { hasText: '새 공지 등록' }).locator('..')
  await box.locator('input[type=date]').fill('2026-10-12')
  await box.getByPlaceholder('공지 제목').fill('성탄 예배 안내')
  await box.getByPlaceholder('공지 내용을 입력하세요.').fill('12월 24일 저녁 7시')
  // 체크 안 하면 앱으로 안 간다
  await box.getByRole('button', { name: '등록' }).click(); await page.waitForTimeout(800)
  assert.equal(sent.filter(s => s.kind === 'app').length, 0)

  await box.locator('input[type=date]').fill('2026-10-12')
  await box.getByPlaceholder('공지 제목').fill('성탄 예배 안내')
  await box.getByPlaceholder('공지 내용을 입력하세요.').fill('12월 24일 저녁 7시')
  await check.check()
  await box.getByRole('button', { name: '등록' }).click(); await page.waitForTimeout(1200)
  const app = sent.filter(s => s.kind === 'app')
  assert.equal(app.length, 1, '등록이 성공하면 한 번 앱으로')
  assert.deepEqual([app[0].action, app[0].body, app[0].csrf], ['to-app', { title: '성탄 예배 안내', content: '12월 24일 저녁 7시' }, 'csrf-test'])
  assert.match(await page.locator('#church-notice-to-app-msg').textContent(), /교인 앱에도 올렸습니다/)
  assert.equal(await check.isChecked(), false, '올린 뒤 체크는 풀린다(다음 공지에 실수로 안 가게)')
  await page.screenshot({ path: 'dist-footer-backup/notice-to-app-1440.png' })
  console.log('notice-to-app-browser: PASS')
} finally { await browser.close() }
