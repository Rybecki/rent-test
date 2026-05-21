import type { ChecklistDef } from '../data/checklistTypes'
import { ChecklistCard } from './ChecklistCard'

type ServiceChecklistCardProps = {
  def: ChecklistDef
  checkedIds: ReadonlySet<string>
  onToggle: (id: string) => void
}

export function ServiceChecklistCard(props: ServiceChecklistCardProps) {
  return (
    <ChecklistCard
      {...props}
      cardTitle="Lista kontrolna obsługi"
    />
  )
}
