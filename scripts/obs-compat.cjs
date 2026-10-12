// OBS 웹소켓 프로토콜 v4를 v5 API 모양으로 감싼 어댑터.
//
// 왜 필요한가:
//   교회 송출 PC가 윈도우 8.1이다. OBS 28부터는 윈도우 10 이상만 지원하므로 그 PC는
//   OBS 27이 최대이고, 27에는 웹소켓이 내장돼 있지 않아 obs-websocket 4.9.1 플러그인을
//   따로 깔아야 한다. 그 플러그인은 프로토콜 v4라서 요청 이름과 응답 모양이 v5와 다르다.
//   (v5: StartStream / v4: StartStreaming 같은 식)
//
// 이 파일이 그 차이를 전부 흡수하므로, 에이전트 코드는 v5 API를 쓰던 그대로 두면 된다.
// 바꾸는 건 require 한 줄뿐:
//   const OBSWebSocket = require('obs-websocket-js').default   // 기존(v5, OBS 28+)
//   const OBSWebSocket = require('./obs-compat.cjs')           // 현재(v4, OBS 27)
//
// 나중에 교회 PC를 윈도우 10 이상으로 바꾸면 위 require를 원래대로 되돌리고
// 이 파일을 지우면 끝난다.

const { EventEmitter } = require('node:events')

const OBS4 = require('obs-websocket-js-v4')
const OBS4Ctor = OBS4.default || OBS4
// 2026-10-12 윈도우 11 PC는 OBS 28 이상(내장 웹소켓 v5, 기본 4455)일 수 있다 → v4 로 안 붙으면 v5 로 붙는다.
// 같은 EXE 하나로 8.1(OBS 27 + 플러그인 4.9.1, v4)과 11(OBS 28+, v5)을 모두 받는다.
// JSON 방식(OBS 기본·표준). 기본 내보내기는 msgpack. 필요할 때만 불러서, 혹시 EXE 에 빠져 있어도 v4(8.1)는 그대로 돈다
let OBS5Ctor = null
function loadV5() {
  if (!OBS5Ctor) {
    const OBS5 = require('../node_modules/obs-websocket-js/dist/json.cjs') // 패키지 이름(obs-websocket-js/json)으로는 EXE(pkg) 안에서 못 찾는다(10/12 확인)
    OBS5Ctor = OBS5.OBSWebSocket || OBS5.default || OBS5
  }
  return OBS5Ctor
}

// v5 로 시도할 주소: 설정 주소, 그리고 설정이 v4 기본(4444)이면 v5 기본(4455)도
const V4_TIMEOUT_MS = 5000

function obsUrlCandidates(url) {
  const text = String(url || '').trim()
  const full = /^wss?:\/\//i.test(text) ? text : `ws://${text}`
  const list = [full]
  if (/:4444\/?$/.test(full)) list.push(full.replace(/:4444(\/?)$/, ':4455$1'))
  return list
}

// v5 요청명 -> v4 요청명, 그리고 인자/응답 모양 변환.
// 에이전트가 실제로 쓰는 5개만 있다. 여기 없는 요청을 부르면 조용히 실패하지 않고 즉시 throw 한다.
const REQUESTS = {
  GetStreamStatus: {
    v4: 'GetStreamingStatus',
    // v4는 { streaming: true }, v5는 { outputActive: true } 로 답한다
    result: (r) => ({ outputActive: Boolean(r.streaming) }),
  },
  StartStream: { v4: 'StartStreaming' },
  StopStream: { v4: 'StopStreaming' },
  SetCurrentSceneCollection: {
    v4: 'SetCurrentSceneCollection',
    args: (a) => ({ 'sc-name': a.sceneCollectionName }),
  },
  SetCurrentProfile: {
    v4: 'SetCurrentProfile',
    args: (a) => ({ 'profile-name': a.profileName }),
  },
}

// v5 라이브러리는 진짜 Error 로 reject 하지만, v4 라이브러리는 .message 가 없는 맹탕 객체
//   { status: 'error', error: 'Authentication Failed.', description: ... }
// 로 reject 한다. 호출부는 error.message 를 읽어 Firestore 에 그대로 기록하는데,
// undefined 가 들어가면 setDoc 이 통째로 거부돼서 에이전트가 죽는다.
// (OBS 가 아직 안 떠서 연결이 실패하는, 부팅 직후의 정상적인 상황에서 바로 터진다)
// 그래서 v4 가 뱉는 건 뭐가 됐든 여기서 진짜 Error 로 바꿔서 내보낸다.
function toError(value) {
  if (value instanceof Error) return value

  if (value && typeof value === 'object') {
    const text = value.error || value.description || value.message || value.status
    const error = new Error(String(text || 'OBS 웹소켓 오류'))
    error.obsRaw = value
    return error
  }

  return new Error(String(value || 'OBS 웹소켓 오류'))
}

class ObsCompat extends EventEmitter {
  constructor() {
    super()
    this._obs = new OBS4Ctor()

    // 한 번이라도 연결에 성공한 상태인지. ConnectionClosed 를 걸러내는 데 쓴다.
    this._connected = false

    // v4 라이브러리는 소켓이 닫힐 때마다 ConnectionClosed 를 쏜다. 여기엔
    // "연결 시도가 실패해서 닫는 경우"와 "재연결하려고 이전 소켓을 닫는 경우"까지 포함된다.
    // (Socket.js 의 connect() 는 재시도마다 이전 소켓을 blind close 한다)
    // v5 는 실제로 연결됐다가 끊길 때만 쏘고, 호출부는 v5 기준으로 짜여 있다.
    // 그대로 흘려보내면 OBS 가 아직 안 뜬 부팅 직후 12번 재시도하는 동안
    // 헛된 연결끊김 이벤트가 12번 발사되고 그때마다 Firestore 에 쓴다.
    this._obs.on('ConnectionClosed', () => {
      if (!this._connected) return
      this._connected = false
      this.emit('ConnectionClosed')
    })

    // v4 라이브러리는 'error' 리스너가 하나도 없으면 EventEmitter 규칙에 따라
    // 프로세스를 통째로 죽인다. 송출 중에 그러면 안 되므로 반드시 받아둔다.
    // 'error' 가 아닌 이름으로 바꿔 다시 쏘는 것도 같은 이유다. 듣는 쪽이 없어도 안전해야 한다.
    this._obs.on('error', (error) => this.emit('ConnectionError', toError(error)))

    this._v5 = null
    this.protocol = ''
  }

  async _connectV5(url, password) {
    if (this._v5) { try { await this._v5.disconnect() } catch { /* 이전 시도 정리 */ } }
    const v5 = new (loadV5())()
    this._v5 = v5
    // v5 도 실패한 연결 시도에서 ConnectionClosed 를 쏠 수 있다 → 붙어 있던 때만 알린다
    v5.on('ConnectionClosed', () => {
      if (this._v5 !== v5 || !this._connected) return
      this._connected = false
      this.emit('ConnectionClosed')
    })
    v5.on('ConnectionError', (error) => { if (this._v5 === v5) this.emit('ConnectionError', toError(error)) })
    await v5.connect(url, password || undefined)
  }

  // v5: connect('ws://127.0.0.1:4455', password)
  // v4: connect({ address: '127.0.0.1:4444', password })
  async connect(url, password) {
    const address = String(url || '').replace(/^wss?:\/\//i, '')

    let v4Error
    try {
      // v4 라이브러리는 v5 OBS 에 붙으면 소켓이 끊겨도 실패를 알리지 않고 영원히 기다린다(10/12 시험에서 확인) → 5초 제한
      let timer
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('v4 응답 없음(OBS 28 이상일 수 있음)')), V4_TIMEOUT_MS) })
      try {
        await Promise.race([this._obs.connect({ address, password }), timeout])
      } finally { clearTimeout(timer) }
      this.protocol = 'v4'
    } catch (error) {
      this._connected = false
      v4Error = toError(error)
      try { await this._obs.disconnect() } catch { /* 반쯤 열린 소켓 정리 */ }
    }

    if (v4Error) {
      // OBS 28 이상이면 v4 로는 안 붙는다 → v5 로
      const v5Errors = []
      for (const candidate of obsUrlCandidates(url)) {
        try {
          await this._connectV5(candidate, password)
          this.protocol = 'v5'
          break
        } catch (error) {
          v5Errors.push(`${candidate} ${toError(error).message}`)
        }
      }
      if (this.protocol !== 'v5') {
        this._v5 = null
        throw new Error(`OBS 연결 실패 (v4: ${v4Error.message} / v5: ${v5Errors.join(', ')})`)
      }
    } else if (this._v5) {
      try { await this._v5.disconnect() } catch { /* 정리 */ }
      this._v5 = null
    }

    this._connected = true

    // v5는 인증까지 끝나면 Identified 이벤트를 쏘고 connect()가 resolve 된다.
    // v4의 connect()는 인증 후에 resolve 되므로, 같은 시점에 우리가 대신 쏴준다.
    this.emit('Identified')
  }

  async call(requestName, args) {
    // v5 로 붙었으면 에이전트가 쓰는 v5 요청 이름·모양 그대로 보낸다
    if (this.protocol === 'v5' && this._v5) {
      try {
        return await this._v5.call(requestName, args)
      } catch (error) {
        throw toError(error)
      }
    }
    const spec = REQUESTS[requestName]
    if (!spec) {
      throw new Error(`obs-compat: v4로 매핑되지 않은 요청입니다 => ${requestName}`)
    }

    const payload = spec.args ? spec.args(args || {}) : args

    let result
    try {
      result = await this._obs.send(spec.v4, payload)
    } catch (error) {
      throw toError(error)
    }

    return spec.result ? spec.result(result) : result
  }

  async disconnect() {
    if (this._v5) {
      const v5 = this._v5
      this._v5 = null
      this._connected = false
      try { await v5.disconnect() } catch { /* 이미 끊김 */ }
    }
    try {
      await this._obs.disconnect()
    } catch {
      // 이미 끊긴 경우까지 시끄럽게 굴 필요 없다
    }
  }
}

module.exports = ObsCompat
module.exports.default = ObsCompat
module.exports.obsUrlCandidates = obsUrlCandidates
