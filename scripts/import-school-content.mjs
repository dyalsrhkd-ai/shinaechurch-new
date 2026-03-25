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
  'school-children': {
    label: '아동부',
    heroTitle: '아동부',
    heroSubtitle: '예수님 안에서 함께 자라가는 아이들',
    heroImage: '/images/user/user_p3_1.jpg',
    blocks: [
      {
        id: 'intro-children',
        type: 'intro',
        title: '아동부 소개',
        subtitle: '',
        body: '매월 셋째 주 토요활동에 새 친구들을 초대해 여러 가지 문화체험활동과 놀이활동을 통해 예수 안에서 함께 기쁨과 사랑을 나눔으로 복음의 기쁜 소식을 전하는 계기로 삼고, 교회 안에서 신앙과 인성을 겸하여 양육하는데 노력하고 있습니다.',
        itemsText: '',
      },
      {
        id: 'info-children',
        type: 'info',
        title: '예배 안내',
        subtitle: '',
        body: '',
        itemsText: '예배시간|매주 일요일 오후 2시\n장소|본 당\n대상|유치부 ~ 초등학생',
      },
      {
        id: 'note-children',
        type: 'note',
        title: '주요 활동',
        subtitle: '',
        body: '• 매월 셋째 주 토요활동 (문화체험, 놀이활동)\n• 여름성경학교 / 겨울성경학교\n• 부활주일 연합예배\n• 어린이주일 야외예배\n• 추수감사주일 작품만들기 및 전시회\n• 성탄축하예배 / 송구영신예배',
        itemsText: '',
      },
      {
        id: 'list-children',
        type: 'list',
        title: '2025년 연간 일정',
        subtitle: '',
        body: '',
        itemsText: '1월|겨울성경학교\n2월|졸업 및 교사헌신예배\n3월|사순절 특별활동\n4월|부활주일 연합예배\n5월|어린이주일 / 야외예배\n6월|여름성경학교 교사강습회\n7월|여름성경학교\n8월|\n9월|특별활동\n10월|추수감사주일 작품만들기 및 전시회\n11월|추수감사주일\n12월|성탄축하예배 / 송구영신예배',
      },
    ],
    updatedAt: serverTimestamp(),
  },

  // ────────────────────────────────────────────
  'school-youth': {
    label: '중·고등부',
    heroTitle: '중·고등부',
    heroSubtitle: '함께 성장하고 믿음으로 하나 되는 청소년',
    heroImage: '/images/user/user_p4_1.jpg',
    blocks: [
      {
        id: 'intro-youth',
        type: 'intro',
        title: '중·고등부 소개',
        subtitle: '',
        body: '매 짝수달 셋째 주 토요활동에 새로운 친구들과 함께 여러 가지 체험활동을 통해 예수 안에서 함께 협력되고 기쁨과 사랑을 나눔으로 사이가 더욱 돈독해지는 계기로 삼고, 매 달 생일파티를 통해 아이들과 함께 교회 안에서 교제하고 신앙을 양육하는데 노력하고 있습니다.',
        itemsText: '',
      },
      {
        id: 'info-youth',
        type: 'info',
        title: '예배 안내',
        subtitle: '',
        body: '',
        itemsText: '예배시간|매주 일요일 오후 2시\n장소|본 당\n대상|중학생 ~ 고등학생',
      },
      {
        id: 'note-youth',
        type: 'note',
        title: '주요 활동',
        subtitle: '',
        body: '• 매 짝수달 셋째 주 토요활동 (체험활동)\n• 매달 생일파티\n• 하계수련회 / 겨울수련회\n• 부활주일 연합예배\n• 중고등부 헌신예배\n• 전교인야외예배\n• 성탄축하예배 / 송구영신예배',
        itemsText: '',
      },
      {
        id: 'list-youth',
        type: 'list',
        title: '2025년 연간 일정',
        subtitle: '',
        body: '',
        itemsText: '1월|겨울수련회 / 민속놀이\n2월|졸업 및 교사헌신예배\n3월|우리지금만나 / 사순절준비\n4월|부활주일 연합예배\n5월|전교인찬양대회\n6월|심방\n7월|중고등부헌신예배\n8월|하계수련회\n9월|우리지금만나\n10월|전교인야외예배\n11월|추수감사절준비 / 성탄절전시회준비\n12월|성탄축하예배 / 송구영신예배',
      },
    ],
    updatedAt: serverTimestamp(),
  },

  // ────────────────────────────────────────────
  'school-young': {
    label: '청년부',
    heroTitle: '청년부',
    heroSubtitle: '주를 찬양하며 하나님께 영광 돌리는 청년들',
    heroImage: '/images/user/user_p5_1.jpg',
    blocks: [
      {
        id: 'intro-young',
        type: 'intro',
        title: '청년부 소개',
        subtitle: '',
        body: '매달 첫째 주 주일 오후 2시 예배와 교회 부흥회 때 찬양인도를 함으로써 주를 입술로 고백하는 은혜로운 찬양인도를 하고, 각 청년부 주최로 이루어진 전교인 성경퀴즈대회, 문화가 있는 날 행사를 통해 성경에 대해 공부하고, 하나님께 영광 돌리는 귀한 재능을 양육합니다.',
        itemsText: '',
      },
      {
        id: 'info-young',
        type: 'info',
        title: '예배 안내',
        subtitle: '',
        body: '',
        itemsText: '예배시간|매주 일요일 오후 2시\n장소|본 당\n대상|청년 (대학생 이상)',
      },
      {
        id: 'note-young',
        type: 'note',
        title: '주요 활동',
        subtitle: '',
        body: '• 교회 부흥회 찬양인도\n• 전교인 성경퀴즈대회\n• 문화가 있는 날 행사\n• 교육부 연합헌신예배 / 연합수련회\n• 전교인체육대회\n• 성탄절 데코 설치\n• 정기총회 준비',
        itemsText: '',
      },
      {
        id: 'list-young',
        type: 'list',
        title: '2025년 연간 일정',
        subtitle: '',
        body: '',
        itemsText: '1월|전교인 민속놀이\n2월|졸업예배 및 교사헌신예배\n3월|부활절전시회준비\n4월|부활주일\n5월|전교인찬양대회\n6월|교육부 연합헌신예배\n7월|교육부연합수련회\n8월|생일파티\n9월|생일파티\n10월|전교인체육대회 / 감사일기노트시작\n11월|추수감사절준비\n12월|성탄절데코설치 / 정기총회준비',
      },
    ],
    updatedAt: serverTimestamp(),
  },

  // ────────────────────────────────────────────
  'school-bible': {
    label: '성경대학',
    heroTitle: '성경대학',
    heroSubtitle: '말씀으로 세워지는 신앙의 기초',
    heroImage: '/images/user/user_p6_1.jpg',
    blocks: [
      {
        id: 'intro-bible',
        type: 'intro',
        title: '성경대학 소개',
        subtitle: '',
        body: '신애교회 성경대학은 성경공부를 원하시는 모든 성도님이 참여 가능한 말씀 훈련 과정입니다. 매주 화요일 저녁 본당에서 담임목사님과 초청 강사의 강의로 진행되며, 개강예배는 강원도 현장예배로 드립니다.',
        itemsText: '',
      },
      {
        id: 'info-bible',
        type: 'info',
        title: '강의 안내',
        subtitle: '',
        body: '',
        itemsText: '강의시간|매주 화요일 오후 7:30 ~ 10:00\n장소|본 당\n대상|신애교회 성도 (성경공부를 원하시는 모든 분)\n제1강의|우용녀 목사 (신애교회 담임목사)\n제2강의|우용석 목사 (군산 진리있는교회 담임목사)',
      },
      {
        id: 'people-bible',
        type: 'people',
        title: '임원 현황',
        subtitle: '회장|김*석 장로\n부회장|이*연 안수집사\n총무(회계)|윤*자 안수집사',
        body: '',
        itemsText: '',
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
