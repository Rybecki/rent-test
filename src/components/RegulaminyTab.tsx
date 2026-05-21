import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import type { EquipmentId, PaymentMethod } from '../types'
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_ORDER,
  PACKAGE_OPTIONS,
} from '../data/packages'
import { countInclusiveDays } from '../lib/dates'
import { computePrice } from '../lib/pricing'
import { buildFilledRegulation, type RegulationFormData } from '../lib/fillRegulation'
import type { BikeModel } from '../types'
import { RegulaminModal } from './RegulaminModal'
import { FilledRegulationView } from './FilledRegulationView'
import { useDocuments } from '../context/documentsContext'
import {
  computeDepositPln,
  EQUIPMENT_QUANTITY_LABEL,
} from '../data/equipmentMeta'
import { EquipmentCounter } from './EquipmentCounter'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { ServiceChecklistCard } from './ServiceChecklistCard'
import {
  getServiceChecklist,
  hasServiceChecklist,
  isChecklistComplete,
} from '../data/serviceChecklists'

const label =
  'font-sophisticated text-xs font-semibold uppercase tracking-wide text-primary'

const control =
  'w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40'

const dateControl =
  'w-auto shrink-0 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40'

const selectChevron =
  'appearance-none bg-size-[10px_10px] bg-position-[calc(100%-14px)_50%] bg-no-repeat pr-10'
const selectArrow =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%228%22%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M1%201l5%205%205-5%22%2F%3E%3C%2Fsvg%3E')]"

const BIKE_OPTIONS: { id: BikeModel; label: string }[] = [
  { id: 'kross', label: 'KROSS Influx Hybrid 1.0' },
  { id: 'winora', label: 'WINORA Yucatan X8' },
]

type Mode = 'form' | 'preview'

type MissingField =
  | 'equipment'
  | 'accepted'
  | 'bikeModel'
  | 'package'
  | 'dates'
  | 'payment'
  | 'fullName'
  | 'clientDetails'
  | 'signature'

const MISSING_FIELD_ORDER: MissingField[] = [
  'equipment',
  'accepted',
  'bikeModel',
  'package',
  'dates',
  'payment',
  'fullName',
  'clientDetails',
  'signature',
]

function MissingFieldWrap({
  id,
  active,
  hintTick,
  className = '',
  children,
}: {
  id: string
  active: boolean
  hintTick: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!active) {
      el.classList.remove('missing-field-hint')
      return
    }
    el.classList.remove('missing-field-hint')
    void el.offsetWidth
    el.classList.add('missing-field-hint')
  }, [active, hintTick])

  return (
    <div ref={ref} id={id} className={`rounded-xl p-1 ${className}`.trim()}>
      {children}
    </div>
  )
}

export function RegulaminyTab() {
  const { addDocument } = useDocuments()
  const sigRef = useRef<SignatureCanvas>(null)
  const [mode, setMode] = useState<Mode>('form')
  const [equipmentId, setEquipmentId] = useState<EquipmentId | ''>('')
  const [packageName, setPackageName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fullName, setFullName] = useState('')
  const [residentialAddress, setResidentialAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [idDocument, setIdDocument] = useState('')
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([])
  const [accepted, setAccepted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [signSuccessOpen, setSignSuccessOpen] = useState(false)
  const [sigCanvasKey, setSigCanvasKey] = useState(0)
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null)
  const [lockedSignatureUrl, setLockedSignatureUrl] = useState<string | null>(
    null,
  )
  const [filledPreviewText, setFilledPreviewText] = useState('')
  const [equipmentCount, setEquipmentCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [checklistChecked, setChecklistChecked] = useState<Set<string>>(
    () => new Set(),
  )
  const [showMissingHints, setShowMissingHints] = useState(false)
  const [hintTick, setHintTick] = useState(0)

  const days = useMemo(
    () => countInclusiveDays(dateFrom, dateTo),
    [dateFrom, dateTo],
  )

  const price = useMemo(() => {
    if (!equipmentId || !packageName || days < 1) return 0
    return computePrice(equipmentId, packageName, days, equipmentCount)
  }, [equipmentId, packageName, days, equipmentCount])

  const depositPln = useMemo(() => {
    if (!equipmentId) return 0
    return computeDepositPln(equipmentId, equipmentCount)
  }, [equipmentId, equipmentCount])

  const totalPln = useMemo(() => price + depositPln, [price, depositPln])

  const packagesForType = equipmentId
    ? [...PACKAGE_OPTIONS[equipmentId]]
    : []

  const serviceChecklist = equipmentId
    ? getServiceChecklist(equipmentId)
    : null

  const toggleChecklistItem = (id: string) => {
    setChecklistChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const signatureReady = Boolean(sigPreviewUrl || lockedSignatureUrl)

  const bikeOk = equipmentId !== 'e-bike' || bikeModels.length > 0

  const toggleBikeModel = (id: BikeModel) => {
    setBikeModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  const clientDetailsOk =
    residentialAddress.trim().length > 2 &&
    phone.trim().length >= 9 &&
    idDocument.trim().length > 2

  const formReady =
    Boolean(equipmentId) &&
    Boolean(packageName.trim()) &&
    days >= 1 &&
    fullName.trim().length > 2 &&
    clientDetailsOk &&
    accepted &&
    signatureReady &&
    bikeOk &&
    Boolean(paymentMethod)

  const formData = (): RegulationFormData | null => {
    if (!equipmentId) return null
    return {
      equipmentId,
      fullName: fullName.trim(),
      residentialAddress: residentialAddress.trim(),
      phone: phone.trim(),
      idDocument: idDocument.trim(),
      packageName,
      dateFrom,
      dateTo,
      days,
      pricePln: price,
      bikeModels: bikeModels.length > 0 ? bikeModels : undefined,
      equipmentCount,
      paymentMethod: paymentMethod as PaymentMethod,
      depositPln,
    }
  }

  const syncSigPreview = () => {
    const c = sigRef.current
    setSigPreviewUrl(c && !c.isEmpty() ? c.toDataURL('image/png') : null)
  }

  const missingFields = useMemo((): MissingField[] => {
    const missing: MissingField[] = []
    if (!equipmentId) missing.push('equipment')
    if (!accepted) missing.push('accepted')
    if (equipmentId === 'e-bike' && bikeModels.length === 0) missing.push('bikeModel')
    if (!packageName.trim()) missing.push('package')
    if (days < 1) missing.push('dates')
    if (!paymentMethod) missing.push('payment')
    if (fullName.trim().length <= 2) missing.push('fullName')
    if (!clientDetailsOk) missing.push('clientDetails')
    if (!signatureReady) missing.push('signature')
    return missing
  }, [
    equipmentId,
    accepted,
    bikeModels,
    packageName,
    days,
    paymentMethod,
    fullName,
    clientDetailsOk,
    signatureReady,
  ])

  const isMissing = (field: MissingField) =>
    showMissingHints && !formReady && missingFields.includes(field)

  const handleGoPreview = () => {
    if (!formReady || !equipmentId) return
    setShowMissingHints(false)
    const pad = sigRef.current
    if (!pad || pad.isEmpty()) return
    const dataUrl = pad.toDataURL('image/png')
    const data = formData()
    if (!data) return
    setLockedSignatureUrl(dataUrl)
    setSigPreviewUrl(dataUrl)
    setFilledPreviewText(buildFilledRegulation(data))
    setMode('preview')
  }

  const handlePreviewClick = () => {
    if (formReady) {
      handleGoPreview()
      return
    }
    setHintTick((t) => t + 1)
    setShowMissingHints(true)
    const first = MISSING_FIELD_ORDER.find((f) => missingFields.includes(f))
    if (first) {
      requestAnimationFrame(() => {
        document
          .getElementById(`field-${first}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  useEffect(() => {
    if (!showMissingHints) return
    const t = window.setTimeout(() => setShowMissingHints(false), 3000)
    return () => window.clearTimeout(t)
  }, [showMissingHints])

  useEffect(() => {
    if (mode !== 'form' || !lockedSignatureUrl) return
    const id = window.setTimeout(() => {
      const pad = sigRef.current
      if (!pad) return
      pad.fromDataURL(lockedSignatureUrl, {
        ratio: 1,
        width: pad.getCanvas().width,
        height: pad.getCanvas().height,
      })
    }, 80)
    return () => window.clearTimeout(id)
  }, [mode, lockedSignatureUrl, sigCanvasKey])

  const handleEdit = () => {
    if (lockedSignatureUrl) setSigPreviewUrl(lockedSignatureUrl)
    setMode('form')
  }

  const handleConfirmSign = () => {
    if (!equipmentId || !lockedSignatureUrl || !filledPreviewText) return
    const data = formData()
    if (!data) return

    const checklistDone =
      serviceChecklist !== null &&
      isChecklistComplete(serviceChecklist, checklistChecked)

    addDocument({
      equipmentId,
      equipmentLabel: EQUIPMENT_LABELS[equipmentId],
      fullName: data.fullName,
      residentialAddress: data.residentialAddress,
      phone: data.phone,
      idDocument: data.idDocument,
      packageName: data.packageName,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      days: data.days,
      pricePln: data.pricePln,
      signatureDataUrl: lockedSignatureUrl,
      filledRegulationText: buildFilledRegulation(data),
      bikeModels: data.bikeModels,
      equipmentCount: data.equipmentCount,
      paymentMethod: data.paymentMethod,
      depositPln: data.depositPln,
      ...(hasServiceChecklist(equipmentId)
        ? {
            checklistCheckedIds: [...checklistChecked],
            checklistCompleted: checklistDone,
          }
        : {}),
    })

    setSignSuccessOpen(true)
    setMode('form')
    setLockedSignatureUrl(null)
    setFilledPreviewText('')
    sigRef.current?.clear()
    setSigPreviewUrl(null)
    setSigCanvasKey((k) => k + 1)
    setAccepted(false)
    setFullName('')
    setResidentialAddress('')
    setPhone('')
    setIdDocument('')
    setPackageName('')
    setDateFrom('')
    setDateTo('')
    setBikeModels([])
    setEquipmentCount(1)
    setPaymentMethod('')
    setChecklistChecked(new Set())
  }

  const selectClass = `${control} ${selectChevron} ${selectArrow}`

  if (mode === 'preview' && equipmentId && lockedSignatureUrl) {
    const previewData = formData()
    if (!previewData) return null

    return (
      <div className="flex flex-col gap-4">
        <FilledRegulationView
          filledText={filledPreviewText}
          equipmentId={equipmentId}
          formData={previewData}
          signatureDataUrl={lockedSignatureUrl}
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleEdit}
            className="w-full rounded-full border border-white/20 bg-white/10 py-3.5 font-display font-bold text-white transition hover:bg-white/15"
          >
            Edytuj
          </button>
          <button
            type="button"
            onClick={handleConfirmSign}
            className="btn-primary w-full border-0 !py-3.5"
          >
            Podpisz
          </button>
        </div>

        {signSuccessOpen && (
          <SuccessModal onClose={() => setSignSuccessOpen(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <MissingFieldWrap
        id="field-equipment"
        active={isMissing('equipment')}
        hintTick={hintTick}
        className="flex flex-col gap-1.5"
      >
        <label className={label} htmlFor="eq-select">
          Wybierz Regulamin
        </label>
        <select
          id="eq-select"
          className={selectClass}
          value={equipmentId}
          onChange={(e) => {
            const v = e.target.value as EquipmentId | ''
            setEquipmentId(v)
            setPackageName('')
            setBikeModels([])
            setEquipmentCount(1)
            setPaymentMethod('')
            setAccepted(false)
            setChecklistChecked(new Set())
          }}
        >
          <option value="">— wybierz —</option>
          {EQUIPMENT_ORDER.map((id) => (
            <option key={id} value={id}>
              {EQUIPMENT_LABELS[id]}
            </option>
          ))}
        </select>
      </MissingFieldWrap>

      {serviceChecklist && (
        <ServiceChecklistCard
          def={serviceChecklist}
          checkedIds={checklistChecked}
          onToggle={toggleChecklistItem}
        />
      )}

      <MissingFieldWrap
        id="field-accepted"
        active={isMissing('accepted')}
        hintTick={hintTick}
      >
        <label className="flex cursor-pointer gap-2.5 text-sm text-white/85">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-white/30 bg-white/10 text-primary focus:ring-primary"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={!equipmentId}
          />
          <span className="leading-relaxed">
            Potwierdzam zapoznanie się z treścią{' '}
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-primary underline decoration-primary/80 underline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!equipmentId}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setModalOpen(true)
              }}
            >
              REGULAMINU
            </button>{' '}
            oraz akceptuję go w całości.
          </span>
        </label>
      </MissingFieldWrap>

      {equipmentId === 'e-bike' && (
        <MissingFieldWrap
          id="field-bikeModel"
          active={isMissing('bikeModel')}
          hintTick={hintTick}
        >
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className={`${label} w-full`}>
              Model roweru <span className="normal-case">(można wybrać oba)</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BIKE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 transition ${
                    bikeModels.includes(opt.id)
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-white/15 bg-white/10 text-white/90 hover:border-white/25'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[#f7c73b]"
                    checked={bikeModels.includes(opt.id)}
                    onChange={() => toggleBikeModel(opt.id)}
                  />
                  <span className="text-sm font-medium leading-snug">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </MissingFieldWrap>
      )}

      <MissingFieldWrap
        id="field-package"
        active={isMissing('package')}
        hintTick={hintTick}
        className="flex flex-col gap-1.5"
      >
        <label className={label} htmlFor="pkg">
          Pakiet
        </label>
        <select
          id="pkg"
          className={selectClass}
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          disabled={!equipmentId}
        >
          <option value="">— wybierz pakiet —</option>
          {packagesForType.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </MissingFieldWrap>

      <div className="flex w-full flex-col items-center gap-4">
        {equipmentId && (
          <div className="flex w-full flex-col items-center gap-2">
            <span className={`${label} text-center`}>
              {EQUIPMENT_QUANTITY_LABEL[equipmentId]}
            </span>
            <EquipmentCounter
              value={equipmentCount}
              onChange={setEquipmentCount}
              disabled={!equipmentId}
            />
          </div>
        )}

        {equipmentId && (
          <div
            className="h-px w-full bg-primary/35"
            role="separator"
            aria-hidden
          />
        )}

        <MissingFieldWrap
          id="field-dates"
          active={isMissing('dates')}
          hintTick={hintTick}
          className="w-full"
        >
          <fieldset className="m-0 w-full border-0 p-0">
            <legend className="sr-only">Termin</legend>
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className={label}>Termin</span>
                <div className="relative flex flex-nowrap items-center gap-2">
                  <input
                    id="df"
                    type="date"
                    aria-label="Data od"
                    className={dateControl}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className="shrink-0 text-white/45" aria-hidden>
                    —
                  </span>
                  <input
                    id="dt"
                    type="date"
                    aria-label="Data do"
                    className={dateControl}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                  <span
                    className="pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap font-display font-semibold leading-none text-primary"
                    aria-live="polite"
                  >
                    <span className="invisible block select-none" aria-hidden>
                      99 dni
                    </span>
                    <span className="absolute inset-0 flex items-center justify-start">
                      {days > 0
                        ? `${days} ${days === 1 ? 'dzień' : 'dni'}`
                        : null}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </fieldset>
        </MissingFieldWrap>
      </div>

      <div className="glass-card flex flex-col gap-3 rounded-xl px-4 py-3">
        {price > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="font-sophisticated text-sm font-semibold text-white/75">
              Wynajem
            </span>
            <span className="font-display text-base font-semibold text-white/90">
              {price.toFixed(2)} PLN
            </span>
          </div>
        )}
        {depositPln > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="font-sophisticated text-sm font-semibold text-white/75">
              Kaucja zwrotna
              {equipmentCount > 1 ? ` (${equipmentCount} ×)` : ''}
            </span>
            <span className="font-display text-base font-semibold text-white/90">
              {depositPln.toFixed(0)} PLN
            </span>
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 ${
            price > 0 || depositPln > 0
              ? 'border-t border-primary/30 pt-3'
              : ''
          }`}
        >
          <span className="font-sophisticated text-sm font-semibold text-primary">
            Kwota całkowita do zapłaty
          </span>
          <span className="font-display text-xl font-bold text-primary">
            {totalPln > 0 ? `${totalPln.toFixed(2)} PLN` : '—'}
          </span>
        </div>
      </div>

      <MissingFieldWrap
        id="field-payment"
        active={isMissing('payment')}
        hintTick={hintTick}
        className="flex flex-col gap-2"
      >
        <span className={label}>Forma płatności</span>
        <PaymentMethodPicker
          value={paymentMethod}
          onChange={setPaymentMethod}
          disabled={!equipmentId}
        />
      </MissingFieldWrap>

      <MissingFieldWrap
        id="field-fullName"
        active={isMissing('fullName')}
        hintTick={hintTick}
        className="flex flex-col gap-1.5"
      >
        <label className={label} htmlFor="fn">
          Imię i nazwisko
        </label>
        <input
          id="fn"
          type="text"
          className={control}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jan Kowalski"
        />
      </MissingFieldWrap>

      <MissingFieldWrap
        id="field-clientDetails"
        active={isMissing('clientDetails')}
        hintTick={hintTick}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="addr">
            Adres zamieszkania
          </label>
          <input
            id="addr"
            type="text"
            className={control}
            autoComplete="street-address"
            value={residentialAddress}
            onChange={(e) => setResidentialAddress(e.target.value)}
            placeholder="ul. Przykładowa 1, 40-000 Katowice"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="phone">
            Nr telefonu
          </label>
          <input
            id="phone"
            type="tel"
            className={control}
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="500 000 000"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="id-doc">
            Nr dokumentu tożsamości
          </label>
          <input
            id="id-doc"
            type="text"
            className={control}
            value={idDocument}
            onChange={(e) => setIdDocument(e.target.value)}
            placeholder="ABC123456 lub PESEL"
          />
        </div>
      </MissingFieldWrap>

      <MissingFieldWrap
        id="field-signature"
        active={isMissing('signature')}
        hintTick={hintTick}
        className="flex flex-col gap-1.5"
      >
        <span className={label}>Podpis</span>
        <div className="flex flex-col gap-2">
          <SignatureCanvas
            key={sigCanvasKey}
            ref={sigRef}
            penColor="#0A0A0A"
            backgroundColor="#ffffff"
            canvasProps={{
              className:
                'h-[200px] w-full touch-none rounded-xl border border-white/15 md:h-[220px]',
              'aria-label': 'Pole podpisu',
            }}
            onEnd={syncSigPreview}
          />
          <button
            type="button"
            className="self-start text-sm font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => {
              sigRef.current?.clear()
              setSigPreviewUrl(null)
              setLockedSignatureUrl(null)
              setSigCanvasKey((k) => k + 1)
            }}
          >
            Wyczyść podpis
          </button>
        </div>
      </MissingFieldWrap>

      <button
        type="button"
        aria-disabled={!formReady}
        onClick={handlePreviewClick}
        className={
          formReady
            ? 'btn-primary w-full border-0 !py-3.5'
            : 'w-full rounded-full border border-white/10 bg-white/10 py-3.5 font-display font-bold text-white/40 transition hover:border-primary/40 hover:bg-white/15'
        }
      >
        PODGLĄD &amp; PODPIS
      </button>

      <RegulaminModal
        equipmentId={equipmentId || null}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {signSuccessOpen && (
        <SuccessModal onClose={() => setSignSuccessOpen(false)} />
      )}
    </div>
  )
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-success-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Zamknij"
      />
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-white/15 bg-graphite-800 p-6 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <CircleCheck
            className="size-14 text-primary"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <h2
          id="sign-success-title"
          className="mb-3 text-center font-display text-xl font-bold text-primary"
        >
          Dokument podpisany
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-white/85">
          Pomyślnie podpisano dokument. Znajdziesz go w zakładce{' '}
          <span className="font-semibold text-white">Dokumenty</span> — możesz tam pobrać PDF.
        </p>
        <button
          type="button"
          className="btn-primary mx-auto block w-full max-w-xs border-0 !py-3"
          onClick={onClose}
        >
          Rozumiem
        </button>
      </div>
    </div>
  )
}
