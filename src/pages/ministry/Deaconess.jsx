import { useMemo } from 'react'
import SubLayout from '../../components/SubLayout'
import MenPageContent from '../../components/content/MenPageContent'
import { ministryContentPages } from '../../data/pageContent'
import { useGalleryItems, useVideoItems } from '../../hooks/useMediaItems'
import { usePageContent } from '../../hooks/usePageContent'

const menus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회', path: '/ministry/deaconess' },
  { label: '부서별', path: '/ministry/dept' },
]

const deaconessPage = ministryContentPages.find(page => page.id === 'ministry-deaconess')

export default function Deaconess() {
  const { items: galleryItems } = useGalleryItems()
  const { items: videoItems } = useVideoItems()
  const { content } = usePageContent(deaconessPage)

  const photos = useMemo(
    () => galleryItems.filter(item => item.dept === '권사회'),
    [galleryItems]
  )
  const videos = useMemo(
    () => videoItems.filter(item => item.dept === '권사회'),
    [videoItems]
  )

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="권사회">
      <MenPageContent pageState={content} pageId="ministry-deaconess" photos={photos} videos={videos} />
    </SubLayout>
  )
}
