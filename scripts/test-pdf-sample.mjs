import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPdfFileName, buildSignedPdfBuffer } from '../server/pdf.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../tmp')

const sampleDoc = {
  id: '00000000-0000-4000-8000-000000000001',
  equipmentId: 'e-bike',
  equipmentLabel: 'Rower elektryczny',
  firstName: 'Jan',
  lastName: 'Kowalski',
  residentialAddress: 'ul. Testowa 1, 00-001 Warszawa',
  phone: '501234567',
  clientEmail: 'jan@example.com',
  idDocument: 'ABC123456',
  pesel: '',
  packageName: 'Pakiet standard',
  dateFrom: '2026-05-27',
  dateTo: '2026-05-30',
  days: 3,
  pricePln: 299.5,
  signedAt: new Date().toISOString(),
  signatureDataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  issuerFirstName: 'Anna',
  issuerLastName: 'Nowak',
  filledRegulationText: '§1 Przykładowy regulamin.\n§2 Drugi akapit z polskimi znakami: ąęółżźćń.',
  bikeModels: ['kross', 'winora'],
  bikeModelCounts: { kross: 1, winora: 1 },
  equipmentCount: 2,
  paymentMethod: 'card',
  depositPln: 200,
  wantsInvoice: false,
}

mkdirSync(outDir, { recursive: true })
const buf = buildSignedPdfBuffer(sampleDoc)
const name = buildPdfFileName(sampleDoc)
const path = join(outDir, 'sample-node.pdf')
writeFileSync(path, buf)
console.log('Zapisano:', path, '(' + name + ',', buf.length, 'bajtów)')
