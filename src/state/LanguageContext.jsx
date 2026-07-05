// -----------------------------------------------------------------------------
// LanguageContext.jsx
// Langue de l'interface (fr/en), détectée automatiquement depuis la langue du
// navigateur au premier chargement — pas de sélecteur manuel pour ce MVP.
// -----------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo } from 'react'

const LanguageContext = createContext(null)

function detectLanguage() {
  if (typeof navigator === 'undefined') return 'fr'
  const browserLang = navigator.language || navigator.userLanguage || 'fr'
  return browserLang.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function LanguageProvider({ children }) {
  // La langue du navigateur ne change pas en cours de session : pas besoin
  // d'état réactif, un simple calcul mémorisé au premier rendu suffit.
  const lang = useMemo(detectLanguage, [])

  // Synchronise l'attribut lang du document (accessibilité / lecteurs
  // d'écran), qui reste sur "fr" par défaut dans index.html sinon.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const lang = useContext(LanguageContext)
  if (!lang) throw new Error("useLanguage doit être utilisé à l'intérieur de <LanguageProvider>")
  return lang
}
