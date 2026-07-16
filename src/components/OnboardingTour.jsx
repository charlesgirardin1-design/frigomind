import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { IllustrationTile, CameraGlyph, BookGlyph, PotGlyph } from './Illustrations.jsx'

// Vue une seule fois par navigateur (pas par compte : utile aussi pour un
// visiteur pas encore connecté) — voir CookieBanner.jsx pour le même schéma.
const STORAGE_KEY = 'frigomind:onboardingSeen'

const STRINGS = {
  fr: {
    ariaLabel: 'Visite guidée de FrigoMind',
    skip: 'Passer',
    next: 'Suivant',
    start: "C'est parti",
    slides: [
      {
        Icon: CameraGlyph,
        tone: 'fresh',
        title: '1. Une photo',
        text: 'Prenez en photo votre frigo ou votre table — pas besoin de tout lister à la main.',
      },
      {
        Icon: BookGlyph,
        tone: 'zest',
        title: '2. Vous vérifiez',
        text: "FrigoMind détecte les ingrédients, vous corrigez ou complétez la liste en un instant.",
      },
      {
        Icon: PotGlyph,
        tone: 'fresh',
        title: '3. Vous cuisinez',
        text: '3 à 5 recettes prêtes à faire, avec les ingrédients que vous avez déjà.',
      },
    ],
  },
  en: {
    ariaLabel: 'FrigoMind guided tour',
    skip: 'Skip',
    next: 'Next',
    start: "Let's go",
    slides: [
      {
        Icon: CameraGlyph,
        tone: 'fresh',
        title: '1. Take a photo',
        text: "Snap a picture of your fridge or table — no need to list everything by hand.",
      },
      {
        Icon: BookGlyph,
        tone: 'zest',
        title: '2. You check it',
        text: 'FrigoMind detects the ingredients, you fix or complete the list in a second.',
      },
      {
        Icon: PotGlyph,
        tone: 'fresh',
        title: '3. You cook',
        text: '3 to 5 ready-to-make recipes, using what you already have.',
      },
    ],
  },
}

// Petite présentation en 3 diapositives montrée une fois, au tout premier
// passage sur l'accueil — complète (sans faire doublon) la section "3 étapes"
// déjà statique sur la page, pour les visiteurs qui ne la liraient pas.
export default function OnboardingTour() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // Stockage indisponible : on ne bloque pas, on montre simplement la
      // visite à chaque visite plutôt que de planter.
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Pas grave : au pire la visite réapparaît la prochaine fois.
    }
    setVisible(false)
  }

  function handleNext() {
    if (step < s.slides.length - 1) {
      setStep((n) => n + 1)
    } else {
      dismiss()
      goTo('upload')
    }
  }

  useEffect(() => {
    if (!visible) return
    function handleKey(e) {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  const slide = s.slides[step]
  const isLast = step === s.slides.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={s.ariaLabel}
      onClick={dismiss}
    >
      <div className="card p-6 max-w-sm w-full text-center animate-popIn" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={dismiss}
          className="float-right text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
        >
          {s.skip}
        </button>

        <IllustrationTile tone={slide.tone} size="lg" className="mx-auto mb-4" key={step}>
          <slide.Icon className="w-full h-full" />
        </IllustrationTile>

        <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-50">{slide.title}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{slide.text}</p>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          {s.slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-5 bg-fresh-600' : 'w-1.5 bg-neutral-200 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        <button type="button" onClick={handleNext} className="btn-primary w-full mt-5">
          {isLast ? s.start : s.next}
        </button>
      </div>
    </div>
  )
}
