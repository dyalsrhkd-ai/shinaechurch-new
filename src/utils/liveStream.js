export const LIVE_STREAM_CATEGORIES = [
  { key: 'children', label: '아동부', path: '/media/live/children', defaultTitle: '아동부 라이브 영상' },
  { key: 'youth', label: '중고등부', path: '/media/live/youth', defaultTitle: '중고등부 라이브 영상' },
  { key: 'young', label: '청년부', path: '/media/live/young', defaultTitle: '청년부 라이브 영상' },
  { key: 'main', label: '대예배', path: '/media/live/main', defaultTitle: '대예배 실시간 예배 방송' },
]

export const LIVE_STREAM_CATEGORY_MAP = Object.fromEntries(
  LIVE_STREAM_CATEGORIES.map((category) => [category.key, category]),
)

export const DEFAULT_LIVE_STREAM = {
  enabled: false,
  title: '실시간 예배 방송',
  youtubeUrl: '',
  accessPassword: '',
  accessKey: '',
  sermonTitle: '',
  scriptureTitle: '',
  scriptureText: '',
}

export const DEFAULT_LIVE_STREAMS = Object.fromEntries(
  LIVE_STREAM_CATEGORIES.map((category) => [
    category.key,
    {
      ...DEFAULT_LIVE_STREAM,
      title: category.defaultTitle,
    },
  ]),
)

export function normalizeLiveStreams(input, legacyStream = null, legacyPassword = '') {
  const source = input && typeof input === 'object' ? input : {}

  return LIVE_STREAM_CATEGORIES.reduce((accumulator, category) => {
    const categoryInput = source[category.key]
    const fallbackStream = category.key === 'main' && legacyStream ? legacyStream : null

    accumulator[category.key] = {
      ...DEFAULT_LIVE_STREAM,
      title: category.defaultTitle,
      accessPassword: legacyPassword || '',
      ...(fallbackStream && typeof fallbackStream === 'object' ? fallbackStream : {}),
      ...(categoryInput && typeof categoryInput === 'object' ? categoryInput : {}),
    }

    accumulator[category.key].accessPassword = String(accumulator[category.key].accessPassword || '').trim()
    accumulator[category.key].accessKey = String(accumulator[category.key].accessKey || '').trim()
    accumulator[category.key].sermonTitle = String(accumulator[category.key].sermonTitle || '').trim()
    accumulator[category.key].scriptureTitle = String(accumulator[category.key].scriptureTitle || '').trim()
    accumulator[category.key].scriptureText = String(accumulator[category.key].scriptureText || '').trim()

    return accumulator
  }, {})
}

export function extractYoutubeVideoId(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  try {
    const url = new URL(input)

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\//, '').slice(0, 11)
    }

    if (url.searchParams.get('v')) {
      return url.searchParams.get('v').slice(0, 11)
    }

    const segments = url.pathname.split('/').filter(Boolean)
    const liveIndex = segments.findIndex((segment) => segment === 'live' || segment === 'embed')
    if (liveIndex >= 0 && segments[liveIndex + 1]) {
      return segments[liveIndex + 1].slice(0, 11)
    }
  } catch {
    return ''
  }

  return ''
}

export function generateLiveAccessKey() {
  const cryptoApi = globalThis.crypto

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID().replace(/-/g, '').slice(0, 20)
  }

  if (cryptoApi?.getRandomValues) {
    const buffer = new Uint32Array(4)
    cryptoApi.getRandomValues(buffer)
    return Array.from(buffer, (value) => value.toString(36)).join('').slice(0, 20)
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 20)
}
