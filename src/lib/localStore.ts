import type { AuthUser, SignedDocument } from '../types'
import { DEV_AUTH_USER, SKIP_AUTH } from '../appConfig'
import type { CreateDocumentResponse } from './apiTypes'
import { ApiError } from './apiError'

const SESSION_KEY = 'rentaboco-session'
const DOCUMENTS_KEY = 'rentaboco-documents-v1'

const TEST_USERS: { email: string; password: string; role: AuthUser['role'] }[] =
  [
    { email: 'kontakt@rentally.pl', password: '123', role: 'admin' },
  ]

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function requireSession(): AuthUser {
  const user = readJson<AuthUser | null>(SESSION_KEY, null)
  if (!user?.email) {
    throw new ApiError('Nie zalogowano', 401)
  }
  return user
}

function getActiveUser(): AuthUser {
  if (SKIP_AUTH) {
    writeJson(SESSION_KEY, DEV_AUTH_USER)
    return DEV_AUTH_USER
  }
  return requireSession()
}

export const localAuthApi = {
  me(): AuthUser {
    return getActiveUser()
  },

  login(email: string, password: string): AuthUser {
    const normalized = email.trim().toLowerCase()
    const match = TEST_USERS.find(
      (u) => u.email === normalized && u.password === password,
    )
    if (!match) {
      throw new ApiError('Nieprawidłowy e-mail lub hasło', 401)
    }
    const user = { email: match.email, role: match.role }
    writeJson(SESSION_KEY, user)
    return user
  },

  logout(): { ok: boolean } {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
    }
    return { ok: true }
  },
}

export const localDocumentsApi = {
  list(): SignedDocument[] {
    getActiveUser()
    return readJson<SignedDocument[]>(DOCUMENTS_KEY, [])
  },

  create(
    partial: Omit<SignedDocument, 'id' | 'signedAt'>,
  ): CreateDocumentResponse {
    getActiveUser()
    const doc: SignedDocument = {
      ...partial,
      id: crypto.randomUUID(),
      signedAt: new Date().toISOString(),
    }
    const docs = readJson<SignedDocument[]>(DOCUMENTS_KEY, [])
    docs.unshift(doc)
    writeJson(DOCUMENTS_KEY, docs)
    return {
      ...doc,
      emailStatus: {
        sent: false,
        reason: 'Tryb testowy — e-mail nie jest wysyłany (localStorage)',
      },
    }
  },

  updateReturnChecklist(
    id: string,
    checkedIds: string[],
    completed: boolean,
  ): SignedDocument {
    getActiveUser()
    const docs = readJson<SignedDocument[]>(DOCUMENTS_KEY, [])
    const index = docs.findIndex((d) => d.id === id)
    if (index < 0) {
      throw new ApiError('Nie znaleziono dokumentu', 404)
    }
    const updated: SignedDocument = {
      ...docs[index],
      returnChecklistCheckedIds: checkedIds,
      returnChecklistCompleted: completed,
    }
    docs[index] = updated
    writeJson(DOCUMENTS_KEY, docs)
    return updated
  },
}
