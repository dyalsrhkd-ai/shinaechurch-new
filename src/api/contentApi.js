import { apiRequest } from './httpClient.js'

function contentUrl(params) {
  return `/api/content.php?${new URLSearchParams(params)}`
}

function withVersion(body, versionNo) {
  return Number.isInteger(versionNo) ? { ...body, versionNo } : body
}

export async function getContentDocument(collectionKey, documentId) {
  try {
    const result = await apiRequest(contentUrl({ collection: collectionKey, id: documentId }))
    return result.document
  } catch (error) {
    if (error.code === 'DOCUMENT_NOT_FOUND') return null
    throw error
  }
}

export async function listContentDocuments(collectionKey, { sort = 'order', direction = 'desc', limit = 1000 } = {}) {
  const result = await apiRequest(contentUrl({ collection: collectionKey, sort, direction, limit: String(limit) }))
  return result.documents
}

export async function createContentDocument(collectionKey, data) {
  const result = await apiRequest(contentUrl({ action: 'create' }), {
    method: 'POST',
    body: { collection: collectionKey, data },
  })
  return result.document
}

export async function upsertContentDocument(collectionKey, documentId, data, versionNo) {
  const result = await apiRequest(contentUrl({ action: 'upsert' }), {
    method: 'POST',
    body: withVersion({ collection: collectionKey, id: documentId, data }, versionNo),
  })
  return result.document
}

export async function updateContentDocument(collectionKey, documentId, patch, versionNo) {
  const result = await apiRequest(contentUrl({ action: 'update' }), {
    method: 'POST',
    body: withVersion({ collection: collectionKey, id: documentId, data: patch }, versionNo),
  })
  return result.document
}

export function deleteContentDocument(collectionKey, documentId, versionNo) {
  return apiRequest(contentUrl({ action: 'delete' }), {
    method: 'POST',
    body: withVersion({ collection: collectionKey, id: documentId }, versionNo),
  })
}

export function reorderContentDocuments(collectionKey, rows) {
  return apiRequest(contentUrl({ action: 'reorder' }), {
    method: 'POST',
    body: { collection: collectionKey, rows },
  })
}
