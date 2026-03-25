export const blockTemplates = [
  { type: 'intro', label: '소개', description: '긴 소개 문구를 넣는 기본 블록입니다.' },
  { type: 'info', label: '안내 정보', description: '예배시간, 대상, 장소, 담당자 같은 안내용 블록입니다.' },
  { type: 'list', label: '목록', description: '주요 활동, 연간 일정, 준비물처럼 여러 항목을 나열합니다.' },
  { type: 'people', label: '구성원', description: '임원, 교사, 회원 명단을 정리합니다.' },
  { type: 'note', label: '추가 문단', description: '짧은 강조 문구나 보조 설명을 넣습니다.' },
]

export const ministryContentPages = [
  {
    id: 'ministry-men',
    label: '남전도회',
    dept: '남전도회',
    description: '소개, 주요 활동, 임원 현황, 회원 명단을 관리합니다.',
    defaultHeroImage: '/images/user/user1.jpg',
    defaultBlocks: ['intro', 'list', 'people'],
  },
  {
    id: 'ministry-women',
    label: '여전도회',
    dept: '여전도회',
    description: '소개, 모임 안내, 주요 활동을 관리합니다.',
    defaultHeroImage: '/images/user/user2.jpg',
    defaultBlocks: ['intro', 'info', 'list'],
  },
  {
    id: 'ministry-deaconess',
    label: '권사회',
    dept: '권사회',
    description: '소개, 모임 안내, 주요 활동을 관리합니다.',
    defaultHeroImage: '/images/user/user_p1_1.jpg',
    defaultBlocks: ['intro', 'info', 'list'],
  },
  {
    id: 'ministry-dept',
    label: '부서별',
    description: '전도부, 제직회, 재정부를 묶어 관리하는 그룹형 페이지입니다.',
    defaultHeroImage: '/images/user/user_p2_1_1.jpg',
    defaultBlocks: ['intro', 'list', 'note'],
  },
]

export const schoolContentPages = [
  {
    id: 'school-children',
    label: '아동부',
    dept: '아동부',
    description: '소개, 예배 안내, 연간 일정, 활동 설명을 관리합니다.',
    defaultHeroImage: '/images/user/user_p5_1.jpg',
    defaultBlocks: ['intro', 'info', 'note', 'list'],
  },
  {
    id: 'school-youth',
    label: '중·고등부',
    dept: '중·고등부',
    description: '소개, 예배 안내, 연간 일정, 활동 설명을 관리합니다.',
    defaultHeroImage: '/images/user/user_p5_2.jpg',
    defaultBlocks: ['intro', 'info', 'note', 'list'],
  },
  {
    id: 'school-young',
    label: '청년부',
    dept: '청년부',
    description: '소개, 예배 안내, 연간 일정, 활동 설명을 관리합니다.',
    defaultHeroImage: '/images/user/user_p5_3.jpg',
    defaultBlocks: ['intro', 'info', 'note', 'list'],
  },
  {
    id: 'school-bible',
    label: '성경대학',
    dept: '성경대학',
    description: '소개, 모임 안내, 연간 일정, 활동 설명을 관리합니다.',
    defaultHeroImage: '/images/user/user_p5_4.jpg',
    defaultBlocks: ['intro', 'info', 'people'],
  },
]

export const defaultDeptGroups = [
  {
    id: 'dept-evangelism',
    dept: '전도부',
    title: '전도부',
    color: '#1d4ed8',
    verse: '',
    desc: '',
    schedulesText: '',
  },
  {
    id: 'dept-deacon-board',
    dept: '제직회',
    title: '제직회',
    color: '#7c3aed',
    verse: '',
    desc: '',
    schedulesText: '',
  },
  {
    id: 'dept-finance',
    dept: '재정부',
    title: '재정부',
    color: '#059669',
    verse: '',
    desc: '',
    schedulesText: '',
  },
]

export function createDefaultDeptGroups() {
  return defaultDeptGroups.map(group => ({ ...group }))
}

export function createBlock(type, index = 0) {
  return {
    id: `${type}-${Date.now()}-${index}`,
    type,
    title: '',
    subtitle: '',
    body: '',
    itemsText: '',
  }
}

export function createDefaultPageState(page) {
  return {
    heroTitle: page?.label || '',
    heroSubtitle: '',
    heroImage: page?.defaultHeroImage || '',
    blocks: (page?.defaultBlocks || []).map((type, index) => createBlock(type, index)),
    deptGroups: page?.id === 'ministry-dept' ? createDefaultDeptGroups() : [],
  }
}

export function normalizePageState(page, raw) {
  const fallback = createDefaultPageState(page)
  if (!raw) return fallback

  if (Array.isArray(raw.blocks) && raw.blocks.length > 0) {
    return {
      heroTitle: raw.heroTitle || page?.label || '',
      heroSubtitle: raw.heroSubtitle || '',
      heroImage: raw.heroImage || page?.defaultHeroImage || '',
      blocks: raw.blocks.map((block, index) => ({
        id: block.id || `${block.type || 'intro'}-${Date.now()}-${index}`,
        type: block.type || 'intro',
        title: block.title || '',
        subtitle: block.subtitle || '',
        body: block.body || '',
        itemsText: block.itemsText || '',
      })),
      deptGroups: page?.id === 'ministry-dept'
        ? (
          Array.isArray(raw.deptGroups) && raw.deptGroups.length > 0
            ? raw.deptGroups.map((group, index) => ({
              id: group.id || `dept-group-${index}`,
              dept: group.dept || '',
              title: group.title || group.dept || '',
              color: group.color || defaultDeptGroups[index]?.color || '#1d4ed8',
              verse: group.verse || '',
              desc: group.desc || '',
              schedulesText: group.schedulesText || '',
            }))
            : createDefaultDeptGroups()
        )
        : [],
    }
  }

  const legacyBlocks = []
  if (raw.introTitle || raw.introBody) {
    legacyBlocks.push({
      id: `intro-${Date.now()}-0`,
      type: 'intro',
      title: raw.introTitle || '소개',
      subtitle: '',
      body: raw.introBody || '',
      itemsText: '',
    })
  }
  if (raw.leaderText || raw.scheduleText) {
    legacyBlocks.push({
      id: `info-${Date.now()}-1`,
      type: 'info',
      title: '안내 정보',
      subtitle: raw.leaderText || '',
      body: raw.scheduleText || '',
      itemsText: '',
    })
  }
  if (raw.activitiesText) {
    legacyBlocks.push({
      id: `list-${Date.now()}-2`,
      type: 'list',
      title: '주요 활동',
      subtitle: '',
      body: '',
      itemsText: raw.activitiesText,
    })
  }
  if (raw.officersText || raw.membersText) {
    legacyBlocks.push({
      id: `people-${Date.now()}-3`,
      type: 'people',
      title: '구성원',
      subtitle: raw.officersText || '',
      body: raw.membersText || '',
      itemsText: '',
    })
  }
  if (raw.extraTitle || raw.extraBody) {
    legacyBlocks.push({
      id: `note-${Date.now()}-4`,
      type: 'note',
      title: raw.extraTitle || '추가 안내',
      subtitle: '',
      body: raw.extraBody || '',
      itemsText: '',
    })
  }

  return {
    heroTitle: raw.heroTitle || page?.label || '',
    heroSubtitle: raw.heroSubtitle || '',
    heroImage: raw.heroImage || page?.defaultHeroImage || '',
    blocks: legacyBlocks.length > 0 ? legacyBlocks : fallback.blocks,
    deptGroups: page?.id === 'ministry-dept'
      ? (
        Array.isArray(raw.deptGroups) && raw.deptGroups.length > 0
          ? raw.deptGroups.map((group, index) => ({
            id: group.id || `dept-group-${index}`,
            dept: group.dept || '',
            title: group.title || group.dept || '',
            color: group.color || defaultDeptGroups[index]?.color || '#1d4ed8',
            verse: group.verse || '',
            desc: group.desc || '',
            schedulesText: group.schedulesText || '',
          }))
          : createDefaultDeptGroups()
      )
      : [],
  }
}
