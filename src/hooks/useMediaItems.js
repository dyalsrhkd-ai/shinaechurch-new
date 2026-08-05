import { useEffect, useState } from 'react'
import { listContentDocuments } from '../api/contentApi'
import { normalizeDept } from '../data/media'

function useContentList(collectionKey, mapItem) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    listContentDocuments(collectionKey, { sort: 'order', direction: 'desc' })
      .then(documents => {
        if (active) setItems(documents.map(mapItem))
      })
      .catch(error => {
        console.error(`Failed to load ${collectionKey}:`, error)
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [collectionKey, mapItem])

  return { items, loading }
}

const mapGallery = document => ({
  id: document.id,
  label: document.label || '',
  imgUrl: document.imgUrl || '',
  dept: normalizeDept(document.dept),
  order: document.order || 0,
})

const mapVideo = document => ({
  id: document.id,
  title: document.title || '',
  youtubeId: document.youtubeId || '',
  dept: normalizeDept(document.dept),
  order: document.order || 0,
})

const mapChoirVideo = document => ({
  id: document.id,
  title: document.title || '',
  youtubeId: document.youtubeId || '',
  singer: document.singer || '',
  order: document.order || 0,
})

const mapChoirGallery = document => ({
  id: document.id,
  label: document.label || '',
  imgUrl: document.imgUrl || '',
  order: document.order || 0,
})

export function useGalleryItems() {
  return useContentList('gallery', mapGallery)
}

export function useVideoItems() {
  return useContentList('videos', mapVideo)
}

export function useChoirVideos() {
  return useContentList('choirVideos', mapChoirVideo)
}

export function useChoirGallery() {
  return useContentList('choirGallery', mapChoirGallery)
}
