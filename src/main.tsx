import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { clearLegacyDocumentStorage } from './lib/clearLegacyStorage'
import './index.css'
import App from './App.tsx'

clearLegacyDocumentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
