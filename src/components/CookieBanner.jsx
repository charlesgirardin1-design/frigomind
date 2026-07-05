import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'

const STORAGE_KEY = 'frigomind:cookiesAccepted'

const STRINGS = {
  fr: {
    ariaLabel: 'Bandeau de consentement aux cookies',
    text: "FrigoMind n'utilise pas de cookies de suivi publicitaire. Le stockage local de votre navigateur sert uniquement à conserver votre historique de recettes sur cet appareil.",
    learnMore: 'En savoir plus',
    accept: "J'accepte",
  },
  en: {
    ariaLabel: 'Cookie consent banner',
    text: "FrigoMind doesn't use advertising tracking cookies. Your browser's local storage is only used to keep your recipe history on this device.",
    learnMore: 'Learn more',
    accept: 'Accept',
  },
}

export default function CookieBanner() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setVisible(false)
  }

  function goToCookiesSection() {
    goTo('legal')
    window.location.hash = '#cookies'
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 animate-fadeIn" role="region" aria-label={s.ariaLabel}>
      <div className="max-w-3xl mx-auto bg-white border border-neutral-200 shadow-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3.5">
        <p className="text-sm text-neutral-600 leading-relaxed flex-1">
          {s.text}{' '}
          <button type="button" onClick={goToCookiesSection} className="text-fresh-700 underline underline-offset-2">
            {s.learnMore}
          </button>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 bg-fresh-600 hover:bg-fresh-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition"
        >
          {s.accept}
        </button>
      </div>
    </div>
  )
}
