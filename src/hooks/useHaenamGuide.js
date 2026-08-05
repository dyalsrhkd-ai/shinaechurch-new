import { useEffect, useState } from 'react'
import { getContentDocument } from '../api/contentApi'
import { haenamGuide, mergeHaenamGuide } from '../data/haenamGuide'

export function useHaenamGuide() {
  const [guide, setGuide] = useState(haenamGuide)

  useEffect(() => {
    let active = true
    getContentDocument('specialContents', 'haenamGuide')
      .then(document => {
        if (active) setGuide(document ? mergeHaenamGuide(document) : haenamGuide)
      })
      .catch(error => {
        console.error(error)
        if (active) setGuide(haenamGuide)
      })
    return () => { active = false }
  }, [])

  return guide
}
