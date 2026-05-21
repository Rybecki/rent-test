import type { PaymentMethod } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'

const OPTIONS: PaymentMethod[] = ['cash', 'card', 'prepayment']

type Props = {
  value: PaymentMethod | ''
  onChange: (value: PaymentMethod) => void
  disabled?: boolean
}

export function PaymentMethodPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {OPTIONS.map((id) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-40 ${
              active
                ? 'border-primary bg-primary text-dark shadow-md'
                : 'border-white/15 bg-white/10 text-white/90 hover:border-white/25'
            }`}
          >
            {PAYMENT_METHOD_LABELS[id]}
          </button>
        )
      })}
    </div>
  )
}
