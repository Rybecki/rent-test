import crypto from 'node:crypto'
import mysql from 'mysql2/promise'
import { loadEnv } from './load-env.mjs'
import { documentToRow, rowToDocument } from '../server/documents-map.mjs'

loadEnv()

const REQUIRED_SIGNED_DOCUMENT_COLUMNS = [
  'id',
  'equipment_id',
  'equipment_label',
  'first_name',
  'last_name',
  'full_name',
  'residential_address',
  'phone',
  'client_email',
  'id_document',
  'pesel',
  'package_name',
  'date_from',
  'date_to',
  'days',
  'price_pln',
  'signed_at',
  'signature_data_url',
  'issuer_first_name',
  'issuer_last_name',
  'filled_regulation_text',
  'bike_models',
  'bike_model_counts',
  'equipment_count',
  'payment_method',
  'deposit_pln',
  'wants_invoice',
  'invoice_company_name',
  'invoice_nip',
  'invoice_city',
  'invoice_street',
  'invoice_unit',
  'invoice_postal_code',
  'invoice_email',
  'checklist_checked_ids',
  'checklist_completed',
  'return_checklist_checked_ids',
  'return_checklist_completed',
  'created_by_user_id',
  'created_at',
]

const INSERT_COLUMNS = [
  'id',
  'equipment_id',
  'equipment_label',
  'first_name',
  'last_name',
  'full_name',
  'residential_address',
  'phone',
  'client_email',
  'id_document',
  'pesel',
  'package_name',
  'date_from',
  'date_to',
  'days',
  'price_pln',
  'signed_at',
  'signature_data_url',
  'issuer_first_name',
  'issuer_last_name',
  'filled_regulation_text',
  'bike_models',
  'bike_model_counts',
  'equipment_count',
  'payment_method',
  'deposit_pln',
  'wants_invoice',
  'invoice_company_name',
  'invoice_nip',
  'invoice_city',
  'invoice_street',
  'invoice_unit',
  'invoice_postal_code',
  'invoice_email',
  'checklist_checked_ids',
  'checklist_completed',
  'return_checklist_checked_ids',
  'return_checklist_completed',
  'created_by_user_id',
]

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function fail(msg) {
  console.error('BŁĄD:', msg)
  process.exit(1)
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    fail(`${label}: oczekiwano "${expected}", otrzymano "${actual}"`)
  }
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

console.log('Sprawdzanie połączenia…')
const [dbInfo] = await conn.query('SELECT DATABASE() AS db')
console.log(`  Baza: ${dbInfo[0].db}`)

const [columns] = await conn.query('SHOW COLUMNS FROM signed_documents')
const columnNames = new Set(columns.map((c) => c.Field))
const missing = REQUIRED_SIGNED_DOCUMENT_COLUMNS.filter((c) => !columnNames.has(c))
if (missing.length > 0) {
  fail(`Brakujące kolumny w signed_documents: ${missing.join(', ')}`)
}
console.log(`  Kolumny signed_documents: ${columnNames.size} (wymagane OK)`)

const [users] = await conn.query('SELECT COUNT(*) AS n FROM users')
if (Number(users[0].n) < 1) {
  fail('Brak użytkowników — uruchom: npm run db:migrate')
}
console.log(`  Użytkownicy: ${users[0].n}`)

const testId = crypto.randomUUID()
const testDoc = {
  id: testId,
  equipmentId: 'kajaki',
  equipmentLabel: 'Kajaki',
  firstName: 'Jan',
  lastName: 'Kowalski',
  residentialAddress: 'ul. Testowa 1, Warszawa',
  phone: '500600700',
  clientEmail: 'test.verify@example.com',
  idDocument: 'ABC123456',
  pesel: '44051401359',
  packageName: 'Pakiet test',
  dateFrom: '2026-05-23',
  dateTo: '2026-05-24',
  days: 1,
  pricePln: 100,
  signedAt: new Date().toISOString(),
  signatureDataUrl: TINY_PNG,
  issuerFirstName: 'Anna',
  issuerLastName: 'Nowak',
  filledRegulationText: 'Test regulaminu — weryfikacja bazy.',
  equipmentCount: 1,
  paymentMethod: 'cash',
  depositPln: 0,
  checklistCompleted: false,
  returnChecklistCompleted: false,
}

const row = documentToRow(testDoc, null)
const placeholders = INSERT_COLUMNS.map(() => '?').join(', ')
const values = INSERT_COLUMNS.map((col) => row[col])

try {
  await conn.query(
    `INSERT INTO signed_documents (${INSERT_COLUMNS.join(', ')}) VALUES (${placeholders})`,
    values,
  )
  console.log('  Zapis testowy: OK')

  const [rows] = await conn.query('SELECT * FROM signed_documents WHERE id = ?', [
    testId,
  ])
  if (rows.length !== 1) fail('Nie znaleziono zapisanego dokumentu testowego')

  const loaded = rowToDocument(rows[0])
  assertEqual('firstName', loaded.firstName, 'Jan')
  assertEqual('lastName', loaded.lastName, 'Kowalski')
  assertEqual('issuerFirstName', loaded.issuerFirstName, 'Anna')
  assertEqual('issuerLastName', loaded.issuerLastName, 'Nowak')
  assertEqual('clientEmail', loaded.clientEmail, 'test.verify@example.com')
  assertEqual('phone', loaded.phone, '500600700')
  console.log('  Odczyt i mapowanie pól: OK')
} finally {
  await conn.query('DELETE FROM signed_documents WHERE id = ?', [testId])
  console.log('  Rekord testowy usunięty')
}

await conn.end()
console.log('\nWeryfikacja bazy zakończona pomyślnie.')
