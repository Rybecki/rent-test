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
     ADD COLUMN bike_model_counts JSON NULL AFTER bike_models`,
  )
  console.log('Dodano kolumnę bike_model_counts.')
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('Kolumna bike_model_counts już istnieje.')
  } else {
    throw e
  }
}

await conn.end()
