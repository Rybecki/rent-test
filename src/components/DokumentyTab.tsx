import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { useDocuments } from '../context/documentsContext'
import type { SignedDocument } from '../types'
import { buildSignedPdf } from '../lib/pdf'
import {
  getIssueChecklistStatus,
  getReturnChecklistStatus,
} from '../lib/documentChecklistStatus'
import {
  formatBikeCountsSummary,
  normalizeBikeModelCounts,
} from '../data/bikeModels'
import { formatInvoiceAddress, hasInvoiceData } from '../lib/invoiceFormat'
import { normalizeNip } from '../lib/invoiceValidation'
import { formatFullName } from '../lib/personName'
import { PAYMENT_METHOD_LABELS } from '../types'
import { ChecklistStatusValue } from './ChecklistStatusValue'

const label =
  'font-sophisticated text-[10px] font-semibold uppercase tracking-[0.14em] text-primary'
const value = 'text-sm font-medium text-white/95 sm:text-base'
const detailLabel =
  'font-sophisticated text-xs font-semibold uppercase tracking-wide text-primary/90'

function formatSignedAt(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sortBySignedAt(docs: SignedDocument[]) {
  return [...docs].sort(
    (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime(),
  )
}

function SummaryField({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={label}>{title}</p>
      <p className={`mt-0.5 truncate ${value}`}>{children}</p>
    </div>
  )
}

function DetailRow({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <>
      <dt className={detailLabel}>{title}</dt>
      <dd className="m-0 text-sm text-white/95">{children}</dd>
    </>
  )
}

function DocumentCard({ document: d }: { document: SignedDocument }) {
  const [expanded, setExpanded] = useState(false)
  const issueStatus = getIssueChecklistStatus(d)
  const returnStatus = getReturnChecklistStatus(d)
  const panelId = `document-panel-${d.id}`

  return (
    <li
      className={`overflow-hidden rounded-2xl border-2 border-primary bg-white/[0.04] shadow-[0_0_18px_rgba(255,117,31,0.14)] transition-shadow ${
        expanded ? 'shadow-[0_0_24px_rgba(255,117,31,0.22)]' : ''
      }`}
    >
      <button
        type="button"
        className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-primary/[0.06] sm:p-5"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
      >
        <div className="flex flex-col gap-3 pr-8">
          <time
            dateTime={d.signedAt}
            className="text-xs font-medium leading-tight text-white sm:text-sm"
          >
            {formatSignedAt(d.signedAt)}
          </time>
          <SummaryField title="Wynajmujący">
            {formatFullName(d.firstName, d.lastName)}
          </SummaryField>
          <SummaryField title="Przedmiot wynajmu">{d.equipmentLabel}</SummaryField>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-primary/25 pt-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
            {expanded ? 'Zwiń' : 'Szczegóły'}
          </span>
          <ChevronDown
            size={20}
            strokeWidth={2.25}
            aria-hidden
            className={`shrink-0 text-primary transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div
          id={panelId}
          className="flex flex-col gap-5 border-t border-primary/30 bg-black/15 px-4 pb-5 pt-4 sm:px-5"
        >
          <dl className="m-0 grid grid-cols-[minmax(0,38%)_1fr] gap-x-4 gap-y-2 text-sm">
            <DetailRow title="Wynajmujący">
              {formatFullName(d.firstName, d.lastName)}
            </DetailRow>
            <DetailRow title="Wydający sprzęt">
              {formatFullName(d.issuerFirstName, d.issuerLastName) || '—'}
            </DetailRow>
            <DetailRow title="Adres">{d.residentialAddress}</DetailRow>
            <DetailRow title="Telefon">{d.phone}</DetailRow>
            <DetailRow title="E-mail">{d.clientEmail || '—'}</DetailRow>
            <DetailRow title="Dokument tożsamości">{d.idDocument}</DetailRow>
            <DetailRow title="PESEL">{d.pesel || '—'}</DetailRow>
            <DetailRow title="Przedmiot wynajmu">{d.equipmentLabel}</DetailRow>
            {issueStatus && (
              <>
                <dt className={detailLabel}>Checklista wydania</dt>
                <dd className="m-0">
                  <ChecklistStatusValue info={issueStatus} />
                </dd>
              </>
            )}
            {returnStatus && (
              <>
                <dt className={detailLabel}>Checklista odbioru</dt>
                <dd className="m-0">
                  <ChecklistStatusValue info={returnStatus} />
                </dd>
              </>
            )}
            <DetailRow title="Data podpisania">{formatSignedAt(d.signedAt)}</DetailRow>
            <DetailRow title="Termin wynajmu">
              {d.dateFrom} — {d.dateTo} ({d.days} {d.days === 1 ? 'dzień' : 'dni'})
            </DetailRow>
            <DetailRow title="Pakiet">{d.packageName}</DetailRow>
            <DetailRow title="Liczba sprzętu">
              {d.equipmentId === 'e-bike' && d.bikeModels?.length
                ? `${d.equipmentCount} (${formatBikeCountsSummary(
                    d.bikeModels,
                    normalizeBikeModelCounts(
                      d.bikeModels,
                      d.bikeModelCounts,
                      d.equipmentCount,
                    ),
                  )})`
                : d.equipmentCount}
            </DetailRow>
            <DetailRow title="Płatność">
              {PAYMENT_METHOD_LABELS[d.paymentMethod]}
            </DetailRow>
            <DetailRow title="Cena">{d.pricePln.toFixed(2)} PLN</DetailRow>
            {d.depositPln > 0 && (
              <DetailRow title="Kaucja">{d.depositPln.toFixed(0)} PLN</DetailRow>
            )}
            {hasInvoiceData(d) && (
              <>
                <DetailRow title="Faktura">{d.invoiceCompanyName}</DetailRow>
                <DetailRow title="NIP">{normalizeNip(d.invoiceNip)}</DetailRow>
                <DetailRow title="Adres firmy">{formatInvoiceAddress(d)}</DetailRow>
                {d.invoiceEmail.trim() && (
                  <DetailRow title="E-mail faktury">{d.invoiceEmail}</DetailRow>
                )}
              </>
            )}
          </dl>

          <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-white/[0.03] p-3">
            <span className={detailLabel}>Podpis w dokumencie</span>
            <img
              src={d.signatureDataUrl}
              alt=""
              className="max-w-[220px] rounded-lg border border-white/15 bg-white"
            />
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full border-2 border-primary bg-primary/15 py-3 font-display font-bold text-primary shadow-[0_0_12px_rgba(255,117,31,0.25)] transition hover:bg-primary/25 hover:shadow-[0_0_18px_rgba(255,117,31,0.35)]"
            onClick={() => void buildSignedPdf(d)}
          >
            Pobierz PDF
          </button>
        </div>
      )}
    </li>
  )
}

export function DokumentyTab() {
  const { documents, loading, error } = useDocuments()
  const sortedDocuments = useMemo(() => sortBySignedAt(documents), [documents])

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-white/60">
        Ładowanie dokumentów…
      </p>
    )
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-red-400" role="alert">
        {error}
      </p>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-white/65">
        <FileText size={40} strokeWidth={1.25} aria-hidden className="text-primary/80" />
        <p className="max-w-md text-sm leading-relaxed">
          Brak podpisanych dokumentów. Podpisz regulamin na stronie głównej.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-4 p-0">
      {sortedDocuments.map((d) => (
        <DocumentCard key={d.id} document={d} />
      ))}
    </ul>
  )
}
