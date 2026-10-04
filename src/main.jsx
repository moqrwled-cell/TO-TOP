import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './i18n'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
