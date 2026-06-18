import { ClipboardSignature, Files } from 'lucide-react'
import { APP_NAME } from '../appConfig'
import { LOGO_SRC } from '../logo'

type TestAppNoticeModalProps = {
  open: boolean
  onConfirm: () => void
}

export function TestAppNoticeModal({ open, onConfirm }: TestAppNoticeModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-notice-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div className="relative z-[1] w-full max-w-lg overflow-hidden rounded-2xl border border-primary/25 bg-graphite-800 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-transparent px-6 py-5">
          <div className="mb-4 flex justify-center">
            <img
              src={LOGO_SRC}
              alt={APP_NAME}
              className="block h-auto max-h-[4.5rem] w-full max-w-[220px] bg-transparent object-contain"
            />
          </div>
          <h2
            id="demo-notice-title"
            className="text-center font-display text-2xl font-bold text-primary"
          >
            Witaj w Rentally!
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-white/75">
            To wersja demonstracyjna pokazująca, jak działa system podpisywania umów
            wypożyczenia.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-white/85">
            Możesz swobodnie przetestować cały proces — od wyboru regulaminu, przez
            wypełnienie danych i podpis, aż po podgląd gotowego dokumentu.
          </p>

          <ul className="flex flex-col gap-3 text-sm text-white/80">
            <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <ClipboardSignature
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>Wypełnij formularz i podpisz umowę tak jak w docelowej aplikacji.</span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Files className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Podpisane dokumenty trafiają do zakładki{' '}
                <span className="font-semibold text-white">Dokumenty</span> — stamtąd
                pobierzesz PDF.
              </span>
            </li>
          </ul>

          <p className="text-center font-display text-lg font-bold text-primary">
            Przyjemnego użytkowania!
          </p>

          <button
            type="button"
            className="btn-primary mt-1 w-full border-0 !py-3.5"
            onClick={onConfirm}
          >
            Zaczynamy
          </button>
        </div>
      </div>
    </div>
  )
}
