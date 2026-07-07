import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './state/AppContext.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { LanguageProvider } from './state/LanguageContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
)
