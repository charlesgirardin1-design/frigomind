import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, CalendarGlyph } from '../components/Illustrations.jsx'

// Chiffres feuilletés par la mini icône calendrier (voir FlippingCalendarIcon
// ci-dessous) — une suite arbitraire qui monte pour évoquer "les jours
// défilent jusqu'à la sortie", sans lien avec une vraie date.
const CALENDAR_DAYS = [12, 13, 14, 15, 16, 17, 18]

// Petit calendrier "à feuillets" : deux anneaux de reliure en haut, un
// chiffre du jour qui bascule (rotation 3D) et se remplace toutes les
// ~1.7s. Remonté à chaque changement via `key` pour rejouer l'animation
// (même trick que le cœur des favoris dans RecipeCard.jsx).
function FlippingCalendarIcon() {
  const [dayIndex, setDayIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setDayIndex((i) => (i + 1) % CALENDAR_DAYS.length)
    }, 1700)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="w-full h-full flex flex-col rounded-lg overflow-hidden ring-1 ring-fresh-900/10 dark:ring-fresh-50/10 shadow-sm">
      <div className="h-[26%] bg-fresh-600 flex items-center justify-center gap-1.5 shrink-0">
        <span className="w-1 h-2 rounded-full bg-white/70" />
        <span className="w-1 h-2 rounded-full bg-white/70" />
      </div>
      <div
        className="flex-1 bg-white dark:bg-neutral-900 flex items-center justify-center"
        style={{ perspective: '200px' }}
      >
        <span
          key={dayIndex}
          className="font-extrabold text-fresh-700 dark:text-fresh-400 leading-none animate-calendarFlip"
          style={{ fontSize: '1.6rem' }}
        >
          {CALENDAR_DAYS[dayIndex]}
        </span>
      </div>
    </div>
  )
}

// Petites phrases affichées façon machine à écrire sous la barre de
// progression, pour donner l'impression que le travail avance concrètement.
function TypewriterStatus({ phrases }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]
    let delay

    if (!isDeleting && charCount < current.length) {
      delay = 45 // vitesse de frappe
    } else if (!isDeleting && charCount === current.length) {
      delay = 1500 // pause phrase complète avant d'effacer
    } else if (isDeleting && charCount > 0) {
      delay = 25 // vitesse d'effacement (plus rapide que la frappe)
    } else {
      delay = 200 // pause brève avant la phrase suivante
    }

    const id = setTimeout(() => {
      if (!isDeleting && charCount < current.length) {
        setCharCount((c) => c + 1)
      } else if (!isDeleting && charCount === current.length) {
        setIsDeleting(true)
      } else if (isDeleting && charCount > 0) {
        setCharCount((c) => c - 1)
      } else {
        setIsDeleting(false)
        setPhraseIndex((i) => (i + 1) % phrases.length)
      }
    }, delay)

    return () => clearTimeout(id)
  }, [charCount, isDeleting, phraseIndex, phrases])

  return (
    <p className="text-xs text-neutral-400 dark:text-neutral-500 h-4">
      {phrases[phraseIndex].slice(0, charCount)}
      <span className="inline-block w-[1px] h-3 bg-neutral-400 dark:bg-neutral-500 ml-0.5 align-middle animate-blink" />
    </p>
  )
}

// Petits ingrédients qui dérivent en orbite autour de l'icône, comme si des
// recettes étaient "en préparation" pendant que la page se construit.
// Chacun a sa propre position, taille, vitesse et direction de dérive
// (variables CSS --drift-x/--drift-y consommées par le keyframe `drift`,
// voir tailwind.config.js) pour un mouvement organique plutôt qu'un simple
// défilé synchronisé.
const DRIFTING_INGREDIENTS = [
  { emoji: '🍅', top: '2%', left: '6%', size: 'text-2xl', duration: '5.5s', delay: '0s', x: '10px', y: '-16px' },
  { emoji: '🥕', top: '8%', right: '4%', size: 'text-xl', duration: '6.5s', delay: '-1.2s', x: '-12px', y: '-10px' },
  { emoji: '🧀', top: '42%', left: '0%', size: 'text-xl', duration: '5s', delay: '-2.4s', x: '14px', y: '8px' },
  { emoji: '🍗', top: '46%', right: '0%', size: 'text-2xl', duration: '7s', delay: '-3.1s', x: '-10px', y: '12px' },
  { emoji: '🍋', bottom: '4%', left: '10%', size: 'text-xl', duration: '6s', delay: '-0.6s', x: '8px', y: '-10px' },
  { emoji: '🥦', bottom: '0%', right: '12%', size: 'text-2xl', duration: '5.8s', delay: '-4s', x: '-14px', y: '-8px' },
  { emoji: '🧄', top: '-6%', left: '38%', size: 'text-lg', duration: '6.2s', delay: '-2s', x: '10px', y: '10px' },
  { emoji: '🍚', bottom: '-6%', right: '36%', size: 'text-lg', duration: '5.3s', delay: '-3.6s', x: '-8px', y: '10px' },
]

const STRINGS = {
  fr: {
    title: 'Toutes les recettes',
    comingSoon: 'Bientôt disponible',
    body: "On prépare une page pour parcourir et chercher librement dans toute la base de recettes, sans passer par une photo. Reviens bientôt !",
    inProgress: 'En préparation',
    statusPhrases: [
      'Ajout des filtres…',
      'Recherche par cuisine du monde…',
      'Indexation des 750 recettes…',
      'Presque prêt…',
    ],
    cta: '📸 Générer des recettes maintenant',
  },
  en: {
    title: 'All recipes',
    comingSoon: 'Coming soon',
    body: "We're building a page to freely browse and search the whole recipe database, no photo needed. Check back soon!",
    inProgress: 'In the works',
    statusPhrases: [
      'Adding filters…',
      'Building world-cuisine search…',
      'Indexing 750 recipes…',
      'Almost ready…',
    ],
    cta: '📸 Generate recipes now',
  },
}

// Page "Toutes les recettes" : le catalogue/recherche libre est en cours de
// refonte, on affiche un message "Bientôt disponible" en attendant plutôt
// que de retirer complètement le lien de navigation.
export default function RecipesBrowsePage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<CalendarGlyph className="w-full h-full" />}
        tone="fresh"
        title={s.title}
      />

      <div className="mt-6 card p-10 text-center flex flex-col items-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-12 -left-10 w-40 h-40 rounded-full bg-fresh-200/30 blur-3xl -z-10 animate-blob"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-14 -right-8 w-36 h-36 rounded-full bg-zest-200/30 blur-3xl -z-10 animate-blob"
          style={{ animationDelay: '-6s' }}
          aria-hidden
        />

        <div className="relative w-full max-w-[220px] h-32 mb-3 mx-auto" aria-hidden>
          {DRIFTING_INGREDIENTS.map((ing, i) => (
            <span
              key={i}
              className={`absolute ${ing.size} animate-drift select-none`}
              style={{
                top: ing.top,
                left: ing.left,
                right: ing.right,
                bottom: ing.bottom,
                animationDuration: ing.duration,
                animationDelay: ing.delay,
                '--drift-x': ing.x,
                '--drift-y': ing.y,
              }}
            >
              {ing.emoji}
            </span>
          ))}
          <IllustrationTile tone="fresh" size="lg" className="absolute inset-0 m-auto animate-float">
            <FlippingCalendarIcon />
          </IllustrationTile>
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{s.comingSoon}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm mt-2">{s.body}</p>

        <div className="mt-5 flex flex-col items-center gap-2" aria-hidden>
          <span className="text-[11px] font-semibold text-fresh-600 dark:text-fresh-400 tracking-wide uppercase">
            {s.inProgress}
          </span>
          <div className="w-40 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-fresh-400 via-zest-400 to-fresh-400 animate-indeterminate" />
          </div>
          <TypewriterStatus phrases={s.statusPhrases} />
        </div>

        <button onClick={() => goTo('upload')} className="btn-primary mt-6">
          {s.cta}
        </button>
      </div>
    </div>
  )
}
