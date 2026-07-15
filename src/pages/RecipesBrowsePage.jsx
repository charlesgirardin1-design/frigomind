import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, CalendarGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'Toutes les recettes',
    comingSoon: 'Bientôt disponible',
    body: "On prépare une page pour parcourir et chercher librement dans toute la base de recettes, sans passer par une photo. Reviens bientôt !",
    cta: '📸 Générer des recettes maintenant',
  },
  en: {
    title: 'All recipes',
    comingSoon: 'Coming soon',
    body: "We're building a page to freely browse and search the whole recipe database, no photo needed. Check back soon!",
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

        <IllustrationTile tone="fresh" size="lg" className="mb-5 animate-float">
          <CalendarGlyph className="w-full h-full" />
        </IllustrationTile>

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{s.comingSoon}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm mt-2">{s.body}</p>

        <button onClick={() => goTo('upload')} className="btn-primary mt-6">
          {s.cta}
        </button>
      </div>
    </div>
  )
}
