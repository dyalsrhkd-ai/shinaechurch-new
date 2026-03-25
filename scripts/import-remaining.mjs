import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import http from 'http'

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
const storage = getStorage(app)
const auth = getAuth(app)

const BASE = 'http://www.shinaechurch.co.kr'

// gallery 컬렉션에 추가할 항목 (부서별 분류)
const GALLERY_IMAGES = {
  '성가대':   [61, 62, 75, 337, 894],
  '아동부':   [298, 516],
  '여전도회': [381],
  '권사회':   [515],
  '남전도회': [836],
  '기타':     [112,113,145,147,155,164,169,185,186,223,224,225,226,230,252,261,282,295,310,320,324,333,383,384,385,392,395,409,416,417,420,460,463,496,519,521,522,788,792,795,800,802,803,804,805,812,821,825,826,830,835,837,838,844,846,847,848,849,854,875,876,877,878,901,903,915,943,957,958,959,963,964,969,970,971,973,979,1004],
}

// farm 컬렉션에 추가할 항목
const FARM_IMAGES = [44,46,89,274,297,412,487,488,523,806,807,817,824,827,834,839,881,882,883,884,895,896,898,904,905,906,907,908,914,916,920,954,1003]

function fetchTitle(no) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'www.shinaechurch.co.kr',
      path: '/wi_bbs/wi_view.php?bbs_arr=5&bbs_no=' + no,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        const m = d.match(/<title>([^<]+)<\/title>/)
        resolve(m ? m[1].trim() : `사진 ${no}`)
      })
    })
    req.on('error', () => resolve(`사진 ${no}`))
  })
}

function fetchBuffer(no) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'www.shinaechurch.co.kr',
      path: `/wi_files/photo_big/${no}.jpg`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
  })
}

async function uploadImage(no, collectionName, dept) {
  const label = await fetchTitle(no)
  const buf = await fetchBuffer(no)
  const fileName = `${Date.now()}_${no}.jpg`
  const storageFolder = collectionName === 'farm' ? 'farm' : 'gallery'
  const storageRef = ref(storage, `${storageFolder}/${fileName}`)
  await uploadBytes(storageRef, buf, { contentType: 'image/jpeg' })
  const imgUrl = await getDownloadURL(storageRef)
  const docData = { label, imgUrl, order: Date.now(), createdAt: serverTimestamp() }
  if (dept) docData.dept = dept
  await addDoc(collection(db, collectionName), docData)
  return label
}

async function main() {
  console.log('[로그인] Firebase 인증 중...')
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('  ✓ 로그인 성공')

  // gallery 추가
  console.log('\n[1단계] 행사갤러리 추가...')
  let ok = 0, fail = 0
  for (const [dept, numbers] of Object.entries(GALLERY_IMAGES)) {
    console.log(`\n  [${dept}] ${numbers.length}장`)
    for (const no of numbers) {
      try {
        process.stdout.write(`    #${no} ...`)
        const label = await uploadImage(no, 'gallery', dept)
        console.log(` "${label}" ✓`)
        ok++
      } catch (e) {
        console.log(` ✗ (${e.message})`)
        fail++
      }
    }
  }

  // farm 추가
  console.log(`\n[2단계] 영선관리 추가... (${FARM_IMAGES.length}장)`)
  for (const no of FARM_IMAGES) {
    try {
      process.stdout.write(`    #${no} ...`)
      const label = await uploadImage(no, 'farm', null)
      console.log(` "${label}" ✓`)
      ok++
    } catch (e) {
      console.log(` ✗ (${e.message})`)
      fail++
    }
  }

  console.log(`\n[완료] 성공: ${ok}장, 실패: ${fail}장`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
