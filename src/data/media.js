export const DEPTS = [
  '전체',
  '아동부',
  '중·고등부',
  '청년부',
  '성경대학',
  '남전도회',
  '여전도회',
  '권사회',
  '성가대',
  '전도부',
  '제직회',
  '재정부',
  '기타',
]

export const EVENT_DEPTS = DEPTS.filter(dept => dept !== '성가대')

export const CHOIR_DEPT = '성가대'

export const DEPT_PAGE_MAP = {
  아동부: '/school/children',
  '중·고등부': '/school/youth',
  청년부: '/school/young',
  성경대학: '/school/bible',
  남전도회: '/ministry/men',
  여전도회: '/ministry/women',
  권사회: '/ministry/deaconess',
  전도부: '/ministry/dept',
  제직회: '/ministry/dept',
  재정부: '/ministry/dept',
}

export function normalizeDept(value) {
  return DEPTS.includes(value) ? value : '기타'
}

export function extractYoutubeId(input) {
  if (!input) return ''
  const trimmed = input.trim()
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : trimmed
}

export function getYoutubeThumb(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
}
