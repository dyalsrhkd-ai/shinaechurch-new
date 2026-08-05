import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, getFirestore } from 'firebase/firestore'

export const CONTENT_COLLECTIONS = [
  'settings', 'siteAssets', 'pageContents', 'specialContents',
  'gallery', 'videos', 'choirVideos', 'choirGallery', 'slides',
  'notices', 'bulletins', 'news', 'newcomers', 'missions', 'farm',
  'farm_info', 'sundaySermons', 'specialSermons', 'history', 'staff',
  'staff_settings', 'worship', 'schedule', 'location', 'facility', 'greeting',
]

export function normalizeFirestoreValue(value) {
  if (value === null || value === undefined) return value
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalizeFirestoreValue)
  if (typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, normalizeFirestoreValue(nested)]),
  )
}

export function serializeCollectionSnapshot(collectionName, snapshot) {
  return {
    collection: collectionName,
    documents: snapshot.docs.map((document) => ({
      id: document.id,
      data: normalizeFirestoreValue(document.data()),
    })),
  }
}

function mysqlDate(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19).replace('T', ' ')
}

export function createContentImportSql(exported) {
  const statements = ['SET NAMES utf8mb4;', 'START TRANSACTION;']

  for (const group of exported.collections || []) {
    if (!CONTENT_COLLECTIONS.includes(group.collection)) {
      throw new Error(`Unknown collection: ${group.collection}`)
    }
    for (const document of group.documents || []) {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(document.id)) {
        throw new Error(`Invalid document ID: ${group.collection}/${document.id}`)
      }
      const data = document.data || {}
      const jsonBase64 = Buffer.from(JSON.stringify(data), 'utf8').toString('base64')
      const order = Number.isFinite(Number(data.order)) ? Math.trunc(Number(data.order)) : 0
      const date = mysqlDate(data.date ?? data.createdAt)
      const sortDate = date ? `'${date}'` : 'NULL'
      statements.push(
        'INSERT INTO `content_documents` ' +
        '(`collection_key`,`document_id`,`data_json`,`sort_order`,`sort_date`,`version_no`,`deleted_at`) VALUES ' +
        `('${group.collection}', '${document.id}', CONVERT(FROM_BASE64('${jsonBase64}') USING utf8mb4), ${order}, ${sortDate}, 1, NULL) ` +
        'ON DUPLICATE KEY UPDATE `data_json`=VALUES(`data_json`), `sort_order`=VALUES(`sort_order`), ' +
        '`sort_date`=VALUES(`sort_date`), `version_no`=`version_no`+1, `deleted_at`=NULL;',
      )
    }
  }

  statements.push('COMMIT;', '')
  return statements.join('\n')
}

function firebaseConfigFromEnv(env) {
  if (env.FIREBASE_CONFIG_JSON) return JSON.parse(env.FIREBASE_CONFIG_JSON)

  const config = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  }
  if (!config.apiKey || !config.projectId) {
    throw new Error('Set FIREBASE_CONFIG_JSON or FIREBASE_API_KEY and FIREBASE_PROJECT_ID.')
  }
  return config
}

function outputPathFromArgs(args) {
  const index = args.indexOf('--out')
  if (index >= 0 && args[index + 1]) return resolve(args[index + 1])
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return resolve('migration', `firestore-content-${stamp}.json`)
}

function sqlOutputPathFromArgs(args) {
  const index = args.indexOf('--sql-out')
  return index >= 0 && args[index + 1] ? resolve(args[index + 1]) : ''
}

async function main() {
  const config = firebaseConfigFromEnv(process.env)
  const app = initializeApp(config, `content-export-${Date.now()}`)
  const email = process.env.FIREBASE_EMAIL
  const password = process.env.FIREBASE_PASSWORD

  if (email || password) {
    if (!email || !password) throw new Error('Set both FIREBASE_EMAIL and FIREBASE_PASSWORD.')
    await signInWithEmailAndPassword(getAuth(app), email, password)
  }

  const db = getFirestore(app)
  const collections = []
  for (const collectionName of CONTENT_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, collectionName))
    const serialized = serializeCollectionSnapshot(collectionName, snapshot)
    collections.push(serialized)
    console.log(`${collectionName}: ${serialized.documents.length}`)
  }

  const outputPath = outputPathFromArgs(process.argv.slice(2))
  const result = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    projectId: config.projectId,
    collections,
  }
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  console.log(`Saved: ${outputPath}`)

  const sqlOutputPath = sqlOutputPathFromArgs(process.argv.slice(2))
  if (sqlOutputPath) {
    await mkdir(dirname(sqlOutputPath), { recursive: true })
    await writeFile(sqlOutputPath, createContentImportSql(result), 'utf8')
    console.log(`SQL saved: ${sqlOutputPath}`)
  }
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
