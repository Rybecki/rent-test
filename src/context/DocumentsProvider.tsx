import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isChecklistComplete } from '../data/checklistUtils'
import { getReturnChecklist } from '../data/returnChecklists'
import { documentsApi } from '../lib/api'
import type { SignedDocument } from '../types'
import { useAuth } from './AuthProvider'
import { DocumentsContext } from './documentsContext'

type RefreshOptions = { silent?: boolean }

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userKey = user?.email ?? ''
  const [documents, setDocuments] = useState<SignedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!userKey) {
        setDocuments([])
        setLoading(false)
        hasLoadedOnce.current = false
        return
      }

      const silent = options?.silent ?? hasLoadedOnce.current
      if (!silent) setLoading(true)
      setError(null)

      try {
        const list = await documentsApi.list()
        setDocuments(Array.isArray(list) ? list : [])
      } catch (e) {
        setDocuments([])
        setError(e instanceof Error ? e.message : 'Błąd ładowania dokumentów')
      } finally {
        hasLoadedOnce.current = true
        setLoading(false)
      }
    },
    [userKey],
  )

  useEffect(() => {
    hasLoadedOnce.current = false
    void refresh()
  }, [refresh])

  const addDocument = useCallback(
    async (
      partial: Omit<SignedDocument, 'id' | 'signedAt'>,
    ): Promise<SignedDocument> => {
      const res = await documentsApi.create(partial)
      const { emailStatus, ...doc } = res
      await refresh({ silent: true })
      return Object.assign(doc, { emailStatus })
    },
    [refresh],
  )

  const updateReturnChecklist = useCallback(
    async (docId: string, checkedIds: string[]) => {
      const doc = documents.find((d) => d.id === docId)
      if (!doc) return
      const def = getReturnChecklist(doc.equipmentId)
      const checkedSet = new Set(checkedIds)
      const completed = def ? isChecklistComplete(def, checkedSet) : false
      const updated = await documentsApi.updateReturnChecklist(
        docId,
        checkedIds,
        completed,
      )
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? updated : d)),
      )
    },
    [documents],
  )

  const value = useMemo(
    () => ({
      documents,
      loading,
      error,
      refresh,
      addDocument,
      updateReturnChecklist,
    }),
    [documents, loading, error, refresh, addDocument, updateReturnChecklist],
  )

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  )
}
