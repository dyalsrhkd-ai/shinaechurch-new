import { createContext, useContext, useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULTS = {
  churchName: '신애교회',
  representative: '우용녀 목사',
  privacyManager: '김영단',
  address: '경기도 의왕시 왕곡로 187번지 (왕곡동)',
  phone: '031-429-4557',
  fax: '031-429-4557',
  email: 'shinaechurch@naver.com',
  tagline: '말씀과 기도,\n사랑과 섬김으로\n세워진 공동체',
}

const SettingsContext = createContext(DEFAULTS)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    getDoc(doc(db, 'settings', 'main'))
      .then(snap => { if (snap.exists()) setSettings({ ...DEFAULTS, ...snap.data() }) })
      .catch(console.error)
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
