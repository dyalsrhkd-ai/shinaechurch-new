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

const womenPage = ministryContentPages.find(page => page.id === 'ministry-women')

export default function Women() {
  const { items: galleryItems } = useGalleryItems()
  const { items: videoItems } = useVideoItems()
  const { content } = usePageContent(womenPage)

  const photos = useMemo(
    () => galleryItems.filter(item => item.dept === '여전도회'),
    [galleryItems]
  )
  const videos = useMemo(
    () => videoItems.filter(item => item.dept === '여전도회'),
    [videoItems]
  )

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="여전도회">
      <MenPageContent pageState={content} pageId="ministry-women" photos={photos} videos={videos} />
    </SubLayout>
  )
}
