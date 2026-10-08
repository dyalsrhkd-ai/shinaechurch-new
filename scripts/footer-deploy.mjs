import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Exact church-host static-file deployment only. Credentials never enter argv or files.
if (process.stdin.isTTY) process.stdin.setRawMode(true)
const input = createInterface({ input: process.stdin, terminal: false })
const credential = await new Promise(done => input.once('line', done))
input.close()
if (process.stdin.isTTY) process.stdin.setRawMode(false)
process.stdin.pause()
if (!credential.startsWith('tlsdo1017:') || /[\r\n"]/.test(credential)) throw Error('Invalid deployment credential')
const backupDir = resolve('dist-footer-backup')
mkdirSync(backupDir, { recursive: true })
const quote = value => '"' + value.replaceAll('\\', '/').replaceAll('"', '\\"') + '"'
function ftp(path, extra = '') {
  const config = `url = "ftp://183.111.174.4/${path}"\nuser = ${quote(credential)}\nsilent\nshow-error\nconnect-timeout = 15\nmax-time = 45\n${extra}`
  const result = spawnSync('curl.exe', ['--config', '-'], { input: config, encoding: 'utf8', maxBuffer: 4e6 })
  if (result.status !== 0) throw Error(`Church FTP operation failed (${result.status}): ${result.stderr}`)
  return result.stdout
}
const mode = process.argv[2] || 'check'
if (mode === 'dashboard') {
  const html = ftp('index.html')
  const oldTag = '<script defer src="/app-install-links-20261002.js"></script>'
  const newTag = '<script defer src="/app-install-links-20261002.js?v=admin-only"></script>'
  if (!html.includes(oldTag) && !html.includes(newTag)) throw Error('Expected bridge tag missing; stopped')
  writeFileSync(resolve(backupDir, 'index.before-dashboard.html'), html)
  const changed = html.replace(oldTag, newTag)
  writeFileSync(resolve(backupDir, 'index.dashboard.html'), changed)
  ftp('app-install-links-20261002.js', `upload-file = ${quote(resolve('public/app-install-links.js'))}\n`)
  if (ftp('app-install-links-20261002.js') !== readFileSync('public/app-install-links.js', 'utf8')) throw Error('Dashboard script mismatch')
  ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.dashboard.html'))}\n`)
  if (ftp('index.html') !== changed) throw Error('Homepage script reference mismatch')
  console.log('Removed public footer links; deployed dashboard-only bridge with cache-busted URL.')
} else if (mode === 'app-v2') {
  // 2026-10-06 교인앱 v2: 대시보드 칸에 「교인앱 관리」 + APK 1.1. 다리 스크립트만 바꾸고 캐시 꼬리표를 올린다
  const html = ftp('index.html')
  const oldTag = '<script defer src="/app-install-links-20261002.js?v=admin-only"></script>'
  const newTag = '<script defer src="/app-install-links-20261002.js?v=app-v2"></script>'
  if (!html.includes(oldTag) && !html.includes(newTag)) throw Error('Expected admin-only bridge tag missing; stopped')
  writeFileSync(resolve(backupDir, 'index.before-app-v2.html'), html)
  writeFileSync(resolve(backupDir, 'app-install-links.before-app-v2.js'), ftp('app-install-links-20261002.js'))
  const changed = html.replace(oldTag, newTag)
  writeFileSync(resolve(backupDir, 'index.app-v2.html'), changed)
  ftp('app-install-links-20261002.js', `upload-file = ${quote(resolve('public/app-install-links.js'))}
`)
  if (ftp('app-install-links-20261002.js') !== readFileSync('public/app-install-links.js', 'utf8')) throw Error('Dashboard script mismatch')
  if (changed !== html) {
    ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.app-v2.html'))}
`)
    if (ftp('index.html') !== changed) throw Error('Homepage script reference mismatch; backup available')
  }
  console.log('Deployed app-v2 dashboard bridge (교인앱 관리 + APK 1.1); backups in dist-footer-backup/.')
} else if (mode === 'responsive') {
  // 2026-10-06 좁은 화면 보정(폴드 접은 화면·큰 글꼴): CSS·JS 두 파일 + index.html 에 두 줄
  const css = '<link rel="stylesheet" href="/responsive-20261006.css">'
  const js = '<script defer src="/responsive-20261006.js"></script>'
  const html = ftp('index.html')
  writeFileSync(resolve(backupDir, 'index.before-responsive.html'), html)
  let changed = html
  if (!changed.includes(css)) changed = changed.replace('</head>', `  ${css}
  </head>`)
  if (!changed.includes(js)) changed = changed.replace('</body>', `  ${js}
  </body>`)
  if (!changed.includes(css) || !changed.includes(js)) throw Error('head/body close tag missing; stopped')
  for (const file of ['responsive-20261006.css', 'responsive-20261006.js']) {
    ftp(file, `upload-file = ${quote(resolve('public', file))}
`)
    if (ftp(file) !== readFileSync(resolve('public', file), 'utf8')) throw Error(`${file} mismatch`)
  }
  writeFileSync(resolve(backupDir, 'index.responsive.html'), changed)
  if (changed !== html) {
    ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.responsive.html'))}
`)
    if (ftp('index.html') !== changed) throw Error('Homepage index mismatch; backup available')
  }
  console.log('Deployed responsive fix (css+js) and index tags; backups in dist-footer-backup/.')
} else if (mode === 'app-link') {
  // 교인앱 링크 다리 스크립트만 다시 올리고 캐시 꼬리표를 올린다(?v=… 어느 값이든 → app-v3). APK 는 latest.apk 고정 주소
  const html = ftp('index.html')
  const tag = /<script defer src="\/app-install-links-20261002\.js(\?v=[\w-]+)?"><\/script>/
  if (!tag.test(html)) throw Error('bridge tag missing; stopped')
  writeFileSync(resolve(backupDir, 'index.before-app-link.html'), html)
  const changed = html.replace(tag, '<script defer src="/app-install-links-20261002.js?v=app-v3"></script>')
  ftp('app-install-links-20261002.js', `upload-file = ${quote(resolve('public/app-install-links.js'))}
`)
  if (ftp('app-install-links-20261002.js') !== readFileSync('public/app-install-links.js', 'utf8')) throw Error('Dashboard script mismatch')
  writeFileSync(resolve(backupDir, 'index.app-link.html'), changed)
  if (changed !== html) {
    ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.app-link.html'))}
`)
    if (ftp('index.html') !== changed) throw Error('Homepage index mismatch; backup available')
  }
  console.log('Deployed app link bridge (latest.apk) with cache tag app-v3.')
} else if (mode === 'app-v8') {
  // 2026-10-06 교인앱 v8: ① live.php 공개 응답에 onAir(방송 중인지)만 추가 ② 대시보드 링크에 가입 안내·PC 백업. 올리기 전에 둘 다 백업
  const livePhp = ftp('api/live.php')
  if (!livePhp.includes('function public_live_payload')) throw Error('live.php differs from expected; stopped')
  writeFileSync(resolve(backupDir, 'live.before-app-v8.php'), livePhp)
  const html = ftp('index.html')
  const tag = /<script defer src="\/app-install-links-20261002\.js(\?v=[\w-]+)?"><\/script>/
  if (!tag.test(html)) throw Error('bridge tag missing; stopped')
  writeFileSync(resolve(backupDir, 'index.before-app-v8.html'), html)
  writeFileSync(resolve(backupDir, 'app-install-links.before-app-v8.js'), ftp('app-install-links-20261002.js'))
  // 서버에 있는 live.php 에 두 곳만 고친다(로컬 소스에는 배포 안 한 변경이 섞여 있을 수 있다)
  const eol = livePhp.includes(String.fromCharCode(13, 10)) ? String.fromCharCode(13, 10) : String.fromCharCode(10)
  const A = ['    $authorized = has_live_access($streamKey);', '    $canView = can_view_live_setting($setting, $authorized);', '    $agent = $canView ? read_live_agent_state($pdo, $streamKey) : null;'].join(eol)
  const A2 = ['    $authorized = has_live_access($streamKey);', '    $canView = can_view_live_setting($setting, $authorized);',
    '    // 교인앱(2026-10-06): 비밀번호 걸린 방송도 「지금 방송 중인지」만 공개한다(영상 주소·에이전트 정보는 그대로 숨김)',
    '    $fullAgent = read_live_agent_state($pdo, $streamKey);',
    '    $latestCommand = read_latest_live_command($pdo, $streamKey);',
    "    $stopPending = is_array($latestCommand) && in_array((string) $latestCommand['status'], array('pending', 'processing'), true)",
    "        && (string) $latestCommand['desiredState'] === 'stop';",
    "    $onAir = !$stopPending && trim((string) $setting['currentVideoId']) !== ''",
    "        && ((is_array($fullAgent) && !empty($fullAgent['streamActive'])) || !empty($setting['enabled']));",
    '    $agent = $canView ? $fullAgent : null;'].join(eol)
  const B = ["        'command' => $canView ? read_latest_live_command($pdo, $streamKey) : null,", '    );'].join(eol)
  const B2 = ["        'command' => $canView ? $latestCommand : null,", "        'onAir' => $onAir,", '    );'].join(eol)
  if (livePhp.split(A).length !== 2 || livePhp.split(B).length !== 2) throw Error('live.php patch points not found exactly once; stopped')
  const patchedPhp = livePhp.replace(A, () => A2).replace(B, () => B2)
  writeFileSync(resolve(backupDir, 'live.app-v8.php'), patchedPhp)
  ftp('api/live.php', `upload-file = ${quote(resolve(backupDir, 'live.app-v8.php'))}
`)
  if (ftp('api/live.php') !== patchedPhp) throw Error('live.php mismatch; run restore-live')
  ftp('app-install-links-20261002.js', `upload-file = ${quote(resolve('public/app-install-links.js'))}
`)
  if (ftp('app-install-links-20261002.js') !== readFileSync('public/app-install-links.js', 'utf8')) throw Error('Dashboard script mismatch')
  const changed = html.replace(tag, '<script defer src="/app-install-links-20261002.js?v=app-v8"></script>')
  writeFileSync(resolve(backupDir, 'index.app-v8.html'), changed)
  if (changed !== html) {
    ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.app-v8.html'))}
`)
    if (ftp('index.html') !== changed) throw Error('Homepage index mismatch; backup available')
  }
  console.log('Deployed app-v8: live.php onAir + dashboard links (join, PC backup); backups in dist-footer-backup/.')
} else if (mode === 'app-admin') {
  // 2026-10-08 「신애교회 앱관리」: 앱 띄우는 칸(app-admin-panel.js) 새로 + 다리 스크립트(메뉴·화면 전환). 올리기 전에 백업
  const html = ftp('index.html')
  const tag = /<script defer src="\/app-install-links-20261002\.js(\?v=[\w-]+)?"><\/script>/
  if (!tag.test(html)) throw Error('bridge tag missing; stopped')
  writeFileSync(resolve(backupDir, 'index.before-app-admin.html'), html)
  writeFileSync(resolve(backupDir, 'app-install-links.before-app-admin.js'), ftp('app-install-links-20261002.js'))
  ftp('app-admin-panel.js', `upload-file = ${quote(resolve('public/app-admin-panel.js'))}
`)
  if (ftp('app-admin-panel.js') !== readFileSync('public/app-admin-panel.js', 'utf8')) throw Error('Panel script mismatch')
  ftp('app-install-links-20261002.js', `upload-file = ${quote(resolve('public/app-install-links.js'))}
`)
  if (ftp('app-install-links-20261002.js') !== readFileSync('public/app-install-links.js', 'utf8')) throw Error('Dashboard script mismatch')
  const changed = html.replace(tag, '<script defer src="/app-install-links-20261002.js?v=app-admin"></script>')
  writeFileSync(resolve(backupDir, 'index.app-admin.html'), changed)
  if (changed !== html) {
    ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.app-admin.html'))}
`)
    if (ftp('index.html') !== changed) throw Error('Homepage index mismatch; backup available')
  }
  console.log('Deployed app-admin: sidebar menu + app panel; backups in dist-footer-backup/.')
} else if (mode === 'restore-live') {
  // 비상: live.php 를 app-v8 이전으로 되돌린다
  ftp('api/live.php', `upload-file = ${quote(resolve(backupDir, 'live.before-app-v8.php'))}
`)
  console.log('Restored live.php from backup.')
} else if (mode === 'check') {
  console.log(ftp('', 'list-only\n'))
} else if (mode === 'deploy') {
  const html = ftp('index.html')
  if (!html.includes('/assets/index-DPQsbdq_.js') || !html.includes('<title>신애교회</title>')) throw Error('Live homepage differs from verified version; stopped')
  const patch = '<script defer src="/app-install-links-20261002.js"></script>'
  if (html.includes('app-install-links-20261002.js')) throw Error('Already deployed; verify instead of overwriting backup')
  writeFileSync(resolve(backupDir, 'index.before.html'), html)
  const changed = html.replace('</body>', `  ${patch}\n  </body>`)
  if (changed === html) throw Error('Missing body close tag')
  writeFileSync(resolve(backupDir, 'index.after.html'), changed)
  ftp('app-install-links-20261002.js', `upload-file = ${quote(resolve('public/app-install-links.js'))}\n`)
  if (ftp('app-install-links-20261002.js') !== readFileSync('public/app-install-links.js', 'utf8')) throw Error('Uploaded footer script mismatch')
  ftp('index.html', `upload-file = ${quote(resolve(backupDir, 'index.after.html'))}\n`)
  if (ftp('index.html') !== changed) throw Error('Uploaded homepage mismatch; backup available')
  console.log(JSON.stringify({ deployed: ['app-install-links-20261002.js', 'index.html'], backup: backupDir }))
} else throw Error('Use check, deploy, dashboard, app-v2, responsive, app-v8 or app-admin')
