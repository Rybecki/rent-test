import { useState, type FormEvent } from 'react'
import { ApiError } from '../lib/api'
import { APP_NAME } from '../appConfig'
import { LOGO_SRC } from '../logo'

type LoginScreenProps = {
  login: (email: string, password: string) => Promise<void>
}

const control =
  'w-full min-w-0 max-w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

export function LoginScreen({ login }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Nie udało się zalogować. Sprawdź połączenie z serwerem.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh min-w-0 flex-col items-center justify-center gap-8 overflow-x-clip p-4">
      <img
        src={LOGO_SRC}
        alt={APP_NAME}
        className="block h-auto max-h-[7rem] w-full max-w-[min(360px,92vw)] bg-transparent object-contain"
      />
      <form
        onSubmit={handleSubmit}
        className="glass-card w-full min-w-0 max-w-md rounded-2xl p-5 shadow-2xl sm:p-8"
      >
        <p className="mb-5 text-center text-sm text-white/70">
          Zaloguj się, aby kontynuować
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide text-primary">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              className={control}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="np. kontakt@rentally.pl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide text-primary">
              Hasło
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              className={control}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-center text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full border-0 disabled:opacity-60"
          >
            {submitting ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </div>
      </form>
    </div>
  )
}
