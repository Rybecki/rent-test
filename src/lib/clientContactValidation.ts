function extractNationalDigits(phone: string, hasLeadingPlus = false): string {
  let digits = phone.replace(/\D/g, '')
  if ((hasLeadingPlus || phone.trimStart().startsWith('+')) && digits.startsWith('48')) {
    digits = digits.slice(2)
  } else if (digits.startsWith('48') && digits.length >= 11) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1)
  }
  return digits.slice(0, 9)
}

export function normalizePhoneDigits(phone: string): string {
  return extractNationalDigits(phone, phone.trimStart().startsWith('+'))
}

export function isValidPolishPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone)
  return /^[1-9]\d{8}$/.test(digits)
}

function formatNational(digits: string): string {
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

export function formatPhoneInput(value: string): string {
  const trimmed = value.trimStart()

  if (!trimmed.startsWith('+')) {
    return formatNational(extractNationalDigits(value, false))
  }

  if (trimmed === '+') return '+'

  const allDigits = trimmed.slice(1).replace(/\D/g, '')

  if (allDigits.length === 0) return '+'

  // Pozwól swobodnie edytować prefiks kraju (+, +4, +48)
  if (allDigits.length < 2 || (allDigits.length === 2 && allDigits !== '48')) {
    return `+${allDigits}`
  }

  if (allDigits === '48') return '+48'

  if (allDigits.startsWith('48')) {
    const national = allDigits.slice(2).slice(0, 9)
    if (national.length === 0) return '+48'
    return `+48 ${formatNational(national)}`.trimEnd()
  }

  return `+${allDigits}`
}

export function phoneValidationMessage(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return 'Podaj numer telefonu'
  if (!isValidPolishPhone(trimmed)) {
    return 'Podaj poprawny numer (9 cyfr lub +48, np. +48 500 123 456)'
  }
  return null
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function isValidClientEmail(email: string): boolean {
  const t = email.trim().toLowerCase()
  if (t.length < 5 || t.length > 254) return false
  return EMAIL_RE.test(t)
}

export function emailValidationMessage(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Podaj adres e-mail'
  if (!isValidClientEmail(trimmed)) {
    return 'Podaj poprawny adres e-mail (np. jan@example.pl)'
  }
  return null
}
