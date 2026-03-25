import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { createDefaultPageState, normalizePageState } from '../data/pageContent'

export function usePageContent(page) {
  const [content, setContent] = useState(() => {
    if (!page?.id) return createDefaultPageState(page)

    try {
      const cached = sessionStorage.getItem(`page-content:${page.id}`)
      if (cached) {
        return normalizePageState(page, JSON.parse(cached))
      }
    } catch (error) {
      console.error(error)
    }

    const emptyState = createDefaultPageState(page)
    return {
      ...emptyState,
      heroTitle: '',
      heroSubtitle: '',
      blocks: emptyState.blocks.map(block => ({
        ...block,
        title: '',
        subtitle: '',
        body: '',
        itemsText: '',
      })),
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!page?.id) return

    let active = true

    async function fetchContent() {
      setLoading(true)
      try {
        const snapshot = await getDoc(doc(db, 'pageContents', page.id))
        if (!active) return
        const nextContent = normalizePageState(page, snapshot.exists() ? snapshot.data() : null)
        setContent(nextContent)
        try {
          sessionStorage.setItem(`page-content:${page.id}`, JSON.stringify(nextContent))
        } catch (error) {
          console.error(error)
        }
      } catch (error) {
        console.error(error)
        if (active) setContent(createDefaultPageState(page))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchContent()
    return () => { active = false }
  }, [page])

  return { content, loading }
}
