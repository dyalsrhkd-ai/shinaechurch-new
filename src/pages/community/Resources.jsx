import SubLayout from '../../components/SubLayout'

const menus = [
  { label: '교회소식',   path: '/community/news' },
  { label: '주보보기',   path: '/community/bulletin' },
  { label: '행사갤러리', path: '/community/gallery' },
  { label: '행사동영상', path: '/community/video' },
  { label: '새가족소개', path: '/community/newcomer' },
  { label: '부서자료실', path: '/community/resources' },
  { label: '공지사항',   path: '/community/notice' },
  { label: '영선관리',   path: '/community/farm' },
]

export default function Resources() {
  return (
    <SubLayout section="교제와 나눔" menus={menus} title="부서자료실">
      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
          {['번호', '제목', '등록일'].map(h => (
            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
          ))}
        </div>
        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          등록된 자료가 없습니다.
        </div>
      </div>
    </SubLayout>
  )
}
