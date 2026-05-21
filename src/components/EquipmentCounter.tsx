import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  min?: number
  max?: number
}

const arrowBtn =
  'flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-dark shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'

export function EquipmentCounter({
  value,
  onChange,
  disabled = false,
  min = 1,
  max = 99,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-5 py-1">
      <button
        type="button"
        className={arrowBtn}
        aria-label="Zmniejsz liczbę"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <ChevronLeft size={28} strokeWidth={2.5} aria-hidden />
      </button>
      <span
        className="min-w-[3.5rem] text-center font-display text-4xl font-bold tabular-nums text-white"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={arrowBtn}
        aria-label="Zwiększ liczbę"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <ChevronRight size={28} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}
