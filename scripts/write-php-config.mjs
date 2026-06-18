import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from './load-env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const DEFAULT_OFFICE_EMAIL = 'kontakt@rentally.pl'

loadEnv()

function phpStr(value) {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function phpBool(value) {
  const v = value === true || value === 'true' || value === '1'
  return v ? 'true' : 'false'
}

const notify = [process.env.NOTIFY_EMAILS, process.env.OFFICE_EMAIL]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
const notifyUnique = [...new Set(notify)].join(',') || DEFAULT_OFFICE_EMAIL

const config = `<?php

return [
    'db' => [
        'host' => 'localhost',
        'port' => ${Number(process.env.DB_PORT || 3306)},
        'name' => ${phpStr(process.env.DB_NAME || '')},
        'user' => ${phpStr(process.env.DB_USER || '')},
        'pass' => ${phpStr(process.env.DB_PASSWORD || '')},
    ],
    'client_origin' => '',
    'session_path' => '',
    'smtp_host' => ${phpStr(process.env.SMTP_HOST || '')},
    'smtp_port' => ${Number(process.env.SMTP_PORT || 465)},
    'smtp_secure' => ${phpBool(process.env.SMTP_SECURE ?? 'true')},
    'smtp_user' => ${phpStr(process.env.SMTP_USER || '')},
    'smtp_pass' => ${phpStr(process.env.SMTP_PASS || '')},
    'mail_from' => ${phpStr(process.env.SMTP_FROM || `"Rentally" <${DEFAULT_OFFICE_EMAIL}>`)},
    'notify_emails' => ${phpStr(notifyUnique)},
    'office_email' => ${phpStr(process.env.OFFICE_EMAIL || DEFAULT_OFFICE_EMAIL)},
];
`

export function writePhpConfig(targetPath) {
  writeFileSync(targetPath, config, 'utf8')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || join(root, 'api', 'config.php')
  writePhpConfig(out)
  console.log('Zapisano:', out)
}
