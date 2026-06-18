import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import type { EquipmentId, PaymentMethod } from '../types'
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_ORDER,
  PACKAGE_OPTIONS,
} from '../data/packages'
import {
  emailValidationMessage,
  formatPhoneInput,
  isValidClientEmail,
  isValidPolishPhone,
  normalizePhoneDigits,
  phoneValidationMessage,
} from '../lib/clientContactValidation'
import {
  formatPostalCodeInput,
  invoiceValidationMessage,
  isInvoiceFormComplete,
  normalizeNip,
} from '../lib/invoiceValidation'
import { countInclusiveDays } from '../lib/dates'
import { computePrice } from '../lib/pricing'
import { buildFilledRegulation, type RegulationFormData } from '../lib/fillRegulation'
import { BIKE_MODEL_OPTIONS, sumBikeModelCounts } from '../data/bikeModels'
import type { BikeModel, BikeModelCounts } from '../types'
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

type Mode = 'form' | 'preview'

type MissingField =
  | 'equipment'
  | 'accepted'
  | 'bikeModel'
  | 'package'
  | 'dates'
  | 'payment'
  | 'invoice'
  | 'name'
  | 'phone'
  | 'email'
  | 'clientDetails'
  | 'signature'
  | 'issuer'

const MISSING_FIELD_ORDER: MissingField[] = [
  'equipment',
  'accepted',
  'bikeModel',
  'package',
  'dates',
  'payment',
  'invoice',
  'name',
  'phone',
  'email',
  'clientDetails',
  'signature',
  'issuer',
]

const fieldErrorClass = 'text-xs text-red-400'

function missingFieldsLabel(count: number): string {
  if (count === 1) return 'Pozostało 1 obowiązkowe pole do uzupełnienia'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `Pozostały ${count} obowiątkowe pola do uzupełnienia`
  }
  return `Pozostało ${count} obowiązkowych pól do uzupełnienia`
}

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
    <div
      ref={ref}
      id={id}
      className={`rounded-xl p-1 ${active ? 'missing-field-active' : ''} ${className}`.trim()}
    >
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [residentialAddress, setResidentialAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [idDocument, setIdDocument] = useState('')
  const [pesel, setPesel] = useState('')
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([])
  const [bikeModelCounts, setBikeModelCounts] = useState<BikeModelCounts>({})
  const [accepted, setAccepted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [signSuccessOpen, setSignSuccessOpen] = useState(false)
  const [sigCanvasKey, setSigCanvasKey] = useState(0)
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null)
  const [issuerFirstName, setIssuerFirstName] = useState('')
  const [issuerLastName, setIssuerLastName] = useState('')
  const [lockedSignatureUrl, setLockedSignatureUrl] = useState<string | null>(
    null,
  )
  const [filledPreviewText, setFilledPreviewText] = useState('')
  const [equipmentCount, setEquipmentCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [wantsInvoice, setWantsInvoice] = useState(false)
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('')
  const [invoiceNip, setInvoiceNip] = useState('')
  const [invoiceCity, setInvoiceCity] = useState('')
  const [invoiceStreet, setInvoiceStreet] = useState('')
  const [invoiceUnit, setInvoiceUnit] = useState('')
  const [invoicePostalCode, setInvoicePostalCode] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [checklistChecked, setChecklistChecked] = useState<Set<string>>(
    () => new Set(),
  )
  const [showMissingHints, setShowMissingHints] = useState(false)
  const [hintTick, setHintTick] = useState(0)

  const days = useMemo(
    () => countInclusiveDays(dateFrom, dateTo),
    [dateFrom, dateTo],
  )

  const activeEquipmentCount = useMemo(() => {
    if (equipmentId === 'e-bike') {
      return sumBikeModelCounts(bikeModelCounts, bikeModels, 1)
    }
    return equipmentCount
  }, [equipmentId, bikeModelCounts, bikeModels, equipmentCount])

  const packagePrice = useMemo(() => {
    if (!equipmentId || !packageName || days < 1) return 0
    return computePrice(equipmentId, packageName, days, activeEquipmentCount)
  }, [equipmentId, packageName, days, activeEquipmentCount])

  const price = packagePrice

  const depositPln = useMemo(() => {
    if (!equipmentId) return 0
    return computeDepositPln(equipmentId, activeEquipmentCount)
  }, [equipmentId, activeEquipmentCount])

  const totalPln = useMemo(() => {
    return packagePrice + depositPln
  }, [packagePrice, depositPln])

  const showTotalAmount = totalPln > 0

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

  const bikeOk =
    equipmentId !== 'e-bike' ||
    (bikeModels.length > 0 &&
      bikeModels.every((m) => (bikeModelCounts[m] ?? 0) >= 1))

  const toggleBikeModel = (id: BikeModel) => {
    setBikeModels((prev) => {
      if (prev.includes(id)) {
        setBikeModelCounts((counts) => {
          const next = { ...counts }
          delete next[id]
          return next
        })
        return prev.filter((m) => m !== id)
      }
      setBikeModelCounts((counts) => ({ ...counts, [id]: 1 }))
      return [...prev, id]
    })
  }

  const peselDigits = pesel.replace(/\D/g, '')
  const phoneOk = isValidPolishPhone(phone)
  const emailOk = isValidClientEmail(clientEmail)

  const phoneError = phoneValidationMessage(phone)
  const emailError = emailValidationMessage(clientEmail)

  const invoiceFields = useMemo(
    () => ({
      wantsInvoice,
      invoiceCompanyName,
      invoiceNip,
      invoiceCity,
      invoiceStreet,
      invoiceUnit,
      invoicePostalCode,
      invoiceEmail,
    }),
    [
      wantsInvoice,
      invoiceCompanyName,
      invoiceNip,
      invoiceCity,
      invoiceStreet,
      invoiceUnit,
      invoicePostalCode,
      invoiceEmail,
    ],
  )

  const invoiceOk = isInvoiceFormComplete(invoiceFields)
  const invoiceError = invoiceValidationMessage(invoiceFields)

  const invoicePayload = () => ({
    wantsInvoice: Boolean(wantsInvoice),
    invoiceCompanyName: invoiceCompanyName.trim(),
    invoiceNip: normalizeNip(invoiceNip),
    invoiceCity: invoiceCity.trim(),
    invoiceStreet: invoiceStreet.trim(),
    invoiceUnit: invoiceUnit.trim(),
    invoicePostalCode: invoicePostalCode.trim(),
    invoiceEmail: invoiceEmail.trim().toLowerCase(),
  })

  const clientDetailsOk =
    residentialAddress.trim().length > 2 &&
    idDocument.trim().length > 2 &&
    peselDigits.length === 11

  const formReady =
    Boolean(equipmentId) &&
    Boolean(packageName.trim()) &&
    days >= 1 &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    phoneOk &&
    emailOk &&
    clientDetailsOk &&
    accepted &&
    signatureReady &&
    issuerFirstName.trim().length >= 2 &&
    issuerLastName.trim().length >= 2 &&
    bikeOk &&
    Boolean(paymentMethod) &&
    invoiceOk

  const formData = (): RegulationFormData | null => {
    if (!equipmentId) return null
    return {
      equipmentId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      residentialAddress: residentialAddress.trim(),
      phone: normalizePhoneDigits(phone),
      clientEmail: clientEmail.trim().toLowerCase(),
      idDocument: idDocument.trim(),
      pesel: peselDigits,
      packageName,
      dateFrom,
      dateTo,
      days,
      pricePln: price,
      bikeModels: bikeModels.length > 0 ? bikeModels : undefined,
      bikeModelCounts:
        equipmentId === 'e-bike' && bikeModels.length > 0
          ? bikeModelCounts
          : undefined,
      equipmentCount: activeEquipmentCount,
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
    if (!invoiceOk) missing.push('invoice')
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      missing.push('name')
    }
    if (!phoneOk) missing.push('phone')
    if (!emailOk) missing.push('email')
    if (!clientDetailsOk) missing.push('clientDetails')
    if (!signatureReady) missing.push('signature')
    if (issuerFirstName.trim().length < 2 || issuerLastName.trim().length < 2) {
      missing.push('issuer')
    }
    return missing
  }, [
    equipmentId,
    accepted,
    bikeModels,
    bikeModelCounts,
    packageName,
    days,
    paymentMethod,
    invoiceOk,
    firstName,
    lastName,
    phoneOk,
    emailOk,
    clientDetailsOk,
    signatureReady,
    issuerFirstName,
    issuerLastName,
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

  const revealMissingHints = useCallback(() => {
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
  }, [missingFields])

  const handlePreviewClick = () => {
    if (formReady) {
      handleGoPreview()
      return
    }
    revealMissingHints()
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

  const handleConfirmSign = async () => {
    if (!equipmentId || !lockedSignatureUrl || !filledPreviewText) return
    const data = formData()
    if (!data) return

    const checklistDone =
      serviceChecklist !== null &&
      isChecklistComplete(serviceChecklist, checklistChecked)

    try {
      await addDocument({
        equipmentId,
        equipmentLabel: EQUIPMENT_LABELS[equipmentId],
        firstName: data.firstName,
        lastName: data.lastName,
        residentialAddress: data.residentialAddress,
        phone: data.phone,
        clientEmail: data.clientEmail ?? clientEmail.trim().toLowerCase(),
        idDocument: data.idDocument,
        pesel: data.pesel,
        packageName: data.packageName,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        days: data.days,
        pricePln: data.pricePln,
        signatureDataUrl: lockedSignatureUrl,
        issuerFirstName: issuerFirstName.trim(),
        issuerLastName: issuerLastName.trim(),
        filledRegulationText: filledPreviewText,
        bikeModels: data.bikeModels,
        bikeModelCounts: data.bikeModelCounts,
        equipmentCount: data.equipmentCount,
        paymentMethod: data.paymentMethod,
        depositPln: data.depositPln,
        ...invoicePayload(),
        ...(hasServiceChecklist(equipmentId)
          ? {
              checklistCheckedIds: [...checklistChecked],
              checklistCompleted: checklistDone,
            }
          : {}),
      })
    } catch (e) {
      console.error('Nie udało się zapisać dokumentu:', e)
      return
    }

    setSignSuccessOpen(true)
    setMode('form')
    setLockedSignatureUrl(null)
    setFilledPreviewText('')
    sigRef.current?.clear()
    setSigPreviewUrl(null)
    setSigCanvasKey((k) => k + 1)
    setIssuerFirstName('')
    setIssuerLastName('')
    setAccepted(false)
    setFirstName('')
    setLastName('')
    setResidentialAddress('')
    setPhone('')
    setClientEmail('')
    setIdDocument('')
    setPesel('')
    setPackageName('')
    setDateFrom('')
    setDateTo('')
    setBikeModels([])
    setBikeModelCounts({})
    setEquipmentCount(1)
    setPaymentMethod('')
    setWantsInvoice(false)
    setInvoiceCompanyName('')
    setInvoiceNip('')
    setInvoiceCity('')
    setInvoiceStreet('')
    setInvoiceUnit('')
    setInvoicePostalCode('')
    setInvoiceEmail('')
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
            setBikeModelCounts({})
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
              className="border-0 bg-transparent p-0 text-base font-extrabold uppercase tracking-wide text-primary underline decoration-2 decoration-primary underline-offset-3 disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
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
              {BIKE_MODEL_OPTIONS.map((opt) => (
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
                    className="size-4 accent-primary"
                    checked={bikeModels.includes(opt.id)}
                    onChange={() => toggleBikeModel(opt.id)}
                  />
                  <span className="text-sm font-medium leading-snug">{opt.label}</span>
                </label>
              ))}
            </div>
            {bikeModels.length > 0 && (
              <div className="mt-3 flex flex-col gap-5">
                {bikeModels.map((modelId) => {
                  const opt = BIKE_MODEL_OPTIONS.find((o) => o.id === modelId)!
                  return (
                    <div
                      key={modelId}
                      className="flex flex-col items-center gap-2"
                    >
                      <span className={`${label} text-center leading-snug`}>
                        Liczba rowerów {opt.label}
                      </span>
                      <EquipmentCounter
                        value={bikeModelCounts[modelId] ?? 1}
                        onChange={(v) =>
                          setBikeModelCounts((prev) => ({
                            ...prev,
                            [modelId]: v,
                          }))
                        }
                      />
                    </div>
                  )
                })}
              </div>
            )}
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
        {equipmentId && equipmentId !== 'e-bike' && (
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
        {packagePrice > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="font-sophisticated text-sm font-semibold text-white/75">
              Wynajem
            </span>
            <span className="font-display text-base font-semibold text-white/90">
              {packagePrice.toFixed(2)} PLN
            </span>
          </div>
        )}
        {depositPln > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="font-sophisticated text-sm font-semibold text-white/75">
              Kaucja zwrotna
              {activeEquipmentCount > 1 ? ` (${activeEquipmentCount} ×)` : ''}
            </span>
            <span className="font-display text-base font-semibold text-white/90">
              {depositPln.toFixed(0)} PLN
            </span>
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 ${
            showTotalAmount ||
            packagePrice > 0 ||
            depositPln > 0
              ? 'border-t border-primary/30 pt-3'
              : ''
          }`}
        >
          <span className="font-sophisticated text-sm font-semibold text-primary">
            Kwota całkowita do zapłaty
          </span>
          <span className="font-display text-xl font-bold text-primary">
            {showTotalAmount ? `${totalPln.toFixed(2)} PLN` : '—'}
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
        id="field-invoice"
        active={isMissing('invoice')}
        hintTick={hintTick}
        className="flex flex-col gap-4"
      >
        <label className="flex cursor-pointer items-center gap-3 text-base font-semibold text-white/95">
          <input
            type="checkbox"
            className="size-4 shrink-0 cursor-pointer rounded border border-primary bg-primary/25 text-primary accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            checked={wantsInvoice}
            onChange={(e) => {
              setWantsInvoice(e.target.checked)
              if (!e.target.checked) {
                setInvoiceCompanyName('')
                setInvoiceNip('')
                setInvoiceCity('')
                setInvoiceStreet('')
                setInvoiceUnit('')
                setInvoicePostalCode('')
                setInvoiceEmail('')
              }
            }}
            disabled={!equipmentId}
          />
          Chcę otrzymać fakturę
        </label>

        {wantsInvoice && (
          <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-white/5 p-4">
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="invoiceCompanyName">
                Nazwa firmy
              </label>
              <input
                id="invoiceCompanyName"
                type="text"
                className={control}
                value={invoiceCompanyName}
                onChange={(e) => setInvoiceCompanyName(e.target.value)}
                placeholder="Nazwa spółki / działalności"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="invoiceNip">
                NIP
              </label>
              <input
                id="invoiceNip"
                type="text"
                inputMode="numeric"
                className={control}
                value={invoiceNip}
                onChange={(e) =>
                  setInvoiceNip(normalizeNip(e.target.value))
                }
                placeholder="0000000000"
                maxLength={10}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="invoiceCity">
                  Miasto
                </label>
                <input
                  id="invoiceCity"
                  type="text"
                  className={control}
                  value={invoiceCity}
                  onChange={(e) => setInvoiceCity(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="invoicePostalCode">
                  Kod pocztowy
                </label>
                <input
                  id="invoicePostalCode"
                  type="text"
                  inputMode="numeric"
                  className={control}
                  value={invoicePostalCode}
                  onChange={(e) =>
                    setInvoicePostalCode(formatPostalCodeInput(e.target.value))
                  }
                  placeholder="00-000"
                  maxLength={6}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={label} htmlFor="invoiceStreet">
                  Ulica i numer
                </label>
                <input
                  id="invoiceStreet"
                  type="text"
                  className={control}
                  value={invoiceStreet}
                  onChange={(e) => setInvoiceStreet(e.target.value)}
                  placeholder="ul. Przykładowa 12"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="invoiceUnit">
                  Lokal
                </label>
                <input
                  id="invoiceUnit"
                  type="text"
                  className={control}
                  value={invoiceUnit}
                  onChange={(e) => setInvoiceUnit(e.target.value)}
                  placeholder="np. 4 (opcjonalnie)"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="invoiceEmail">
                Adres e-mail do wysłania faktury (opcjonalnie)
              </label>
              <input
                id="invoiceEmail"
                type="email"
                autoComplete="email"
                className={control}
                value={invoiceEmail}
                onChange={(e) => setInvoiceEmail(e.target.value)}
                placeholder="faktury@firma.pl"
              />
            </div>
            {invoiceError && (
              <p className="text-xs text-red-400">{invoiceError}</p>
            )}
          </div>
        )}
      </MissingFieldWrap>

      <MissingFieldWrap
        id="field-name"
        active={isMissing('name')}
        hintTick={hintTick}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="firstName">
            Imię
          </label>
          <input
            id="firstName"
            type="text"
            className={control}
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jan"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="lastName">
            Nazwisko
          </label>
          <input
            id="lastName"
            type="text"
            className={control}
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Kowalski"
            required
          />
        </div>
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
        <MissingFieldWrap
          id="field-phone"
          active={isMissing('phone')}
          hintTick={hintTick}
          className="flex flex-col gap-1.5"
        >
          <label className={label} htmlFor="phone">
            Nr telefonu
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={control}
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            placeholder="+48 500 123 456"
            aria-invalid={Boolean(phoneError && (showMissingHints || phone.trim()))}
            aria-describedby={phoneError ? 'phone-error' : undefined}
          />
          {phoneError && (showMissingHints || phone.trim()) && (
            <p id="phone-error" className={fieldErrorClass} role="alert">
              {phoneError}
            </p>
          )}
        </MissingFieldWrap>
        <MissingFieldWrap
          id="field-email"
          active={isMissing('email')}
          hintTick={hintTick}
          className="flex flex-col gap-1.5"
        >
          <label className={label} htmlFor="client-email">
            E-mail klienta
          </label>
          <input
            id="client-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={control}
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            onBlur={() =>
              setClientEmail((v) => v.trim().toLowerCase())
            }
            placeholder="klient@example.com"
            aria-invalid={Boolean(emailError && (showMissingHints || clientEmail.trim()))}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (showMissingHints || clientEmail.trim()) && (
            <p id="email-error" className={fieldErrorClass} role="alert">
              {emailError}
            </p>
          )}
        </MissingFieldWrap>
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
            placeholder="np. ABC123456"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="pesel">
            PESEL
          </label>
          <input
            id="pesel"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={control}
            value={pesel}
            onChange={(e) => setPesel(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="00000000000"
            maxLength={11}
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

      <MissingFieldWrap
        id="field-issuer"
        active={isMissing('issuer')}
        hintTick={hintTick}
        className="flex flex-col gap-2"
      >
        <span className={label}>Osoba wydająca sprzęt</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="issuerFirstName">
              Imię
            </label>
            <input
              id="issuerFirstName"
              type="text"
              className={control}
              autoComplete="off"
              value={issuerFirstName}
              onChange={(e) => setIssuerFirstName(e.target.value)}
              placeholder="Jan"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="issuerLastName">
              Nazwisko
            </label>
            <input
              id="issuerLastName"
              type="text"
              className={control}
              autoComplete="off"
              value={issuerLastName}
              onChange={(e) => setIssuerLastName(e.target.value)}
              placeholder="Kowalski"
              required
            />
          </div>
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

      {!formReady && missingFields.length > 0 && (
        <button
          type="button"
          onClick={revealMissingHints}
          className="missing-count-pulse -mt-1 w-full cursor-pointer text-center text-xs font-medium text-primary transition hover:underline"
        >
          {missingFieldsLabel(missingFields.length)}
        </button>
      )}

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
      <div className="relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-primary/25 bg-graphite-800 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-transparent px-6 py-5">
          <div className="mb-3 flex justify-center">
            <CircleCheck
              className="size-14 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <h2
            id="sign-success-title"
            className="text-center font-display text-xl font-bold text-primary"
          >
            Dokument podpisany
          </h2>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5">
          <p className="text-center text-sm leading-relaxed text-white/85">
            Pomyślnie podpisano dokument. Znajdziesz go w zakładce{' '}
            <span className="font-semibold text-white">Dokumenty</span> — możesz tam
            pobrać PDF.
          </p>
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-center text-sm leading-relaxed text-white/70">
            W pełnej wersji aplikacji kopia dokumentu zostanie wysłana e-mailem do
            obsługi oraz do klienta.
          </p>
          <button
            type="button"
            className="btn-primary mt-1 w-full border-0 !py-3"
            onClick={onClose}
          >
            Rozumiem
          </button>
        </div>
      </div>
    </div>
  )
}
