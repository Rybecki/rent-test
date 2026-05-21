import { PinPad } from './PinPad'

type PinGateModalProps = {
  open: boolean
  title: string
  description: string
  correctPin: string
  onSuccess: () => void
  onClose: () => void
}

export function PinGateModal({
  open,
  title,
  description,
  correctPin,
  onSuccess,
  onClose,
}: PinGateModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-gate-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Zamknij"
      />
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-primary/40 bg-graphite-800 p-6 shadow-2xl">
        <h2
          id="pin-gate-title"
          className="mb-2 text-center font-display text-xl font-bold text-primary"
        >
          {title}
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-white/80">
          {description}
        </p>
        <PinPad correctPin={correctPin} onSuccess={onSuccess} />
      </div>
    </div>
  )
}
