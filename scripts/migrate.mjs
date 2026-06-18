import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import { loadEnv } from './load-env.mjs'

loadEnv()

function parseMigrateUsers() {
  const raw = process.env.MIGRATE_USERS?.trim()
  if (!raw) {
    console.log('Brak MIGRATE_USERS w .env — pominięto tworzenie użytkowników.')
    return []
  }
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) {
      throw new Error('MIGRATE_USERS musi być tablicą JSON')
    }
    return list.map((u) => ({
      email: String(u.email).toLowerCase(),
      password: String(u.password),
      role: u.role === 'admin' ? 'admin' : 'user',
    }))
  } catch (e) {
    console.error('Nieprawidłowy MIGRATE_USERS:', e.message)
    process.exit(1)
  }
}

const USERS = parseMigrateUsers()

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS signed_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  equipment_id VARCHAR(32) NOT NULL,
  equipment_label VARCHAR(128) NOT NULL,
  first_name VARCHAR(128) NOT NULL,
  last_name VARCHAR(128) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  residential_address TEXT NOT NULL,
  phone VARCHAR(32) NOT NULL,
  client_email VARCHAR(255) NOT NULL DEFAULT '',
  id_document VARCHAR(64) NOT NULL,
  pesel VARCHAR(11) NOT NULL DEFAULT '',
  package_name VARCHAR(128) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  days INT UNSIGNED NOT NULL,
  price_pln DECIMAL(10, 2) NOT NULL,
  signed_at DATETIME(3) NOT NULL,
  signature_data_url MEDIUMTEXT NOT NULL,
  issuer_first_name VARCHAR(128) NOT NULL DEFAULT '',
  issuer_last_name VARCHAR(128) NOT NULL DEFAULT '',
  filled_regulation_text MEDIUMTEXT NOT NULL,
  bike_models JSON NULL,
  bike_model_counts JSON NULL,
  equipment_count INT UNSIGNED NOT NULL DEFAULT 1,
  payment_method ENUM('cash', 'card', 'prepayment') NOT NULL,
  deposit_pln DECIMAL(10, 2) NOT NULL DEFAULT 0,
  wants_invoice TINYINT(1) NOT NULL DEFAULT 0,
  invoice_company_name VARCHAR(255) NOT NULL DEFAULT '',
  invoice_nip VARCHAR(16) NOT NULL DEFAULT '',
  invoice_city VARCHAR(128) NOT NULL DEFAULT '',
  invoice_street VARCHAR(255) NOT NULL DEFAULT '',
  invoice_unit VARCHAR(64) NOT NULL DEFAULT '',
  invoice_postal_code VARCHAR(16) NOT NULL DEFAULT '',
  invoice_email VARCHAR(255) NOT NULL DEFAULT '',
  checklist_checked_ids JSON NULL,
  checklist_completed TINYINT(1) NOT NULL DEFAULT 0,
  return_checklist_checked_ids JSON NULL,
  return_checklist_completed TINYINT(1) NOT NULL DEFAULT 0,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_signed_documents_signed_at (signed_at DESC),
  CONSTRAINT fk_signed_documents_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
})

console.log('Tworzenie tabel…')
await conn.query(SQL)

for (const u of USERS) {
  const email = u.email.toLowerCase()
  const hash = await bcrypt.hash(u.password, 12)
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email])
  if (existing.length > 0) {
    await conn.query(
      'UPDATE users SET password_hash = ?, role = ? WHERE email = ?',
      [hash, u.role, email],
    )
    console.log(`Zaktualizowano użytkownika: ${email} (${u.role})`)
  } else {
    await conn.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, hash, u.role],
    )
    console.log(`Utworzono użytkownika: ${email} (${u.role})`)
  }
}

for (const stmt of [
  `ALTER TABLE signed_documents
   ADD COLUMN client_email VARCHAR(255) NOT NULL DEFAULT '' AFTER phone`,
  `ALTER TABLE signed_documents
   ADD COLUMN bike_model_counts JSON NULL AFTER bike_models`,
]) {
  try {
    await conn.query(stmt)
    console.log('Migracja OK:', stmt.slice(0, 60).replace(/\s+/g, ' '))
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e
  }
}

await conn.end()
console.log('Migracja zakończona.')
