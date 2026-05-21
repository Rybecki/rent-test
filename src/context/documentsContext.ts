import { createContext, useContext } from 'react'
import type { SignedDocument } from '../types'

export type DocumentsContextValue = {
  documents: SignedDocument[]
  addDocument: (doc: Omit<SignedDocument, 'id' | 'signedAt'>) => SignedDocument
  updateReturnChecklist: (docId: string, checkedIds: string[]) => void
}

export const DocumentsContext = createContext<DocumentsContextValue | null>(
  null,
)

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments outside DocumentsProvider')
  return ctx
}
