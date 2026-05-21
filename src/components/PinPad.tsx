import { useCallback, useState } from 'react'
import { Delete } from 'lucide-react'

const keyClass =
  'flex h-[52px] items-center justify-center rounded-xl border border-white/15 bg-white/10 font-display text-lg font-semibold text-white transition active:scale-[0.98] hover:bg-white/15'

type PinPadProps = {
  onSuccess: () => void
  correctPin: string
}

export function PinPad({ onSuccess, correctPin }: PinPadProps) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  const back = useCallback(() => {
    setPin((p) => p.slice(0, -1))
  }, [])

  const tryUnlock = useCallback(
    (value: string) => {
      if (value.length < 4) return
      if (value === correctPin) {
        onSuccess()
        return
      }
      setShake(true)
      setPin('')
      window.setTimeout(() => setShake(false), 450)
    },
    [correctPin, onSuccess],
  )

  const press = (d: string) => {
    setPin((p) => {
      if (p.length >= 4) return p
      const next = p + d
      if (next.length === 4) queueMicrotask(() => tryUnlock(next))
      return next
    })
  }

  return (
    <div className={`mx-auto max-w-[280px] ${shake ? 'pinpad-shake' : ''}`}>
      <div className="mb-5 flex justify-center gap-3" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border-2 ${
              i < pin.length
                ? 'border-primary bg-primary'
                : 'border-white/35 bg-white/5'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className={keyClass} onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={`${keyClass} invisible pointer-events-none`} disabled aria-hidden />
        <button type="button" className={keyClass} onClick={() => press('0')}>
          0
        </button>
        <button type="button" className={keyClass} onClick={back} aria-label="Cofnij">
          <Delete size={22} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
