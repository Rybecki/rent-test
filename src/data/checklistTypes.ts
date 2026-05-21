export type ChecklistItemDef = {
  id: string
  label: string
  optional?: boolean
}

export type ChecklistSubsectionDef = {
  title: string
  items: ChecklistItemDef[]
  infoNote?: string
}

export type ChecklistSectionDef = {
  title: string
  subsections: ChecklistSubsectionDef[]
}

export type ChecklistDef = {
  modalTitle: string
  sections: ChecklistSectionDef[]
  infoNotes?: string
}
