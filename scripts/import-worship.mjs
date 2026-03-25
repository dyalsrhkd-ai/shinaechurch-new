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

  await setDoc(doc(db, 'worship', 'main'), {
    year: '2026',
    motto: '섬김과 봉사',
    mainServices: [
      { name: '주일 낮 1부', time: '오전 09:00', place: '본당 1층' },
      { name: '주일 낮 2부', time: '오전 11:00', place: '본당 1층' },
      { name: '주일 오후',   time: '오후 02:00', place: '본당 1층' },
      { name: '수요 저녁',   time: '오후 07:30', place: '본당 1층' },
      { name: '금요 저녁',   time: '오후 08:00', place: '본당 1층' },
      { name: '매일 새벽',   time: '오전 05:00', place: '본당 1층' },
    ],
    deptServices: [
      { name: '대학청년부 주일', time: '오후 02:00', place: '대학청년부실' },
      { name: '아동부 주일',    time: '오전 11:00', place: '아동부실' },
      { name: '중·고등부 주일', time: '오전 11:00', place: '중·고등부실' },
    ],
    notice: '예배 시간은 교회 사정에 따라 변경될 수 있습니다. 자세한 내용은 주보 또는 공지사항을 확인해 주시기 바랍니다.\n문의: 031-429-4557',
    updatedAt: serverTimestamp(),
  })
  console.log('✓ 저장 완료')
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
