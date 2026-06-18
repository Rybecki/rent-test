import {
  BIKE_MODEL_LABELS,
  normalizeBikeModelCounts,
  sumBikeModelCounts,
} from '../data/bikeModels'
import { formatFullName } from './personName'
import type { BikeModel, EquipmentId, PaymentMethod } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'
import { getRegulationText } from '../data/regulations'

export interface RegulationFormData {
  equipmentId: EquipmentId
  firstName: string
  lastName: string
  residentialAddress: string
  phone: string
  clientEmail?: string
  idDocument: string
  pesel: string
  packageName: string
  dateFrom: string
  dateTo: string
  days: number
  pricePln: number
  bikeModels?: BikeModel[]
  bikeModelCounts?: Partial<Record<BikeModel, number>>
  equipmentCount: number
  paymentMethod: PaymentMethod
  depositPln: number
}

function buildRentalPaymentMarks(method: PaymentMethod): string {
  const keys: PaymentMethod[] = ['cash', 'card', 'prepayment']
  return keys
    .map((k) => `${k === method ? '[X]' : '[]'} ${PAYMENT_METHOD_LABELS[k]}`)
    .join(' ')
}

function buildDepositCollectionMarks(method: PaymentMethod): string {
  const cash = method === 'cash' ? '[X]' : '[]'
  const preauth = method !== 'cash' ? '[X]' : '[]'
  return `${cash} Gotówka ${preauth} Preautoryzacja`
}

function formatDatePl(iso: string): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pl-PL')
}

const FOOTER_SPLIT: Record<EquipmentId, RegExp> = {
  'e-bike': /\n6\. PODPISY\n/,
  kajaki: /\nPodpis Wynajmującego\s+Podpis Najemcy\n/,
  'vip-bus': /\nPodpis Wynajmującego:\s*/,
  autolaweta: /\nPodpisy stron:\s*/,
  dmuchance: /\n\(Wynajmujący\)\s+\(Najemca\)/,
}

export function fillRegulationText(
  raw: string,
  data: RegulationFormData,
): string {
  let t = raw
  const name = formatFullName(data.firstName, data.lastName)
  const address = data.residentialAddress.trim()
  const phone = data.phone.trim()
  const idDoc = data.idDocument.trim()
  const pesel = data.pesel.trim().replace(/\D/g, '')
  const from = formatDatePl(data.dateFrom)
  const to = formatDatePl(data.dateTo)
  const price = data.pricePln.toFixed(2)
  const pkg = data.packageName

  t = t.replace(/Imię i nazwisko:\s*_{3,}/gi, `Imię i nazwisko: ${name}`)
  t = t.replace(
    /Imię i nazwisko \/ firma:\s*_{3,}/gi,
    `Imię i nazwisko / firma: ${name}`,
  )
  t = t.replace(/Imię i Nazwisko:\s*\.{3,}/gi, `Imię i Nazwisko: ${name}`)

  t = t.replace(
    /Nr dokumentu tożsamości \(lub PESEL\):\s*_{3,}/gi,
    `Nr dokumentu tożsamości: ${idDoc}, PESEL: ${pesel}`,
  )
  t = t.replace(
    /Nr dokumentu tożsamości \(PESEL\/Paszport\):\s*_{3,}/gi,
    `Nr dokumentu tożsamości: ${idDoc}, PESEL: ${pesel}`,
  )
  t = t.replace(/Adres zamieszkania:\s*_{3,}/gi, `Adres zamieszkania: ${address}`)
  t = t.replace(/Numer telefonu:\s*_{3,}/gi, `Numer telefonu: ${phone}`)
  t = t.replace(/Telefon:\s*_{3,}/g, `Telefon: ${phone}`)
  t = t.replace(/Adres:\s*_{3,}/g, `Adres: ${address}`)
  t = t.replace(
    /Nr dokumentu tożsamości:\s*_{3,}/gi,
    `Nr dokumentu tożsamości: ${idDoc}`,
  )
  t = t.replace(
    /PESEL:\s*\.+\s*,\s*Nr tel:\s*\.+/,
    `PESEL: ${pesel}, Nr tel: ${phone}`,
  )
  t = t.replace(
    /Adres:\s*\.+(?=,\s*zwanym)/,
    `Adres: ${address}`,
  )
  t = t.replace(
    /Najemca:\s*\.{20,}/,
    `Najemca: ${name}, ${address}, tel. ${phone}, dok. tożs. ${idDoc}, PESEL: ${pesel}`,
  )
  t = t.replace(
    /Zleceniodawca:\s*_{3,}/,
    `Zleceniodawca: ${name}, ${address}, tel. ${phone}, dok. ${idDoc}`,
  )

  t = t.replace(
    /Data i godzina wydania:\s*_{3,}/,
    `Data i godzina wydania: ${from}`,
  )
  t = t.replace(
    /Planowana data i godzina zwrotu:\s*_{3,}/,
    `Planowana data i godzina zwrotu: ${to}`,
  )
  t = t.replace(
    /Data zawarcia umowy:\s*_{3,}/,
    `Data zawarcia umowy: ${from}`,
  )
  t = t.replace(
    /Data i miejsce zawarcia umowy:\s*_{3,}/,
    `Data zawarcia umowy: ${from}`,
  )
  t = t.replace(
    /Zawarta w dniu \.+\s+pomiędzy:/,
    `Zawarta w dniu ${from} pomiędzy:`,
  )
  t = t.replace(
    /Okres najmu: od dnia \.+\s+godz\. \.+\s+do dnia \.+\s+godz\. \./,
    `Okres najmu: od dnia ${from} godz. ______ do dnia ${to} godz. ______`,
  )
  t = t.replace(/Termin:\s*_{3,}/, `Termin: ${from} – ${to}`)
  t = t.replace(/Pakiet:\s*_{3,}/g, `Pakiet: ${pkg}`)
  t = t.replace(
    /Data i godziny:\s*_{3,}/,
    `Data i godziny: ${from} – ${to}`,
  )
  t = t.replace(
    /Opłata za wynajem:\s*_{3,}\s*PLN/,
    `Opłata za wynajem: ${price} PLN`,
  )
  t = t.replace(
    /Cena za wynajem wynosi:\s*\.+\s*zł brutto/,
    `Cena za wynajem wynosi: ${price} zł brutto`,
  )
  t = t.replace(
    /łączną kwotę wynajmu brutto na:\s*\.+\s*zł/,
    `łączną kwotę wynajmu brutto na: ${price} zł`,
  )
  t = t.replace(/Cena:\s*_{3,}/, `Cena: ${price} PLN`)
  t = t.replace(/Cena netto:\s*_{3,}\s*PLN/, `Cena netto: ${price} PLN`)
  t = t.replace(
    /Cena:\s*([\d.,]+)\s*PLN(?!\s*—\s*płatność)/,
    `Cena: $1 PLN — płatność: ${PAYMENT_METHOD_LABELS[data.paymentMethod]}`,
  )

  const bikeModels = data.bikeModels ?? []
  const bikeCounts =
    data.equipmentId === 'e-bike'
      ? normalizeBikeModelCounts(
          bikeModels,
          data.bikeModelCounts,
          data.equipmentCount,
        )
      : {}
  const count = Math.max(
    1,
    data.equipmentId === 'e-bike'
      ? sumBikeModelCounts(bikeCounts, bikeModels, data.equipmentCount)
      : data.equipmentCount,
  )
  const countStr = String(count)
  const deposit =
    data.depositPln > 0 ? data.depositPln.toFixed(0) : '0'
  const payMarks = buildRentalPaymentMarks(data.paymentMethod)
  const depMarks = buildDepositCollectionMarks(data.paymentMethod)

  t = t.replace(/\(szt\. \.+\)/g, `(szt. ${countStr})`)

  t = t.replace(
    /\(opłacono:\s*(?:\[[Xx ]?\]\s*)?(?:Gotówka\s*)?(?:\[[Xx ]?\]\s*)?(?:Karta\/BLIK\s*)?(?:\[[Xx ]?\]\s*)?(?:Przedpłata\s*)?\)/gi,
    `(opłacono: ${payMarks})`,
  )

  t = t.replace(
    /Kaucja zwrotna:\s*[\d._]+\s*PLN\s*\(pobrano:[^)]+\)/i,
    `Kaucja zwrotna: ${deposit} PLN (pobrano: ${depMarks})`,
  )
  t = t.replace(
    /Kaucja zwrotna:\s*_{3,}\s*PLN\s*\(pobrano:[^)]+\)/i,
    `Kaucja zwrotna: ${deposit} PLN (pobrano: ${depMarks})`,
  )

  t = t.replace(
    /3\. Kaucja zwrotna w wysokości\s*\.+\s*zł/,
    `3. Kaucja zwrotna w wysokości ${deposit} zł`,
  )

  const gotowkaMark = data.paymentMethod === 'cash' ? '[X]' : '[ ]'
  const przelewMark = data.paymentMethod !== 'cash' ? '[X]' : '[ ]'
  t = t.replace(
    /3\. Łączna należność płatna jest:\s*\[[ Xx]?\]\s*Gotówką\s*\/\s*\[[ Xx]?\]\s*Przelewem\./,
    `3. Łączna należność płatna jest: ${gotowkaMark} Gotówką / ${przelewMark} Przelewem.`,
  )

  t = t.replace(
    /Sposób płatności:\s*_{3,}/,
    `Sposób płatności: ${PAYMENT_METHOD_LABELS[data.paymentMethod]}`,
  )

  if (data.equipmentId === 'e-bike') {
    t = t.replace(
      /Wynajmujący oddaje do używania Najemcy rower elektryczny:/,
      `Wynajmujący oddaje do używania Najemcy rower(y) elektryczne (liczba: ${countStr}):`,
    )
  }

  if (data.equipmentId === 'e-bike') {
    const krossN = bikeCounts.kross ?? 0
    const winoraN = bikeCounts.winora ?? 0
    t = t.replace(
      /\[\]\s*KROSS Influx Hybrid 1\.0 \(Nr ramy: _+\)/,
      `${krossN > 0 ? '[X]' : '[]'} ${BIKE_MODEL_LABELS.kross} (liczba: ${krossN}) (Nr ramy: ______________________)`,
    )
    t = t.replace(
      /\[\]\s*WINORA Yucatan X8 \(Nr ramy: _+\)/,
      `${winoraN > 0 ? '[X]' : '[]'} ${BIKE_MODEL_LABELS.winora} (liczba: ${winoraN}) (Nr ramy: ______________________)`,
    )
  }

  t = t.replace(
    /Wynajmujący:\s*_{3,}\s+Najemca:\s*_{3,}/,
    `Wynajmujący: _____________________ Najemca: ${name}`,
  )
  t = t.replace(
    /Podpis Wynajmującego:\s*_{3,}\s+Podpis Zamawiającego:\s*_{3,}/,
    `Podpis Wynajmującego: ____________________ Podpis Zamawiającego: ${name}`,
  )
  t = t.replace(/Podpisy stron:\s*_{3,}/, `Podpisy stron: ${name}`)

  return t
}

export function buildFilledRegulation(data: RegulationFormData): string {
  const raw = getRegulationText(data.equipmentId)
  return fillRegulationText(raw, data)
}

export function splitRegulationForPreview(
  filled: string,
  equipmentId: EquipmentId,
): { body: string; footer: string } {
  const re = FOOTER_SPLIT[equipmentId]
  const m = re.exec(filled)
  if (m?.index != null && m.index >= 0) {
    return {
      body: filled.slice(0, m.index).trimEnd(),
      footer: filled.slice(m.index).trimStart(),
    }
  }
  return { body: filled.trimEnd(), footer: '' }
}

export function splitFooterForSignature(footer: string): {
  beforeSignature: string
  najemcaLine: string | null
  afterSignature: string
} {
  const lines = footer.split('\n')
  let najemcaIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (
      /Najemca:\s*[^_]/i.test(line) ||
      /Podpis Zamawiającego:\s*[^_]/i.test(line) ||
      (/\(Najemca\)/.test(line) && !line.includes('___'))
    ) {
      najemcaIdx = i
      break
    }
    if (/Podpis Najemcy/i.test(line) && !/_{5,}/.test(line)) {
      najemcaIdx = i
      break
    }
  }

  if (najemcaIdx === -1) {
    const podpisIdx = lines.findIndex((l) => /Podpis Najemcy/i.test(l))
    if (podpisIdx >= 0) {
      return {
        beforeSignature: lines.slice(0, podpisIdx + 1).join('\n'),
        najemcaLine: null,
        afterSignature: lines.slice(podpisIdx + 1).join('\n'),
      }
    }
    return { beforeSignature: footer, najemcaLine: null, afterSignature: '' }
  }

  return {
    beforeSignature: lines.slice(0, najemcaIdx + 1).join('\n'),
    najemcaLine: lines[najemcaIdx],
    afterSignature: lines.slice(najemcaIdx + 1).join('\n').trimStart(),
  }
}

export function splitFilledRegulationForDisplay(
  filled: string,
  equipmentId: EquipmentId,
): { contentBeforeSignature: string; contentAfterSignature: string } {
  const { body, footer } = splitRegulationForPreview(filled, equipmentId)
  if (!footer) {
    return { contentBeforeSignature: filled, contentAfterSignature: '' }
  }
  const { beforeSignature, afterSignature } = splitFooterForSignature(footer)
  const beforeParts = [body, beforeSignature].filter(Boolean)
  return {
    contentBeforeSignature: beforeParts.join('\n\n'),
    contentAfterSignature: afterSignature,
  }
}

export function isBikeLine(line: string): boolean {
  return /KROSS Influx Hybrid|WINORA Yucatan/.test(line)
}

export function isBikeLineSelected(
  line: string,
  bikeModels?: BikeModel[],
  bikeModelCounts?: Partial<Record<BikeModel, number>>,
): boolean {
  if (/KROSS Influx/.test(line)) {
    const n = bikeModelCounts?.kross
    if (n != null) return n > 0
    return Boolean(bikeModels?.includes('kross') && /\[X\]/.test(line))
  }
  if (/WINORA Yucatan/.test(line)) {
    const n = bikeModelCounts?.winora
    if (n != null) return n > 0
    return Boolean(bikeModels?.includes('winora') && /\[X\]/.test(line))
  }
  return false
}

export function buildHighlightSnippets(data: RegulationFormData): string[] {
  const bikeModels = data.bikeModels ?? []
  const bikeCounts = normalizeBikeModelCounts(
    bikeModels,
    data.bikeModelCounts,
    data.equipmentCount,
  )
  const count =
    data.equipmentId === 'e-bike'
      ? sumBikeModelCounts(bikeCounts, bikeModels, data.equipmentCount)
      : Math.max(1, data.equipmentCount)
  const price = data.pricePln.toFixed(2)
  const deposit =
    data.depositPln > 0 ? data.depositPln.toFixed(0) : ''
  const from = formatDatePl(data.dateFrom)
  const to = formatDatePl(data.dateTo)

  const raw = [
    formatFullName(data.firstName, data.lastName),
    data.firstName.trim(),
    data.lastName.trim(),
    data.residentialAddress.trim(),
    data.phone.trim(),
    data.idDocument.trim(),
    data.pesel.trim().replace(/\D/g, ''),
    data.packageName.trim(),
    from,
    to,
    from !== '—' && to !== '—' ? `${from} – ${to}` : '',
    price,
    deposit,
    PAYMENT_METHOD_LABELS[data.paymentMethod],
    `(szt. ${count})`,
    `liczba: ${count}`,
    `Opłata za wynajem: ${price} PLN`,
    `Kaucja zwrotna: ${deposit} PLN`,
    `Cena za wynajem wynosi: ${price} zł brutto`,
    `Cena netto: ${price} PLN`,
    `Cena: ${price} PLN`,
    `${formatFullName(data.firstName, data.lastName)}, ${data.residentialAddress.trim()}`,
  ]

  const seen = new Set<string>()
  for (const s of raw) {
    const t = s.trim()
    if (t.length < 2 || t === '—') continue
    seen.add(t)
  }
  return [...seen]
}

export function isFilledPreviewLine(
  line: string,
  data: RegulationFormData,
): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  if (isBikeLine(line)) {
    return isBikeLineSelected(line, data.bikeModels, data.bikeModelCounts)
  }

  if (/\[X\]/.test(line)) {
    return true
  }

  if (/_{5,}/.test(line) && !/Najemca:\s*[^_]/i.test(line)) {
    return false
  }

  const snippets = buildHighlightSnippets(data)
  return snippets.some((s) => line.includes(s))
}

export const FILLED_LINE_CLASS =
  'block w-full rounded-lg border border-primary/50 bg-primary/20 px-2 py-1.5 font-semibold text-primary'

export const REGULATION_LINE_CLASS = 'block w-full py-0.5 text-white/85'

export type LinePreviewPart = { kind: 'normal' | 'filled'; text: string }

function snippetPositions(line: string, snippets: string[]) {
  const sorted = [...snippets].sort((a, b) => b.length - a.length)
  const ranges: { start: number; end: number; text: string }[] = []

  for (const snippet of sorted) {
    let from = 0
    while (from < line.length) {
      const idx = line.indexOf(snippet, from)
      if (idx < 0) break
      const end = idx + snippet.length
      const overlaps = ranges.some(
        (r) => !(end <= r.start || idx >= r.end),
      )
      if (!overlaps) ranges.push({ start: idx, end, text: snippet })
      from = idx + 1
    }
  }

  return ranges.sort((a, b) => a.start - b.start)
}

export function getFilledLineParts(
  line: string,
  data: RegulationFormData,
): LinePreviewPart[] {
  if (!isFilledPreviewLine(line, data)) {
    return [{ kind: 'normal', text: line }]
  }

  if (
    isBikeLine(line) ||
    /\[X\]/.test(line) ||
    /\(szt\. \d+\)/.test(line)
  ) {
    return [{ kind: 'filled', text: line }]
  }

  const snippets = buildHighlightSnippets(data).filter((s) => line.includes(s))
  const ranges = snippetPositions(line, snippets)

  if (ranges.length === 0) {
    const colon = line.indexOf(':')
    if (colon > 0) {
      const label = line.slice(0, colon + 1).trimEnd()
      const value = line.slice(colon + 1).trim()
      const parts: LinePreviewPart[] = [{ kind: 'normal', text: label }]
      if (value) parts.push({ kind: 'filled', text: value })
      return parts
    }
    return [{ kind: 'filled', text: line }]
  }

  const parts: LinePreviewPart[] = []
  let pos = 0
  for (const { start, end, text } of ranges) {
    if (start > pos) {
      const gap = line.slice(pos, start).trim()
      if (gap) parts.push({ kind: 'normal', text: gap })
    }
    parts.push({ kind: 'filled', text })
    pos = end
  }
  if (pos < line.length) {
    const tail = line.slice(pos).trim()
    if (tail) parts.push({ kind: 'normal', text: tail })
  }

  return parts.length > 0 ? parts : [{ kind: 'filled', text: line }]
}
