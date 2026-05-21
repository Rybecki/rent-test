import { FileText } from 'lucide-react'
import { useDocuments } from '../context/documentsContext'
import { buildSignedPdf } from '../lib/pdf'
import {
  getIssueChecklistStatus,
  getReturnChecklistStatus,
} from '../lib/documentChecklistStatus'
import { PAYMENT_METHOD_LABELS } from '../types'
import { ChecklistStatusValue } from './ChecklistStatusValue'

const field =
  'font-sophisticated text-xs font-semibold uppercase tracking-wide text-primary'
const value = 'text-white/95'

export function DokumentyTab() {
  const { documents } = useDocuments()

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-white/65">
        <FileText size={40} strokeWidth={1.25} aria-hidden className="text-primary/80" />
        <p className="max-w-md text-sm leading-relaxed">
          Brak podpisanych dokumentów. Podpisz regulamin w zakładce „Regulaminy”.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-4 p-0">
      {documents.map((d) => {
        const issueStatus = getIssueChecklistStatus(d)
        const returnStatus = getReturnChecklistStatus(d)

        return (
          <li key={d.id} className="glass-card flex flex-col gap-4 rounded-2xl p-4 sm:p-5">
            <dl className="m-0 grid grid-cols-[minmax(0,38%)_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className={field}>Imię i nazwisko</dt>
              <dd className={`m-0 ${value}`}>{d.fullName}</dd>
              <dt className={field}>Adres</dt>
              <dd className={`m-0 ${value}`}>{d.residentialAddress}</dd>
              <dt className={field}>Telefon</dt>
              <dd className={`m-0 ${value}`}>{d.phone}</dd>
              <dt className={field}>Dokument</dt>
              <dd className={`m-0 ${value}`}>{d.idDocument}</dd>
              <dt className={field}>Przedmiot wynajmu</dt>
              <dd className={`m-0 ${value}`}>{d.equipmentLabel}</dd>
              {issueStatus && (
                <>
                  <dt className={field}>Checklista wydania</dt>
                  <dd className="m-0">
                    <ChecklistStatusValue info={issueStatus} />
                  </dd>
                </>
              )}
              {returnStatus && (
                <>
                  <dt className={field}>Checklista odbioru</dt>
                  <dd className="m-0">
                    <ChecklistStatusValue info={returnStatus} />
                  </dd>
                </>
              )}
              <dt className={field}>Data podpisania</dt>
              <dd className={`m-0 ${value}`}>
                {new Date(d.signedAt).toLocaleString('pl-PL')}
              </dd>
              <dt className={field}>Termin</dt>
              <dd className={`m-0 ${value}`}>
                {d.dateFrom} — {d.dateTo} ({d.days} {d.days === 1 ? 'dzień' : 'dni'})
              </dd>
              <dt className={field}>Pakiet</dt>
              <dd className={`m-0 ${value}`}>{d.packageName}</dd>
              <dt className={field}>Liczba sprzętu</dt>
              <dd className={`m-0 ${value}`}>{d.equipmentCount}</dd>
              <dt className={field}>Płatność</dt>
              <dd className={`m-0 ${value}`}>
                {PAYMENT_METHOD_LABELS[d.paymentMethod]}
              </dd>
              <dt className={field}>Cena</dt>
              <dd className={`m-0 ${value}`}>{d.pricePln.toFixed(2)} PLN</dd>
              {d.depositPln > 0 && (
                <>
                  <dt className={field}>Kaucja</dt>
                  <dd className={`m-0 ${value}`}>{d.depositPln.toFixed(0)} PLN</dd>
                </>
              )}
            </dl>
            <div className="flex flex-col gap-1.5">
              <span className={field}>Podpis w dokumencie</span>
              <img
                src={d.signatureDataUrl}
                alt=""
                className="max-w-[220px] rounded-lg border border-white/15 bg-white"
              />
            </div>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-primary bg-primary/10 py-3 font-display font-bold text-primary shadow-[0_0_10px_rgba(247,199,59,0.2)] transition hover:bg-primary/20 hover:shadow-[0_0_16px_rgba(247,199,59,0.35)]"
              onClick={() => void buildSignedPdf(d)}
            >
              Pobierz PDF
            </button>
          </li>
        )
      })}
    </ul>
  )
}
