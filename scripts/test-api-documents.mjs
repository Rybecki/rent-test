import { loadEnv } from './load-env.mjs'

loadEnv()

const API = process.env.API_URL || `http://localhost:${process.env.API_PORT || 3002}`
const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Ustaw TEST_USER_EMAIL i TEST_USER_PASSWORD w pliku .env')
  process.exit(1)
}

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function fail(msg) {
  console.error('BŁĄD API:', msg)
  process.exit(1)
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { res, body }
}

console.log(`Test API: ${API}`)

const health = await api('/api/health')
if (!health.res.ok) fail('Serwer nie odpowiada na /api/health — uruchom: npm run dev:api')

const login = await api('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  credentials: 'include',
})
if (!login.res.ok) {
  fail(`Logowanie nieudane: ${login.body?.error ?? login.res.status}`)
}
const cookie = login.res.headers.getSetCookie?.()?.join('; ') ?? ''
if (!cookie && !login.res.headers.get('set-cookie')) {
  console.warn('Uwaga: brak nagłówka Set-Cookie — test może nie działać bez sesji')
}
const sessionCookie =
  login.res.headers.getSetCookie?.()?.[0]?.split(';')[0] ??
  login.res.headers.get('set-cookie')?.split(';')[0] ??
  ''

const payload = {
  equipmentId: 'kajaki',
  equipmentLabel: 'Kajaki',
  firstName: 'Test',
  lastName: 'Apiowy',
  residentialAddress: 'ul. API 1',
  phone: '501502503',
  clientEmail: 'api.test@example.com',
  idDocument: 'XYZ987654',
  pesel: '44051401359',
  packageName: 'Test API',
  dateFrom: '2026-05-23',
  dateTo: '2026-05-24',
  days: 1,
  pricePln: 50,
  signatureDataUrl: TINY_PNG,
  issuerFirstName: 'Maria',
  issuerLastName: 'Wydająca',
  filledRegulationText: 'Treść testowa API.',
  equipmentCount: 1,
  paymentMethod: 'cash',
  depositPln: 0,
}

const create = await api('/api/documents', {
  method: 'POST',
  credentials: 'include',
  headers: sessionCookie ? { Cookie: sessionCookie } : {},
  body: JSON.stringify(payload),
})
if (!create.res.ok) {
  fail(`POST /api/documents: ${create.body?.error ?? JSON.stringify(create.body)}`)
}

const doc = create.body
if (doc.firstName !== 'Test' || doc.lastName !== 'Apiowy') {
  fail('Odpowiedź API: błędne imię/nazwisko klienta')
}
if (doc.issuerFirstName !== 'Maria' || doc.issuerLastName !== 'Wydająca') {
  fail('Odpowiedź API: błędne imię/nazwisko wydającego')
}
console.log('  POST /api/documents: OK', doc.id)

const list = await api('/api/documents', {
  credentials: 'include',
  headers: sessionCookie ? { Cookie: sessionCookie } : {},
})
if (!list.res.ok) fail('GET /api/documents nieudane')
const found = list.body.find((d) => d.id === doc.id)
if (!found) fail('Utworzony dokument nie ma na liście')
if (found.issuerFirstName !== 'Maria') fail('Lista: brak issuerFirstName')
console.log('  GET /api/documents: OK')

import mysql from 'mysql2/promise'
const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
await conn.query('DELETE FROM signed_documents WHERE id = ?', [doc.id])
await conn.end()
console.log('  Rekord testowy usunięty z bazy')
console.log('\nTest API zakończony pomyślnie.')
