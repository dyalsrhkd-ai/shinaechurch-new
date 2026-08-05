import assert from 'node:assert/strict'

import {
  createContentImportSql,
  normalizeFirestoreValue,
  serializeCollectionSnapshot,
} from './export-firestore-content.mjs'

const timestamp = {
  toDate() {
    return new Date('2026-08-05T01:02:03.456Z')
  },
}

const normalized = normalizeFirestoreValue({
  createdAt: timestamp,
  nested: [{ updatedAt: timestamp }],
})

assert.deepEqual(normalized, {
  createdAt: '2026-08-05T01:02:03.456Z',
  nested: [{ updatedAt: '2026-08-05T01:02:03.456Z' }],
})

const exported = serializeCollectionSnapshot('notices', {
  docs: [
    { id: 'notice_1', data: () => ({ title: '공지', createdAt: timestamp }) },
  ],
})

assert.deepEqual(exported, {
  collection: 'notices',
  documents: [
    {
      id: 'notice_1',
      data: { title: '공지', createdAt: '2026-08-05T01:02:03.456Z' },
    },
  ],
})

const sql = createContentImportSql({ collections: [exported] })
assert.match(sql, /INSERT INTO `content_documents`/)
assert.match(sql, /'notices', 'notice_1'/)
assert.match(sql, /FROM_BASE64\('/)
assert.match(sql, /ON DUPLICATE KEY UPDATE/)

console.log('Cafe24 content export contract OK')
