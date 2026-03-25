import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
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

  for (const id of ['school-children', 'ministry-men']) {
    console.log(`\n========== ${id} ==========`)
    const snap = await getDoc(doc(db, 'pageContents', id))
    if (!snap.exists()) { console.log('없음'); continue }
    console.log(JSON.stringify(snap.data(), null, 2))
  }

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
