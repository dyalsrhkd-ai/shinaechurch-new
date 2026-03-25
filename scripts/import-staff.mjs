import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
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

const staffData = [
  { group: '담임목사', groupOrder: 0, order: 0, name: '우용녀 목사', role: '담임목사', imgUrl: '/images/corp_new/mem8.jpg' },
  { group: '교역자',   groupOrder: 1, order: 0, name: '김해림 목사',   role: '부목사',       imgUrl: '/images/corp_new/mem6.jpg' },
  { group: '교역자',   groupOrder: 1, order: 1, name: '김영단 전도사', role: '행정전도사',    imgUrl: '/images/corp_new/mem3.jpg' },
  { group: '교역자',   groupOrder: 1, order: 2, name: '유영희 전도사', role: '심방전도사',    imgUrl: '/images/corp_new/mem9.jpg' },
  { group: '교역자',   groupOrder: 1, order: 3, name: '한정욱 전도사', role: '전도사',        imgUrl: '/images/corp_new/mem11.jpg' },
  { group: '교역자',   groupOrder: 1, order: 4, name: '김요셉 전도사', role: '아동부전도사',  imgUrl: '/images/corp_new/mem5.jpg' },
  { group: '시무장로', groupOrder: 2, order: 0, name: '우태호 장로', role: '원로장로', imgUrl: '/images/corp/man6.jpg' },
  { group: '시무장로', groupOrder: 2, order: 1, name: '문옥희 장로', role: '은퇴장로', imgUrl: '/images/corp_new/mem7.jpg' },
  { group: '시무장로', groupOrder: 2, order: 2, name: '김영옥 장로', role: '장로',     imgUrl: '/images/corp_new/mem4.jpg' },
  { group: '시무장로', groupOrder: 2, order: 3, name: '윤여균 장로', role: '장로',     imgUrl: '/images/corp_new/mem10.jpg' },
  { group: '시무장로', groupOrder: 2, order: 4, name: '김강석 장로', role: '장로',     imgUrl: '/images/corp_new/mem2.jpg' },
]

async function main() {
  console.log('[로그인] Firebase 인증 중...')
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('  ✓ 로그인 성공\n')

  // 기존 데이터 삭제
  const snap = await getDocs(collection(db, 'staff'))
  if (!snap.empty) {
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'staff', d.id))))
    console.log(`  기존 ${snap.size}개 삭제 완료`)
  }

  // 새 데이터 저장
  for (const member of staffData) {
    await addDoc(collection(db, 'staff'), { ...member, createdAt: serverTimestamp() })
    console.log(`  ✓ ${member.name} (${member.group})`)
  }

  console.log('\n[완료]')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
