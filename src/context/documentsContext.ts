import { createContext, useContext } from 'react'
import type { DocumentEmailStatus } from '../lib/api'
import type { SignedDocument } from '../types'

export type DocumentsContextValue = {
  documents: SignedDocument[]
  loading: boolean
  error: string | null
  refresh: (options?: { silent?: boolean }) => Promise<void>
  addDocument: (
    doc: Omit<SignedDocument, 'id' | 'signedAt'>,
  ) => Promise<SignedDocument & { emailStatus?: DocumentEmailStatus }>
  updateReturnChecklist: (docId: string, checkedIds: string[]) => Promise<void>
}

export const DocumentsContext = createContext<DocumentsContextValue | null>(
  null,
)

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments outside DocumentsProvider')
  return ctx
}
