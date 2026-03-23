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

const PER_PAGE = 12

const videos = [
  { id: 'X4nCDhXGJ3o', title: '봉헌송-변지은' },
  { id: 'NyCdmGh93LI', title: '봉헌송-유남정' },
  { id: 'lvgM6LRURe8', title: '봉헌송-유남정' },
  { id: 'kMkM1HYK7Ls', title: '봉헌송(주현)' },
  { id: 'u20LnfggGDs', title: '내가천사의 말한다해도.봉헌찬양(유남정)' },
  { id: 'HH904-ZJTZM', title: '"주 너를 지키리"(주현)' },
  { id: 'UTuIRExF_X8', title: '주의 손에 나의 손을 포개고(유남정)' },
  { id: 'fx00MxbvqTc', title: '주 은혜가 내게 족하네(변지은)' },
  { id: 'gD1zaLRDGwE', title: '기름부으심(주 현)' },
  { id: 'pcDKgPXPhcQ', title: '옷자락에서 전해지는 사랑(변지은)' },
  { id: 'VHG_-lngAMM', title: '2020년 교회를 향한 하나님의역사' },
  { id: 'cxVXuE7OBOc', title: '성경읽기미션' },
  { id: 'eOQn61EdRgI', title: '드라이브스루배달' },
  { id: '4i4l2v7vsWw', title: '2020.09.11금요화상심방예배' },
  { id: 'shRDOxxqWzQ', title: '영원히 찬양드리세' },
  { id: 'jJwbCrr_UeM', title: '2020.02.23.주를앙모하는자' },
  { id: 'bUa04tgzXXM', title: '졸업및교사헌신예배성극' },
  { id: 'PS0rw_eLQQ4', title: '주예수내맘에 오심' },
  { id: 'MbO_70pn3bg', title: '겨울수련회첫째날(파자마파티)' },
  { id: '7PB2Wx5HwT4', title: '겨울수련회충주라이트월드' },
  { id: 'BL0BqducgDc', title: '1987년신애교회고등부성극' },
  { id: 'BkGU2o6bFeY', title: '토요활동-충주라이트월드(2020.1.10)' },
  { id: 'pgkJrmeoJec', title: '2020.1.18직분자교육' },
  { id: 'GeJRW1K97dE', title: '2020.1.10.파자마파티' },
  { id: 'INeYzC66LJ8', title: '창조.타락.구원(교육부연합)' },
  { id: 'stIIprjMpTk', title: '"떡매치기"성탄절특별활동' },
  { id: '834aim_XLE4', title: '흥부와놀부의성탄절' },
  { id: 'rPbnnIgrL_A', title: '"왕이나셨다"-성탄전야제' },
  { id: '7BEalIXk1ao', title: '"찬양이언제나넘치면"' },
  { id: 'aouZaVJgjpg', title: '"천사들의노래"-성탄전야제' },
  { id: 'Ed9W6NccaYg', title: '각설이타령(문화가있는날)' },
  { id: 'M78mK_UUVQI', title: 'I love jesus' },
  { id: 'IjkEIm2dvcI', title: 'Never Enogh' },
  { id: 'slOuts4IBrE', title: '14년지기의 찬양' },
  { id: 'ctgcJtTCkkI', title: '외치세깊은곳에서' },
  { id: 'KNVuZTh0UPU', title: '작은것들을위한 시' },
  { id: 'VZLneWJ7Mfw', title: '컵타' },
  { id: 'gZu_QixE194', title: '믿음의 달인' },
  { id: 'XTvq7uuJNJQ', title: 'because of you' },
  { id: 'wQQmZW_ARiw', title: '오!할렐루야(청소년음악축제)' },
  { id: 'AtZXcGkaTZk', title: '주님만아시네(헌신예배)' },
  { id: 'dhVtuZWNz2o', title: '2019.8.청년부산티아고 순례길' },
  { id: 'Sj_wfMBZlAw', title: '중,고등부를 소개합니다.' },
  { id: 'qEQ10FZ9C7o', title: '내게평화주소서2019.7.21' },
  { id: 'yjDtreABOgM', title: '나의모든것 되시는주님2019.07.14' },
  { id: 'JHPndk2jKgQ', title: '주를위한나의멜로디2019. 7 .7' },
  { id: 'ijYB9SNJ50g', title: '나의기도2019 6 30' },
  { id: 'EYy579qAO-c', title: '오! 할렐루야' },
  { id: 'xUsCch0wKBU', title: '나의갈길다가도록' },
  { id: '2iA6EC2BWus', title: '나주만따르게하소서' },
  { id: 'r4xj1kJr4xU', title: '봉헌송-왕이신나의하나님' },
  { id: 'Y52P_w2-rxI', title: '나 두려움없네' },
  { id: 'EnRT_aX85jY', title: '성탄예배봉헌송' },
  { id: 'N_oF7723OQY', title: '주의친절한 팔에안기세-워십' },
  { id: 'cFFfcZD2jwg', title: 'Joy to the worid 워십' },
  { id: 'DnDKhlHxqj0', title: 'This christmas' },
  { id: 'NycR6EKl9rk', title: '촛불워십"소원"' },
  { id: 'wtrQ3uVgJos', title: 'I love jesus' },
  { id: 'bGRU8HeCwYY', title: '사랑(무언극)' },
  { id: 'fVMdWfPVu-k', title: '비나리-태권무(장*우외2명)' },
  { id: 'QbvjYyeaHWg', title: '내영혼이 은총입어(추수감사절)' },
  { id: 'VetLjw1ZrBw', title: '추수찬송(2018.11.18)' },
  { id: 'ttd7F9CF5Ts', title: '평화의 기도(2018.11.11)' },
  { id: 'Uqv7_5GtwNA', title: '예수높은산에서(2018.11.4)' },
  { id: 'PqJUV2TellA', title: '거룩하신 주(2018.10.28)' },
  { id: 'SSEwdNi-TLw', title: '내게강같은 평화(2018.10.21)' },
  { id: 'UFz2TZTmpmk', title: '2018.10.14은보다 더 귀하신 주' },
  { id: '68v3vofna0o', title: '2018.10.7 나는 비록 약하나' },
  { id: 'iPhnPJl5flY', title: "18'9.30봉헌송" },
  { id: '2kgRcOgx3rc', title: '2018.9.30호산나' },
  { id: 'lzshY60wFaU', title: '2018.9.23' },
  { id: 'ngeQb0R1bx4', title: '2018.9.16.호산나성가대' },
  { id: 'biz_aWscR-k', title: '2018.9.9.2부호산나' },
  { id: '9d_0Cd9kP8g', title: '2018.8.26.주일봉헌송(윤*실)' },
  { id: 'GZe6MZyORZ8', title: '부활절연합예배 아동부2018.4.8' },
  { id: 'sNQMQUn-UjQ', title: '연합여전도회부활절예배2018.4.8' },
  { id: 'PwNe-j2r14o', title: '부활절 특별찬양2018.4.8' },
  { id: 'T0khc5C0z_Y', title: '청년부 문화가 있는날(아동부특별순서)' },
]

export default function Video() {
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(videos.length / PER_PAGE)
  const slice = videos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <SubLayout section="교제와 나눔" menus={menus} title="행사동영상">
      <div style={{ marginBottom: '12px', fontSize: '0.82rem', color: '#9ca3af', textAlign: 'right' }}>전체 {videos.length}개</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {slice.map((v, i) => (
          <div key={i} onClick={() => setModal(v.id)} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eaecf0', background: '#fff' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
              <img
                src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                alt={v.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
                onMouseEnter={e => e.target.style.opacity = '0.75'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,0,0,0.85)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '16px solid #fff', marginLeft: '4px' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</p>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p);  }} />

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
            <div style={{ aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${modal}?autoplay=1`} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ display: 'block' }} />
            </div>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </SubLayout>
  )
}
