import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
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

const contents = {

  // ────────────────────────────────────────────
  'ministry-men': {
    label: '남전도회',
    heroTitle: '남전도회',
    heroSubtitle: '섬김과 봉사로 하나님께 영광을',
    heroImage: '/images/user/user1.jpg',
    blocks: [
      {
        id: 'intro-men',
        type: 'intro',
        title: '남전도회 소개',
        subtitle: '',
        body: '신애교회 연합남전도회는 예수님의 근본 가르침인 "사랑"을 바탕으로 회원들과 폭넓은 교제와 교회의 부흥을 위한 전도에 최선의 노력을 다하고 있습니다.\n하나님께서 "네가 죽도록 충성하라 그리하면 내가 생명의 면류관을 네게 주리라"는 말씀에 합심하여 선을 이루어 나가는 전도회가 되고자 노력하고 있습니다.',
        itemsText: '',
      },
      {
        id: 'list-men',
        type: 'list',
        title: '주요 활동',
        subtitle: '',
        body: '',
        itemsText: '4월 남전도헌신예배\n5월 전교인찬양대회\n10월 전교인체육대회(친교)\n영선관리(농장, 연못)\n고령의 어르신 섬김과 봉사\n매주 오후2시예배 안수집사 준비찬양',
      },
      {
        id: 'people-men',
        type: 'people',
        title: '임원 및 회원',
        subtitle: '회장|권*일\n총무 및 서기|이*우\n회계|신*식',
        body: '윤*균\n김*현\n최*근\n백*경\n김*엽\n서*원\n권*일\n권*준\n신*식\n백*한\n조*수\n이*우\n김*석\n김*채\n최*식\n권*진\n박*수\n윤*남\n주*준\n김*훈\n주*\n황*찬\n김*현\n권*민\n김*원\n김*규\n김*성\n서*욱\n김*범\n홍*표\n김*우\n최*영',
        itemsText: '',
      },
    ],
    deptGroups: [],
    updatedAt: serverTimestamp(),
  },

  // ────────────────────────────────────────────
  'ministry-women': {
    label: '여전도회',
    heroTitle: '여전도회',
    heroSubtitle: '하나님 말씀 중심으로 하나 되는 전도회',
    heroImage: '/images/user/user2.jpg',
    blocks: [
      {
        id: 'intro-women',
        type: 'intro',
        title: '여전도회 소개',
        subtitle: '',
        body: '신애교회 여전도회는 하나님의 온전한 뜻을 따라 예배드리기를 힘쓰고, 성도들이 하나님께 영광 돌리는 일이 많아지기를 중보기도로 협력하는 전도회입니다.\n회원들이 모두 연합되고 하나 되어 하나님 말씀 중심으로 모든 사업과 활동을 열심히 하고 있습니다.',
        itemsText: '',
      },
      {
        id: 'info-women',
        type: 'info',
        title: '모임 안내',
        subtitle: '',
        body: '',
        itemsText: '제1여전도회|고령자|매월 둘째 주 월례회|본 당\n제2여전도회|50대 이후|매월 둘째 주 월례회|본 당\n제3여전도회|40대 이후|매월 둘째 주 월례회|본 당\n제4여전도회|권찰 및 30대 이후|매월 둘째 주 월례회|본 당',
      },
      {
        id: 'list-women',
        type: 'list',
        title: '주요 활동',
        subtitle: '',
        body: '',
        itemsText: '설·추석 명절 사업 (인삼 판매)\n만두 판매 (연 2회 이상)\n화단 관리\n농작물 관리 협력\n벼룩시장 판매 사업\n기타 먹거리 판매 사업\n새벽작정예배\n구역예배 (매주 금)',
      },
      {
        id: 'people-women',
        type: 'people',
        title: '임원 현황',
        subtitle: '',
        body: '',
        itemsText: '',
      },
    ],
    deptGroups: [],
    updatedAt: serverTimestamp(),
  },

  // ────────────────────────────────────────────
  'ministry-deaconess': {
    label: '권사회',
    heroTitle: '권사회',
    heroSubtitle: '기도와 섬김으로 교회를 받치는 어머니들',
    heroImage: '/images/user/user_p1_1.jpg',
    blocks: [
      {
        id: 'intro-deaconess',
        type: 'intro',
        title: '권사회 소개',
        subtitle: '',
        body: '신애교회 권사회는 교회를 위해 기도와 섬김으로 모인 공동체입니다. 교회의 어머니로서 항상 낮은 곳에서 섬김으로 봉사하며, 하나님 중심·성경 중심·교회 중심으로 교회 부흥과 발전에 적극 협력하고 있습니다.',
        itemsText: '',
      },
      {
        id: 'info-deaconess',
        type: 'info',
        title: '모임 안내',
        subtitle: '',
        body: '',
        itemsText: '제1여권사회|고령자|매월 셋째 주|본 당\n제2여권사회||매월 셋째 주|본 당\n제3여권사회||매월 셋째 주|본 당',
      },
      {
        id: 'list-deaconess',
        type: 'list',
        title: '주요 활동',
        subtitle: '',
        body: '',
        itemsText: '연말연초 떡국 판매\n농장물 관리 협력\n연꽃축제\n교회 화단 및 크리스마스 트리 관리\n김장김치 판매\n설·추석 명절 (식혜 및 전)\n수세미 뜨기 (판매 및 전도 활동)\n바나나발효식초 제조 판매\n새벽작정예배\n교회 및 목회자를 위한 기도모임',
      },
      {
        id: 'people-deaconess',
        type: 'people',
        title: '임원 현황',
        subtitle: '',
        body: '',
        itemsText: '',
      },
    ],
    deptGroups: [],
    updatedAt: serverTimestamp(),
  },

  // ────────────────────────────────────────────
  'ministry-dept': {
    heroTitle: '부서별',
    heroSubtitle: '전도부 · 제직회 · 재정부',
    heroImage: '/images/user/user_p2_1_1.jpg',
    blocks: [],
    deptGroups: [
      {
        id: 'dept-evangelism',
        dept: '전도부',
        title: '전도부',
        color: '#1d4ed8',
        verse: '"너희는 온 천하에 다니며 만민에게 복음을 전파하라" (마가복음 16:15)',
        desc: '신애교회 전도부는 매주 목요일 거리 전도대회를 진행하며, 가족전도프로젝트를 통해 지역 사회에 복음을 전하고 있습니다. 75세 이상 어르신들을 위한 봄나들이, 미용봉사 "신애헤어방" 운영 등 섬김과 전도 활동을 활발히 펼치고 있습니다.',
        schedulesText: '매주 목요일 10:00~11:00|거리 전도대회 (다목적체육관 앞)\n연 1회|75세 이상 어르신 야유회\n연중|가족전도프로젝트',
      },
      {
        id: 'dept-deacon-board',
        dept: '제직회',
        title: '제직회',
        color: '#7c3aed',
        verse: '"누구든지 첫째가 되고자 하면 뭇 사람의 끝이 되며 뭇 사람을 섬기는 자가 되어야 하리라" (마가복음 9:35)',
        desc: '신애교회 제직회는 "섬김과 봉사"라는 표어 아래 하나님이 공급하시는 힘과 능력으로 예수님처럼 낮은 곳에서 섬기는 삶을 실천하는 사랑과 섬김의 공동체입니다.',
        schedulesText: '연 1회|제직회 헌신예배\n연 1회|패션쇼 및 바자회\n매주 수요일|구역장 모임 공과 공부',
      },
      {
        id: 'dept-finance',
        dept: '재정부',
        title: '재정부',
        color: '#059669',
        verse: '"각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라" (고린도후서 9:7)',
        desc: '신애교회 재정부는 교회의 재정을 투명하고 성실하게 관리하여 하나님의 사역이 원활히 이루어질 수 있도록 섬기는 부서입니다.',
        schedulesText: '',
      },
    ],
    updatedAt: serverTimestamp(),
  },
}

async function main() {
  console.log('[로그인] Firebase 인증 중...')
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('  ✓ 로그인 성공\n')

  for (const [id, data] of Object.entries(contents)) {
    try {
      await setDoc(doc(db, 'pageContents', id), data)
      console.log(`  ✓ ${id} 저장 완료`)
    } catch (e) {
      console.log(`  ✗ ${id} 실패: ${e.message}`)
    }
  }

  console.log('\n[완료]')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
