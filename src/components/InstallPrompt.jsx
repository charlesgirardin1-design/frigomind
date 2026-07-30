import { useEffect, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'

// Ne propose l'installation qu'une fois par navigateur (refus ou acceptation),
// et jamais si l'app tourne déjà en mode installé — même schéma que
// CookieBanner.jsx/OnboardingTour.jsx.
const DISMISSED_KEY = 'frigomind:installPromptDismissed'
const COOKIE_CONSENT_KEY = 'frigomind:cookiesAccepted'

const STRINGS = {
  fr: {
    ariaLabel: "Proposition d'installation de l'application",
    title: 'Installer FrigoMind',
    text: "Ajoutez FrigoMind à votre écran d'accueil pour l'ouvrir en un geste, comme une vraie app.",
    install: 'Installer',
    later: 'Plus tard',
  },
  en: {
    ariaLabel: 'App install prompt',
    title: 'Install FrigoMind',
    text: 'Add FrigoMind to your home screen to open it in one tap, like a real app.',
    install: 'Install',
    later: 'Not now',
  },
}

function isStandalone() {
  return typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches
}

// Bandeau "Ajouter à l'écran d'accueil" : le navigateur ne propose ce geste
// que via l'événement `beforeinstallprompt` (Chrome/Edge/Android — pas
// Safari/iOS, qui n'a pas d'équivalent programmable), donc ce bandeau ne
// s'affiche que là où c'est réellement possible plutôt que d'afficher un
// bouton qui ne ferait rien ailleurs.
export default function InstallPrompt() {
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    let dismissed = false
    try {
      dismissed = !!localStorage.getItem(DISMISSED_KEY)
    } catch {
      // Stockage indisponible : tant pis, le bandeau pourra réapparaître.
    }
    if (dismissed) return

    function handleBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      // Laisse le bandeau cookies passer en premier s'il est encore affiché,
      // pour ne pas empiler deux bandeaux fixes en bas d'écran d'un coup.
      try {
        if (localStorage.getItem(COOKIE_CONSENT_KEY)) {
          setVisible(true)
        } else {
          setTimeout(() => setVisible(true), 4000)
        }
      } catch {
        setVisible(true)
      }
    }
    function handleInstalled() {
      setVisible(false)
      try {
        localStorage.setItem(DISMISSED_KEY, 'true')
      } catch {
        // idem : pas bloquant.
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // Pas grave : au pire le bandeau réapparaît la prochaine visite.
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    // Que l'utilisateur accepte ou refuse la boîte de dialogue native, on ne
    // reproposera pas : `beforeinstallprompt` ne se redéclenche pas avant
    // longtemps de toute façon, mais autant être explicite.
    dismiss()
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div
      className="print:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-4 animate-fadeIn"
      role="region"
      aria-label={s.ariaLabel}
    >
      <div className="max-w-3xl mx-auto card px-5 py-4 flex items-center gap-3.5">
        <img src="/logo-32.png" alt="" className="w-10 h-10 rounded-xl shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-50">{s.title}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{s.text}</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button type="button" onClick={handleInstall} className="btn-primary !py-2 !px-4 text-xs whitespace-nowrap">
            {s.install}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
          >
            {s.later}
          </button>
        </div>
      </div>
    </div>
  )
}
