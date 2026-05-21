import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChecklistDef } from '../data/checklistTypes'
import { countChecked, isChecklistComplete } from '../data/checklistUtils'
import { ServiceChecklistModal } from './ServiceChecklistModal'

type ChecklistCardProps = {
  def: ChecklistDef
  checkedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  cardTitle?: string
}

export function ChecklistCard({
  def,
  checkedIds,
  onToggle,
  cardTitle = 'Lista kontrolna',
}: ChecklistCardProps) {
  const [open, setOpen] = useState(false)
  const complete = useMemo(
    () => isChecklistComplete(def, checkedIds),
    [def, checkedIds],
  )
  const { checked, total } = useMemo(
    () => countChecked(def, checkedIds),
    [def, checkedIds],
  )

  const borderClass = complete
    ? 'border-emerald-500/90 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
    : 'border-red-500/85 shadow-[0_0_12px_rgba(239,68,68,0.2)]'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-graphite-800/80 px-4 py-3.5 text-left transition hover:bg-graphite-750 ${borderClass}`}
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            complete ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}
          aria-hidden
        >
          <ClipboardList size={24} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-sm font-bold text-white">
            {cardTitle}
          </span>
          <span className="mt-0.5 block text-xs text-white/65">
            {checked}/{total} punktów
            {complete ? ' — ukończona' : ' — do uzupełnienia'}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-display text-xs font-bold ${
            complete
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {checked}/{total}
        </span>
      </button>

      <ServiceChecklistModal
        def={def}
        open={open}
        checkedIds={checkedIds}
        onToggle={onToggle}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
