import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { CHOIR_DEPT, normalizeDept } from '../data/media'

export function useGalleryItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchItems() {
      setLoading(true)
      try {
        const snap = await getDocs(query(collection(db, 'gallery'), orderBy('order', 'desc')))
        if (!active) return
        setItems(snap.docs.map(doc => ({
          id: doc.id,
          label: doc.data().label || '',
          imgUrl: doc.data().imgUrl || '',
          dept: normalizeDept(doc.data().dept),
          order: doc.data().order || 0,
        })))
      } catch (error) {
        console.error('Failed to load gallery:', error)
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchItems()
    return () => { active = false }
  }, [])

  return { items, loading }
}

export function useVideoItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchItems() {
      setLoading(true)
      try {
        const snap = await getDocs(query(collection(db, 'videos'), orderBy('order', 'desc')))
        if (!active) return
        setItems(snap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '',
          youtubeId: doc.data().youtubeId || '',
          dept: normalizeDept(doc.data().dept),
          order: doc.data().order || 0,
        })))
      } catch (error) {
        console.error('Failed to load videos:', error)
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchItems()
    return () => { active = false }
  }, [])

  return { items, loading }
}

export function useChoirVideos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchItems() {
      setLoading(true)
      try {
        let snap = await getDocs(query(collection(db, 'choirVideos'), orderBy('order', 'desc')))
        if (snap.empty) {
          const legacySnap = await getDocs(query(collection(db, 'videos'), orderBy('order', 'desc')))
          const legacyItems = legacySnap.docs.filter(docItem => docItem.data().dept === CHOIR_DEPT)

          if (legacyItems.length > 0) {
            await Promise.all(legacyItems.map(async docItem => {
              const data = { ...docItem.data() }
              delete data.dept
              await setDoc(doc(db, 'choirVideos', docItem.id), data, { merge: true })
              await deleteDoc(doc(db, 'videos', docItem.id))
            }))
            snap = await getDocs(query(collection(db, 'choirVideos'), orderBy('order', 'desc')))
          }
        }

        if (!active) return
        setItems(snap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '',
          youtubeId: doc.data().youtubeId || '',
          singer: doc.data().singer || '',
          order: doc.data().order || 0,
        })))
      } catch (error) {
        console.error('Failed to load choir videos:', error)
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchItems()
    return () => { active = false }
  }, [])

  return { items, loading }
}

export function useChoirGallery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchItems() {
      setLoading(true)
      try {
        let snap = await getDocs(query(collection(db, 'choirGallery'), orderBy('order', 'desc')))
        if (snap.empty) {
          const legacySnap = await getDocs(query(collection(db, 'gallery'), orderBy('order', 'desc')))
          const legacyItems = legacySnap.docs.filter(docItem => docItem.data().dept === CHOIR_DEPT)

          if (legacyItems.length > 0) {
            await Promise.all(legacyItems.map(async docItem => {
              const data = { ...docItem.data() }
              delete data.dept
              await setDoc(doc(db, 'choirGallery', docItem.id), data, { merge: true })
              await deleteDoc(doc(db, 'gallery', docItem.id))
            }))
            snap = await getDocs(query(collection(db, 'choirGallery'), orderBy('order', 'desc')))
          }
        }

        if (!active) return
        setItems(snap.docs.map(doc => ({
          id: doc.id,
          label: doc.data().label || '',
          imgUrl: doc.data().imgUrl || '',
          order: doc.data().order || 0,
        })))
      } catch (error) {
        console.error('Failed to load choir gallery:', error)
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchItems()
    return () => { active = false }
  }, [])

  return { items, loading }
}
