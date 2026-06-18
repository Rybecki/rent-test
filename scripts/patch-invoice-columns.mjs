import mysql from 'mysql2/promise'
import { loadEnv } from './load-env.mjs'

loadEnv()

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const steps = [
  `ALTER TABLE signed_documents
   ADD COLUMN wants_invoice TINYINT(1) NOT NULL DEFAULT 0 AFTER deposit_pln`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_company_name VARCHAR(255) NOT NULL DEFAULT '' AFTER wants_invoice`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_nip VARCHAR(16) NOT NULL DEFAULT '' AFTER invoice_company_name`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_city VARCHAR(128) NOT NULL DEFAULT '' AFTER invoice_nip`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_street VARCHAR(255) NOT NULL DEFAULT '' AFTER invoice_city`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_unit VARCHAR(64) NOT NULL DEFAULT '' AFTER invoice_street`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_postal_code VARCHAR(16) NOT NULL DEFAULT '' AFTER invoice_unit`,
  `ALTER TABLE signed_documents
   ADD COLUMN invoice_email VARCHAR(255) NOT NULL DEFAULT '' AFTER invoice_postal_code`,
]

for (const sql of steps) {
  try {
    await conn.query(sql)
    console.log('OK:', sql.slice(0, 72).replace(/\s+/g, ' '))
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Kolumna już istnieje — pomijam.')
    } else {
      throw e
    }
  }
}

await conn.end()
console.log('Migracja faktura — zakończona.')
