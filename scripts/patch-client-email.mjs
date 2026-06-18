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

try {
  await conn.query(
    `ALTER TABLE signed_documents
     ADD COLUMN client_email VARCHAR(255) NOT NULL DEFAULT '' AFTER phone`,
  )
  console.log('Dodano kolumnę client_email.')
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('Kolumna client_email już istnieje.')
  } else {
    throw e
  }
}

await conn.end()
