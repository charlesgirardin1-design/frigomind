// -----------------------------------------------------------------------------
// ThemeContext.jsx
// Thème clair/sombre : détecté depuis la préférence système au premier
// chargement (prefers-color-scheme), puis modifiable manuellement (bouton
// dans le header) — le choix est mémorisé pour les prochaines visites.
// Applique/retire la classe "dark" sur <html>, que Tailwind utilise comme
// ancre pour tous les utilitaires dark: (darkMode: 'class').
// -----------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'frigomind_theme'

function detectSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Stockage indisponible : on retombe simplement sur la détection système.
  }
  return detectSystemTheme()
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Stockage indisponible : le changement reste actif pour la session
      // en cours, simplement pas mémorisé pour la prochaine visite.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme doit être utilisé à l'intérieur de <ThemeProvider>")
  return ctx
}
