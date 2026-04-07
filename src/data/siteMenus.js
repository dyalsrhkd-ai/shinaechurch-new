import { LIVE_STREAM_CATEGORIES } from '../utils/liveStream'

export const introMenus = [
  { label: '인사말', path: '/intro/greeting' },
  { label: '교회 연혁', path: '/intro/history' },
  { label: '섬기는 사람들', path: '/intro/staff' },
  { label: '교회 연간 일정', path: '/intro/schedule' },
  { label: '예배 안내', path: '/intro/worship' },
  { label: '오시는 길', path: '/intro/location' },
  { label: '교회 시설물 안내', path: '/intro/facility' },
  { label: '해남성전 선교관', path: '/intro/haenam' },
]

export const ministryMenus = [
  { label: '남전도회', path: '/ministry/men' },
  { label: '여전도회', path: '/ministry/women' },
  { label: '권사회', path: '/ministry/deaconess' },
  { label: '부속회', path: '/ministry/dept' },
  { label: '해남성전 선교관', path: '/ministry/haenam' },
]

export const liveMenus = LIVE_STREAM_CATEGORIES.map(({ label, path }) => ({ label, path }))

export const headerMenus = [
  {
    label: '교회 소개',
    path: '/intro',
    sub: introMenus,
  },
  {
    label: '말씀 및 찬양',
    path: '/media',
    sub: [
      { label: '주일예배', path: '/media/sunday' },
      { label: '특별집회', path: '/media/special' },
      { label: '찬양대', path: '/media/choir' },
    ],
  },
  {
    label: '라이브영상',
    path: '/media/live',
    sub: liveMenus,
  },
  {
    label: '기관 및 부서',
    path: '/ministry',
    sub: ministryMenus,
  },
  {
    label: '교회 학교',
    path: '/school',
    sub: [
      { label: '아동부', path: '/school/children' },
      { label: '중고등부', path: '/school/youth' },
      { label: '청년부', path: '/school/young' },
      { label: '성경대학', path: '/school/bible' },
    ],
  },
  {
    label: '선교',
    path: '/mission',
    sub: [
      { label: '해외선교', path: '/mission/overseas' },
      { label: '국내선교', path: '/mission/domestic' },
    ],
  },
  {
    label: '교제와 나눔',
    path: '/community',
    sub: [
      { label: '교회소식', path: '/community/news' },
      { label: '주보보기', path: '/community/bulletin' },
      { label: '행사갤러리', path: '/community/gallery' },
      { label: '행사동영상', path: '/community/video' },
      { label: '새가족소개', path: '/community/newcomer' },
      { label: '부서자료실', path: '/community/resources' },
      { label: '공지사항', path: '/community/notice' },
      { label: '텃밭관리', path: '/community/farm' },
    ],
  },
]

export const footerColumns = [
  {
    title: '교회 소개',
    links: introMenus.filter((item) => item.path !== '/intro/schedule'),
  },
  {
    title: '말씀 및 찬양',
    links: [
      { label: '주일예배', to: '/media/sunday' },
      { label: '특별집회', to: '/media/special' },
      { label: '찬양대', to: '/media/choir' },
      { label: '라이브영상', to: '/media/live/main' },
    ],
  },
  {
    title: '기관 및 부서',
    links: ministryMenus.map((item) => ({ label: item.label, to: item.path })),
  },
  {
    title: '교회 학교',
    links: [
      { label: '아동부', to: '/school/children' },
      { label: '중고등부', to: '/school/youth' },
      { label: '청년부', to: '/school/young' },
      { label: '성경대학', to: '/school/bible' },
    ],
  },
  {
    title: '선교',
    links: [
      { label: '해외선교', to: '/mission/overseas' },
      { label: '국내선교', to: '/mission/domestic' },
    ],
  },
  {
    title: '교제와 나눔',
    links: [
      { label: '공지사항', to: '/community/notice' },
      { label: '주보보기', to: '/community/bulletin' },
      { label: '행사갤러리', to: '/community/gallery' },
      { label: '부서자료실', to: '/community/resources' },
    ],
  },
]
