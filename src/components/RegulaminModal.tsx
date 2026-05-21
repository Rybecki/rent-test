import { X } from 'lucide-react'
import type { EquipmentId } from '../types'
import { EQUIPMENT_LABELS } from '../data/packages'
import { getRegulationText } from '../data/regulations'

type RegulaminModalProps = {
  equipmentId: EquipmentId | null
  open: boolean
  onClose: () => void
}

export function RegulaminModal({
  equipmentId,
  open,
  onClose,
}: RegulaminModalProps) {
  if (!open || !equipmentId) return null
  const title = EQUIPMENT_LABELS[equipmentId]
  const body = getRegulationText(equipmentId)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Zamknij"
      />
      <div className="relative z-[1] flex max-h-[min(90dvh,900px)] w-full max-w-[820px] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-graphite-800 shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-graphite-950 px-4 py-3">
          <h2 id="reg-modal-title" className="font-display text-lg font-semibold text-primary">
            Regulamin — {title}
          </h2>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X size={22} />
          </button>
        </header>
        <div className="max-h-[calc(90dvh-56px)] overflow-auto">
          <pre className="m-0 whitespace-pre-wrap break-words p-4 text-sm leading-relaxed text-white/90">
            {body}
          </pre>
        </div>
      </div>
    </div>
  )
}
