const LEGACY_DOCUMENT_KEYS = [
  'cherrysign-documents-v1',
  'cherrysign-auth',
  'cherrysign-docs-auth',
  'rentaboco-session',
  'rentaboco-documents-v1',
]

export function clearLegacyDocumentStorage() {
  if (typeof localStorage === 'undefined') return
  for (const key of LEGACY_DOCUMENT_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {}
  }
}
