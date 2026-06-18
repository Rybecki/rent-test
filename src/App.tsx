import { AuthProvider, useAuth } from './context/AuthProvider'
import { DocumentsProvider } from './context/DocumentsProvider'
import { LoginScreen } from './components/LoginScreen'
import { AppShell } from './components/AppShell'

function AppContent() {
  const { user, loading, login } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-white/60">
        Ładowanie…
      </div>
    )
  }

  if (!user) {
    return <LoginScreen login={login} />
  }

  return (
    <DocumentsProvider>
      <AppShell />
    </DocumentsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
