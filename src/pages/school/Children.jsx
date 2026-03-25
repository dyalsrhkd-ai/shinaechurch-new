import { useMemo } from 'react'
import SubLayout from '../../components/SubLayout'
import SchoolPageContent from '../../components/content/SchoolPageContent'
import { ministryContentPages, schoolContentPages } from '../../data/pageContent'
import { useGalleryItems, useVideoItems } from '../../hooks/useMediaItems'
import { usePageContent } from '../../hooks/usePageContent'

const menus = [
  { label: '아동부', path: '/school/children' },
  { label: '중·고등부', path: '/school/youth' },
  { label: '청년부', path: '/school/young' },
  { label: '성경대학', path: '/school/bible' },
]

const page = schoolContentPages.find(item => item.id === 'school-children')
const EXCLUDED_CHILD_VIDEO_IDS = new Set(['bUa04tgzXXM', 'PS0rw_eLQQ4', 'stIIprjMpTk', '834aim_XLE4'])

export default function Children() {
  const { items: galleryItems } = useGalleryItems()
  const { items: videoItems } = useVideoItems()
  const { content } = usePageContent(page)

  const photos = useMemo(() => galleryItems.filter(item => item.dept === '아동부'), [galleryItems])
  const videos = useMemo(
    () => videoItems.filter(item => item.dept === '아동부' && !EXCLUDED_CHILD_VIDEO_IDS.has(item.youtubeId)),
    [videoItems]
  )

  return (
    <SubLayout section="교회 학교" menus={menus} title="아동부">
      <SchoolPageContent pageState={content} pageId="school-children" photos={photos} videos={videos} />
    </SubLayout>
  )
}
