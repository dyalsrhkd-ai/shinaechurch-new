export const LIVE_STREAM_CATEGORIES = [
  { key: 'children', label: '아동부', path: '/media/live/children', defaultTitle: '아동부 실시간 예배 영상' },
  { key: 'youth', label: '중고등부', path: '/media/live/youth', defaultTitle: '중고등부 실시간 예배 영상' },
  { key: 'young', label: '청년부', path: '/media/live/young', defaultTitle: '청년부 실시간 예배 영상' },
  { key: 'main', label: '대예배', path: '/media/live/main', defaultTitle: '대예배 실시간 예배 영상' },
]

export const LIVE_STREAM_CATEGORY_MAP = Object.fromEntries(
  LIVE_STREAM_CATEGORIES.map((category) => [category.key, category]),
)

export const DEFAULT_LIVE_STREAM = {
  enabled: false,
  title: '실시간 예배 영상',
  youtubeUrl: '',
  youtubeChromeProfileName: '',
  currentVideoId: '',
  accessPassword: '',
  accessKey: '',
  sermonTitle: '',
  scriptureTitle: '',
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

    accumulator[category.key].youtubeUrl = String(accumulator[category.key].youtubeUrl || '').trim()
    accumulator[category.key].youtubeChromeProfileName = String(accumulator[category.key].youtubeChromeProfileName || '').trim()
    accumulator[category.key].currentVideoId = String(accumulator[category.key].currentVideoId || '').trim()
    accumulator[category.key].accessPassword = String(accumulator[category.key].accessPassword || '').trim()
    accumulator[category.key].accessKey = String(accumulator[category.key].accessKey || '').trim()
    accumulator[category.key].sermonTitle = String(accumulator[category.key].sermonTitle || '').trim()
    accumulator[category.key].scriptureTitle = String(
      accumulator[category.key].scriptureTitle || accumulator[category.key].scriptureText || '',
    ).trim()

    return accumulator
  }, {})
}

export function extractYoutubeChannelId(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(input)) {
    return input
  }

  try {
    const url = new URL(input)
    const segments = url.pathname.split('/').filter(Boolean)
    const channelIndex = segments.findIndex((segment) => segment === 'channel')

    if (channelIndex >= 0 && /^UC[a-zA-Z0-9_-]{22}$/.test(segments[channelIndex + 1] || '')) {
      return segments[channelIndex + 1]
    }
  } catch {
    return ''
  }

  return ''
}

export function extractYoutubeVideoId(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  const channelId = extractYoutubeChannelId(input)
  if (channelId) return channelId

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

export function resolveYoutubeEmbedUrl(value) {
  const channelId = extractYoutubeChannelId(value)
  if (channelId) {
    return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&rel=0`
  }

  const videoId = extractYoutubeVideoId(value)
  if (videoId && videoId.length === 11) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
  }

  return ''
}

export function hasLiveStreamTarget(value) {
  return Boolean(extractYoutubeChannelId(value) || extractYoutubeVideoId(value))
}

export function generateLiveAccessKey() {
  const cryptoApi = globalThis.crypto

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID().replace(/-/g, '').slice(0, 20)
  }

  if (cryptoApi?.getRandomValues) {
    const buffer = new Uint32Array(4)
    cryptoApi.getRandomValues(buffer)
    return Array.from(buffer, (item) => item.toString(36)).join('').slice(0, 20)
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 20)
}
