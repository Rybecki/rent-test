import type {
  ChecklistDef,
  ChecklistItemDef,
  ChecklistSectionDef,
} from './checklistTypes'

export function getAllChecklistItems(def: ChecklistDef): ChecklistItemDef[] {
  return def.sections.flatMap((s) =>
    s.subsections.flatMap((sub) => sub.items),
  )
}

export function getRequiredChecklistItems(def: ChecklistDef): ChecklistItemDef[] {
  return getAllChecklistItems(def).filter((i) => !i.optional)
}

export function isChecklistComplete(
  def: ChecklistDef,
  checkedIds: ReadonlySet<string>,
): boolean {
  return getRequiredChecklistItems(def).every((i) => checkedIds.has(i.id))
}

export function countChecked(
  def: ChecklistDef,
  checkedIds: ReadonlySet<string>,
): { checked: number; total: number } {
  const required = getRequiredChecklistItems(def)
  const checked = required.filter((i) => checkedIds.has(i.id)).length
  return { checked, total: required.length }
}

function completionPercent(
  required: ChecklistItemDef[],
  checkedIds: ReadonlySet<string>,
): number {
  if (required.length === 0) return 100
  const checked = required.filter((i) => checkedIds.has(i.id)).length
  return Math.round((checked / required.length) * 100)
}

export function checklistCompletionPercent(
  def: ChecklistDef,
  checkedIds: ReadonlySet<string>,
): number {
  return completionPercent(getRequiredChecklistItems(def), checkedIds)
}

export function sectionCompletionPercent(
  section: ChecklistSectionDef,
  checkedIds: ReadonlySet<string>,
): number {
  const required = section.subsections
    .flatMap((sub) => sub.items)
    .filter((i) => !i.optional)
  return completionPercent(required, checkedIds)
}
