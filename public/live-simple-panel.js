// 2026-10-12 라이브 방송 간편 화면(요셉님: "컴맹이 와도 되게"). 다리 스크립트가 #/admin/live-streams/<부서> 에서 원래 화면 대신 띄운다.
// 「오늘 방송」(신호등·설교 제목·본문·큰 버튼 하나·진행 단계) + 접힌 「처음 설정」. 서버 API 는 원래 화면과 같다(live.php admin/save/command).
(() => {
  const LABELS = { children: '아동부', youth: '중고등부', young: '청년부', main: '대예배' }
  const ONLINE_SECONDS = 60
  // 방송 PC 프로그램: 부서 하나짜리는 live-agent.<부서>.json, 중고등부+청년부 한 대는 live-agent.youth-young.json 을 EXE 옆에서 읽는다
  const EXE = { main: 'ShinaeLiveMain.exe', children: 'ShinaeLiveChildren.exe', youth: 'ShinaeLiveYouth.exe', young: 'ShinaeLiveYoung.exe', 'youth-young': 'ShinaeLiveYouthYoung.exe' }
  const DOWNLOAD_PAGE = 'https://github.com/dyalsrhkd-ai/shinaechurch-new/releases/latest'
  const API_BASE = 'http://www.shinaechurch.co.kr' // 이 사이트는 https 가 안 열려 있다
  const css = `
  .cls{max-width:760px;margin:0 auto;padding:8px 0 40px;color:#0f172a;font-size:16px;line-height:1.6}
  .cls *{box-sizing:border-box}
  .cls h1{font-size:1.5rem;font-weight:900;margin:0 0 4px}
  .cls .sub{color:#64748b;font-size:.9rem;margin:0 0 18px}
  .cls .card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:22px;margin-bottom:16px}
  .cls .light{display:flex;align-items:center;gap:12px;border-radius:14px;padding:14px 16px;font-weight:800;margin-bottom:18px}
  .cls .light i{width:16px;height:16px;border-radius:50%;flex:none}
  .cls .light.on{background:#ecfdf3;color:#166534}.cls .light.on i{background:#16a34a;box-shadow:0 0 0 5px #bbf7d0}
  .cls .light.off{background:#fef2f2;color:#b91c1c}.cls .light.off i{background:#dc2626;box-shadow:0 0 0 5px #fecaca}
  .cls .light.live{background:#fff1f2;color:#be123c}.cls .light.live i{background:#e11d48;box-shadow:0 0 0 5px #fecdd3;animation:clsPulse 1.2s infinite}
  @keyframes clsPulse{50%{opacity:.35}}
  .cls label{display:block;font-weight:800;font-size:.92rem;margin:0 0 6px}
  .cls .hint{font-weight:500;color:#94a3b8;font-size:.82rem;margin-left:6px}
  .cls input,.cls select{width:100%;font-size:1rem;padding:13px 14px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a}
  .cls .field{margin-bottom:14px}
  .cls .big{width:100%;border:none;border-radius:16px;padding:20px;font-size:1.3rem;font-weight:900;cursor:pointer;color:#fff;background:#dc2626;margin-top:6px}
  .cls .big.stop{background:#0f172a}.cls .big.confirm{background:#b45309}
  .cls .big:disabled{opacity:.4;cursor:default}
  .cls .steps{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:8px}
  .cls .steps li{display:flex;gap:10px;align-items:center;color:#94a3b8;font-weight:700}
  .cls .steps li b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#f1f5f9;font-size:.8rem;flex:none}
  .cls .steps li.done{color:#166534}.cls .steps li.done b{background:#16a34a;color:#fff}
  .cls .steps li.now{color:#b45309}.cls .steps li.now b{background:#f59e0b;color:#fff}
  .cls .msg{margin-top:14px;border-radius:12px;padding:12px 14px;font-size:.92rem}
  .cls .msg.err{background:#fef2f2;color:#b91c1c}.cls .msg.ok{background:#ecfdf3;color:#166534}.cls .msg.info{background:#eff6ff;color:#1d4ed8}
  .cls details summary{cursor:pointer;font-weight:900;font-size:1.05rem;list-style:none}
  .cls details summary::before{content:'▸ ';color:#64748b}.cls details[open] summary::before{content:'▾ '}
  .cls details .note{color:#64748b;font-size:.85rem;margin:6px 0 16px}
  .cls .row{display:flex;gap:8px}.cls .row input{flex:1;min-width:0}
  .cls .ghost{border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:0 14px;font-weight:800;cursor:pointer;white-space:nowrap;font-size:.92rem;color:#0f172a}
  .cls .save{border:none;background:#1d4ed8;color:#fff;border-radius:12px;padding:14px 20px;font-weight:900;font-size:1rem;cursor:pointer;width:100%}
  .cls .pcreg{border-top:1px dashed #cbd5e1;margin-top:22px;padding-top:18px}
  .cls .pcreg h3{font-size:1rem;font-weight:900;margin:0 0 4px}
  .cls .pcreg .check{display:flex;gap:8px;align-items:center;font-weight:700;margin-bottom:14px}
  .cls .pcreg .check input{width:18px;height:18px}
  .cls .pcreg a{color:#1d4ed8;font-weight:800}
  .cls .link{word-break:break-all;color:#334155;font-size:.85rem;background:#f8fafc;border-radius:10px;padding:10px 12px;margin-top:8px}
  @media (max-width:600px){.cls .card{padding:16px}.cls h1{font-size:1.25rem}}
  `

  const channelIdOf = value => {
    const text = String(value || '').trim()
    if (/^UC[\w-]{22}$/.test(text)) return text
    const match = text.match(/\/channel\/(UC[\w-]{22})/)
    return match ? match[1] : ''
  }
  const newKey = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20)
  const el = (tag, props = {}, ...kids) => {
    const node = Object.assign(document.createElement(tag), props)
    for (const kid of kids) if (kid != null) node.append(kid)
    return node
  }

  async function api(path, body, csrf) {
    const init = { credentials: 'same-origin', headers: {} }
    if (body) { init.method = 'POST'; init.headers['Content-Type'] = 'application/json'; init.headers['X-CSRF-Token'] = csrf; init.body = JSON.stringify(body) }
    const response = await fetch(path, init)
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.ok === false) throw new Error((data.error && data.error.message) || `서버 오류(${response.status})`)
    return data
  }

  function mount(host, streamKey) {
    const label = LABELS[streamKey] || '라이브'
    if (!document.getElementById('church-live-simple-css')) document.head.append(el('style', { id: 'church-live-simple-css', textContent: css }))
    let live = null, csrf = '', busy = false, confirmUntil = 0, message = null, timer = null, alive = true, formDirty = false

    const light = el('div', { className: 'light off' }, el('i'), el('span'))
    const sermon = el('input', { placeholder: '예: 벽을 깨는 치유' })
    const scripture = el('input', { placeholder: '예: 누가복음 17장 11-19절' })
    const big = el('button', { type: 'button', className: 'big' })
    const steps = el('ul', { className: 'steps' })
    const msg = el('div')
    const today = el('section', { className: 'card' },
      light,
      el('div', { className: 'field' }, el('label', { textContent: '설교 제목' }, el('span', { className: 'hint', textContent: '홈페이지에 함께 보입니다 (비워도 됩니다)' })), sermon),
      el('div', { className: 'field' }, el('label', { textContent: '본문 말씀' }), scripture),
      big, steps, msg)

    const channel = el('input', { placeholder: 'UC로 시작하는 ID 또는 https://www.youtube.com/channel/UC… 주소' })
    const profile = el('select')
    const title = el('input')
    const password = el('input', { placeholder: '비워 두면 누구나 볼 수 있습니다' })
    const key = el('input', { readOnly: true })
    const linkBox = el('div', { className: 'link' })
    const copyBtn = el('button', { type: 'button', className: 'ghost', textContent: '복사' })
    const keyBtn = el('button', { type: 'button', className: 'ghost', textContent: '새로 만들기' })
    const saveBtn = el('button', { type: 'button', className: 'save', textContent: '설정 저장' })
    const setupMsg = el('div')

    // 새 방송 PC 준비: 열쇠를 발급받아 그 EXE 가 읽는 이름의 설정 파일로 내려받는다
    const pair = streamKey === 'youth' || streamKey === 'young'
    const together = el('input', { type: 'checkbox' })
    const obsPass = el('input', { type: 'password', placeholder: 'OBS → 도구 → WebSocket 서버 설정의 비밀번호' })
    const regBtn = el('button', { type: 'button', className: 'save', textContent: '설정 파일 받기' })
    const regMsg = el('div')
    const pcreg = el('div', { className: 'pcreg' },
      el('h3', { textContent: '새 방송 PC 준비' }),
      el('p', { className: 'note', textContent: `① 방송 PC에 크롬·OBS를 깔고 크롬에서 교회 유튜브 계정으로 로그인 ② 아래에서 설정 파일 받기 ③ 프로그램(EXE)을 받아 설정 파일과 같은 폴더에 두고 실행. 다시 받으면 전에 받은 설정 파일은 못 쓰게 됩니다(방송 PC는 부서마다 한 대만 켜 두세요).` }),
      pair ? el('label', { className: 'check' }, together, '중고등부·청년부를 이 컴퓨터 한 대로 방송') : null,
      el('div', { className: 'field' }, el('label', { textContent: 'OBS 비밀번호' }, el('span', { className: 'hint', textContent: '방송 PC의 OBS에 정한 것' })), obsPass),
      regBtn, regMsg,
      el('p', { className: 'note' }, '프로그램(EXE) 받는 곳: ', el('a', { href: DOWNLOAD_PAGE, target: '_blank', rel: 'noopener', textContent: '방송 PC 프로그램 다운로드' })))
    const setup = el('details', { className: 'card' },
      el('summary', { textContent: '처음 설정 (한 번만 하면 됩니다)' }),
      el('p', { className: 'note', textContent: '유튜브 채널과 방송 계정을 정해 두는 곳입니다. 평소 예배 때는 손대지 않아도 됩니다.' }),
      el('div', { className: 'field' }, el('label', { textContent: '유튜브 채널' }, el('span', { className: 'hint', textContent: '유튜브 스튜디오 → 설정 → 채널 → 고급 설정의 「채널 ID」' })), channel),
      el('div', { className: 'field' }, el('label', { textContent: '유튜브 방송 계정' }, el('span', { className: 'hint', textContent: '방송 PC 크롬에 로그인된 계정' })), profile),
      el('div', { className: 'field' }, el('label', { textContent: '방송 제목' }), title),
      el('div', { className: 'field' }, el('label', { textContent: '시청 비밀번호' }), password),
      el('div', { className: 'field' }, el('label', { textContent: '카카오톡 공유 링크' }, el('span', { className: 'hint', textContent: '비밀번호 없이 바로 볼 수 있는 주소' })), el('div', { className: 'row' }, key, copyBtn, keyBtn), linkBox),
      saveBtn, setupMsg, pcreg)

    const root = el('div', { className: 'cls' },
      el('h1', { textContent: `${label} 방송` }),
      el('p', { className: 'sub', textContent: '설교 제목을 적고 「방송 시작」만 누르면 됩니다. 방송실 컴퓨터가 OBS와 유튜브를 알아서 켭니다.' }),
      today, setup)
    host.replaceChildren(root)
    for (const input of [channel, profile, title, password]) input.addEventListener('input', () => { formDirty = true })

    const setting = () => (live && live.setting) || {}
    const agent = () => (live && live.agent) || null
    const online = () => { const a = agent(); return Boolean(a && a.seenAgo != null && a.seenAgo < ONLINE_SECONDS) }
    const streaming = () => Boolean(online() && agent().streamActive)
    const shareLink = k => k ? `${location.origin}${location.pathname}#/media/live/${streamKey}?access=${encodeURIComponent(k)}` : ''
    const say = (box, kind, text) => { box.className = text ? `msg ${kind}` : ''; box.textContent = text || '' }

    function fillSetup() {
      const s = setting()
      channel.value = s.youtubeUrl || ''
      title.value = s.title || ''
      password.value = s.accessPassword || ''
      key.value = s.accessKey || ''
      fillProfiles()
      formDirty = false
    }
    function fillProfiles() {
      const chosen = setting().youtubeChromeProfileName || ''
      const list = (agent() && agent().chromeProfiles) || []
      const options = [['', list.length ? '자동 (방송 PC가 알아서 고릅니다)' : '자동 (방송 PC를 켜면 계정 목록이 나옵니다)']]
      for (const p of list) options.push([p.dir, [p.name, p.email].filter(Boolean).join(' · ') || p.dir])
      if (chosen && !list.some(p => p.dir === chosen)) options.push([chosen, `지금 저장된 값: ${chosen}`])
      const sig = JSON.stringify(options)
      if (profile.dataset.sig !== sig) {
        const keep = formDirty ? profile.value : chosen
        profile.replaceChildren(...options.map(([value, text]) => el('option', { value, textContent: text })))
        profile.value = options.some(([v]) => v === keep) ? keep : ''
        profile.dataset.sig = sig
      }
    }

    function render() {
      const s = setting(), a = agent(), cmd = live && live.command
      linkBox.textContent = shareLink(key.value) || '아직 없습니다. 「새로 만들기」를 누르세요.'
      if (!formDirty) fillProfiles()
      if (streaming()) { light.className = 'light live'; light.lastChild.textContent = '지금 방송 중입니다' }
      else if (online()) { light.className = 'light on'; light.lastChild.textContent = `방송 PC 준비됨${a.obsConnected ? '' : ' (OBS 켜는 중…)'}` }
      else { light.className = 'light off'; light.lastChild.textContent = '방송 PC가 꺼져 있습니다. 방송실 컴퓨터를 켜 주세요.' }

      const ready = Boolean(channelIdOf(s.youtubeUrl))
      const pending = cmd && (cmd.status === 'pending' || cmd.status === 'processing') && cmd.desiredState
      big.classList.remove('stop', 'confirm')
      if (!ready) { big.textContent = '처음 설정을 먼저 해 주세요'; big.disabled = true; setup.open = true }
      else if (pending) { big.textContent = pending === 'start' ? '방송을 켜는 중…' : '방송을 끄는 중…'; big.disabled = true }
      else if (streaming()) {
        const asking = Date.now() < confirmUntil
        big.textContent = asking ? '정말 끝낼까요? 한 번 더 누르세요' : '■ 방송 끝내기'
        big.classList.add(asking ? 'confirm' : 'stop'); big.disabled = busy
      } else { big.textContent = '▶ 방송 시작'; big.disabled = busy || !online() }

      // 진행 단계: 마지막 명령이 「시작」일 때만
      steps.replaceChildren()
      if (cmd && cmd.desiredState === 'start' && cmd.status !== 'error' && (pending || streaming())) {
        const video = Boolean(s.currentVideoId || (a && a.currentVideoId))
        const done = [cmd.status !== 'pending', streaming(), streaming() && video]
        ;['방송 PC에 전달', 'OBS 송출 시작', '유튜브 라이브 시작됨 (홈페이지에 영상 표시)'].forEach((text, i) => {
          const state = done[i] ? 'done' : (i === 0 || done[i - 1]) ? 'now' : ''
          steps.append(el('li', { className: state }, el('b', { textContent: done[i] ? '✓' : String(i + 1) }), text))
        })
      }
      if (message) say(msg, message.kind, message.text)
      else if (cmd && cmd.status === 'error') say(msg, 'err', `방송 PC가 처리하지 못했습니다: ${cmd.error || '이유 모름'}. 방송실 컴퓨터 화면을 확인해 주세요.`)
      else say(msg, '', '')
    }

    async function load(first) {
      try {
        live = (await api(`/api/live.php?action=admin&streamKey=${encodeURIComponent(streamKey)}`)).live
        if (first) { fillSetup(); sermon.value = setting().sermonTitle || ''; scripture.value = setting().scriptureTitle || '' }
        render()
      } catch (error) { say(msg, 'err', `상태를 불러오지 못했습니다: ${error.message}`) }
    }
    async function token() {
      if (!csrf) csrf = (await api('/api/auth.php?action=me')).csrfToken || ''
      return csrf
    }
    async function save(patch) {
      const next = { ...setting(), ...patch }
      const data = await api('/api/live.php?action=save', { streamKey, setting: next }, await token())
      live = { ...live, setting: data.setting }
    }
    async function command(state) {
      const data = await api('/api/live.php?action=command', { streamKey, desiredState: state }, await token())
      live = { ...live, command: data.command }
    }

    big.addEventListener('click', async () => {
      if (busy) return
      if (streaming() && Date.now() >= confirmUntil) { confirmUntil = Date.now() + 4000; render(); setTimeout(render, 4100); return }
      busy = true; message = null; render()
      try {
        if (streaming()) { await command('stop'); message = { kind: 'info', text: '방송을 끝내라고 방송 PC에 보냈습니다.' } }
        else {
          await save({ sermonTitle: sermon.value.trim(), scriptureTitle: scripture.value.trim(), currentVideoId: '' })
          await command('start')
          message = { kind: 'info', text: '방송 PC에 보냈습니다. 유튜브까지 켜지는 데 30초~1분쯤 걸립니다.' }
        }
      } catch (error) { message = { kind: 'err', text: `보내지 못했습니다: ${error.message}` } }
      confirmUntil = 0; busy = false; render()
      setTimeout(() => { message = null; render() }, 8000)
    })
    for (const input of [sermon, scripture]) input.addEventListener('change', async () => {
      if (!streaming()) return // 방송 중에 고치면 바로 저장(홈페이지 표시가 바뀐다). 아니면 시작할 때 저장
      try { await save({ sermonTitle: sermon.value.trim(), scriptureTitle: scripture.value.trim() }) } catch { /* 다음 시작 때 다시 저장 */ }
    })
    keyBtn.addEventListener('click', () => { key.value = newKey(); formDirty = true; render() })
    copyBtn.addEventListener('click', async () => {
      const link = shareLink(key.value)
      if (!link) return
      try { await navigator.clipboard.writeText(link); say(setupMsg, 'ok', '공유 링크를 복사했습니다. 카카오톡에 붙여 넣으세요.') } catch { say(setupMsg, 'err', '복사하지 못했습니다. 주소를 길게 눌러 직접 복사해 주세요.') }
    })
    regBtn.addEventListener('click', async () => {
      const both = pair && together.checked
      const fileKey = both ? 'youth-young' : streamKey
      const streams = both ? ['youth', 'young'] : [streamKey]
      regBtn.disabled = true
      try {
        const data = await api('/api/live.php?action=issue-agent', { agentKey: `${fileKey}-pc`, displayName: `${both ? '중고등부·청년부' : label} 방송 PC`, streamKeys: streams }, await token())
        const config = {
          apiBaseUrl: API_BASE, agentId: data.agent.agentKey, agentToken: data.agent.agentToken, managedStreamKeys: data.agent.streamKeys,
          obsUrl: 'ws://127.0.0.1:4444', obsPassword: obsPass.value, agentLabel: `${both ? '중고등부·청년부' : label} 방송 PC`,
          heartbeatMs: 15000, videoResyncMs: 600000, youtubeAutomationPort: 9223, adminPageUrl: '', streamSettings: {},
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' }))
        const a = el('a', { href: url, download: `live-agent.${fileKey}.json` })
        document.body.append(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        say(regMsg, 'ok', `설정 파일 live-agent.${fileKey}.json 을 받았습니다. 방송 PC에서 ${EXE[fileKey]} 와 같은 폴더에 두고 ${EXE[fileKey]} 를 실행하세요. 이 파일은 방송 PC 전용 열쇠이니 다른 곳에 보내지 마세요.`)
        obsPass.value = ''
      } catch (error) { say(regMsg, 'err', `받지 못했습니다: ${error.message}`) }
      regBtn.disabled = false
    })
    saveBtn.addEventListener('click', async () => {
      if (!channelIdOf(channel.value)) { say(setupMsg, 'err', '유튜브 채널 ID를 찾지 못했습니다. UC로 시작하는 24글자 ID나 /channel/UC… 주소를 넣어 주세요.'); return }
      saveBtn.disabled = true
      try {
        await save({ youtubeUrl: channel.value.trim(), youtubeChromeProfileName: profile.value, title: title.value.trim(), accessPassword: password.value.trim(), accessKey: key.value.trim() })
        formDirty = false; fillSetup(); say(setupMsg, 'ok', '저장했습니다.'); render()
      } catch (error) { say(setupMsg, 'err', `저장하지 못했습니다: ${error.message}`) }
      saveBtn.disabled = false
    })

    load(true)
    timer = setInterval(() => { if (alive && !busy) load(false) }, 2000)
    return () => { alive = false; clearInterval(timer); host.replaceChildren() }
  }

  window.ChurchLiveSimple = { mount, channelIdOf }
})()
