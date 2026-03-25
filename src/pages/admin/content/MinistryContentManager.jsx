import PageContentManager from './PageContentManager'
import { ministryContentPages } from '../../../data/pageContent'

export default function MinistryContentManager() {
  return (
    <PageContentManager
      title="기관 · 부서 관리"
      description="남전도회, 여전도회, 권사회, 부서별 페이지의 텍스트 섹션을 관리합니다."
      pages={ministryContentPages}
    />
  )
}
