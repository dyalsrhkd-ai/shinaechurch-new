import Pagination from '../../components/Pagination'
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

const PER_PAGE = 15

const entries = [
  { no: 1007, title: '2026.03.22 교회소식', date: '2026-03-22', img: '/images/community/news_1007.png' },
  { no: 1000, title: '2026.03.15.교회소식', date: '2026-03-15', img: '/images/community/news_1000.png' },
  { no: 999, title: '2026.03.08교회소식', date: '2026-03-08', img: '/images/community/news_999.png' },
  { no: 998, title: '2026.03.01교회소식', date: '2026-03-08', img: '/images/community/news_998.png' },
  { no: 995, title: '2026.02.22교회소식', date: '2026-03-08', img: '/images/community/news_995.png' },
  { no: 994, title: '2026.02.15.교회소식', date: '2026-03-08', img: '/images/community/news_994.png' },
  { no: 993, title: '2026.02.08교회소식', date: '2026-03-08', img: '/images/community/news_993.png' },
  { no: 992, title: '2026.02.01교회소식', date: '2026-03-08', img: '/images/community/news_992.png' },
  { no: 987, title: '2026.01.25교회소식', date: '2026-03-08', img: '/images/community/news_987.png' },
  { no: 986, title: '2026.01.18교회소식', date: '2026-03-08', img: '/images/community/news_986.png' },
  { no: 985, title: '2026.01.11교회소식', date: '2026-03-08', img: '/images/community/news_985.png' },
  { no: 948, title: '2025.10.12교회소식', date: '2025-10-12', img: '/images/community/news_948.png' },
  { no: 947, title: '2025.10.05교회소식', date: '2025-10-12', img: '/images/community/news_947.png' },
  { no: 946, title: '2025.09.28교회소식', date: '2025-10-12', img: '/images/community/news_946.png' },
  { no: 945, title: '2025.09.21교회소식', date: '2025-10-12', img: '/images/community/news_945.png' },
  { no: 942, title: '2025.09.14.교회소식', date: '2025-09-13', img: '/images/community/news_942.png' },
  { no: 941, title: '2025.09.07 교회소식', date: '2025-09-13', img: '/images/community/news_941.png' },
  { no: 940, title: '2025.08.31 교회소식', date: '2025-09-13', img: '/images/community/news_940.png' },
  { no: 939, title: '2025.08.24. 교회소식', date: '2025-09-13', img: '/images/community/news_939.png' },
  { no: 938, title: '2025.08.17교회소식', date: '2025-09-13', img: '/images/community/news_938.png' },
  { no: 931, title: '2025.08.10. 교회소식', date: '2025-09-13', img: '/images/community/news_931.png' },
  { no: 926, title: '2025.08.03. 교회소식', date: '2025-09-06', img: '/images/community/news_926.png' },
  { no: 925, title: '2025.07.20 교회소식', date: '2025-09-06', img: '/images/community/news_925.png' },
  { no: 910, title: '2025.07.13.교회소식', date: '2025-07-13', img: '/images/community/news_910.png' },
  { no: 899, title: '2025.06.29. 교회소식', date: '2025-06-29', img: '/images/community/news_899.png' },
  { no: 890, title: '2025.06.22.교회소식', date: '2025-06-22', img: '/images/community/news_890.png' },
  { no: 889, title: '2025.06.15.교회소식', date: '2025-06-22', img: '/images/community/news_889.png' },
  { no: 888, title: '2025.06.08. 교회소식', date: '2025-06-22', img: '/images/community/news_888.png' },
  { no: 879, title: '2025.06.1 교회소식', date: '2025-06-01', img: '/images/community/news_879.png' },
  { no: 867, title: '2025.05.25 교회소식', date: '2025-05-25', img: '/images/community/news_867.png' },
  { no: 866, title: '2025.05.18. 교회소식', date: '2025-05-25', img: '/images/community/news_866.png' },
  { no: 862, title: '2025.05.11. 교회소식', date: '2025-05-11', img: '/images/community/news_862.png' },
  { no: 858, title: '2025.05.04. 교회소식', date: '2025-05-04', img: '/images/community/news_858.png' },
  { no: 851, title: '2025.04.27.교회소식', date: '2025-04-27', img: '/images/community/news_851.png' },
  { no: 841, title: '2025.04.20. 교회소식', date: '2025-04-20', img: '/images/community/news_841.png' },
  { no: 832, title: '2025.04.13.교회소식', date: '2025-04-13', img: '/images/community/news_832.png' },
  { no: 822, title: '2025.04.06.교회소식', date: '2025-04-06', img: '/images/community/news_822.png' },
  { no: 819, title: '2025.03.30.교회소식', date: '2025-03-30', img: '/images/community/news_819.png' },
  { no: 811, title: '2025.03.23.교회소식', date: '2025-03-23', img: '/images/community/news_811.png' },
  { no: 810, title: '2025.03.16.교회소식', date: '2025-03-23', img: '/images/community/news_810.png' },
  { no: 778, title: '2025.03.09. 교회소식', date: '2025-03-16', img: '/images/community/news_778.png' },
  { no: 777, title: '2025.03.02. 교회소식', date: '2025-03-16', img: '/images/community/news_777.png' },
  { no: 776, title: '2025.02.23. 교회소식', date: '2025-03-16', img: '/images/community/news_776.png' },
  { no: 775, title: '2025.02.02. 교회소식', date: '2025-03-16', img: '/images/community/news_775.png' },
  { no: 774, title: '2025.01.26. 교회소식', date: '2025-03-16', img: '/images/community/news_774.png' },
  { no: 773, title: '2025.01.19. 교회소식', date: '2025-03-16', img: '/images/community/news_773.png' },
  { no: 772, title: '2025.01.12교회소식', date: '2025-03-16', img: '/images/community/news_772.png' },
  { no: 771, title: '2025.01.15. 교회소식', date: '2025-03-16', img: '/images/community/news_771.png' },
  { no: 615, title: '2020.12.13교회소식', date: '2020-12-16', img: '/images/community/news_615.png' },
  { no: 613, title: '2020.11.29교회소식', date: '2020-12-16', img: '/images/community/news_613.png' },
  { no: 612, title: '2020.11.22교회소식', date: '2020-12-16', img: '/images/community/news_612.png' },
  { no: 611, title: '2020.11.15교회소식', date: '2020-12-16', img: '/images/community/news_611.png' },
  { no: 610, title: '2020.11.08교회소식', date: '2020-12-16', img: '/images/community/news_610.png' },
  { no: 609, title: '2020.11.01교회소식', date: '2020-12-16', img: '/images/community/news_609.png' },
  { no: 601, title: '2020.10.25교회소식', date: '2020-12-16', img: '/images/community/news_601.png' },
  { no: 600, title: '2020.10.18교회소식', date: '2020-12-16', img: '/images/community/news_600.png' },
  { no: 599, title: '2020.10.11교회소식', date: '2020-12-16', img: '/images/community/news_599.png' },
  { no: 598, title: '2020.10.04교회소식', date: '2020-12-16', img: '/images/community/news_598.png' },
  { no: 581, title: '2020.09.27교회소식', date: '2020-09-25', img: '/images/community/news_581.png' },
  { no: 580, title: '2020.09.20교회소식', date: '2020-09-25', img: '/images/community/news_580.png' },
  { no: 573, title: '2020.09.13교회소식', date: '2020-09-12', img: '/images/community/news_573.png' },
  { no: 572, title: '2020.09.06교회소식', date: '2020-09-12', img: '/images/community/news_572.png' },
  { no: 571, title: '2020.08.30교회소식', date: '2020-09-12', img: '/images/community/news_571.png' },
  { no: 570, title: '2020.08.23교회소식', date: '2020-09-12', img: '/images/community/news_570.png' },
  { no: 569, title: '2020.08.16교회소식', date: '2020-09-12', img: '/images/community/news_569.png' },
  { no: 568, title: '2020.08.09교회소식', date: '2020-09-12', img: '/images/community/news_568.png' },
  { no: 567, title: '2020.08.02교회소식', date: '2020-09-12', img: '/images/community/news_567.png' },
  { no: 566, title: '2020.07.26교회소식', date: '2020-09-12', img: '/images/community/news_566.png' },
  { no: 546, title: '2020.07.19교회소식', date: '2020-07-18', img: '/images/community/news_546.png' },
  { no: 545, title: '2020.07.12교회소식', date: '2020-07-18', img: '/images/community/news_545.png' },
  { no: 544, title: '2020.07.05교회소식', date: '2020-07-18', img: '/images/community/news_544.png' },
  { no: 543, title: '2020.06.28교회소식', date: '2020-07-18', img: '/images/community/news_543.png' },
  { no: 534, title: '2020.06.21교회소식', date: '2020-06-20', img: '/images/community/news_534.png' },
  { no: 529, title: '2020.06.07교회소식', date: '2020-06-05', img: '/images/community/news_529.png' },
  { no: 527, title: '2020.05.31교회소식', date: '2020-06-05', img: '/images/community/news_527.png' },
  { no: 514, title: '2020.05.24교회소식', date: '2020-05-23', img: '/images/community/news_514.png' },
  { no: 513, title: '2020.05.17교회소식', date: '2020-05-23', img: '/images/community/news_513.png' },
  { no: 512, title: '2020.05.10교회소식', date: '2020-05-23', img: '/images/community/news_512.png' },
  { no: 511, title: '2020.05.03교회소식', date: '2020-05-23', img: '/images/community/news_511.png' },
  { no: 510, title: '2020.04.26교회소식', date: '2020-05-23', img: '/images/community/news_510.png' },
  { no: 509, title: '2020.04.19교회소식', date: '2020-05-23', img: '/images/community/news_509.png' },
  { no: 498, title: '2020.04.12교회소식', date: '2020-04-11', img: '/images/community/news_498.png' },
  { no: 495, title: '2020.04.05교회소식', date: '2020-04-04', img: '/images/community/news_495.png' },
  { no: 492, title: '2020.03.29교회소식', date: '2020-03-28', img: '/images/community/news_492.png' },
  { no: 486, title: '2020.03.22교회소식', date: '2020-03-21', img: '/images/community/news_486.png' },
  { no: 483, title: '2020.03.15교회소식', date: '2020-03-15', img: '/images/community/news_483.png' },
  { no: 480, title: '2020.03.08.교회소식', date: '2020-03-08', img: '/images/community/news_480.png' },
  { no: 476, title: '2020.03.01교회소식', date: '2020-03-01', img: '/images/community/news_476.png' },
  { no: 475, title: '2020.02.23.교회소식', date: '2020-02-23', img: '/images/community/news_475.png' },
  { no: 465, title: '2020.02.16교회소식', date: '2020-02-15', img: '/images/community/news_465.png' },
  { no: 452, title: '2020.02.09교회소식', date: '2020-02-08', img: '/images/community/news_452.png' },
  { no: 451, title: '2020.02.02교회소식', date: '2020-02-01', img: '/images/community/news_451.png' },
  { no: 450, title: '2020.01.26교회소식', date: '2020-02-01', img: '/images/community/news_450.png' },
  { no: 449, title: '2020.01.19교회소식', date: '2020-02-01', img: '/images/community/news_449.png' },
  { no: 448, title: '2020.01.12교회소식', date: '2020-02-01', img: '/images/community/news_448.png' },
  { no: 447, title: '2020.01.05교회소식', date: '2020-02-01', img: '/images/community/news_447.png' },
  { no: 433, title: '2019.12.29.교회소식', date: '2020-01-01', img: '/images/community/news_433.png' },
  { no: 414, title: '2019.12.22교회소식', date: '2019-12-21', img: '/images/community/news_414.png' },
  { no: 408, title: '2019.12.15교회소식', date: '2019-12-14', img: '/images/community/news_408.png' },
  { no: 407, title: '2019.12.08교회소식', date: '2019-12-14', img: '/images/community/news_407.png' },
  { no: 391, title: '2019.12.01교회소식', date: '2019-11-30', img: '/images/community/news_391.png' },
  { no: 388, title: '2019.11.24교회소식', date: '2019-11-22', img: '/images/community/news_388.png' },
  { no: 372, title: '2019.11.17교회소식', date: '2019-11-16', img: '/images/community/news_372.png' },
  { no: 371, title: '2019.11.10교회소식', date: '2019-11-16', img: '/images/community/news_371.png' },
  { no: 370, title: '2019.11.03교회소식', date: '2019-11-16', img: '/images/community/news_370.png' },
  { no: 369, title: '2019.10.27교회소식', date: '2019-11-16', img: '/images/community/news_369.png' },
  { no: 368, title: '2019.10.20교회소식', date: '2019-11-16', img: '/images/community/news_368.png' },
  { no: 367, title: '2019.10.13교회소식', date: '2019-11-16', img: '/images/community/news_367.png' },
  { no: 366, title: '2019.10.06교회소식', date: '2019-11-16', img: '/images/community/news_366.png' },
  { no: 365, title: '2019.09.29교회소식', date: '2019-11-16', img: '/images/community/news_365.png' },
  { no: 364, title: '2019.09.22교회소식', date: '2019-11-16', img: '/images/community/news_364.png' },
  { no: 363, title: '2019.09.15교회소식', date: '2019-11-16', img: '/images/community/news_363.png' },
  { no: 362, title: '2019.09.08교회소식', date: '2019-11-16', img: '/images/community/news_362.png' },
  { no: 361, title: '2019.09.01교회소식', date: '2019-11-16', img: '/images/community/news_361.png' },
  { no: 323, title: '2019.8.25교회소식', date: '2019-08-24', img: '/images/community/news_323.png' },
  { no: 318, title: '2019.8.18교회소식', date: '2019-08-17', img: '/images/community/news_318.png' },
  { no: 314, title: '2019.08.11교회소식', date: '2019-08-10', img: '/images/community/news_314.png' },
  { no: 307, title: '2019.07.28교회소식', date: '2019-07-26', img: '/images/community/news_307.png' },
  { no: 302, title: '2019.7.21교회소식', date: '2019-07-19', img: '/images/community/news_302.png' },
  { no: 294, title: '2019.7.14교회소식', date: '2019-07-13', img: '/images/community/news_294.png' },
  { no: 286, title: '2019.7.7교회소식', date: '2019-07-06', img: '/images/community/news_286.png' },
  { no: 280, title: '2019.06.30교회소식', date: '2019-06-30', img: '/images/community/news_280.png' },
  { no: 273, title: '2019.6.23.교회소식', date: '2019-06-22', img: '/images/community/news_273.png' },
  { no: 268, title: '2019.06.16.교회소식', date: '2019-06-16', img: '/images/community/news_268.png' },
  { no: 258, title: '20196.9교회소식', date: '2019-06-08', img: '/images/community/news_258.png' },
  { no: 257, title: '2019.6.2교회소식', date: '2019-06-08', img: '/images/community/news_257.png' },
  { no: 248, title: '2019.05.26교회소식', date: '2019-05-25', img: '/images/community/news_248.png' },
  { no: 247, title: '2019.05.19교회소식', date: '2019-05-25', img: '/images/community/news_247.png' },
  { no: 246, title: '2019.05.12교회소식', date: '2019-05-25', img: '/images/community/news_246.png' },
  { no: 245, title: '2019.05.05 교회소식', date: '2019-05-25', img: '/images/community/news_245.png' },
  { no: 244, title: '2019.04.21교회소식', date: '2019-05-25', img: '/images/community/news_244.png' },
  { no: 221, title: '2019.4.14교회소식', date: '2019-04-13', img: '/images/community/news_221.png' },
  { no: 220, title: '2019.4.7교회소식', date: '2019-04-13', img: '/images/community/news_220.png' },
  { no: 219, title: '2019.3.31교회소식', date: '2019-04-13', img: '/images/community/news_219.png' },
  { no: 218, title: '2019.3.24교회소식', date: '2019-04-13', img: '/images/community/news_218.png' },
  { no: 211, title: '2019.3.17교회소식', date: '2019-03-16', img: '/images/community/news_211.png' },
  { no: 208, title: '2019.3.10교회소식', date: '2019-03-09', img: '/images/community/news_208.png' },
  { no: 207, title: '2019.3.3.교회소식', date: '2019-03-09', img: '/images/community/news_207.png' },
  { no: 201, title: '2019.2.10 교회소식', date: '2019-02-09', img: null },
  { no: 197, title: '2019.1.27.교회소식', date: '2019-01-28', img: null },
  { no: 194, title: '2019.1.20.교회소식', date: '2019-01-19', img: null },
  { no: 191, title: '2019.1.13 교회소식', date: '2019-01-16', img: '/images/community/news_191.png' },
  { no: 181, title: '2019.1.6교회소식', date: '2019-01-05', img: '/images/community/news_181.png' },
  { no: 173, title: '2019년 1월교회소식', date: '2019-01-01', img: null },
  { no: 98, title: "18'9.16 교회소식", date: '2018-09-16', img: null },
  { no: 78, title: '2018.9.9 교회소식', date: '2018-09-08', img: null },
]

export default function News() {
  const [open, setOpen] = useState(null)
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(entries.length / PER_PAGE)
  const slice = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="교회소식">
      <div style={{ border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px', background: '#0f2040', padding: '12px 20px' }}>
          {['번호', '제목', '등록일'].map(h => (
            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{h}</span>
          ))}
        </div>
        {slice.map((e, i) => (
          <div key={e.no}>
            <div
              onClick={() => setOpen(open === ((page-1)*PER_PAGE+i) ? null : (page-1)*PER_PAGE+i)}
              style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 110px',
                padding: '14px 20px',
                borderBottom: open === ((page-1)*PER_PAGE+i) ? 'none' : (i < slice.length - 1 ? '1px solid #f0f2f5' : 'none'),
                background: i % 2 === 0 ? '#fff' : '#fafbfc',
                cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={el => el.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
            >
              <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{e.no}</span>
              <span style={{ fontSize: '0.875rem', color: '#0f2040', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {e.title}
                <span style={{ fontSize: '0.7rem', color: open === ((page-1)*PER_PAGE+i) ? '#0284c7' : '#9ca3af' }}>{open === ((page-1)*PER_PAGE+i) ? '▲' : '▼'}</span>
              </span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{e.date}</span>
            </div>
            {open === ((page-1)*PER_PAGE+i) && (
              <div style={{ padding: '20px', background: '#f8fafc', borderBottom: i < slice.length - 1 ? '1px solid #f0f2f5' : 'none', display: 'flex', justifyContent: 'center' }}>
                {e.img
                  ? <img src={e.img} alt={e.title} style={{ maxWidth: '400px', width: '100%', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
                  : <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>이미지가 없습니다.</p>
                }
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); setOpen(null) }} />
    </SubLayout>
  )
}
