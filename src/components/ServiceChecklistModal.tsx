import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { ChecklistDef } from '../data/checklistTypes'
import {
  checklistCompletionPercent,
  sectionCompletionPercent,
} from '../data/checklistUtils'

type ServiceChecklistModalProps = {
  def: ChecklistDef
  open: boolean
  checkedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  onClose: () => void
}

function percentBadge(pct: number) {
  const done = pct >= 100
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 font-display text-xs font-bold tabular-nums ${
        done
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-primary/15 text-primary'
      }`}
    >
      {pct}%
    </span>
  )
}

export function ServiceChecklistModal({
  def,
  open,
  checkedIds,
  onToggle,
  onClose,
}: ServiceChecklistModalProps) {
  const overallPct = useMemo(
    () => checklistCompletionPercent(def, checkedIds),
    [def, checkedIds],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Zamknij"
      />
      <div
        className="relative z-10 flex max-h-[min(90dvh,900px)] w-full max-w-[820px] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-graphite-800 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-graphite-950 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <h2
              id="checklist-modal-title"
              className="min-w-0 font-display text-base font-semibold leading-snug text-primary sm:text-lg"
            >
              {def.modalTitle}
            </h2>
            {percentBadge(overallPct)}
          </div>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X size={22} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-6">
            {def.sections.map((section) => {
              const sectionPct = sectionCompletionPercent(section, checkedIds)
              return (
                <section key={section.title}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 font-display text-sm font-bold leading-snug text-white">
                      {section.title}
                    </h3>
                    {percentBadge(sectionPct)}
                  </div>
                  <div className="flex flex-col gap-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary/90">
                          {sub.title}
                        </p>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                          {sub.items.map((item) => {
                            const on = checkedIds.has(item.id)
                            return (
                              <li key={item.id}>
                                <label
                                  className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 text-sm leading-snug transition ${
                                    on
                                      ? 'border-primary/50 bg-primary/10 text-white'
                                      : 'border-white/12 bg-white/5 text-white/90 hover:border-white/20'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 size-4 shrink-0 accent-[#f7c73b]"
                                    checked={on}
                                    onChange={() => onToggle(item.id)}
                                  />
                                  <span>
                                    {item.label}
                                    {item.optional && (
                                      <span className="ml-1 text-white/45">
                                        (opcjonalnie)
                                      </span>
                                    )}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                        {sub.infoNote && (
                          <p className="mt-2 text-xs leading-relaxed text-white/50 italic">
                            {sub.infoNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
            {def.infoNotes && (
              <div className="border-t border-white/10 pt-4">
                <pre className="m-0 whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-white/45">
                  {def.infoNotes}
                </pre>
              </div>
            )}
          </div>
        </div>
        <footer className="shrink-0 border-t border-white/10 bg-graphite-950 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-white/20 bg-white/10 py-3 font-display font-bold text-white transition hover:bg-white/15"
          >
            Zamknij
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
