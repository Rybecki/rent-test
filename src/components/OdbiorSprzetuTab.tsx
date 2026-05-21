import { PackageCheck } from 'lucide-react'
import { useMemo } from 'react'
import { ChecklistCard } from './ChecklistCard'
import { useDocuments } from '../context/documentsContext'
import { getReturnChecklist, hasReturnChecklist } from '../data/returnChecklists'

const field =
  'font-sophisticated text-xs font-semibold uppercase tracking-wide text-primary'
const value = 'text-white/95'

export function OdbiorSprzetuTab() {
  const { documents, updateReturnChecklist } = useDocuments()

  const pickupDocs = useMemo(
    () => documents.filter((d) => hasReturnChecklist(d.equipmentId)),
    [documents],
  )

  if (pickupDocs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-white/65">
        <PackageCheck size={40} strokeWidth={1.25} aria-hidden className="text-primary/80" />
        <p className="max-w-md text-sm leading-relaxed">
          Brak dokumentów do odbioru. Podpisz regulamin dla E-Bike lub Kajaków w zakładce
          „Regulaminy”.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-4 p-0">
      {pickupDocs.map((d) => {
        const def = getReturnChecklist(d.equipmentId)!
        const checkedIds = new Set(d.returnChecklistCheckedIds ?? [])

        const toggle = (itemId: string) => {
          const next = new Set(checkedIds)
          if (next.has(itemId)) next.delete(itemId)
          else next.add(itemId)
          updateReturnChecklist(d.id, [...next])
        }

        return (
          <li key={d.id} className="glass-card flex flex-col gap-4 rounded-2xl p-4 sm:p-5">
            <dl className="m-0 grid grid-cols-[minmax(0,38%)_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className={field}>Imię i nazwisko</dt>
              <dd className={`m-0 ${value}`}>{d.fullName}</dd>
              <dt className={field}>Sprzęt</dt>
              <dd className={`m-0 ${value}`}>{d.equipmentLabel}</dd>
              <dt className={field}>Liczba</dt>
              <dd className={`m-0 ${value}`}>{d.equipmentCount}</dd>
              <dt className={field}>Pakiet</dt>
              <dd className={`m-0 ${value}`}>{d.packageName}</dd>
            </dl>
            <ChecklistCard
              def={def}
              checkedIds={checkedIds}
              onToggle={toggle}
              cardTitle="Checklista odbioru"
            />
          </li>
        )
      })}
    </ul>
  )
}
