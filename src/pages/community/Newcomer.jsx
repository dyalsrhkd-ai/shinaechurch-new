import { useState } from 'react'
import Pagination from '../../components/Pagination'
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
  { no: 29, bbs: 816, name: '곽**성도',                          date: '2025-03-30' },
  { no: 28, bbs: 815, name: '한상욱 전도사',                      date: '2025-03-30' },
  { no: 27, bbs: 799, name: '새가족 교육수료식',                   date: '2025-03-16' },
  { no: 26, bbs: 789, name: '2025.01.05 새가족환영',               date: '2025-01-05' },
  { no: 25, bbs: null, name: '2020.02.23 김**, 오**',              date: '2020-02-23' },
  { no: 24, bbs: 403, name: "'19.12.01 김**, 김**, 김**",          date: '2019-12-01' },
  { no: 23, bbs: 401, name: "'19.11.24 김**성도",                  date: '2019-11-24' },
  { no: 22, bbs: 400, name: "'19.10.13 지*성도",                   date: '2019-10-13' },
  { no: 21, bbs: 399, name: "'19.09.01 석**집사",                  date: '2019-09-01' },
  { no: 20, bbs: 291, name: '이**성도 2019.7.7',                   date: '2019-07-07' },
  { no: 19, bbs: 281, name: '유**권사 2019.6.30',                  date: '2019-06-30' },
  { no: 18, bbs: 276, name: '2019.6.23 이**성도',                  date: '2019-06-23' },
  { no: 17, bbs: 253, name: '2019.05.26 장**, 이**성도',           date: '2019-05-26' },
  { no: 16, bbs: 242, name: '2019.05.19 박**, 정**, 백**, 최**',   date: '2019-05-19' },
  { no: 15, bbs: 241, name: '2019.05.12 이**, 최**',               date: '2019-05-12' },
  { no: 14, bbs: 240, name: '2019.05.05 황**성도',                 date: '2019-05-05' },
  { no: 13, bbs: 239, name: '2019.04.14 손**성도',                 date: '2019-04-14' },
  { no: 12, bbs: 238, name: '2019.03.24 홍**권사',                 date: '2019-03-24' },
  { no: 11, bbs: 237, name: '2019.01.20 장**성도',                 date: '2019-01-20' },
  { no: 10, bbs: 156, name: '2018.12.23 김**성도',                 date: '2018-12-23' },
  { no: 9,  bbs: 129, name: '2018.11.18 권**, 최**성도',           date: '2018-11-18' },
  { no: 8,  bbs: 128, name: '2018.10.21 전**, 유**성도',           date: '2018-10-21' },
  { no: 7,  bbs: 92,  name: '2018.9.16 박**자매',                  date: '2018-09-16' },
  { no: 6,  bbs: 87,  name: '2018.9.9 노**성도',                   date: '2018-09-09' },
  { no: 5,  bbs: 76,  name: '2018.9.2 권**집사부부',               date: '2018-09-02' },
  { no: 4,  bbs: 17,  name: '2018.7.8 허**집사',                   date: '2018-07-08' },
  { no: 3,  bbs: 16,  name: '2018.5.27 김**청년',                  date: '2018-05-27' },
  { no: 2,  bbs: 15,  name: '2018.5.27 함**성도',                  date: '2018-05-27' },
  { no: 1,  bbs: 14,  name: '2018.3.4 김**집사가족',               date: '2018-03-04' },
]

const PER_PAGE = 15

export default function Newcomer() {
  const [open, setOpen] = useState(null)
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(entries.length / PER_PAGE)
  const slice = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="새가족소개">
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', borderLeft: '4px solid #16a34a' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#14532d', marginBottom: '4px' }}>새가족을 환영합니다</p>
        <p style={{ fontSize: '0.82rem', color: '#374151' }}>신애교회에 새롭게 등록하신 새가족 여러분을 진심으로 환영합니다.</p>
      </div>

      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
          {['번호', '이름/내용', '날짜'].map(h => (
            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
          ))}
        </div>
        {slice.map((e, i) => {
          const globalIdx = (page - 1) * PER_PAGE + i
          const isOpen = open === globalIdx
          const hasImg = e.bbs !== null
          return (
            <div key={e.no}>
              <div
                onClick={() => hasImg && setOpen(isOpen ? null : globalIdx)}
                style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 110px',
                  padding: '14px 20px',
                  borderBottom: isOpen ? 'none' : (i < slice.length - 1 ? '1px solid #f0f2f5' : 'none'),
                  background: i % 2 === 0 ? '#fff' : '#fafbfc',
                  cursor: hasImg ? 'pointer' : 'default',
                  alignItems: 'center', transition: 'background 0.15s',
                }}
                onMouseEnter={el => { if (hasImg) el.currentTarget.style.background = '#f0f7ff' }}
                onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
              >
                <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{e.no}</span>
                <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {e.name}
                  {hasImg && <span style={{ fontSize: '0.7rem', color: isOpen ? '#0284c7' : '#9ca3af' }}>{isOpen ? '▲' : '▼'}</span>}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{e.date}</span>
              </div>
              {isOpen && e.bbs && (
                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={`/images/community/newcomer/${e.bbs}.jpg`}
                    alt={e.name}
                    style={{ maxWidth: '500px', width: '100%', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); setOpen(null) }} />
    </SubLayout>
  )
}
