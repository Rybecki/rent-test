import nodemailer from 'nodemailer'
import { buildPdfFileName, buildSignedPdfBuffer } from './pdf.mjs'
import { formatInvoiceTextLines } from './validate-invoice.mjs'

const BIURO_EMAIL = 'biuro@ja-yhymm.pl'


function getNotifyEmails() {
  const fromEnv = [process.env.NOTIFY_EMAILS, process.env.OFFICE_EMAIL]
    .filter(Boolean)
    .join(',')

  const emails = new Set(
    (fromEnv || `${BIURO_EMAIL},kontakt@rent-aboco.pl`)
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )

  emails.add(BIURO_EMAIL)

  return [...emails]
}

function bccForClient(clientEmail) {
  const client = String(clientEmail || '')
    .trim()
    .toLowerCase()
  const bcc = getNotifyEmails().filter((e) => e !== client)
  if (bcc.length === 0) return undefined
  return bcc.length === 1 ? bcc[0] : bcc
}

function createTransport() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE !== 'false'

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}


export async function sendSignedDocumentEmails(doc) {
  const transport = createTransport()
  if (!transport) {
    console.warn(
      '[email] Brak SMTP_HOST/SMTP_USER/SMTP_PASS — pominięto wysyłkę.',
    )
    return { sent: false, reason: 'smtp_not_configured' }
  }

  const pdfBuffer = buildSignedPdfBuffer(doc)
  const fileName = buildPdfFileName(doc)
  const from =
    process.env.SMTP_FROM ||
    `"Rentally" <${process.env.SMTP_USER}>`

  const subject = `Rentally — potwierdzenie podpisu: ${doc.equipmentLabel}`
  const text = [
    'Dzień dobry,',
    '',
    `W załączniku przesyłamy podpisany dokument (${doc.equipmentLabel}).`,
    `Imię i nazwisko: ${`${doc.firstName} ${doc.lastName}`.trim()}`,
    `Osoba wydająca sprzęt: ${`${doc.issuerFirstName} ${doc.issuerLastName}`.trim()}`,
    `Termin wynajmu: ${doc.dateFrom} — ${doc.dateTo}`,
    '',
    ...formatInvoiceTextLines(doc),
    '',
    'Pozdrawiamy,',
    'Rentally',
  ].join('\n')

  const attachment = {
    filename: fileName,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }

  const clientEmail = String(doc.clientEmail || '').trim().toLowerCase()
  const notifyEmails = getNotifyEmails()

  if (clientEmail) {
    await transport.sendMail({
      from,
      to: clientEmail,
      bcc: bccForClient(clientEmail),
      subject,
      text,
      attachments: [attachment],
    })
  } else {
    await transport.sendMail({
      from,
      to: notifyEmails.length === 1 ? notifyEmails[0] : notifyEmails,
      subject: `${subject} (brak e-mail klienta)`,
      text,
      attachments: [attachment],
    })
  }

  return {
    sent: true,
    clientEmail: clientEmail || null,
    notifyEmails,
  }
}
