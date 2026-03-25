import { useMemo } from 'react'
import SubLayout from '../../components/SubLayout'
import DeptPageContent from '../../components/content/DeptPageContent'
import { ministryContentPages } from '../../data/pageContent'
import { useGalleryItems, useVideoItems } from '../../hooks/useMediaItems'
import { usePageContent } from '../../hooks/usePageContent'

const menus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회', path: '/ministry/deaconess' },
  { label: '부서별', path: '/ministry/dept' },
]

const deptPage = ministryContentPages.find(page => page.id === 'ministry-dept')
const deptNames = ['전도부', '제직회', '재정부']

export default function Dept() {
  const { items } = useGalleryItems()
  const { items: videoItems } = useVideoItems()
  const { content } = usePageContent(deptPage)

  const photos = useMemo(
    () => items.filter(item => deptNames.includes(item.dept)),
    [items]
  )
  const videos = useMemo(
    () => videoItems.filter(item => deptNames.includes(item.dept)),
    [videoItems]
  )

  return (
    <SubLayout section="기관 · 부서" menus={menus} title="부서별">
      <DeptPageContent pageState={content} photos={photos} videos={videos} />
    </SubLayout>
  )
}
