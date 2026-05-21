import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { computeDepositPln } from '../data/equipmentMeta'
import { isChecklistComplete } from '../data/checklistUtils'
import { getReturnChecklist } from '../data/returnChecklists'
import { buildFilledRegulation } from '../lib/fillRegulation'
import type { BikeModel, PaymentMethod, SignedDocument } from '../types'
import { DocumentsContext } from './documentsContext'

const STORAGE_KEY = 'cherrysign-documents-v1'

function normalizeBikeModels(raw: SignedDocument): BikeModel[] {
  if (raw.bikeModels?.length) return raw.bikeModels
  if (raw.bikeModel) return [raw.bikeModel]
  return []
}

function migrateDoc(raw: SignedDocument): SignedDocument {
  const equipmentCount = raw.equipmentCount ?? 1
  const paymentMethod = (raw.paymentMethod ?? 'cash') as PaymentMethod
  const depositPln =
    raw.depositPln ??
    computeDepositPln(raw.equipmentId, equipmentCount)
  const bikeModels = normalizeBikeModels(raw)

  const formBase = {
    equipmentId: raw.equipmentId,
    fullName: raw.fullName,
    residentialAddress: raw.residentialAddress ?? '',
    phone: raw.phone ?? '',
    idDocument: raw.idDocument ?? '',
    packageName: raw.packageName,
    dateFrom: raw.dateFrom,
    dateTo: raw.dateTo,
    days: raw.days,
    pricePln: raw.pricePln,
    bikeModels: bikeModels.length > 0 ? bikeModels : undefined,
    equipmentCount,
    paymentMethod,
    depositPln,
  }

  return {
    ...raw,
    equipmentCount,
    paymentMethod,
    depositPln,
    bikeModels: bikeModels.length > 0 ? bikeModels : undefined,
    filledRegulationText:
      raw.filledRegulationText || buildFilledRegulation(formBase),
  }
}

function load(): SignedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SignedDocument[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(migrateDoc)
  } catch {
    return []
  }
}

function save(list: SignedDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    return
  }
}

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<SignedDocument[]>(load)

  useEffect(() => {
    save(documents)
  }, [documents])

  const addDocument = useCallback(
    (partial: Omit<SignedDocument, 'id' | 'signedAt'>): SignedDocument => {
      const doc: SignedDocument = {
        ...partial,
        id: crypto.randomUUID(),
        signedAt: new Date().toISOString(),
      }
      setDocuments((prev) => [doc, ...prev])
      return doc
    },
    [],
  )

  const updateReturnChecklist = useCallback((docId: string, checkedIds: string[]) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d
        const def = getReturnChecklist(d.equipmentId)
        const checkedSet = new Set(checkedIds)
        const completed = def ? isChecklistComplete(def, checkedSet) : false
        return {
          ...d,
          returnChecklistCheckedIds: checkedIds,
          returnChecklistCompleted: completed,
        }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({ documents, addDocument, updateReturnChecklist }),
    [documents, addDocument, updateReturnChecklist],
  )

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  )
}
