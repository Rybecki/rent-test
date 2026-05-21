import { checklistCompletionPercent, isChecklistComplete } from '../data/checklistUtils'
import { getReturnChecklist, hasReturnChecklist } from '../data/returnChecklists'
import { getServiceChecklist, hasServiceChecklist } from '../data/serviceChecklists'
import type { SignedDocument } from '../types'

export type ChecklistStatusInfo = {
  complete: boolean
  percent: number
}

export function getIssueChecklistStatus(
  doc: SignedDocument,
): ChecklistStatusInfo | null {
  if (!hasServiceChecklist(doc.equipmentId)) return null
  const def = getServiceChecklist(doc.equipmentId)
  if (!def) return null

  const checkedIds = new Set(doc.checklistCheckedIds ?? [])
  if (doc.checklistCheckedIds?.length) {
    return {
      complete: isChecklistComplete(def, checkedIds),
      percent: checklistCompletionPercent(def, checkedIds),
    }
  }

  const complete = doc.checklistCompleted ?? false
  return {
    complete,
    percent: complete ? 100 : 0,
  }
}

export function getReturnChecklistStatus(
  doc: SignedDocument,
): ChecklistStatusInfo | null {
  if (!hasReturnChecklist(doc.equipmentId)) return null
  const def = getReturnChecklist(doc.equipmentId)
  if (!def) return null

  const checkedIds = new Set(doc.returnChecklistCheckedIds ?? [])
  return {
    complete: isChecklistComplete(def, checkedIds),
    percent: checklistCompletionPercent(def, checkedIds),
  }
}

export function formatChecklistStatus(info: ChecklistStatusInfo): string {
  const label = info.complete ? 'Wypełniona' : 'Niewypełniona'
  return `${label} (${info.percent}%)`
}
