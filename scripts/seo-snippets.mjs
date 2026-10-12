// 2026-10-12 네이버 검색 노출: 네이버 로봇은 자바스크립트를 거의 안 돌려서 빈 <div id="root"> 만 본다.
// head 에 설명·공유 미리보기·교회 정보(JSON-LD), root 안에 교회 소개 글을 넣는다.
// root 안의 글은 화면(React)이 뜨면 바로 지워지고 지금 디자인으로 바뀐다. 내용은 홈페이지 화면에 있는 그대로.
export const SITE = 'http://www.shinaechurch.co.kr/'
const description = '경기도 의왕시 왕곡동 신애교회(담임목사 우용녀) 홈페이지입니다. 주일예배 1부 오전 9시·2부 오전 11시, 수요·금요·새벽예배 안내와 실시간 설교영상, 교회 소식, 주보를 볼 수 있습니다.'

// naver-site-verification 은 요셉님이 네이버 서치어드바이저에서 받은 코드가 있을 때만 넣는다
export function seoHead(naverCode = '') {
  const ld = {
    '@context': 'https://schema.org', '@type': 'Church', name: '신애교회', url: SITE,
    logo: `${SITE}uploads/legacy/site-assets/logo.png`, image: `${SITE}images/main1.jpg`,
    telephone: '+82-31-429-4557', email: 'shinaechurch@naver.com',
    address: { '@type': 'PostalAddress', streetAddress: '왕곡로 187 (왕곡동)', addressLocality: '의왕시', addressRegion: '경기도', addressCountry: 'KR' },
  }
  return [
    '<!-- seo:start -->',
    `<meta name="description" content="${description}">`,
    ...(naverCode ? [`<meta name="naver-site-verification" content="${naverCode}">`] : []),
    `<link rel="canonical" href="${SITE}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="신애교회">',
    '<meta property="og:title" content="신애교회 | 경기도 의왕시 왕곡동">',
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${SITE}">`,
    `<meta property="og:image" content="${SITE}images/main1.jpg">`,
    '<meta property="og:image:width" content="1100">',
    '<meta property="og:image:height" content="500">',
    '<meta property="og:locale" content="ko_KR">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    '<!-- seo:end -->',
  ].map(line => `    ${line}`).join('\n')
}

const worship = [['주일 낮 1부', '오전 9:00'], ['주일 낮 2부', '오전 11:00'], ['주일 오후', '오후 2:00'], ['수요 예배', '저녁 7:30'], ['금요 예배', '저녁 9:00'], ['매일 새벽', '오전 5:00'], ['월요기도회', '저녁 9:00']]

export const seoBody = `<div id="root"><!-- seo:start --><div style="max-width:720px;margin:0 auto;padding:40px 16px;font-family:sans-serif;color:#333;line-height:1.7">
<h1 style="font-size:24px">신애교회</h1>
<p>하나님의 은혜 안에서 함께 자라는 교회, 경기도 의왕시 왕곡동 신애교회가 당신을 환영합니다. 담임목사 우용녀.</p>
<h2 style="font-size:18px">예배 안내</h2>
<ul>${worship.map(([name, time]) => `<li>${name} ${time} (본당 1층)</li>`).join('')}</ul>
<p>대학청년부 주일 오후 2:00, 아동부·중고등부 주일 오전 11:00</p>
<h2 style="font-size:18px">오시는 길</h2>
<p>경기도 의왕시 왕곡로 187 (왕곡동)<br>전화 031-429-4557 · 이메일 shinaechurch@naver.com</p>
<p>교회 소개 · 말씀 및 찬양 · 실시간 설교영상 · 기관 및 부서 · 교회 학교 · 선교 · 교제와 나눔</p>
</div><!-- seo:end --></div>`

export const robots = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}sitemap.xml
`

export const sitemap = date => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}</loc><lastmod>${date}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`

// 서버의 index.html 에 넣는다. 이미 넣었으면 그 부분만 바꾼다(여러 번 돌려도 같다)
export function applySeo(html, naverCode = '') {
  let out = html.replace(/<html lang="en">/, '<html lang="ko">')
  out = out.replace(/\n\s*<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, '')
  out = out.replace(/(<title>신애교회<\/title>)/, `$1\n${seoHead(naverCode)}`)
  out = out.replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<script)|<div id="root"><\/div>/, seoBody)
  if (!out.includes('<!-- seo:end -->\n') || !out.includes('<div id="root"><!-- seo:start -->')) throw Error('index.html 에 넣을 자리를 못 찾음; 멈춤')
  return out
}
