import PageContentManager from './PageContentManager'
import { schoolContentPages } from '../../../data/pageContent'

export default function SchoolContentManager() {
  return (
    <PageContentManager
      title="교회학교 관리"
      description="아동부, 중·고등부, 청년부, 성경대학 페이지의 텍스트 섹션을 관리합니다."
      pages={schoolContentPages}
    />
  )
}
