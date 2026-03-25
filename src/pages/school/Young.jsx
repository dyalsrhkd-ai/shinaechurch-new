import { useMemo } from 'react'
import SubLayout from '../../components/SubLayout'
import SchoolPageContent from '../../components/content/SchoolPageContent'
import { schoolContentPages } from '../../data/pageContent'
import { useGalleryItems, useVideoItems } from '../../hooks/useMediaItems'
import { usePageContent } from '../../hooks/usePageContent'

const menus = [
  { label: '아동부', path: '/school/children' },
  { label: '중·고등부', path: '/school/youth' },
  { label: '청년부', path: '/school/young' },
  { label: '성경대학', path: '/school/bible' },
]

const page = schoolContentPages.find(item => item.id === 'school-young')

export default function Young() {
  const { items: galleryItems } = useGalleryItems()
  const { items: videoItems } = useVideoItems()
  const { content } = usePageContent(page)

  const photos = useMemo(() => galleryItems.filter(item => item.dept === '청년부'), [galleryItems])
  const videos = useMemo(() => videoItems.filter(item => item.dept === '청년부'), [videoItems])

  return (
    <SubLayout section="교회 학교" menus={menus} title="청년부">
      <SchoolPageContent pageState={content} pageId="school-young" photos={photos} videos={videos} />
    </SubLayout>
  )
}
