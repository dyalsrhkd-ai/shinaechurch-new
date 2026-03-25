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

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('✓ 로그인')

  await setDoc(doc(db, 'location', 'main'), {
    // 지도 embed URL (비워두면 기존 Daum roughmap 유지)
    // Google Maps: 지도 검색 → 공유 → 지도 퍼가기 → iframe src 값
    mapEmbedUrl: '',
    address: '경기도 의왕시 왕곡로 187번지 (왕곡동)',
    phone: '031-429-4557',
    kakaoMapUrl: 'https://map.kakao.com/link/search/경기도 의왕시 왕곡로 187번지',
    transportSections: [
      {
        lineName: '1호선',
        lineColor: '#1d63c0',
        stationInfo: '의왕역 하차',
        routes: [
          '일반버스 1-2번(마을버스 01·02) 하차 후 환승 → 일반 87번(고천, 의왕시청) → 왕림윗마을 정류장 하차',
          '일반버스 5번, 64번, 65번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
          '일반 777번, 301번 / 직행 3000번, 8409번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
        ],
      },
      {
        lineName: '4호선',
        lineColor: '#00a2e8',
        stationInfo: '환승 이용',
        routes: [
          '일반 301번, 10번 / 좌석 300번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
          '일반 777번, 441번 하차 후 환승 → 일반 87번 → 왕림윗마을 하차',
          '직행 3000번, 3102번(의왕톨게이트 정류장 하차) → 일반 87번(고천체육공원) → 왕림윗마을 하차',
        ],
      },
    ],
    updatedAt: serverTimestamp(),
  })

  console.log('✓ 저장 완료')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
