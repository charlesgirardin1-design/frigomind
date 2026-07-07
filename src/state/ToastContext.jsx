// -----------------------------------------------------------------------------
// ToastContext.jsx
// Petit système de notifications toast (succès / info / erreur). Context +
// hooks maison plutôt qu'une librairie externe, conformément à la contrainte
// "sans dépendance compliquée" du projet (voir AppContext.jsx).
// -----------------------------------------------------------------------------

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Toast from '../components/Toast.jsx'

const ToastContext = createContext(null)

const AUTO_DISMISS_MS = 2800

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, { type = 'success' } = {}) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, message, type }])
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    },
    [dismissToast]
  )

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>")
  return ctx
}
