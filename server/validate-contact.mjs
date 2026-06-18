const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function normalizePhoneDigits(phone) {
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('48') && digits.length >= 11) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1)
  return digits.slice(0, 9)
}

export function isValidPolishPhone(phone) {
  const digits = normalizePhoneDigits(phone)
  return /^[1-9]\d{8}$/.test(digits)
}

export function isValidClientEmail(email) {
  const t = String(email).trim().toLowerCase()
  if (t.length < 5 || t.length > 254) return false
  return EMAIL_RE.test(t)
}

export function formatPhoneForStorage(phone) {
  return normalizePhoneDigits(phone)
}
