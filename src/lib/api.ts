import { USE_LOCAL_STORAGE } from '../appConfig'
import type { AuthUser, SignedDocument } from '../types'
import { appUrl } from './baseUrl'
import type { CreateDocumentResponse } from './apiTypes'
export type { CreateDocumentResponse, DocumentEmailStatus } from './apiTypes'
import { localAuthApi, localDocumentsApi } from './localStore'

import { ApiError } from './apiError'

export { ApiError }

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(appUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const body = await parseJson<{ error?: string } & T>(res)

  if (!res.ok) {
    throw new ApiError(body.error ?? res.statusText, res.status)
  }

  return body as T
}

export const authApi = {
  me: () =>
    USE_LOCAL_STORAGE
      ? Promise.resolve().then(() => localAuthApi.me())
      : apiRequest<AuthUser>('/api/auth/me'),
  login: (email: string, password: string) =>
    USE_LOCAL_STORAGE
      ? Promise.resolve().then(() => localAuthApi.login(email, password))
      : apiRequest<AuthUser>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),
  logout: () =>
    USE_LOCAL_STORAGE
      ? Promise.resolve().then(() => localAuthApi.logout())
      : apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
}

export const documentsApi = {
  list: () =>
    USE_LOCAL_STORAGE
      ? Promise.resolve(localDocumentsApi.list())
      : apiRequest<SignedDocument[]>('/api/documents'),
  create: (doc: Omit<SignedDocument, 'id' | 'signedAt'>) =>
    USE_LOCAL_STORAGE
      ? Promise.resolve(localDocumentsApi.create(doc))
      : apiRequest<CreateDocumentResponse>('/api/documents', {
          method: 'POST',
          body: JSON.stringify(doc),
        }),
  updateReturnChecklist: (
    id: string,
    checkedIds: string[],
    completed: boolean,
  ) =>
    USE_LOCAL_STORAGE
      ? Promise.resolve(
          localDocumentsApi.updateReturnChecklist(id, checkedIds, completed),
        )
      : apiRequest<SignedDocument>(`/api/documents/${id}/return-checklist`, {
          method: 'PATCH',
          body: JSON.stringify({ checkedIds, completed }),
        }),
}
