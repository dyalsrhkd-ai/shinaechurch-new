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

  await setDoc(doc(db, 'greeting', 'main'), {
    photoUrl: '',
    name: '우용녀',
    nameTitle: '목사',
    role: '신애교회 담임목사',
    greetingTitle: '신애교회에 오신 것을\n주님의 이름으로 환영합니다.',
    paragraphs: [
      '먼저 하나님께 영광을 돌리며, 신애교회에 오신 것을 주님의 이름으로 환영합니다.',
      '주님은 우리의 화평이시며 원수 된 것과 막힌 담을 자기 육체로 허시고, 십자가로 이 둘을 한 몸으로 하나님께서 화목하게 하셨습니다.',
      '하나님께서 세우신 교회가 서로 연합하여 성령 안에서 하나님이 거하실 처소가 되기 위해 그리스도 예수 안에서 함께 지어져가는 성전이 되길 소망합니다.',
      '신애교회를 찾는 모든 이들이 화평으로 하나님의 나라를 세워가는 그리스도인이 되길 바랍니다.',
    ],
    signatureRole: '신애교회 담임목사',
    signatureName: '우용녀',
    visions: [
      { label: '말씀 중심',   desc: '성경 말씀 위에 세워진 건강한 교회' },
      { label: '기도 공동체', desc: '기도로 하나 되는 성령 충만한 교회' },
      { label: '사랑과 섬김', desc: '이웃을 사랑하고 세상을 섬기는 교회' },
    ],
    updatedAt: serverTimestamp(),
  })

  console.log('✓ 저장 완료')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
