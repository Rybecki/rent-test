import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(__dirname, script)], {
      cwd: root,
      stdio: 'inherit',
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} zakończył się kodem ${code}`))
    })
  })
}

const steps = [
  'migrate.mjs',
  'patch-client-email.mjs',
  'patch-bike-model-counts.mjs',
  'patch-name-columns.mjs',
  'patch-issuer-name-columns.mjs',
  'patch-invoice-columns.mjs',
  'db-verify.mjs',
]

console.log('=== Konfiguracja bazy danych ===\n')
for (const step of steps) {
  console.log(`→ ${step}`)
  await run(step)
  console.log('')
}
console.log('=== Gotowe ===')
