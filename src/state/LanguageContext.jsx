// -----------------------------------------------------------------------------
// LanguageContext.jsx
// Langue de l'interface (fr/en) : détectée automatiquement depuis la langue du
// navigateur au premier chargement, puis modifiable manuellement (drapeau
// FR/EN dans le header) — le choix est mémorisé pour les prochaines visites.
// -----------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'frigomind_lang'

function detectLanguage() {
  if (typeof navigator === 'undefined') return 'fr'
  const browserLang = navigator.language || navigator.userLanguage || 'fr'
  return browserLang.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    // Stockage indisponible (navigation privée stricte, etc.) : on retombe
    // simplement sur la détection automatique.
  }
  return detectLanguage()
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage)

  // Synchronise l'attribut lang du document (accessibilité / lecteurs
  // d'écran), qui reste sur "fr" par défaut dans index.html sinon.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((next) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Stockage indisponible : le changement reste actif pour la session
      // en cours, simplement pas mémorisé pour la prochaine visite.
    }
  }, [])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

function useLanguageContext() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage doit être utilisé à l'intérieur de <LanguageProvider>")
  return ctx
}

// La grande majorité des composants n'ont besoin que de la langue courante
// (ex: STRINGS[lang]) : on garde donc useLanguage() en simple string comme
// avant, pour ne pas devoir toucher toutes les pages qui l'utilisent déjà.
export function useLanguage() {
  return useLanguageContext().lang
}

// Réservé au sélecteur de langue (drapeaux dans le header) : expose aussi le
// setter.
export function useLanguageControls() {
  return useLanguageContext()
}
