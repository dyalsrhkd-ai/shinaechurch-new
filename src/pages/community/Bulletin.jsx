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

const FILE_BASE = 'http://www.shinaechurch.co.kr/wi_files/pds_files/'

const entries = [
  { no: 146, title: '2026.03.22 주보', date: '2026-03-22', file: '1008.hwp' },
  { no: 145, title: '2026.03.15 주보', date: '2026-03-15', file: '1001.hwp' },
  { no: 144, title: '2026.03.08 주보', date: '2026-03-08', file: '997.hwp' },
  { no: 143, title: '2026.03.01 주보', date: '2026-03-01', file: '996.hwp' },
  { no: 142, title: '2026.02.22 주보', date: '2026-02-22', file: '991.hwp' },
  { no: 141, title: '2026.02.15 주보', date: '2026-02-15', file: '990.hwp' },
  { no: 140, title: '2026.02.08 주보', date: '2026-02-08', file: '989.hwp' },
  { no: 139, title: '2026.02.01 주보', date: '2026-02-01', file: '988.hwp' },
  { no: 138, title: '2026.01.25 주보', date: '2026-01-25', file: '984.hwp' },
  { no: 137, title: '2026.01.18 주보', date: '2026-01-18', file: '983.hwp' },
  { no: 136, title: '2026.01.11 주보', date: '2026-01-11', file: '982.hwp' },
  { no: 135, title: '2025.10.12 주보', date: '2025-10-12', file: '952.hwp' },
  { no: 134, title: '2025.10.05 주보', date: '2025-10-05', file: '951.hwp' },
  { no: 133, title: '2025.09.28 주보', date: '2025-09-28', file: '950.hwp' },
  { no: 132, title: '2025.09.21 주보', date: '2025-09-21', file: '949.hwp' },
  { no: 131, title: '2025.09.14 주보', date: '2025-09-14', file: '937.hwp' },
  { no: 130, title: '2025.09.07 주보', date: '2025-09-07', file: '936.hwp' },
  { no: 129, title: '2025.08.31 주보', date: '2025-08-31', file: '935.hwp' },
  { no: 128, title: '2025.08.24 주보', date: '2025-08-24', file: '934.hwp' },
  { no: 127, title: '2025.08.17 주보', date: '2025-08-17', file: '933.hwp' },
  { no: 126, title: '2025.08.10 주보', date: '2025-08-10', file: '932.hwp' },
  { no: 125, title: '2025.08.03 주보', date: '2025-08-03', file: '924.hwp' },
  { no: 124, title: '2025.07.20 주보', date: '2025-07-20', file: '923.hwp' },
  { no: 123, title: '2025.07.13 주보', date: '2025-07-13', file: '911.hwp' },
  { no: 122, title: '2025.06.29 주보', date: '2025-06-29', file: '900.hwp' },
  { no: 121, title: '2025.06.22 주보', date: '2025-06-22', file: '887.hwp' },
  { no: 120, title: '2025.06.18 주보', date: '2025-06-18', file: '886.hwp' },
  { no: 119, title: '2025.06.08 주보', date: '2025-06-08', file: '885.hwp' },
  { no: 118, title: '2025.06.01 주보', date: '2025-06-01', file: '880.hwp' },
  { no: 117, title: '2025.05.25 주보', date: '2025-05-25', file: '869.hwp' },
  { no: 116, title: '2025.05.18 주보', date: '2025-05-18', file: '868.hwp' },
  { no: 115, title: '2025.05.11 주보', date: '2025-05-11', file: '863.hwp' },
  { no: 114, title: '2025.05.04 주보', date: '2025-05-04', file: '859.hwp' },
  { no: 113, title: '2025.04.27 주보', date: '2025-04-27', file: '852.hwp' },
  { no: 112, title: '2025.04.20 주보', date: '2025-04-20', file: '842.hwp' },
  { no: 111, title: '2025.04.13 주보', date: '2025-04-13', file: '833.hwp' },
  { no: 110, title: '2025.04.06 주보', date: '2025-04-06', file: '823.hwp' },
  { no: 109, title: '2025.03.30 주보', date: '2025-03-30', file: '818.hwp' },
  { no: 108, title: '2025.03.23 주보', date: '2025-03-23', file: '809.hwp' },
  { no: 107, title: '2025.03.16 주보', date: '2025-03-16', file: '808.hwp' },
  { no: 106, title: '2025.03.09 주보', date: '2025-03-09', file: '787.hwp' },
  { no: 105, title: '2025.03.02 주보', date: '2025-03-02', file: '786.hwp' },
  { no: 104, title: '2025.02.23 주보', date: '2025-02-23', file: '785.hwp' },
  { no: 103, title: '2025.02.02 주보', date: '2025-02-02', file: '784.hwp' },
  { no: 102, title: '2025.01.26 주보', date: '2025-01-26', file: '783.hwp' },
  { no: 101, title: '2025.01.19 주보', date: '2025-01-19', file: '782.hwp' },
  { no: 100, title: '2025.01.12 주보', date: '2025-01-12', file: '781.hwp' },
  { no: 99,  title: '2025.01.05 주보', date: '2025-01-05', file: '780.hwp' },
  { no: 98,  title: '2020.12.13 주보', date: '2020-12-13', file: '608.pdf' },
  { no: 97,  title: '2020.12.06 주보', date: '2020-12-06', file: '607.pdf' },
  { no: 96,  title: '2020.11.29 주보', date: '2020-11-29', file: '606.pdf' },
  { no: 95,  title: '2020.11.22 주보', date: '2020-11-22', file: '605.pdf' },
  { no: 94,  title: '2020.11.15 주보', date: '2020-11-15', file: '604.pdf' },
  { no: 93,  title: '2020.11.08 주보', date: '2020-11-08', file: '603.pdf' },
  { no: 92,  title: '2020.11.01 주보', date: '2020-11-01', file: '602.pdf' },
  { no: 91,  title: '2020.10.25 주보', date: '2020-10-25', file: '597.pdf' },
  { no: 90,  title: '2020.10.18 주보', date: '2020-10-18', file: '596.pdf' },
  { no: 89,  title: '2020.10.11 주보', date: '2020-10-11', file: '595.pdf' },
  { no: 88,  title: '2020.10.04 주보', date: '2020-10-04', file: '594.pdf' },
  { no: 87,  title: '2020.09.27 주보', date: '2020-09-27', file: '579.pdf' },
]

const PER_PAGE = 15
import { useState } from 'react'

export default function Bulletin() {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(entries.length / PER_PAGE)
  const slice = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="주보보기">
      <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', borderLeft: '4px solid #0284c7', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0c4a6e', marginBottom: '4px' }}>주보 다운로드</p>
          <p style={{ fontSize: '0.82rem', color: '#374151' }}>주보는 HWP 또는 PDF 파일로 제공됩니다. 아래 목록에서 원하시는 주보를 클릭하여 다운로드하세요.</p>
        </div>
      </div>

      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px 110px', background: '#0f2040', padding: '12px 20px' }}>
          {['번호', '제목', '파일', '등록일'].map(h => (
            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
          ))}
        </div>
        {slice.map((e, i) => {
          const isPdf = e.file.endsWith('.pdf')
          return (
            <a
              key={e.no}
              href={FILE_BASE + e.file}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 60px 110px',
                padding: '14px 20px',
                borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafbfc',
                textDecoration: 'none',
                transition: 'background 0.15s',
                alignItems: 'center',
              }}
              onMouseEnter={el => el.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
            >
              <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{e.no}</span>
              <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500 }}>{e.title}</span>
              <span style={{ fontSize: '0.72rem', color: '#fff', background: isPdf ? '#dc2626' : '#0284c7', padding: '2px 8px', borderRadius: '9999px', textAlign: 'center' }}>{isPdf ? 'PDF' : 'HWP'}</span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{e.date}</span>
            </a>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p);  }} />
    </SubLayout>
  )
}
