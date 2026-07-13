import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { localizeRecipeName } from '../data/recipesDB.js'
import PageHeader from '../components/PageHeader.jsx'
import SkeletonCard from '../components/Skeleton.jsx'
import { IllustrationTile, ClockGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'Historique',
    subtitle: 'Vos sessions de recettes générées, conservées localement sur cet appareil.',
    clearAll: 'Effacer tout',
    empty: 'Aucune recette générée pour le moment.',
    start: '📸 Commencer',
    ingredients: 'Ingrédients :',
    dateLocale: 'fr-FR',
  },
  en: {
    title: 'History',
    subtitle: 'Your generated recipe sessions, kept locally on this device.',
    clearAll: 'Clear all',
    empty: 'No recipes generated yet.',
    start: '📸 Get started',
    ingredients: 'Ingredients:',
    dateLocale: 'en-US',
  },
}

function formatDate(iso, locale) {
  const d = new Date(iso)
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Historique (bonus) des sessions de recettes générées, persistées en localStorage.
export default function HistoryPage() {
  const { state, goTo, wipeHistory } = useApp()
  const { authLoading } = useAuth()
  const lang = useLanguage()
  const s = STRINGS[lang]
  // Fenêtre de chargement : le temps que Firebase confirme la session avant
  // que state.history ne soit peuplé. On affiche des squelettes plutôt que
  // le message "aucune recette", qui sinon flasherait avant les vraies données.
  const isLoadingUserData = authLoading

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<ClockGlyph className="w-full h-full" />}
        title={s.title}
        subtitle={s.subtitle}
        action={
          state.history.length > 0 && (
            <button onClick={wipeHistory} className="text-xs text-neutral-400 hover:text-red-500">
              {s.clearAll}
            </button>
          )
        }
      />

      {isLoadingUserData ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : state.history.length === 0 ? (
        <div className="mt-8 card p-8 text-center flex flex-col items-center">
          <IllustrationTile tone="neutral" size="lg" className="mb-4">
            <ClockGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500 text-sm max-w-xs">{s.empty}</p>
          <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            {s.start}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {state.history.map((entry, index) => (
            <div
              key={entry.id}
              className="card p-4 animate-fadeIn"
              style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
            >
              <p className="text-xs text-neutral-400">{formatDate(entry.date, s.dateLocale)}</p>
              <p className="text-sm text-neutral-600 mt-1">
                {s.ingredients} <span className="text-neutral-800">{entry.ingredients.join(', ') || '—'}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.recipes.map((r) => (
                  <span key={r.id} className="badge badge-neutral">
                    {r.emoji} {localizeRecipeName(r, lang)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
