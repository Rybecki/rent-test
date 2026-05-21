import { useCallback, useState } from 'react'
import { DocumentsProvider } from './context/DocumentsProvider'
import { LoginScreen } from './components/LoginScreen'
import { AppShell } from './components/AppShell'

const SESSION = 'cherrysign-auth'

export default function App() {
  const [authed, setAuthed] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION) === '1',
  )

  const onAuthenticated = useCallback(() => {
    sessionStorage.setItem(SESSION, '1')
    setAuthed(true)
  }, [])

  return (
    <DocumentsProvider>
      {authed ? (
        <AppShell />
      ) : (
        <LoginScreen onAuthenticated={onAuthenticated} />
      )}
    </DocumentsProvider>
  )
}
