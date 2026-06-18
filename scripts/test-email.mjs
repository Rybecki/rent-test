import nodemailer from 'nodemailer'
import { loadEnv } from './load-env.mjs'

loadEnv()

const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const to = process.env.OFFICE_EMAIL || 'kontakt@rent-aboco.pl'
const from = process.env.SMTP_FROM || user

const hosts = [
  process.env.SMTP_HOST,
  's142.cyber-folks.pl',
  'mail.ja-yhymm.pl',
  'smtp.ja-yhymm.pl',
].filter(Boolean)

const attempts = [
  { port: 465, secure: true, label: '465 SSL' },
  { port: 587, secure: false, label: '587 STARTTLS' },
]

for (const host of [...new Set(hosts)]) {
  for (const { port, secure, label } of attempts) {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
    try {
      await transport.verify()
      const info = await transport.sendMail({
        from,
        to,
        subject: `Rentally — test SMTP (${host}:${port})`,
        text: 'Test wysyłki z aplikacji. Jeśli widzisz tę wiadomość, konfiguracja SMTP działa.',
      })
      console.log(`OK: ${host}:${port} (${label})`)
      console.log('messageId:', info.messageId)
      console.log('Odbiorca:', to)
      process.exit(0)
    } catch (e) {
      console.log(`FAIL: ${host}:${port} (${label}) — ${e.message}`)
    }
  }
}

console.error('Żadna konfiguracja SMTP nie zadziałała.')
process.exit(1)
