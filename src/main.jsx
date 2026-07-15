import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './state/AppContext.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { LanguageProvider } from './state/LanguageContext.jsx'
import { ThemeProvider } from './state/ThemeContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import { registerSW } from './utils/registerSW.js'
import './index.css'

registerSW()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
)
