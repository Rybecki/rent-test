import type { SignedDocument } from '../types'
import { isInvoiceFormComplete, normalizeNip } from './invoiceValidation'

export function hasInvoiceData(doc: SignedDocument): boolean {
  if (doc.wantsInvoice) return true
  return isInvoiceFormComplete({
    wantsInvoice: true,
    invoiceCompanyName: doc.invoiceCompanyName,
    invoiceNip: doc.invoiceNip,
    invoiceCity: doc.invoiceCity,
    invoiceStreet: doc.invoiceStreet,
    invoiceUnit: doc.invoiceUnit,
    invoicePostalCode: doc.invoicePostalCode,
    invoiceEmail: doc.invoiceEmail,
  })
}

export function formatInvoiceAddress(doc: SignedDocument): string {
  const parts = [
    doc.invoiceStreet.trim(),
    doc.invoiceUnit.trim() ? `lok. ${doc.invoiceUnit.trim()}` : '',
    `${doc.invoicePostalCode.trim()} ${doc.invoiceCity.trim()}`.trim(),
  ].filter(Boolean)
  return parts.join(', ')
}

export function formatInvoiceTextLines(doc: SignedDocument): string[] {
  if (!hasInvoiceData(doc)) return []
  const lines = [
    '',
    'Dane do faktury:',
    `Nazwa firmy: ${doc.invoiceCompanyName.trim()}`,
    `NIP: ${normalizeNip(doc.invoiceNip)}`,
    `Miasto: ${doc.invoiceCity.trim()}`,
    `Ulica i numer: ${doc.invoiceStreet.trim()}`,
  ]
  if (doc.invoiceUnit.trim()) {
    lines.push(`Lokal: ${doc.invoiceUnit.trim()}`)
  }
  lines.push(`Kod pocztowy: ${doc.invoicePostalCode.trim()}`)
  if (doc.invoiceEmail.trim()) {
    lines.push(`E-mail do faktury: ${doc.invoiceEmail.trim()}`)
  }
  return lines
}
