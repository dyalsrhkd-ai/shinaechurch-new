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

  await setDoc(doc(db, 'settings', 'main'), {
    churchName: '신애교회',
    representative: '우용녀 목사',
    privacyManager: '김영단',
    address: '경기도 의왕시 왕곡로 187번지 (왕곡동)',
    phone: '031-429-4557',
    fax: '031-429-4557',
    email: 'shinaechurch@naver.com',
    tagline: '말씀과 기도,\n사랑과 섬김으로\n세워진 공동체',
    updatedAt: serverTimestamp(),
  })

  console.log('✓ 저장 완료')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
