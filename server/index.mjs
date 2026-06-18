import crypto from 'node:crypto'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { loadEnv } from '../scripts/load-env.mjs'
import { pool } from './db.mjs'
import { rowToDocument, documentToRow } from './documents-map.mjs'
import { sendSignedDocumentEmails } from './email.mjs'
import {
  formatPhoneForStorage,
  isValidClientEmail,
  isValidPolishPhone,
} from './validate-contact.mjs'
import {
  mergeInvoiceFields,
  parseWantsInvoice,
  validateInvoiceFields,
} from './validate-invoice.mjs'

loadEnv()

const PORT = Number(process.env.API_PORT || 3002)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3001'
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'dev-change-me-in-production'

const app = express()

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json({ limit: '15mb' }))
app.use(
  session({
    name: 'rentally.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
)

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Wymagane logowanie' })
    return
  }
  next()
}

function requireAdmin(req, res, next) {
  if (req.session?.role !== 'admin') {
    res.status(403).json({ error: 'Brak uprawnień administratora' })
    return
  }
  next()
}

function dbErrorMessage(err) {
  if (err?.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'Brak dostępu do bazy MySQL (zły login/hasło lub IP nie jest dozwolone w panelu hostingu).'
  }
  if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED') {
    return 'Nie można połączyć się z serwerem bazy — sprawdź DB_HOST w pliku .env.'
  }
  return 'Błąd połączenia z bazą danych.'
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: true })
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: dbErrorMessage(err) })
  }
})

app.get('/api/auth/me', async (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Nie zalogowano' })
    return
  }
  res.json({
    email: req.session.email,
    role: req.session.role,
  })
})

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!email || !password) {
    res.status(400).json({ error: 'Podaj e-mail i hasło' })
    return
  }

  const [rows] = await pool.query(
    'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
    [email],
  )

  const user = rows[0]
  if (!user) {
    res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' })
    return
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' })
    return
  }

  req.session.userId = user.id
  req.session.email = user.email
  req.session.role = user.role

  res.json({ email: user.email, role: user.role })
}))

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Nie udało się wylogować' })
      return
    }
    res.clearCookie('rentally.sid')
    res.json({ ok: true })
  })
})

app.get(
  '/api/documents',
  requireAuth,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      'SELECT * FROM signed_documents ORDER BY signed_at DESC',
    )
    res.json(rows.map(rowToDocument))
  }),
)

app.post('/api/documents', requireAuth, asyncRoute(async (req, res) => {
  const body = req.body ?? {}
  const id = crypto.randomUUID()
  const signedAt = new Date().toISOString()

  const doc = {
    id,
    equipmentId: body.equipmentId,
    equipmentLabel: body.equipmentLabel,
    firstName: String(body.firstName ?? '').trim(),
    lastName: String(body.lastName ?? '').trim(),
    residentialAddress: body.residentialAddress,
    phone: body.phone,
    clientEmail: String(body.clientEmail ?? '').trim().toLowerCase(),
    idDocument: body.idDocument,
    pesel: body.pesel ?? '',
    packageName: body.packageName,
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    days: body.days,
    pricePln: body.pricePln,
    signedAt,
    signatureDataUrl: body.signatureDataUrl,
    issuerFirstName: String(body.issuerFirstName ?? '').trim(),
    issuerLastName: String(body.issuerLastName ?? '').trim(),
    filledRegulationText: body.filledRegulationText,
    bikeModels: body.bikeModels,
    bikeModelCounts: body.bikeModelCounts,
    equipmentCount: body.equipmentCount ?? 1,
    paymentMethod: body.paymentMethod,
    depositPln: body.depositPln ?? 0,
    checklistCheckedIds: body.checklistCheckedIds,
    checklistCompleted: body.checklistCompleted ?? false,
    returnChecklistCheckedIds: body.returnChecklistCheckedIds,
    returnChecklistCompleted: body.returnChecklistCompleted ?? false,
    wantsInvoice: parseWantsInvoice(body.wantsInvoice),
    invoiceCompanyName: String(body.invoiceCompanyName ?? '').trim(),
    invoiceNip: String(body.invoiceNip ?? '').trim(),
    invoiceCity: String(body.invoiceCity ?? '').trim(),
    invoiceStreet: String(body.invoiceStreet ?? '').trim(),
    invoiceUnit: String(body.invoiceUnit ?? '').trim(),
    invoicePostalCode: String(body.invoicePostalCode ?? '').trim(),
    invoiceEmail: String(body.invoiceEmail ?? '').trim().toLowerCase(),
  }

  const clientEmail = doc.clientEmail
  if (!isValidClientEmail(clientEmail)) {
    res.status(400).json({ error: 'Podaj prawidłowy adres e-mail klienta' })
    return
  }

  if (!isValidPolishPhone(doc.phone)) {
    res.status(400).json({ error: 'Podaj prawidłowy numer telefonu (9 cyfr)' })
    return
  }

  doc.phone = formatPhoneForStorage(doc.phone)

  if (doc.firstName.length < 2 || doc.lastName.length < 2) {
    res.status(400).json({ error: 'Podaj imię i nazwisko (oba pola są wymagane)' })
    return
  }

  if (doc.issuerFirstName.length < 2 || doc.issuerLastName.length < 2) {
    res.status(400).json({
      error: 'Podaj imię i nazwisko osoby wydającej sprzęt (oba pola są wymagane)',
    })
    return
  }

  const invoiceError = validateInvoiceFields(doc)
  if (invoiceError) {
    res.status(400).json({ error: invoiceError })
    return
  }

  const row = documentToRow(doc, req.session.userId)
  await pool.query(
    `INSERT INTO signed_documents (
      id, equipment_id, equipment_label, first_name, last_name, full_name, residential_address, phone,
      client_email, id_document, pesel, package_name, date_from, date_to, days, price_pln,
      signed_at, signature_data_url, issuer_first_name, issuer_last_name,
      filled_regulation_text, bike_models,
      bike_model_counts, equipment_count, payment_method, deposit_pln,
      wants_invoice, invoice_company_name, invoice_nip, invoice_city, invoice_street,
      invoice_unit, invoice_postal_code, invoice_email,
      checklist_checked_ids, checklist_completed, return_checklist_checked_ids,
      return_checklist_completed, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.equipment_id,
      row.equipment_label,
      row.first_name,
      row.last_name,
      row.full_name,
      row.residential_address,
      row.phone,
      row.client_email,
      row.id_document,
      row.pesel,
      row.package_name,
      row.date_from,
      row.date_to,
      row.days,
      row.price_pln,
      row.signed_at,
      row.signature_data_url,
      row.issuer_first_name,
      row.issuer_last_name,
      row.filled_regulation_text,
      row.bike_models,
      row.bike_model_counts,
      row.equipment_count,
      row.payment_method,
      row.deposit_pln,
      row.wants_invoice,
      row.invoice_company_name,
      row.invoice_nip,
      row.invoice_city,
      row.invoice_street,
      row.invoice_unit,
      row.invoice_postal_code,
      row.invoice_email,
      row.checklist_checked_ids,
      row.checklist_completed,
      row.return_checklist_checked_ids,
      row.return_checklist_completed,
      row.created_by_user_id,
    ],
  )

  const [inserted] = await pool.query(
    'SELECT * FROM signed_documents WHERE id = ?',
    [id],
  )
  const saved = rowToDocument(inserted[0])
  const docForEmail = mergeInvoiceFields(saved, doc)

  let emailStatus = { sent: false, reason: 'unknown' }
  try {
    emailStatus = await sendSignedDocumentEmails(docForEmail)
  } catch (err) {
    console.error('[email] Błąd wysyłki:', err)
    emailStatus = {
      sent: false,
      reason: err instanceof Error ? err.message : 'send_failed',
    }
  }

  res.status(201).json({ ...docForEmail, emailStatus })
}))

app.patch(
  '/api/documents/:id/return-checklist',
  requireAuth,
  asyncRoute(async (req, res) => {
    const id = req.params.id
    const checkedIds = Array.isArray(req.body?.checkedIds)
      ? req.body.checkedIds
      : []
    const completed = Boolean(req.body?.completed)

    const [result] = await pool.query(
      `UPDATE signed_documents SET
        return_checklist_checked_ids = ?,
        return_checklist_completed = ?
      WHERE id = ?`,
      [
        checkedIds.length ? JSON.stringify(checkedIds) : null,
        completed ? 1 : 0,
        id,
      ],
    )

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Nie znaleziono dokumentu' })
      return
    }

    const [rows] = await pool.query(
      'SELECT * FROM signed_documents WHERE id = ?',
      [id],
    )
    res.json(rowToDocument(rows[0]))
  }),
)

app.use((err, _req, res, _next) => {
  console.error('[api]', err)
  const isDb =
    err?.code === 'ER_ACCESS_DENIED_ERROR' ||
    err?.code === 'ETIMEDOUT' ||
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'ENOTFOUND'
  res.status(isDb ? 503 : 500).json({
    error: isDb ? dbErrorMessage(err) : 'Wewnętrzny błąd serwera',
  })
})

async function start() {
  try {
    await pool.query('SELECT 1')
    console.log('Baza danych: połączono')
  } catch (err) {
    console.error('Baza danych: BŁĄD —', dbErrorMessage(err))
    if (err?.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(
        '  → Panel hostingu: MySQL → dostęp zdalny / whitelist IP (Twoje IP może się zmieniać).',
      )
    }
  }

  app.listen(PORT, () => {
    console.log(`API: http://localhost:${PORT}`)
  })
}

start()
