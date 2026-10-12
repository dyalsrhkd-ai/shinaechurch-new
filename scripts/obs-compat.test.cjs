// obs-compat 어댑터 자체 점검. OBS 없이 돌아간다.
//   node scripts/obs-compat.test.cjs
// 윈도우 8.1 송출 PC와 같은 조건으로 확인하려면 Node 16으로 돌릴 것.

const assert = require('node:assert')
const ObsCompat = require('./obs-compat.cjs')

// 내부 v4 클라이언트를 가짜로 갈아끼워, 어댑터가 v4에 정확히 뭘 넘기는지 들여다본다.
function makeFake(compat, sendResult = {}) {
  const calls = []
  compat._obs = {
    connect: async (opts) => { calls.push(['connect', opts]) },
    send: async (name, args) => { calls.push(['send', name, args]); return sendResult },
    disconnect: async () => { calls.push(['disconnect']) },
    on: () => {},
  }
  return calls
}

function test(name, fn) {
  try {
    fn()
    console.log('  PASS  ' + name)
  } catch (e) {
    console.log('  FAIL  ' + name + '\n        ' + e.message)
    process.exitCode = 1
  }
}

async function main() {
  console.log('obs-compat 점검 (node ' + process.version + ')\n')

  // v5는 'ws://127.0.0.1:4444', v4 라이브러리는 'host:port' 만 받는다.
  // 이걸 안 벗기면 연결이 조용히 실패한다.
  await (async () => {
    const c = new ObsCompat()
    const calls = makeFake(c)
    let identified = false
    c.on('Identified', () => { identified = true })
    await c.connect('ws://127.0.0.1:4444', 'pw')
    test('connect: ws:// 접두어를 벗겨 v4에 넘긴다', () => {
      assert.deepStrictEqual(calls[0], ['connect', { address: '127.0.0.1:4444', password: 'pw' }])
    })
    test('connect: v5처럼 Identified 이벤트를 쏜다', () => {
      assert.strictEqual(identified, true)
    })
  })()

  // v4는 { streaming: bool }, 에이전트 코드는 v5의 { outputActive } 를 읽는다.
  // 이 변환이 틀리면 "이미 송출중"으로 오판해서 방송이 시작되지 않는다.
  await (async () => {
    const c = new ObsCompat()
    const calls = makeFake(c, { streaming: true, recording: false })
    const res = await c.call('GetStreamStatus')
    test('GetStreamStatus -> GetStreamingStatus 로 변환', () => {
      assert.strictEqual(calls[0][1], 'GetStreamingStatus')
    })
    test('GetStreamStatus: streaming -> outputActive 로 변환', () => {
      assert.deepStrictEqual(res, { outputActive: true })
    })
  })()

  await (async () => {
    const c = new ObsCompat()
    const calls = makeFake(c, { streaming: false })
    const res = await c.call('GetStreamStatus')
    test('GetStreamStatus: 송출중 아님도 정확히 전달', () => {
      assert.deepStrictEqual(res, { outputActive: false })
    })
    void calls
  })()

  await (async () => {
    const c = new ObsCompat()
    const calls = makeFake(c)
    await c.call('StartStream')
    await c.call('StopStream')
    test('StartStream/StopStream -> v4 이름으로 변환', () => {
      assert.strictEqual(calls[0][1], 'StartStreaming')
      assert.strictEqual(calls[1][1], 'StopStreaming')
    })
  })()

  // v4는 인자 이름이 케밥케이스다. 틀리면 씬 전환이 조용히 무시된다.
  await (async () => {
    const c = new ObsCompat()
    const calls = makeFake(c)
    await c.call('SetCurrentSceneCollection', { sceneCollectionName: '주일예배' })
    await c.call('SetCurrentProfile', { profileName: '아동부' })
    test('SetCurrentSceneCollection: sceneCollectionName -> sc-name', () => {
      assert.deepStrictEqual(calls[0][2], { 'sc-name': '주일예배' })
    })
    test('SetCurrentProfile: profileName -> profile-name', () => {
      assert.deepStrictEqual(calls[1][2], { 'profile-name': '아동부' })
    })
  })()

  // 매핑 안 된 요청은 조용히 넘어가면 안 된다. 나중에 누가 v5 요청을 추가했을 때 바로 알아채야 한다.
  await (async () => {
    const c = new ObsCompat()
    makeFake(c)
    let threw = false
    try {
      await c.call('GetSceneList')
    } catch (e) {
      threw = /매핑되지 않은 요청/.test(e.message)
    }
    test('매핑 안 된 요청은 즉시 throw 한다', () => {
      assert.strictEqual(threw, true)
    })
  })()

  // --- 여기부터: 실제로 에이전트를 죽였던 버그 ---
  // v4 라이브러리는 .message 없는 맹탕 객체로 reject 한다. 호출부는 error.message 를
  // 그대로 Firestore 에 쓰기 때문에, undefined 가 되면 setDoc 이 거부하고 에이전트가 죽는다.
  // OBS 가 아직 안 뜬 부팅 직후에 매번 터지던 경로다.
  await (async () => {
    const c = new ObsCompat()
    c._obs = {
      connect: async () => { throw { status: 'error', error: 'Authentication Failed.' } },
      send: async () => {},
      disconnect: async () => {},
      on: () => {},
    }
    let caught = null
    try {
      await c.connect('ws://127.0.0.1:4444', 'wrong')
    } catch (e) {
      caught = e
    }
    test('connect 실패: v4의 맹탕 객체를 진짜 Error 로 바꾼다', () => {
      assert.ok(caught instanceof Error, 'Error 인스턴스여야 함')
    })
    test('connect 실패: error.message 가 undefined 가 아니다 (setDoc 이 죽던 원인)', () => {
      assert.strictEqual(typeof caught.message, 'string')
      assert.notStrictEqual(caught.message, 'undefined')
      assert.ok(caught.message.length > 0)
      assert.ok(/Authentication Failed/.test(caught.message), '원본 사유가 보존돼야 함')
    })
  })()

  await (async () => {
    const c = new ObsCompat()
    c._obs = {
      connect: async () => {},
      send: async () => { throw { status: 'error', error: 'request type not found' } },
      disconnect: async () => {},
      on: () => {},
    }
    let caught = null
    try {
      await c.call('StartStream')
    } catch (e) {
      caught = e
    }
    test('call 실패: v4의 맹탕 객체를 진짜 Error 로 바꾼다', () => {
      assert.ok(caught instanceof Error)
      assert.ok(/request type not found/.test(caught.message))
    })
  })()

  await (async () => {
    const c = new ObsCompat()
    c._obs = {
      connect: async () => { throw 'そのまま文字列' },
      send: async () => {},
      disconnect: async () => {},
      on: () => {},
    }
    let caught = null
    try {
      await c.connect('ws://127.0.0.1:4444', 'x')
    } catch (e) {
      caught = e
    }
    test('문자열을 던져도 Error 로 감싼다', () => {
      assert.ok(caught instanceof Error)
      assert.strictEqual(typeof caught.message, 'string')
    })
  })()

  // --- ConnectionClosed 걸러내기 ---
  // v4 는 연결 실패로 소켓을 닫을 때도 ConnectionClosed 를 쏜다. 그대로 흘리면
  // OBS 가 아직 안 뜬 부팅 직후 재시도 12번 동안 헛된 연결끊김이 12번 나가고
  // 그때마다 Firestore 에 쓴다. 연결된 적 없으면 안 쏘는 게 v5 동작이다.
  //
  // _obs 는 진짜 v4 인스턴스(EventEmitter)이므로, 거기에 직접 emit 하면
  // 생성자가 등록해둔 진짜 핸들러가 돈다. 테스트가 실제 코드를 밟는다.
  await (async () => {
    const c = new ObsCompat()
    let closed = 0
    c.on('ConnectionClosed', () => { closed += 1 })

    c._obs.emit('ConnectionClosed')
    c._obs.emit('ConnectionClosed')
    c._obs.emit('ConnectionClosed')
    test('연결된 적 없으면 ConnectionClosed 를 안 쏜다 (재시도 중 헛발사 방지)', () => {
      assert.strictEqual(closed, 0)
    })
  })()

  await (async () => {
    const c = new ObsCompat()
    let closed = 0
    c.on('ConnectionClosed', () => { closed += 1 })

    // connect 성공을 흉내낸다 (내부 v4 의 connect 만 갈아끼움)
    c._obs.connect = async () => {}
    await c.connect('ws://127.0.0.1:4444', 'pw')

    c._obs.emit('ConnectionClosed')
    test('진짜로 연결됐다 끊기면 ConnectionClosed 를 쏜다', () => {
      assert.strictEqual(closed, 1)
    })

    c._obs.emit('ConnectionClosed')
    test('끊긴 뒤 중복 close 는 무시한다', () => {
      assert.strictEqual(closed, 1)
    })
  })()

  // 연결 실패가 났다고 해서 그 뒤 성공한 연결의 끊김까지 막아버리면 안 된다
  await (async () => {
    const c = new ObsCompat()
    let closed = 0
    c.on('ConnectionClosed', () => { closed += 1 })

    c._obs.connect = async () => { throw { status: 'error', error: 'Connection error.' } }
    try { await c.connect('ws://127.0.0.1:4444', 'pw') } catch {}
    c._obs.emit('ConnectionClosed')

    c._obs.connect = async () => {}
    await c.connect('ws://127.0.0.1:4444', 'pw')
    c._obs.emit('ConnectionClosed')

    test('실패 후 재연결 성공하면 그 뒤 끊김은 정상 통보', () => {
      assert.strictEqual(closed, 1)
    })
  })()

  // v4 는 리스너 없는 'error' 이벤트로 프로세스를 죽인다. 어댑터가 반드시 받아야 한다.
  await (async () => {
    const c = new ObsCompat()
    let got = null
    c.on('ConnectionError', (e) => { got = e })
    c._obs.emit('error', { status: 'error', error: 'socket blew up' })
    test("v4의 'error' 이벤트를 받아서 Error 로 넘긴다 (프로세스 죽음 방지)", () => {
      assert.ok(got instanceof Error)
      assert.ok(/socket blew up/.test(got.message))
    })
  })()

  console.log('')
  console.log(process.exitCode ? '실패한 항목이 있습니다.' : '전부 통과.')
}

main()
