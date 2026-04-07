import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import baeksukFavicon from '../assets/baeksuk-favicon.png'
import { DEFAULT_LIVE_STREAMS, normalizeLiveStreams } from '../utils/liveStream'

const DEFAULTS = {
  churchName: '신애교회',
  representative: '담임목사',
  privacyManager: '관리자',
  address: '경기도 군포시 번영로 187번길',
  phone: '031-429-4557',
  fax: '031-429-4557',
  email: 'shinaechurch@naver.com',
  tagline: '말씀과 기도,\n사랑과 섬김으로\n세워지는 공동체',
  logoUrl: '',
  liveAccessPassword: '',
  liveStreams: DEFAULT_LIVE_STREAMS,
}

const SettingsContext = createContext(DEFAULTS)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'main'),
      (snap) => {
        if (!snap.exists()) {
          setSettings(DEFAULTS)
          return
        }

        const data = snap.data()
        setSettings({
          ...DEFAULTS,
          ...data,
          liveAccessPassword: String(data.liveAccessPassword || '').trim(),
          liveStreams: normalizeLiveStreams(data.liveStreams, data.liveStreamTest),
        })
      },
      console.error,
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const faviconHref = baeksukFavicon
    let favicon = document.querySelector("link[rel='icon']")

    if (!favicon) {
      favicon = document.createElement('link')
      favicon.setAttribute('rel', 'icon')
      document.head.appendChild(favicon)
    }

    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', faviconHref)
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
