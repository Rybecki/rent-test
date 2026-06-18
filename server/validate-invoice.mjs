import { isValidClientEmail } from './validate-contact.mjs'

export function normalizeNip(nip) {
  return String(nip ?? '')
    .replace(/\D/g, '')
    .slice(0, 10)
}

export function isValidNip(nip) {
  const d = normalizeNip(nip)
  if (!/^\d{10}$/.test(d)) return false
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * weights[i]
  const check = sum % 11
  const last = check === 10 ? 0 : check
  return last === Number(d[9])
}

export function isValidPostalCode(code) {
  return /^\d{2}-\d{3}$/.test(String(code ?? '').trim())
}


export function parseWantsInvoice(value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}


export function hasInvoiceData(doc) {
  if (parseWantsInvoice(doc.wantsInvoice)) return true
  return (
    String(doc.invoiceCompanyName ?? '').trim().length >= 2 &&
    isValidNip(doc.invoiceNip)
  )
}


export function readWantsInvoiceFromRow(row) {
  const flag = row.wants_invoice
  if (flag === 1 || flag === true) return true
  if (flag === 0 || flag === false || flag == null) {
    return hasInvoiceData({
      wantsInvoice: false,
      invoiceCompanyName: row.invoice_company_name,
      invoiceNip: row.invoice_nip,
    })
  }
  if (Buffer.isBuffer(flag)) return flag[0] === 1
  return Number(flag) === 1
}


export function mergeInvoiceFields(saved, source) {
  if (!hasInvoiceData(source)) return saved
  return {
    ...saved,
    wantsInvoice: true,
    invoiceCompanyName: String(
      source.invoiceCompanyName ?? saved.invoiceCompanyName ?? '',
    ).trim(),
    invoiceNip: normalizeNip(source.invoiceNip ?? saved.invoiceNip),
    invoiceCity: String(source.invoiceCity ?? saved.invoiceCity ?? '').trim(),
    invoiceStreet: String(
      source.invoiceStreet ?? saved.invoiceStreet ?? '',
    ).trim(),
    invoiceUnit: String(source.invoiceUnit ?? saved.invoiceUnit ?? '').trim(),
    invoicePostalCode: String(
      source.invoicePostalCode ?? saved.invoicePostalCode ?? '',
    ).trim(),
    invoiceEmail: String(source.invoiceEmail ?? saved.invoiceEmail ?? '')
      .trim()
      .toLowerCase(),
  }
}


export function validateInvoiceFields(doc) {
  if (!parseWantsInvoice(doc.wantsInvoice)) return null

  if (String(doc.invoiceCompanyName ?? '').trim().length < 2) {
    return 'Podaj nazwę firmy do faktury'
  }
  if (!isValidNip(doc.invoiceNip)) {
    return 'Podaj poprawny NIP (10 cyfr)'
  }
  if (String(doc.invoiceCity ?? '').trim().length < 2) {
    return 'Podaj miasto (faktura)'
  }
  if (String(doc.invoiceStreet ?? '').trim().length < 2) {
    return 'Podaj ulicę i numer (faktura)'
  }
  if (!isValidPostalCode(doc.invoicePostalCode)) {
    return 'Podaj kod pocztowy (np. 00-001)'
  }

  const invoiceEmail = String(doc.invoiceEmail ?? '').trim().toLowerCase()
  if (invoiceEmail && !isValidClientEmail(invoiceEmail)) {
    return 'Podaj poprawny e-mail do wysłania faktury'
  }

  return null
}


export function formatInvoiceTextLines(doc) {
  if (!hasInvoiceData(doc)) return []

  const lines = [
    '',
    'Dane do faktury:',
    `Nazwa firmy: ${String(doc.invoiceCompanyName ?? '').trim()}`,
    `NIP: ${normalizeNip(doc.invoiceNip)}`,
    `Miasto: ${String(doc.invoiceCity ?? '').trim()}`,
    `Ulica i numer: ${String(doc.invoiceStreet ?? '').trim()}`,
  ]
  const unit = String(doc.invoiceUnit ?? '').trim()
  if (unit) lines.push(`Lokal: ${unit}`)
  lines.push(`Kod pocztowy: ${String(doc.invoicePostalCode ?? '').trim()}`)
  const email = String(doc.invoiceEmail ?? '').trim()
  if (email) lines.push(`E-mail do faktury: ${email}`)
  return lines
}
