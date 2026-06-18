import type { SignedDocument } from '../types'

export type DocumentEmailStatus = {
  sent: boolean
  reason?: string
  clientEmail?: string | null
  notifyEmails?: string[]
  officeEmail?: string
}

export type CreateDocumentResponse = SignedDocument & {
  emailStatus?: DocumentEmailStatus
}
