import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, addDoc, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDroOJix6yaqw65JMCvP7ZfE-Ihku8Pvxk",
  authDomain: "shinae-new.firebaseapp.com",
  projectId: "shinae-new",
  storageBucket: "shinae-new.firebasestorage.app",
  messagingSenderId: "61716478568",
  appId: "1:61716478568:web:41f329a0047eb88a02d9dd",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const historyData = [
  {
    period: '1995 — 2010', color: '#1d4ed8', order: 0,
    events: [
      { date: '1995.11.30', desc: '신애교회 창립예배' },
      { date: '1998.03.26', desc: '우용녀 목사 안수' },
      { date: '1998.11.01', desc: '신애교회 헌당예배' },
      { date: '1999.04.17', desc: '장로 장립, 권사 취임예배 (장로: 정재복, 권사: 황금옥, 김영옥)' },
      { date: '2001.11.24', desc: '김영단 전도사 임명' },
      { date: '2002.01.26', desc: '장로 장립·권사 취임예배 (장로: 표은희, 권사 다수)' },
      { date: '2002.10.30', desc: '우용녀 목사 노회장 취임예배' },
      { date: '2004.04.18', desc: '목사 안수·집사 안수·권사 취임예배' },
      { date: '2005.05.08', desc: '교회 명칭을 "제일신애교회"로 변경' },
      { date: '2006.10.28', desc: '장로·안수집사 임직 및 권사 취임예배' },
      { date: '2009.10.04', desc: '김해림 전도사 임명' },
      { date: '2010.05.22', desc: '경기도 안양시 호계동 성전 이전 입당 및 임직예배' },
    ],
  },
  {
    period: '2011 — 2020', color: '#0369a1', order: 1,
    events: [
      { date: '2012.05.13', desc: '유영희 전도사 임명' },
      { date: '2012.11.11', desc: '이평자 전도사 은퇴' },
      { date: '2014.03.29', desc: '목사 안수 및 임직예배 (목사: 우용미)' },
      { date: '2015.01.20', desc: '헤필드대학교로부터 담임목사 명예박사학위 수여' },
      { date: '2015.03.03', desc: '제일신애교회 성경대학 개설' },
      { date: '2015.12.04', desc: '호계구사거리 교육관 이전 예배' },
      { date: '2016.04.05', desc: '경기도 의왕시 왕곡동 83-10 성전 부지 구입' },
      { date: '2016.06.23', desc: '의왕시 왕곡동 주차장 부지 구입' },
      { date: '2016.11.15', desc: '성전 건축 착공' },
      { date: '2017.04.01', desc: '제일신애교회 → 신애교회로 명칭 변경 및 주소 이전' },
      { date: '2017.06.10', desc: '성전 입당 및 임직예배 (장로·안수집사·권사 다수 임직)' },
      { date: '2019.04.25', desc: '연합성총회에서 백석총회로 소속 변경' },
      { date: '2019.06.30', desc: '교육관 개관식 및 담장 설치' },
      { date: '2020.02.08', desc: '식당 뒤 전답 매입' },
    ],
  },
  {
    period: '2021 — 현재', color: '#7c3aed', order: 2,
    events: [
      { date: '2021.03.02', desc: '의왕시 별묘길3 이레벨빌라 교육관으로 소유권 이전' },
      { date: '2021.03.14', desc: '장로·권사 은퇴식 및 권사 임직식' },
      { date: '2022.04.18', desc: '김해림 강도사 인허' },
      { date: '2022.06.05', desc: '상반기 임시총회 — 강도사·전도사 임명' },
      { date: '2023.02.19', desc: '각 부서별실 개설 (재정부·전도부·새신자반 등)' },
      { date: '2023.10.17', desc: '김해림 목사 임직예배' },
      { date: '2024.06~',   desc: '농장부 지역사회 어려운 이웃에게 농작물 후원' },
      { date: '2024.07~',   desc: '장학회 고천중·우성고등학교 장학금 지원' },
      { date: '2025.02',    desc: '인도네시아 GPDI 베데스다교회 건축 기공식' },
      { date: '2025.11',    desc: '인도네시아 베데스다교회 완공예배' },
    ],
  },
]

const scheduleData = {
  year: '2026',
  motto: '섬김과 봉사 — 사랑으로 하나 되는 신애교회',
  months: [
    { month: '1월',  events: ['신년 감사예배', '신년 하례', '직원수련회'] },
    { month: '2월',  events: ['사순절 시작', '중·고등부 수련회'] },
    { month: '3월',  events: ['삼일절 기념예배', '성경대학 개강', '청년부 수련회'] },
    { month: '4월',  events: ['종려주일 예배', '고난주간 예배', '부활절 연합예배'] },
    { month: '5월',  events: ['어버이날 감사예배', '어린이날 행사', '가정의 달 특별예배'] },
    { month: '6월',  events: ['현충일 추모예배', '교회 수련회', '아동부 수련회'] },
    { month: '7월',  events: ['맥추감사절 예배', '여름성경학교', '청소년 캠프'] },
    { month: '8월',  events: ['광복절 기념예배', '하계 수련회'] },
    { month: '9월',  events: ['성경대학 개강', '추석 감사예배', '전도축제'] },
    { month: '10월', events: ['종교개혁주일 예배', '선교대회', '문화행사'] },
    { month: '11월', events: ['추수감사절 예배', '성경대학 수료식', '연말 특별집회'] },
    { month: '12월', events: ['대강절(대림절) 예배', '성탄절 예배', '송년 감사예배'] },
  ],
  updatedAt: serverTimestamp(),
}

async function main() {
  console.log('[로그인] Firebase 인증 중...')
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('  ✓ 로그인 성공\n')

  // ── 교회연혁 ──────────────────────────────
  console.log('[교회연혁] 기존 데이터 삭제...')
  const histSnap = await getDocs(collection(db, 'history'))
  await Promise.all(histSnap.docs.map(d => deleteDoc(doc(db, 'history', d.id))))

  console.log('[교회연혁] 저장 중...')
  for (const era of historyData) {
    await addDoc(collection(db, 'history'), { ...era, updatedAt: serverTimestamp() })
    console.log(`  ✓ ${era.period} (${era.events.length}건)`)
  }

  // ── 연간일정 ──────────────────────────────
  console.log('\n[연간일정] 저장 중...')
  await setDoc(doc(db, 'schedule', 'main'), scheduleData)
  console.log('  ✓ 저장 완료')

  console.log('\n[완료]')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
