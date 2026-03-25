import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
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

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function uploadImage(buffer, filename, contentType = 'image/jpeg') {
  const storageRef = ref(storage, `facility/${filename}`)
  await uploadBytes(storageRef, buffer, { contentType })
  return getDownloadURL(storageRef)
}

const IMAGES = [
  { file: 'corp6.jpg',    label: 'hero',       isHero: true },
  { file: 'corp6_1.jpg',  label: '본당' },
  { file: 'corp6_2.jpg',  label: '소예배실' },
  { file: 'corp6_10.jpg', label: '유년부실' },
  { file: 'corp6_11.jpg', label: '유아실' },
  { file: 'corp6_3.jpg',  label: '방송실' },
  { file: 'corp6_4.jpg',  label: '식당 1' },
  { file: 'corp6_5.jpg',  label: '식당 2' },
  { file: 'corp6_6.jpg',  label: '성전' },
  { file: 'corp6_7.jpg',  label: '교회앞 연못' },
  { file: 'corp6_8.jpg',  label: '신애교회농장' },
  { file: 'corp6_9.jpg',  label: '교역자사무실' },
  { file: 'corp6_12.jpg', label: '목양실' },
  { file: 'corp6_13.jpg', label: '교육부사무실' },
]

const BASE_URL = 'http://www.shinaechurch.co.kr/images/etc/'

const BUILDINGS = [
  {
    name: '본관 (예배당)',
    color: '#1d4ed8',
    order: 0,
    floors: [
      { floor: '1층', rooms: ['대예배실', '목양실', '전도부실', '유아실', '방송실', '접대실', '주차장'] },
      { floor: '2층', rooms: ['초등부실', '유년부실', '소예배실', '교역자 사무실', '교육부 사무실', '성가대실'] },
    ],
  },
  {
    name: '별관 (이례빌)',
    color: '#0369a1',
    order: 1,
    floors: [
      { floor: '101호', rooms: ['재정부실', '전도부실', '새신자반'] },
    ],
  },
  {
    name: '별관',
    color: '#7c3aed',
    order: 2,
    floors: [
      { floor: '1층', rooms: ['식당'] },
    ],
  },
  {
    name: '부속 시설',
    color: '#059669',
    order: 3,
    floors: [
      { floor: '', rooms: ['농장 (과수원·텃밭)', '교회 앞 연못', '주차장 (교회 전용)', '25인승 버스', '해남수련관'] },
    ],
  },
]

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('✓ 로그인')

  let heroImageUrl = ''
  const photos = []

  for (const img of IMAGES) {
    const url = BASE_URL + img.file
    console.log(`  다운로드: ${url}`)
    try {
      const buffer = await downloadImage(url)
      const uploadedUrl = await uploadImage(buffer, img.file)
      console.log(`  ✓ 업로드: ${img.file}`)
      if (img.isHero) {
        heroImageUrl = uploadedUrl
      } else {
        photos.push({ url: uploadedUrl, label: img.label })
      }
    } catch (e) {
      console.error(`  ✗ 실패: ${img.file} — ${e.message}`)
    }
  }

  await setDoc(doc(db, 'facility', 'main'), {
    heroImageUrl,
    buildings: BUILDINGS,
    photos,
    updatedAt: serverTimestamp(),
  })

  console.log(`\n✓ Firestore 저장 완료`)
  console.log(`  히어로 이미지: ${heroImageUrl ? '✓' : '✗'}`)
  console.log(`  시설 사진: ${photos.length}장`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
