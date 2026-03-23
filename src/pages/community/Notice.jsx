import { useState } from 'react'
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

const entries = [
  {
    no: 9, title: '총회세미나 일정', date: '2019-01-16',
    content: '2019.1.21(월) 신월동 신광교회 오전10:30분 시작\n교회차를 이용하실분은 9시까지 오시기 바랍니다.\n\n신광교회 주소 및 전화번호\n서울 양천구 중앙로 211  02)2605-7107',
  },
  {
    no: 8, title: '1월 부서별 행사', date: '2019-01-07',
    content: '1. 2019년 신애교회 직분자 교육안내\n2019년 1월 12일 오전9시\n제1강 신광교회 담임목사 김성민',
  },
  {
    no: 7, title: '12월2일 세례식이 있습니다.', date: '2018-11-21',
    content: '입교나 세례를 받으실 분들은 오전10시까지 오시기 바랍니다.\n목양실에서 세례문답이 있습니다.',
  },
  {
    no: 6, title: '권사회 성탄트리', date: '2018-11-21',
    content: '권사회에서 성탄트리를 장식하고 있습니다.\n처음 시작부터 남전도회에서 설치 작업을 도와주시고 권사회에서 장식을 하고 있습니다.',
  },
  {
    no: 5, title: '2018.11.25. 교회 창립23주년예배', date: '2018-11-21',
    content: '25일 신애교회 창립 23주년 예배를 드립니다.\n- 권사회 성탄트리\n- 추수감사절 꽃꽂이',
  },
  {
    no: 4, title: '2018.11.18. 추수감사절', date: '2018-11-21',
    content: '11.18일 추수감사절입니다.\n권사회에서 꽃꽂이를 준비하고 있으니 과일을 드리고 싶으신 분은 권사님들께 연락 주세요.',
  },
  {
    no: 3, title: '2018.11.12~ 권사회 김장김치 판매', date: '2018-11-21',
    content: '2018.11.12~ 권사회 김장김치 판매합니다.\n절임배추 20kg 3만원, 김장김치 10kg 7만원, 20kg 13만원',
  },
  {
    no: 2, title: '오후2시 연합남전도 헌신예배가 있습니다.', date: '2018-09-16',
    content: '오후 2시 연합남전도 헌신예배가 있습니다.',
  },
  {
    no: 1, title: '성경대학 개강예배는 9월11일(화)', date: '2018-09-09',
    content: '성경대학 개강예배는 9월11일(화)\n장소: 강원도\n오전 8시30분 교회에서 출발',
  },
]

export default function Notice() {
  const [open, setOpen] = useState(null)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="공지사항">
      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
          {['번호', '제목', '등록일'].map(h => (
            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
          ))}
        </div>
        {entries.map((e, i) => (
          <div key={e.no}>
            <div
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 110px',
                padding: '14px 20px',
                borderBottom: open === i ? 'none' : (i < entries.length - 1 ? '1px solid #f0f2f5' : 'none'),
                background: i % 2 === 0 ? '#fff' : '#fafbfc',
                cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={el => el.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
            >
              <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{e.no}</span>
              <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {e.title}
                <span style={{ fontSize: '0.7rem', color: open === i ? '#0284c7' : '#9ca3af' }}>{open === i ? '▲' : '▼'}</span>
              </span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{e.date}</span>
            </div>
            {open === i && (
              <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: i < entries.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
                <pre style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{e.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </SubLayout>
  )
}
