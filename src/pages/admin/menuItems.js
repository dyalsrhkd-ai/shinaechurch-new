export const MENU_GROUPS = [
  {
    label: '메인 화면',
    items: [
      { label: '슬라이드 관리', path: '/admin/slides', icon: '🎞️', color: '#1d4ed8', desc: '메인 배너와 슬라이드를 관리', keywords: ['메인', '슬라이드', '배너'] },
    ],
  },
  {
    label: '교회 소개',
    items: [
      { label: '인사말', path: '/admin/greeting', icon: '✍️', color: '#1d4ed8', desc: '담임목사 인사말 수정', keywords: ['인사말', '목사', '소개글'] },
      { label: '섬기는 사람들', path: '/admin/staff', icon: '👥', color: '#0369a1', desc: '교역자와 직분자 정보 관리', keywords: ['스태프', '교역자', '직분자', '사역자'] },
      { label: '교회 연혁', path: '/admin/history', icon: '🕰️', color: '#7c3aed', desc: '연혁 항목 추가 및 수정', keywords: ['연혁', '역사'] },
      { label: '교회 연간 일정', path: '/admin/schedule', icon: '🗓️', color: '#059669', desc: '연간 행사와 일정을 관리', keywords: ['일정', '행사', '캘린더'] },
      { label: '예배 안내', path: '/admin/worship', icon: '⛪', color: '#dc2626', desc: '예배 시간과 안내 문구 관리', keywords: ['예배', '예배안내'] },
      { label: '오시는 길', path: '/admin/location', icon: '📍', color: '#059669', desc: '주소와 지도 정보를 관리', keywords: ['위치', '지도', '주소'] },
      { label: '교회 시설물 안내', path: '/admin/facility', icon: '🏛️', color: '#d97706', desc: '시설 이미지와 설명 관리', keywords: ['시설', '건물'] },
    ],
  },
  {
    label: '말씀 및 찬양',
    items: [
      { label: '주일예배', path: '/admin/sermons/sunday', icon: '🎤', color: '#dc2626', desc: '주일예배 영상 등록', keywords: ['주일예배', '설교'] },
      { label: '특별집회', path: '/admin/sermons/special', icon: '🔥', color: '#7c3aed', desc: '특별집회 영상 등록', keywords: ['특별집회', '부흥회'] },
      { label: '찬양대', path: '/admin/sermons/choir', icon: '🎵', color: '#059669', desc: '찬양대 영상과 사진 관리', keywords: ['찬양대', '찬양'] },
    ],
  },
  {
    label: '라이브영상',
    items: [
      { label: '아동부 라이브 영상 관리', path: '/admin/live-streams/children', icon: 'LIVE', color: '#dc2626', desc: '아동부 송출 주소와 비밀번호를 관리', keywords: ['라이브', '아동부', '실시간', '비밀번호', '송출'] },
      { label: '중고등부 라이브 영상 관리', path: '/admin/live-streams/youth', icon: 'LIVE', color: '#dc2626', desc: '중고등부 송출 주소와 비밀번호를 관리', keywords: ['라이브', '중고등부', '실시간', '비밀번호', '송출'] },
      { label: '청년부 라이브 영상 관리', path: '/admin/live-streams/young', icon: 'LIVE', color: '#dc2626', desc: '청년부 송출 주소와 비밀번호를 관리', keywords: ['라이브', '청년부', '실시간', '비밀번호', '송출'] },
      { label: '대예배 라이브 영상 관리', path: '/admin/live-streams/main', icon: 'LIVE', color: '#dc2626', desc: '대예배 송출 주소와 비밀번호를 관리', keywords: ['라이브', '대예배', '실시간', '비밀번호', '송출'] },
    ],
  },
  {
    label: '기관 및 부서',
    items: [
      { label: '기관 및 부서 관리', path: '/admin/content/ministry', icon: '🏷️', color: '#2563eb', desc: '남전도회, 여전도회, 권사회, 부속회 관리', keywords: ['기관', '부서', '남전도회', '여전도회', '권사회', '부속회'] },
    ],
  },
  {
    label: '교회학교',
    items: [
      { label: '교회학교 관리', path: '/admin/content/school', icon: '🎒', color: '#0891b2', desc: '아동부, 중고등부, 청년부, 성경대학 관리', keywords: ['교회학교', '아동부', '중고등부', '청년부', '성경대학'] },
    ],
  },
  {
    label: '선교',
    items: [
      { label: '선교 관리', path: '/admin/missions', icon: '🌍', color: '#2563eb', desc: '해외선교와 국내선교 정보를 관리', keywords: ['선교', '해외선교', '국내선교'] },
    ],
  },
  {
    label: '교제와 나눔',
    items: [
      { label: '공지사항', path: '/admin/notices', icon: '📢', color: '#0369a1', desc: '공지사항 작성과 수정', keywords: ['공지', '안내'] },
      { label: '주보', path: '/admin/bulletins', icon: '📰', color: '#7c3aed', desc: '주보 파일 업로드', keywords: ['주보', 'pdf', 'hwp'] },
      { label: '교회소식', path: '/admin/news', icon: '🖼️', color: '#059669', desc: '교회소식 이미지 등록', keywords: ['교회소식', '뉴스'] },
      { label: '행사갤러리', path: '/admin/gallery', icon: '🖼', color: '#d97706', desc: '행사 사진 갤러리 관리', keywords: ['갤러리', '사진'] },
      { label: '행사동영상', path: '/admin/videos', icon: '🎬', color: '#7c2d12', desc: '행사 영상 관리', keywords: ['동영상', '영상'] },
      { label: '새가족소개', path: '/admin/newcomers', icon: '🙌', color: '#0891b2', desc: '새가족 소개 관리', keywords: ['새가족', '등록'] },
      { label: '텃밭관리', path: '/admin/farm', icon: '🌱', color: '#65a30d', desc: '텃밭 활동 관리', keywords: ['텃밭', '농장'] },
    ],
  },
  {
    label: '설정',
    items: [
      { label: '기본 정보', path: '/admin/settings', icon: '⚙️', color: '#6b7280', desc: '교회명, 연락처, 로고 등을 관리', keywords: ['설정', '기본정보', '교회명', '연락처'] },
      { label: '방문 로그', path: '/admin/visitor-logs', icon: '📈', color: '#0ea5e9', desc: '홈페이지 방문 로그 확인', keywords: ['방문', '로그', 'analytics'] },
      { label: '활동 로그', path: '/admin/activity-logs', icon: '🧾', color: '#2563eb', desc: '관리자 작업 로그 확인', keywords: ['활동', '로그', '관리자'] },
    ],
  },
]

export const ALL_ITEMS = MENU_GROUPS.flatMap((group) => group.items)
