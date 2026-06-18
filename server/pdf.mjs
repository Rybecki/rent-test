import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAYMENT_LABELS = {
  cash: 'Gotówka',
  card: 'Karta/BLIK',
  prepayment: 'Przedpłata',
}

const FONT_VFS = 'DejaVuSans.ttf'
const FONT_FAMILY = 'DejaVuSans'

let fontBase64 = null

function loadFontBase64() {
  if (fontBase64) return fontBase64
  const candidates = [
    join(__dirname, '../public/fonts/NotoSans-Regular.ttf'),
    join(__dirname, '../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      fontBase64 = readFileSync(p).toString('base64')
      return fontBase64
    }
  }
  throw new Error('Brak pliku czcionki TTF do generowania PDF')
}

function applyFont(pdf, data) {
  pdf.addFileToVFS(FONT_VFS, data)
  pdf.addFont(FONT_VFS, FONT_FAMILY, 'normal', undefined, 'Identity-H')
  pdf.setFont(FONT_FAMILY, 'normal')
}

function stripDataUrl(dataUrl) {
  const i = dataUrl.indexOf('base64,')
  return i >= 0 ? dataUrl.slice(i + 7) : dataUrl
}

function sanitizeFileNamePart(value) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
}

export function buildPdfFileName(doc) {
  const parts = [
    'Rentally',
    sanitizeFileNamePart(`${doc.firstName} ${doc.lastName}`.trim()),
    sanitizeFileNamePart(doc.equipmentLabel),
  ].filter((p) => p.length > 0)
  return `${parts.join(' - ')}.pdf`
}


export function buildSignedPdfBuffer(doc) {
  const fontData = loadFontBase64()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  applyFont(pdf, fontData)

  const margin = 14
  const pageW = pdf.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = margin

  const header = [
    'Rentally — dokument podpisany',
    `Imię i nazwisko: ${`${doc.firstName} ${doc.lastName}`.trim()}`,
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
          ...doc.bikeModels.map(
            (m) =>
              `${m === 'kross' ? 'KROSS Influx Hybrid 1.0' : 'WINORA Yucatan X8'}: ${doc.bikeModelCounts?.[m] ?? 0}`,
          ),
        ]
      : [`Liczba sprzętu: ${doc.equipmentCount}`]),
    `Kwota: ${doc.pricePln.toFixed(2)} PLN`,
    `Płatność: ${PAYMENT_LABELS[doc.paymentMethod] ?? doc.paymentMethod}`,
    ...(doc.depositPln > 0
      ? [`Kaucja zwrotna: ${doc.depositPln.toFixed(0)} PLN`]
      : []),
    `Data podpisania: ${new Date(doc.signedAt).toLocaleString('pl-PL')}`,
    `Osoba wydająca sprzęt: ${`${doc.issuerFirstName} ${doc.issuerLastName}`.trim()}`,
    '',
  ]

  pdf.setFontSize(10)
  for (const line of header) {
    const lines = pdf.splitTextToSize(line, maxW)
    for (const l of lines) {
      if (y > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage()
        applyFont(pdf, fontData)
        y = margin
      }
      pdf.text(l, margin, y)
      y += 5
    }
  }

  y += 4
  pdf.setFontSize(9)
  const bodyLines = pdf.splitTextToSize(doc.filledRegulationText || '', maxW)
  for (const line of bodyLines) {
    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage()
      applyFont(pdf, fontData)
      y = margin
    }
    pdf.text(line, margin, y)
    y += 4.2
  }

  y += 6
  if (y > pdf.internal.pageSize.getHeight() - 70) {
    pdf.addPage()
    applyFont(pdf, fontData)
    y = margin
  }
  pdf.setFontSize(10)
  pdf.text('Podpis Najemcy (wygenerowany elektronicznie):', margin, y)
  y += 8

  try {
    const imgData = doc.signatureDataUrl
    const fmt = imgData.includes('image/png') ? 'PNG' : 'JPEG'
    pdf.addImage(stripDataUrl(imgData), fmt, margin, y, 80, 30, undefined, 'FAST')
  } catch {
    pdf.text('(Nie udało się osadzić obrazu podpisu.)', margin, y)
  }

  return Buffer.from(pdf.output('arraybuffer'))
}
