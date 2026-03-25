import http from 'http'
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

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout: ' + url)) })
  })
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms))
}

// Parse items from a list page HTML
// Returns array of { youtubeId, title, ref }
function parseItems(html) {
  const items = []

  // Find all blocks: openPage + youtube thumb + <p>title.ref.</p>
  // Pattern: openPage('bbs_no'... img src='https://i.ytimg.com/vi/{ID}/hqdefault.jpg' ... <p>{title}.{ref}.</p>
  const itemRegex = /openPage\('[^']+','',''\)[^>]*><img src='https:\/\/i\.ytimg\.com\/vi\/([^/]+)\/hqdefault\.jpg'[\s\S]*?<p>([^<]+)<\/p>/g

  let match
  while ((match = itemRegex.exec(html)) !== null) {
    const youtubeId = match[1].trim()
    const raw = match[2].trim()

    // Format: "제목.성경구절." or just "제목."
    // Split on first dot to separate title from ref
    const parts = raw.replace(/\.$/, '').split('.')
    const title = parts[0].trim()
    const ref = parts.slice(1).join('.').trim()

    if (youtubeId) {
      items.push({ youtubeId, title, ref })
    }
  }

  return items
}

async function scrapeAllPages(baseUrl, totalPages) {
  const allItems = []
  for (let page = 1; page <= totalPages; page++) {
    const url = `${baseUrl}?pagenum=${page}`
    process.stdout.write(`  페이지 ${page}/${totalPages} 스크래핑 중...`)
    try {
      const html = await fetchPage(url)
      const items = parseItems(html)
      allItems.push(...items)
      console.log(` ${items.length}개`)
    } catch (e) {
      console.log(` 실패: ${e.message}`)
    }
    if (page < totalPages) await delay(300)
  }
  return allItems
}

async function clearCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName))
  if (snap.empty) return
  console.log(`  기존 ${snap.size}개 삭제 중...`)
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, collectionName, d.id))))
}

async function importSermons(collectionName, items) {
  // items[0] = newest → highest order
  const base = Date.now()
  for (let i = 0; i < items.length; i++) {
    const { youtubeId, title, ref } = items[i]
    await addDoc(collection(db, collectionName), {
      youtubeId,
      title,
      ref,
      date: '',
      order: base - i,
      createdAt: serverTimestamp(),
    })
  }
}

async function main() {
  console.log('[로그인] Firebase 인증 중...')
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('  ✓ 로그인 성공\n')

  // ── 주일설교 ──────────────────────────────
  console.log('[주일설교] media1.php 스크래핑 (21페이지)...')
  const sundayItems = await scrapeAllPages('http://www.shinaechurch.co.kr/main/media1.php', 21)
  console.log(`  → 총 ${sundayItems.length}개 수집\n`)

  console.log('[주일설교] 기존 데이터 삭제...')
  await clearCollection('sundaySermons')
  console.log('  ✓ 삭제 완료\n')

  console.log('[주일설교] Firestore 저장 중...')
  await importSermons('sundaySermons', sundayItems)
  console.log(`  ✓ ${sundayItems.length}개 저장 완료\n`)

  // ── 특별설교 ──────────────────────────────
  console.log('[특별설교] media2.php 스크래핑 (1페이지)...')
  const specialItems = await scrapeAllPages('http://www.shinaechurch.co.kr/main/media2.php', 1)
  console.log(`  → 총 ${specialItems.length}개 수집\n`)

  console.log('[특별설교] 기존 데이터 삭제...')
  await clearCollection('specialSermons')
  console.log('  ✓ 삭제 완료\n')

  console.log('[특별설교] Firestore 저장 중...')
  await importSermons('specialSermons', specialItems)
  console.log(`  ✓ ${specialItems.length}개 저장 완료\n`)

  console.log('[완료]')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
