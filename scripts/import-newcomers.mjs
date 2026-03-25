import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore'
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

function fetchHtml(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: 'www.shinaechurch.co.kr', path, headers: { 'User-Agent': 'Mozilla/5.0' } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)) }
    )
    req.on('error', reject)
  })
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': BASE },
    }
    const req = http.get(options, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
  })
}

// Parse list page and return [{no, title, date}]
function parseList(html) {
  const rows = []
  const trRe = /onclick="openPage\('(\d+)'\)[^"]*"[\s\S]*?<td class='txt_al'>([\s\S]*?)<\/td>[\s\S]*?<td>([\d-]+)<\/td>/g
  let m
  while ((m = trRe.exec(html)) !== null) {
    const no = m[1]
    const title = m[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
    const date = m[3].trim()
    rows.push({ no, title, date })
  }
  return rows
}

// Parse view page and return first image URL
function parseFirstImage(html) {
  const m = html.match(/id='bbs_box'[\s\S]*?<img[^>]+src="([^"]+)"/i)
  return m ? m[1] : null
}

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@shinaechurch.com', '123456789!')
  console.log('Firebase 인증 완료')

  // Fetch all 3 list pages
  const allPosts = []
  for (let p = 1; p <= 3; p++) {
    const html = await fetchHtml(`/wi_bbs/wi_list.php?bbs_arr=7&pagenum=${p}`)
    const posts = parseList(html)
    if (posts.length === 0) break
    allPosts.push(...posts)
    console.log(`페이지 ${p}: ${posts.length}건`)
  }
  console.log(`총 ${allPosts.length}건 발견`)

  // Clear existing newcomers
  const existing = await getDocs(collection(db, 'newcomers'))
  for (const d of existing.docs) await deleteDoc(doc(db, 'newcomers', d.id))
  console.log(`기존 ${existing.docs.length}건 삭제`)

  // Process each post
  for (const post of allPosts) {
    console.log(`[${post.no}] ${post.title} (${post.date})`)
    try {
      const viewHtml = await fetchHtml(`/wi_bbs/wi_view.php?bbs_arr=7&bbs_no=${post.no}`)
      const imgUrl = parseFirstImage(viewHtml)

      let storedUrl = null
      let storagePath = null

      if (imgUrl) {
        const buf = await fetchBuffer(imgUrl)
        const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg'
        const fileName = `newcomers/${Date.now()}_${post.no}.${ext}`
        const storageRef = ref(storage, fileName)
        await uploadBytes(storageRef, buf, { contentType: 'image/jpeg' })
        storedUrl = await getDownloadURL(storageRef)
        storagePath = storageRef.fullPath
        console.log(`  ✓ 이미지 업로드`)
      } else {
        console.log(`  ✗ 이미지 없음`)
      }

      const dateObj = new Date(post.date + 'T00:00:00')
      await addDoc(collection(db, 'newcomers'), {
        name: post.title,
        date: Timestamp.fromDate(dateObj),
        imgUrl: storedUrl,
        storagePath,
      })
    } catch (e) {
      console.error(`  오류: ${e.message}`)
    }

    // Small delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\n완료!')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
