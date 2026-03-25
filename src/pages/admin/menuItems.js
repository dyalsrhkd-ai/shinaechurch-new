export const MENU_GROUPS = [
  {
    label: '메인 화면',
    items: [
      { label: '슬라이더 관리',   path: '/admin/slides',           icon: '🖼️', color: '#1d4ed8', desc: '메인 배너 이미지 관리', keywords: ['메인', '배너', '메인배너', '슬라이드', '첫화면'] },
    ],
  },
  {
    label: '교회 소개',
    items: [
      { label: '인사말',          path: '/admin/greeting',         icon: '✉️', color: '#1d4ed8', desc: '담임목사 인사말 수정', keywords: ['목사인사', '담임목사', '환영문', '소개글'] },
      { label: '섬기는 사람들',   path: '/admin/staff',            icon: '👥', color: '#0369a1', desc: '교역자 정보 수정', keywords: ['교역자', '직원', '사역자', '스태프', '부목사', '전도사'] },
      { label: '교회 연혁',       path: '/admin/history',          icon: '📅', color: '#7c3aed', desc: '연혁 추가·수정·삭제', keywords: ['연혁', '역사', '교회사'] },
      { label: '연간 일정',       path: '/admin/schedule',         icon: '🗓️', color: '#059669', desc: '월별 교회 일정 관리', keywords: ['일정', '행사일정', '월별일정', '캘린더'] },
      { label: '예배 안내',       path: '/admin/worship',          icon: '⛪', color: '#dc2626', desc: '예배 시간·장소 관리', keywords: ['예배시간', '예배장소', '주일예배', '수요예배', '금요예배'] },
      { label: '오시는 길',       path: '/admin/location',         icon: '📍', color: '#059669', desc: '지도·주소·교통안내 수정', keywords: ['지도', '주소', '주소수정', '위치', '길찾기', '교통', '카카오맵', '네이버지도'] },
      { label: '교회시설물',      path: '/admin/facility',         icon: '🏛️', color: '#d97706', desc: '시설 사진·구성 관리', keywords: ['시설', '건물', '본당', '예배실', '시설사진', '교회건물'] },
    ],
  },
  {
    label: '말씀 · 찬양',
    items: [
      { label: '주일설교',        path: '/admin/sermons/sunday',   icon: '🎙️', color: '#dc2626', desc: '주일 설교 영상 등록', keywords: ['설교', '주일', '주일예배설교', '말씀', '설교영상'] },
      { label: '특별설교',        path: '/admin/sermons/special',  icon: '✨',  color: '#7c3aed', desc: '특별 설교 영상 등록', keywords: ['특별집회', '부흥회', '행사설교', '특강'] },
      { label: '성가대',          path: '/admin/sermons/choir',    icon: '🎵', color: '#059669', desc: '성가대 영상·사진 관리', keywords: ['찬양대', '봉헌송', '찬양', '성가', '성가대사진'] },
    ],
  },
  {
    label: '기관 · 부서',
    items: [
      { label: '기관 · 부서 관리', path: '/admin/content/ministry', icon: '🤝', color: '#2563eb', desc: '남전도회·여전도회·권사회·부서별', keywords: ['기관부서', '남전도회', '여전도회', '권사회', '전도부', '제직회', '재정부', '남선교회', '여선교회'] },
    ],
  },
  {
    label: '교회학교',
    items: [
      { label: '교회학교 관리',   path: '/admin/content/school',   icon: '🎒', color: '#0891b2', desc: '아동부·중고등부·청년부·성경대학', keywords: ['교회학교', '아동부', '중고등부', '청년부', '청소년부', '성경대학', '학생부'] },
    ],
  },
  {
    label: '교제와 나눔',
    items: [
      { label: '공지사항',        path: '/admin/notices',          icon: '📢', color: '#0369a1', desc: '공지 작성 및 수정', keywords: ['공지', '안내', '알림', '모집'] },
      { label: '주보',            path: '/admin/bulletins',        icon: '📄', color: '#7c3aed', desc: '주보 파일 업로드', keywords: ['주보보기', 'pdf', 'hwp', '주보파일'] },
      { label: '교회소식',        path: '/admin/news',             icon: '📰', color: '#059669', desc: '주간 소식 이미지 등록', keywords: ['소식', '뉴스', '주간소식'] },
      { label: '행사갤러리',      path: '/admin/gallery',          icon: '📷', color: '#d97706', desc: '갤러리 사진 관리', keywords: ['갤러리', '사진', '행사사진', '앨범'] },
      { label: '행사동영상',      path: '/admin/videos',           icon: '🎬', color: '#7c2d12', desc: '부서별 영상 관리', keywords: ['동영상', '영상', '유튜브', '행사영상'] },
      { label: '새신자소개',       path: '/admin/newcomers',        icon: '🙋', color: '#0891b2', desc: '새신자 소개 관리', keywords: ['새신자', '신규등록', '등록교인'] },
      { label: '영선관리',        path: '/admin/farm',             icon: '🌱', color: '#65a30d', desc: '농장·영선 관리', keywords: ['영선', '농장', '작물', '연못', '채소'] },
    ],
  },
  {
    label: '설정',
    items: [
      { label: '기본 정보',       path: '/admin/settings',         icon: '⚙️', color: '#6b7280', desc: '교회 연락처·표어 수정', keywords: ['설정', '기본설정', '연락처', '전화번호', '이메일', '팩스', '표어', '교회명'] },
    ],
  },
]

export const ALL_ITEMS = MENU_GROUPS.flatMap(g => g.items)
