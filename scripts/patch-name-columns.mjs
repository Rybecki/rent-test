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
   ADD COLUMN first_name VARCHAR(128) NOT NULL DEFAULT '' AFTER equipment_label`,
  `ALTER TABLE signed_documents
   ADD COLUMN last_name VARCHAR(128) NOT NULL DEFAULT '' AFTER first_name`,
  `UPDATE signed_documents SET
     first_name = TRIM(SUBSTRING_INDEX(full_name, ' ', 1)),
     last_name = TRIM(SUBSTRING(full_name, LOCATE(' ', full_name)))
   WHERE (first_name = '' OR last_name = '') AND full_name <> ''`,
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
console.log('Migracja imię/nazwisko zakończona.')
