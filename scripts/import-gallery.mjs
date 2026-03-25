import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import https from 'https'
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

// 부서별 이미지 번호 매핑
const DEPT_IMAGES = {
  '아동부':   [40, 41, 58, 74, 91, 103, 148, 149, 151, 170, 198, 228, 232, 283, 296, 336, 415, 517, 790, 791, 794, 798, 801, 828, 845, 861, 865, 917, 930, 953, 965, 966, 968, 974, 1002, 1005],
  '중·고등부': [54, 55, 69, 70, 72, 107, 111, 146, 154, 165, 227, 264, 284, 304, 309, 315, 380, 382, 397, 518, 520, 524, 576, 820],
  '청년부':   [56, 57, 59, 97, 108, 110, 153, 158, 168, 184, 305, 319, 335, 338, 461, 462, 891, 892, 922],
  '성경대학': [18, 21, 22, 23, 93, 94, 95, 96, 229, 394],
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const options = { rejectUnauthorized: false }
    mod.get(url, options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const options = { rejectUnauthorized: false }
    mod.get(url, options, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchBuffer(res.headers.location).then(resolve).catch(reject)
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function getTitle(bbs_no) {
  try {
    const html = await fetchText(`${BASE}/wi_bbs/wi_view.php?bbs_arr=5&bbs_no=${bbs_no}`)
    const match = html.match(/<title>([^<]+)<\/title>/)
    return match ? match[1].trim() : `사진 ${bbs_no}`
  } catch {
    return `사진 ${bbs_no}`
  }
}

// 1. Firestore gallery 전체 삭제
async function deleteAllGallery() {
  console.log('\n[1단계] Firestore gallery 전체 삭제 중...')
  const snap = await getDocs(collection(db, 'gallery'))
  console.log(`  → ${snap.size}개 문서 삭제`)
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'gallery', d.id))))

  // Storage gallery/ 폴더 삭제 시도
  console.log('  → Storage 파일 삭제 시도 (imgUrl 기준)')
  const storageRefs = snap.docs.map(d => d.data().imgUrl).filter(Boolean)
  for (const url of storageRefs) {
    try {
      // URL에서 path 추출
      const match = url.match(/o\/(gallery%2F[^?]+)/)
      if (match) {
        const path = decodeURIComponent(match[1])
        await deleteObject(ref(storage, path))
      }
    } catch { /* 이미 없는 파일 무시 */ }
  }
  console.log('  ✓ 삭제 완료')
}

// 2. 이미지 다운로드 → Storage 업로드 → Firestore 등록
async function importImages() {
  console.log('\n[2단계] 이미지 가져오기 시작...')
  let order = Date.now()
  let success = 0, fail = 0

  for (const [dept, numbers] of Object.entries(DEPT_IMAGES)) {
    console.log(`\n  [${dept}] ${numbers.length}장`)
    for (const no of numbers) {
      try {
        process.stdout.write(`    #${no} 제목 가져오는 중...`)
        const label = await getTitle(no)
        process.stdout.write(` "${label}" 이미지 다운로드...`)

        const imgUrl = `${BASE}/wi_files/photo_big/${no}.jpg`
        const buf = await fetchBuffer(imgUrl)

        process.stdout.write(` Storage 업로드...`)
        const fileName = `${Date.now()}_${no}.jpg`
        const storageRef = ref(storage, `gallery/${fileName}`)
        await uploadBytes(storageRef, buf, { contentType: 'image/jpeg' })
        const downloadUrl = await getDownloadURL(storageRef)

        await addDoc(collection(db, 'gallery'), {
          label,
          dept,
          imgUrl: downloadUrl,
          order: order--,
          createdAt: serverTimestamp(),
        })

        console.log(` ✓`)
        success++
      } catch (e) {
        console.log(` ✗ (${e.message})`)
        fail++
      }
    }
  }

  console.log(`\n[완료] 성공: ${success}장, 실패: ${fail}장`)
}

async function main() {
  console.log('[로그인] Firebase 인증 중...')
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('  ✓ 로그인 성공')
  await importImages()
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
