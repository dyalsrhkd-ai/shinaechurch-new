import { useEffect, useState } from 'react'
import { getContentDocument } from '../api/contentApi'

export function useSiteAssets() {
  const [assets, setAssets] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getContentDocument('siteAssets', 'main')
      .then((document) => {
        if (!active) return
        setAssets(document || {})
      })
      .catch((error) => {
        console.error('Failed to load site assets:', error)
        if (active) setAssets({})
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { assets: assets || {}, loading }
}
