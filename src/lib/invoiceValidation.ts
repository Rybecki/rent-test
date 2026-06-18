import { isValidClientEmail } from './clientContactValidation'

export function normalizeNip(nip: string): string {
  return nip.replace(/\D/g, '').slice(0, 10)
}

export function isValidNip(nip: string): boolean {
  const d = normalizeNip(nip)
  if (!/^\d{10}$/.test(d)) return false
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * weights[i]
  const check = sum % 11
  const last = check === 10 ? 0 : check
  return last === Number(d[9])
}

export function formatPostalCodeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 5)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

export function isValidPostalCode(code: string): boolean {
  return /^\d{2}-\d{3}$/.test(code.trim())
}

export interface InvoiceFormFields {
  wantsInvoice: boolean
  invoiceCompanyName: string
  invoiceNip: string
  invoiceCity: string
  invoiceStreet: string
  invoiceUnit: string
  invoicePostalCode: string
  invoiceEmail: string
}

export function isInvoiceFormComplete(fields: InvoiceFormFields): boolean {
  if (!fields.wantsInvoice) return true
  if (fields.invoiceCompanyName.trim().length < 2) return false
  if (!isValidNip(fields.invoiceNip)) return false
  if (fields.invoiceCity.trim().length < 2) return false
  if (fields.invoiceStreet.trim().length < 2) return false
  if (!isValidPostalCode(fields.invoicePostalCode)) return false
  const email = fields.invoiceEmail.trim()
  if (email && !isValidClientEmail(email)) return false
  return true
}

export function invoiceValidationMessage(
  fields: InvoiceFormFields,
): string | null {
  if (!fields.wantsInvoice) return null
  if (fields.invoiceCompanyName.trim().length < 2) {
    return 'Podaj nazwę firmy'
  }
  if (!isValidNip(fields.invoiceNip)) {
    return 'Podaj poprawny NIP (10 cyfr)'
  }
  if (fields.invoiceCity.trim().length < 2) {
    return 'Podaj miasto'
  }
  if (fields.invoiceStreet.trim().length < 2) {
    return 'Podaj ulicę i numer'
  }
  if (!isValidPostalCode(fields.invoicePostalCode)) {
    return 'Podaj kod pocztowy (np. 00-001)'
  }
  const email = fields.invoiceEmail.trim()
  if (email && !isValidClientEmail(email)) {
    return 'Podaj poprawny e-mail do faktury'
  }
  return null
}
