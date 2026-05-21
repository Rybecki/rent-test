import { ClipboardSignature, Files, PackageCheck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { RegulaminyTab } from './RegulaminyTab'
import { OdbiorSprzetuTab } from './OdbiorSprzetuTab'
import { DokumentyTab } from './DokumentyTab'
import { PinGateModal } from './PinGateModal'
import {
  APP_NAME,
  DOCS_AUTH_SESSION_KEY,
  DOCUMENTS_TAB_PIN,
} from '../appConfig'
import { LOGO_SRC } from '../logo'

type TabId = 'reg' | 'pickup' | 'docs'

export function AppShell() {
  const [tab, setTab] = useState<TabId>('reg')
  const [docsUnlocked, setDocsUnlocked] = useState(
    () =>
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(DOCS_AUTH_SESSION_KEY) === '1',
  )
  const [docsPinOpen, setDocsPinOpen] = useState(false)

  const unlockDocs = useCallback(() => {
    sessionStorage.setItem(DOCS_AUTH_SESSION_KEY, '1')
    setDocsUnlocked(true)
    setDocsPinOpen(false)
    setTab('docs')
  }, [])

  const requestDocsTab = () => {
    if (docsUnlocked) {
      setTab('docs')
      return
    }
    setDocsPinOpen(true)
  }

  const tabBtn = (active: boolean) =>
    [
      'inline-flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-1.5 font-display text-xs font-semibold transition-colors sm:gap-2 sm:px-2 sm:text-sm',
      active
        ? 'border-primary/90 bg-primary text-dark shadow-md'
        : 'border-white/15 bg-white/10 text-white/90 hover:border-white/25 hover:bg-white/15',
    ].join(' ')

  return (
    <div className="mx-auto flex min-h-dvh max-w-[900px] flex-col">
      <header className="sticky top-0 z-20 border-2 border-primary bg-graphite-750 px-3 pb-3 pt-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:rounded-b-3xl">
        <div className="mb-2 flex justify-center py-1">
          <img
            src={LOGO_SRC}
            alt={APP_NAME}
            className="block h-auto max-h-14 w-full max-w-[340px] bg-transparent object-contain"
          />
        </div>
        <nav className="grid grid-cols-3 gap-2" aria-label="Główne zakładki">
          <button
            type="button"
            className={tabBtn(tab === 'reg')}
            onClick={() => setTab('reg')}
          >
            <ClipboardSignature size={18} aria-hidden className="sm:hidden" />
            <ClipboardSignature size={20} aria-hidden className="hidden sm:block" />
            Regulaminy
          </button>
          <button
            type="button"
            className={tabBtn(tab === 'pickup')}
            onClick={() => setTab('pickup')}
          >
            <PackageCheck size={18} aria-hidden className="sm:hidden" />
            <PackageCheck size={20} aria-hidden className="hidden sm:block" />
            Odbiór sprzętu
          </button>
          <button
            type="button"
            className={tabBtn(tab === 'docs')}
            onClick={requestDocsTab}
          >
            <Files size={18} aria-hidden className="sm:hidden" />
            <Files size={20} aria-hidden className="hidden sm:block" />
            Dokumenty
          </button>
        </nav>
      </header>

      <main className="scheme-dark flex-1 px-3.5 pb-10 pt-3.5 md:px-6 md:pt-5">
        {tab === 'reg' && <RegulaminyTab />}
        {tab === 'pickup' && <OdbiorSprzetuTab />}
        {tab === 'docs' && docsUnlocked && <DokumentyTab />}
        {tab === 'docs' && !docsUnlocked && (
          <p className="py-8 text-center text-sm text-white/60">
            Wprowadź PIN, aby otworzyć dokumenty.
          </p>
        )}
      </main>

      <PinGateModal
        open={docsPinOpen}
        title="Dokumenty — PIN"
        description="Wprowadź PIN, aby otworzyć listę podpisanych dokumentów."
        correctPin={DOCUMENTS_TAB_PIN}
        onSuccess={unlockDocs}
        onClose={() => setDocsPinOpen(false)}
      />
    </div>
  )
}
