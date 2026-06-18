import { ClipboardSignature, Files, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RegulaminyTab } from './RegulaminyTab'
import { OdbiorSprzetuTab } from './OdbiorSprzetuTab'
import { DokumentyTab } from './DokumentyTab'
import { TestAppNoticeModal } from './TestAppNoticeModal'
import { useAuth } from '../context/AuthProvider'
import { APP_NAME, SKIP_AUTH } from '../appConfig'
import { hasSeenDemoNotice, markDemoNoticeSeen } from '../lib/demoNoticeStorage'
import { LOGO_SRC } from '../logo'

type TabId = 'reg' | 'pickup' | 'docs'

export function AppShell() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState<TabId>('reg')
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(false)

  useEffect(() => {
    if (!hasSeenDemoNotice()) setDemoNoticeOpen(true)
  }, [])

  useEffect(() => {
    if (!isAdmin && tab === 'docs') setTab('reg')
  }, [isAdmin, tab])

  const tabBtn = (active: boolean, compact?: boolean) =>
    [
      'inline-flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-1.5 font-display font-semibold transition-colors sm:gap-2 sm:px-2',
      compact ? 'text-[10px] leading-tight sm:text-xs' : 'text-xs sm:text-sm',
      active
        ? 'border-primary/90 bg-primary text-dark shadow-md'
        : 'border-white/15 bg-white/10 text-white/90 hover:border-white/25 hover:bg-white/15',
    ].join(' ')

  return (
    <div className="mx-auto flex min-h-dvh max-w-[900px] flex-col">
      <TestAppNoticeModal
        open={demoNoticeOpen}
        onConfirm={() => {
          markDemoNoticeSeen()
          setDemoNoticeOpen(false)
        }}
      />
      <header className="sticky top-0 z-20 border-2 border-t-0 border-primary bg-graphite-750 px-3 pb-3 pt-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:rounded-b-3xl">
        <div
          className={`mb-2 grid min-h-[3.75rem] items-start gap-2 ${
            SKIP_AUTH ? 'grid-cols-1' : 'grid-cols-[1fr_auto_1fr]'
          }`}
        >
          {!SKIP_AUTH && <div aria-hidden className="min-w-0" />}
          <div className="flex justify-center py-1">
            <img
              src={LOGO_SRC}
              alt={APP_NAME}
              className="block h-auto max-h-[4.25rem] w-full max-w-[min(360px,72vw)] bg-transparent object-contain"
            />
          </div>
          {!SKIP_AUTH && (
            <div className="flex min-w-0 flex-col items-end gap-1 justify-self-end pt-0.5">
              <p className="max-w-[140px] truncate text-right text-[10px] leading-tight text-white/70 sm:max-w-[200px] sm:text-xs">
                {user?.email}
              </p>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {user?.role === 'admin' ? 'Administrator' : 'Użytkownik'}
              </span>
            </div>
          )}
        </div>
        <nav
          className={`grid gap-2 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}
          aria-label="Główne zakładki"
        >
          <button
            type="button"
            className={tabBtn(tab === 'reg', true)}
            onClick={() => setTab('reg')}
          >
            <ClipboardSignature size={18} aria-hidden className="sm:hidden" />
            <ClipboardSignature size={20} aria-hidden className="hidden sm:block" />
            STRONA GŁÓWNA
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
          {isAdmin && (
            <button
              type="button"
              className={tabBtn(tab === 'docs')}
              onClick={() => setTab('docs')}
            >
              <Files size={18} aria-hidden className="sm:hidden" />
              <Files size={20} aria-hidden className="hidden sm:block" />
              Dokumenty
            </button>
          )}
        </nav>
      </header>

      <main className="scheme-dark flex-1 px-3.5 pb-10 pt-3.5 md:px-6 md:pt-5">
        {tab === 'reg' && <RegulaminyTab />}
        {tab === 'pickup' && <OdbiorSprzetuTab />}
        {tab === 'docs' && isAdmin && <DokumentyTab />}
      </main>
    </div>
  )
}
