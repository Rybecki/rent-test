import mysql from 'mysql2/promise'
import { loadEnv } from './load-env.mjs'

loadEnv()

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Brak wymaganych zmiennych DB_* w pliku .env')
  process.exit(1)
}

const host = process.argv[2] || DB_HOST

const conn = await mysql.createConnection({
  host,
  port: Number(DB_PORT || 3306),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
})

try {
  const [rows] = await conn.query('SELECT DATABASE() AS db, VERSION() AS version')
  console.log(`Połączenie OK (${host}):`, rows[0])
} catch (e) {
  if (e.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Odmowa dostępu MySQL.')
    console.error('  Użytkownik:', DB_USER, '| host:', host)
    console.error(
      '  W panelu hostingu dodaj zdalny dostęp MySQL dla swojego IP',
    )
    console.error('  (lub zaktualizuj DB_PASSWORD w pliku .env).')
  } else {
    console.error(e.message)
  }
  process.exit(1)
} finally {
  await conn.end()
}
