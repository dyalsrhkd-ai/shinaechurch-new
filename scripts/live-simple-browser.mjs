// 10/12 라이브 방송 간편 화면 — 운영 관리자 화면(가짜 로그인·가짜 API, 쓰기 차단) + 로컬 다리/간편 화면 스크립트
// 운영 서버에는 아무것도 보내지 않는다: /api/** 는 전부 이 시험이 대신 답한다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
// 내려받기 때 시험 브라우저가 연 빈 탭이 닫히면서 playwright 내부에서 TargetClosedError 가 난다 — 시험 대상과 무관해서 이것만 무시
process.on('uncaughtException', error => { if (error && error.name === 'TargetClosedError') return; console.error(error); process.exit(1) })
const base = () => ({
  setting: { enabled: false, title: '대예배 실시간 예배 영상', youtubeUrl: 'UCabcdefghijklmnopqrstuv', youtubeChromeProfileName: '', currentVideoId: '', accessPassword: '1004', accessKey: 'sharekey123', sermonTitle: '', scriptureTitle: '' },
  agent: { seenAgo: 5, obsConnected: true, streamActive: false, currentVideoId: '', chromeProfiles: [{ dir: 'Default', name: '방송실', email: '' }, { dir: 'Profile 3', name: '신애교회', email: 'church@gmail.com' }] },
  command: null,
})
let state = base()
const calls = []

async function open(viewport, hash = '#/admin/live-streams/main') {
  const page = await browser.newPage({ viewport })
  await page.route('**/app-install-links-20261002.js*', r => r.fulfill({ contentType: 'text/javascript', body: readFileSync('public/app-install-links.js', 'utf8') }))
  await page.route('**/live-simple-panel.js*', r => r.fulfill({ contentType: 'text/javascript', body: readFileSync('public/live-simple-panel.js', 'utf8') }))
  await page.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url())
    const action = url.searchParams.get('action')
    if (url.pathname.endsWith('/auth.php') && action === 'me') return route.fulfill({ json: { ok: true, user: { uid: 'u', displayName: 'UI test', mustChangePassword: false }, csrfToken: 'csrf-test' } })
    if (url.pathname.endsWith('/live.php')) {
      if (action === 'admin') return route.fulfill({ json: { ok: true, live: { streamKey: url.searchParams.get('streamKey'), ...structuredClone(state) } } })
      const body = JSON.parse(req.postData() || '{}')
      calls.push({ action, body, csrf: req.headers()['x-csrf-token'] })
      if (action === 'save') { state.setting = { ...body.setting }; return route.fulfill({ json: { ok: true, setting: state.setting } }) }
      if (action === 'issue-agent') return route.fulfill({ status: 201, json: { ok: true, agent: { agentKey: body.agentKey, agentToken: 'issued-token-1234567890abcdef', streamKeys: body.streamKeys } } })
      if (action === 'command') {
        state.command = { desiredState: body.desiredState, status: 'pending', error: '' }
        // 방송 PC 흉내: 1초 뒤 받음, 2초 뒤 OBS, 3초 뒤 유튜브 영상
        setTimeout(() => { state.command.status = 'completed'; if (body.desiredState === 'stop') state.agent.streamActive = false }, 1000)
        if (body.desiredState === 'start') {
          setTimeout(() => { state.agent.streamActive = true }, 2000)
          setTimeout(() => { state.setting.currentVideoId = 'abcdefghijk' }, 3000)
        }
        return route.fulfill({ status: 201, json: { ok: true, command: state.command } })
      }
    }
    if (req.method() !== 'GET') return route.fulfill({ json: { ok: true } })
    if (url.pathname.endsWith('/runtime.php')) return route.fulfill({ json: { ok: true, summary: { todayVisits: 0, weekVisits: 0, monthVisits: 0, yearVisits: 0, totalVisits: 0 }, logs: [] } })
    return route.continue()
  })
  await page.goto(`http://www.shinaechurch.co.kr/?live-simple-test=${Date.now()}${hash}`)
  await page.locator('[data-church-live-host] .cls').waitFor({ timeout: 20000 })
  await page.waitForTimeout(800)
  return page
}
const big = page => page.locator('.cls .big')
const light = page => page.locator('.cls .light')

try {
  // 1) 방송 PC 꺼짐: 빨간불, 시작 못 함
  state = base(); state.agent.seenAgo = 900
  let page = await open({ width: 1440, height: 900 })
  assert.match(await page.locator('[data-church-live-host] h1').textContent(), /대예배 방송/)
  assert.equal(await page.evaluate(() => document.querySelector('main > [data-church-hidden="live"]')?.style.display), 'none', '원래 입력 화면은 숨김')
  assert.match(await light(page).textContent(), /꺼져 있습니다/)
  assert.equal(await big(page).isDisabled(), true, '꺼져 있으면 시작 못 함')

  // 2) 켜짐 → 설교 제목 적고 시작 → 저장 다음 명령, 다른 칸 그대로
  state.agent.seenAgo = 3; await page.waitForTimeout(2500)
  assert.match(await light(page).textContent(), /준비됨/)
  assert.match(await big(page).textContent(), /방송 시작/)
  await page.locator('.cls input').nth(0).fill('벽을 깨는 치유')
  await page.locator('.cls input').nth(1).fill('누가복음 17장')
  await big(page).click()
  await page.waitForTimeout(500)
  assert.deepEqual(calls.map(c => c.action), ['save', 'command'], '저장한 뒤 시작 명령')
  assert.equal(calls[0].csrf, 'csrf-test')
  assert.equal(calls[0].body.setting.sermonTitle, '벽을 깨는 치유')
  assert.equal(calls[0].body.setting.accessKey, 'sharekey123', '다른 칸은 지우지 않는다')
  assert.equal(calls[0].body.setting.youtubeUrl, 'UCabcdefghijklmnopqrstuv')
  assert.equal(calls[1].body.desiredState, 'start')
  // 진행 단계가 차례로 채워지고 방송 중으로
  await page.waitForFunction(() => document.querySelectorAll('.cls .steps li.done').length === 3, null, { timeout: 15000 })
  assert.match(await light(page).textContent(), /방송 중/)
  assert.match(await big(page).textContent(), /끝내기/)

  // 3) 끝내기: 한 번 누르면 확인만, 두 번째에 종료 명령
  await big(page).click(); await page.waitForTimeout(300)
  assert.match(await big(page).textContent(), /한 번 더/)
  assert.equal(calls.filter(c => c.action === 'command').length, 1, '첫 번째 누름은 확인만')
  await big(page).click(); await page.waitForTimeout(400)
  assert.equal(calls.at(-1).body.desiredState, 'stop')
  await page.waitForFunction(() => /방송 시작/.test(document.querySelector('.cls .big').textContent), null, { timeout: 10000 })

  // 4) 처음 설정: 방송 PC가 보낸 계정 목록에서 고르기, 저장해도 설교 제목 유지
  await page.locator('.cls details summary').click()
  const options = await page.locator('.cls select option').allTextContents()
  assert.ok(options.some(t => /자동/.test(t)) && options.some(t => /church@gmail.com/.test(t)), `계정 목록: ${options}`)
  await page.locator('.cls select').selectOption('Profile 3')
  await page.locator('.cls details input').nth(1).fill('주일 예배 생중계')
  calls.length = 0
  await page.getByRole('button', { name: '설정 저장' }).click(); await page.waitForTimeout(500)
  assert.equal(calls[0].body.setting.youtubeChromeProfileName, 'Profile 3')
  assert.equal(calls[0].body.setting.title, '주일 예배 생중계')
  assert.equal(calls[0].body.setting.sermonTitle, '벽을 깨는 치유', '설정 저장이 설교 제목을 지우지 않는다')
  await page.waitForTimeout(2500)
  assert.equal(await page.locator('.cls select').inputValue(), 'Profile 3', '저장 뒤에도 고른 값 유지')
  // 잘못된 채널은 저장 안 함
  await page.locator('.cls details input').nth(0).fill('https://www.youtube.com/@shinae')
  calls.length = 0
  await page.getByRole('button', { name: '설정 저장' }).click(); await page.waitForTimeout(300)
  assert.equal(calls.length, 0); assert.match(await page.locator('.cls details .msg').textContent(), /찾지 못했습니다/)

  // 4-2) 방송 PC 등록: 열쇠를 발급받아 그 EXE 가 읽는 이름의 설정 파일로 내려받는다
  await page.locator('.cls .pcreg input[type=password]').fill('obs-pass-1')
  calls.length = 0
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.cls .pcreg button.save').click()])
  assert.equal(download.suggestedFilename(), 'live-agent.main.json')
  const issued = calls.find(c => c.action === 'issue-agent')
  assert.deepEqual([issued.body.agentKey, issued.body.streamKeys, issued.csrf], ['main-pc', ['main'], 'csrf-test'])
  const config = JSON.parse(readFileSync(await download.path(), 'utf8'))
  assert.equal(config.apiBaseUrl, 'http://www.shinaechurch.co.kr')
  assert.deepEqual([config.agentId, config.agentToken, config.obsPassword, config.obsUrl], ['main-pc', 'issued-token-1234567890abcdef', 'obs-pass-1', 'ws://127.0.0.1:4444'])
  assert.deepEqual(config.managedStreamKeys, ['main'])
  assert.match(await page.locator('.cls .pcreg .msg').textContent(), /ShinaeLiveMain\.exe/)

  // 5) 다른 메뉴로 가면 원래 화면, 다른 부서로 가면 그 부서
  await page.evaluate(() => { location.hash = '#/admin/dashboard' }); await page.waitForTimeout(1500)
  assert.equal(await page.locator('[data-church-live-host]').count(), 0, '간편 화면 사라짐')
  assert.equal(await page.locator('[data-church-hidden]').count(), 0, '숨긴 본문 되돌림')
  await page.evaluate(() => { location.hash = '#/admin/live-streams/youth' })
  await page.locator('[data-church-live-host] h1', { hasText: '중고등부 방송' }).waitFor({ timeout: 10000 })
  // 중고등부·청년부 한 대로: 통합 EXE 가 읽는 이름·두 부서
  await page.locator('.cls details summary').click()
  await page.locator('.cls .pcreg input[type=checkbox]').check()
  calls.length = 0
  const [both] = await Promise.all([page.waitForEvent('download'), page.locator('.cls .pcreg button.save').click()])
  assert.equal(both.suggestedFilename(), 'live-agent.youth-young.json')
  assert.deepEqual(calls.find(c => c.action === 'issue-agent').body.streamKeys, ['youth', 'young'])
  const bothConfig = JSON.parse(readFileSync(await both.path(), 'utf8'))
  assert.deepEqual([bothConfig.agentId, bothConfig.managedStreamKeys], ['youth-young-pc', ['youth', 'young']])
  assert.match(await page.locator('.cls .pcreg .msg').textContent(), /ShinaeLiveYouthYoung\.exe/)
  await page.screenshot({ path: 'dist-footer-backup/live-simple-1440.png' })
  // 내려받기 때 시험 브라우저가 빈 탭을 하나 더 열어서 여기서 닫으면 playwright 가 멈춘다 → 끝에서 브라우저째 닫는다

  // 6) 채널 없음 → 처음 설정 먼저, 휴대폰 폭에서 가로 넘침 없음
  state = base(); state.setting.youtubeUrl = ''
  page = await open({ width: 390, height: 844 })
  assert.match(await big(page).textContent(), /처음 설정/)
  assert.equal(await page.locator('.cls details').getAttribute('open'), '')
  const overflow = await page.evaluate(() => { const h = document.querySelector('[data-church-live-host] .cls'); return h.scrollWidth - h.clientWidth })
  assert.ok(overflow <= 1, `간편 화면 가로 넘침 ${overflow}px`)
  await page.screenshot({ path: 'dist-footer-backup/live-simple-390.png', fullPage: true })
  await page.close()
  console.log('live-simple-browser: PASS')
} catch (error) { console.error('live-simple-browser: FAIL', error); process.exitCode = 1 } finally { await browser.close() }
