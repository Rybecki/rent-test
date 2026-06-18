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
   ADD COLUMN issuer_first_name VARCHAR(128) NOT NULL DEFAULT '' AFTER signature_data_url`,
  `ALTER TABLE signed_documents
   ADD COLUMN issuer_last_name VARCHAR(128) NOT NULL DEFAULT '' AFTER issuer_first_name`,
]

for (const sql of steps) {
  try {
    await conn.query(sql)
    console.log('OK:', sql.slice(0, 70).replace(/\s+/g, ' '))
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Kolumna już istnieje — pomijam.')
    } else {
      throw e
    }
  }
}

await conn.end()
console.log('Migracja osoba wydająca — zakończona.')
