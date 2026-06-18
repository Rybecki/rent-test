import { APP_NAME } from '../appConfig'
import { buildFilledRegulation } from './fillRegulation'
import {
  formatChecklistStatus,
  getIssueChecklistStatus,
  getReturnChecklistStatus,
} from './documentChecklistStatus'
import { formatBikeCountsSummary, normalizeBikeModelCounts } from '../data/bikeModels'
import { formatFullName } from './personName'
import type { SignedDocument } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'

const FONT_VFS = 'NotoSans-Regular.ttf'
const FONT_FAMILY = 'NotoSans'

let notoSansBase64: string | null = null

function uint8ToBase64(u8: Uint8Array): string {
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < u8.length; i += chunk) {
    const sub = u8.subarray(i, i + chunk)
    binary += String.fromCharCode.apply(null, sub as unknown as number[])
  }
  return btoa(binary)
}

async function loadNotoSansBase64(): Promise<string> {
  if (notoSansBase64) return notoSansBase64
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const url = `${base}/fonts/NotoSans-Regular.ttf`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Nie udało się pobrać czcionki PDF (${res.status}): ${url}`)
  }
  const buf = await res.arrayBuffer()
  notoSansBase64 = uint8ToBase64(new Uint8Array(buf))
  return notoSansBase64
}

function applyUnicodeFont(
  pdf: import('jspdf').jsPDF,
  data: string,
): void {
  pdf.addFileToVFS(FONT_VFS, data)
  pdf.addFont(FONT_VFS, FONT_FAMILY, 'normal', undefined, 'Identity-H')
  pdf.setFont(FONT_FAMILY, 'normal')
}

function stripDataUrl(dataUrl: string): string {
  const i = dataUrl.indexOf('base64,')
  return i >= 0 ? dataUrl.slice(i + 7) : dataUrl
}

function sanitizeFileNamePart(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
}

export function buildPdfFileName(doc: SignedDocument): string {
  const parts = [
    APP_NAME,
    sanitizeFileNamePart(formatFullName(doc.firstName, doc.lastName)),
    sanitizeFileNamePart(doc.equipmentLabel),
  ].filter((p) => p.length > 0)
  return `${parts.join(' - ')}.pdf`
}

export async function buildSignedPdf(doc: SignedDocument): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const fontData = await loadNotoSansBase64()

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  applyUnicodeFont(pdf, fontData)

  const margin = 14
  const pageW = pdf.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = margin

  const header = [
    `${APP_NAME} — dokument podpisany`,
    `Imię i nazwisko: ${formatFullName(doc.firstName, doc.lastName)}`,
    `Adres: ${doc.residentialAddress}`,
    `Telefon: ${doc.phone}`,
    `E-mail: ${doc.clientEmail}`,
    `Dokument tożsamości: ${doc.idDocument}`,
    ...(doc.pesel ? [`PESEL: ${doc.pesel}`] : []),
    `Przedmiot: ${doc.equipmentLabel}`,
    `Pakiet: ${doc.packageName}`,
    `Termin: ${doc.dateFrom} — ${doc.dateTo} (${doc.days} dni)`,
    ...(doc.equipmentId === 'e-bike' && doc.bikeModels?.length
      ? [
          `Rowerów łącznie: ${doc.equipmentCount}`,
          formatBikeCountsSummary(
            doc.bikeModels,
            normalizeBikeModelCounts(
              doc.bikeModels,
              doc.bikeModelCounts,
              doc.equipmentCount,
            ),
          ),
        ]
      : [`Liczba sprzętu: ${doc.equipmentCount}`]),
    `Kwota: ${doc.pricePln.toFixed(2)} PLN`,
    `Płatność: ${PAYMENT_METHOD_LABELS[doc.paymentMethod]}`,
    ...(doc.depositPln > 0
      ? [`Kaucja zwrotna: ${doc.depositPln.toFixed(0)} PLN`]
      : []),
    `Data podpisania: ${new Date(doc.signedAt).toLocaleString('pl-PL')}`,
    `Osoba wydająca sprzęt: ${formatFullName(doc.issuerFirstName, doc.issuerLastName)}`,
    ...((): string[] => {
      const lines: string[] = []
      const issue = getIssueChecklistStatus(doc)
      const ret = getReturnChecklistStatus(doc)
      if (issue) lines.push(`Checklista wydania: ${formatChecklistStatus(issue)}`)
      if (ret) lines.push(`Checklista odbioru: ${formatChecklistStatus(ret)}`)
      return lines
    })(),
    '',
  ]

  pdf.setFontSize(10)
  for (const line of header) {
    const lines = pdf.splitTextToSize(line, maxW)
    for (const l of lines) {
      if (y > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage()
        applyUnicodeFont(pdf, fontData)
        y = margin
      }
      pdf.text(l, margin, y)
      y += 5
    }
  }

  y += 4
  pdf.setFontSize(9)
  const body =
    doc.filledRegulationText ||
    buildFilledRegulation({
      equipmentId: doc.equipmentId,
      firstName: doc.firstName,
      lastName: doc.lastName,
      residentialAddress: doc.residentialAddress,
      phone: doc.phone,
      clientEmail: doc.clientEmail ?? '',
      idDocument: doc.idDocument,
      pesel: doc.pesel ?? '',
      packageName: doc.packageName,
      dateFrom: doc.dateFrom,
      dateTo: doc.dateTo,
      days: doc.days,
      pricePln: doc.pricePln,
      bikeModels: doc.bikeModels ?? (doc.bikeModel ? [doc.bikeModel] : undefined),
      bikeModelCounts: doc.bikeModelCounts,
      equipmentCount: doc.equipmentCount,
      paymentMethod: doc.paymentMethod,
      depositPln: doc.depositPln,
    })
  const bodyLines = pdf.splitTextToSize(body, maxW)
  for (const line of bodyLines) {
    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage()
      applyUnicodeFont(pdf, fontData)
      y = margin
    }
    pdf.text(line, margin, y)
    y += 4.2
  }

  y += 6
  if (y > pdf.internal.pageSize.getHeight() - 70) {
    pdf.addPage()
    applyUnicodeFont(pdf, fontData)
    y = margin
  }
  pdf.setFontSize(10)
  pdf.text('Podpis Najemcy (wygenerowany elektronicznie):', margin, y)
  y += 8

  try {
    const imgData = doc.signatureDataUrl
    const fmt = imgData.includes('image/png') ? 'PNG' : 'JPEG'
    pdf.addImage(
      stripDataUrl(imgData),
      fmt,
      margin,
      y,
      80,
      30,
      undefined,
      'FAST',
    )
  } catch {
    pdf.text('(Nie udało się osadzić obrazu podpisu.)', margin, y)
  }

  pdf.save(buildPdfFileName(doc))
}
