import { useMemo } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { localizeRecipeName } from '../data/recipesDB.js'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, ChartGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'Vos statistiques',
    subtitle: 'Un petit résumé de votre activité sur FrigoMind, calculé à partir de votre historique local.',
    empty: 'Pas encore de statistiques : générez vos premières recettes pour voir apparaître vos chiffres ici.',
    start: '📸 Commencer',
    sessions: (n) => `session${n > 1 ? 's' : ''} de recettes générée${n > 1 ? 's' : ''}`,
    totalRecipes: (n) => `recette${n > 1 ? 's' : ''} reçue${n > 1 ? 's' : ''} au total`,
    topIngredients: 'Vos ingrédients les plus fréquents',
    topRecipes: 'Vos recettes les plus recommandées',
    footer: (n) =>
      `Calculé sur vos ${n} dernière${n > 1 ? 's' : ''} session${n > 1 ? 's' : ''} enregistrée${
        n > 1 ? 's' : ''
      } sur cet appareil (l'historique local conserve au maximum les 20 dernières). Rien n'est envoyé à un serveur.`,
  },
  en: {
    title: 'Your stats',
    subtitle: 'A quick summary of your activity on FrigoMind, calculated from your local history.',
    empty: 'No stats yet: generate your first recipes to see your numbers appear here.',
    start: '📸 Get started',
    sessions: (n) => `recipe session${n > 1 ? 's' : ''} generated`,
    totalRecipes: (n) => `recipe${n > 1 ? 's' : ''} received in total`,
    topIngredients: 'Your most frequent ingredients',
    topRecipes: 'Your most recommended recipes',
    footer: (n) =>
      `Calculated from your ${n} most recent session${n > 1 ? 's' : ''} saved on this device (local history keeps at most the last 20). Nothing is sent to a server.`,
  },
}

// Calcule quelques statistiques simples à partir de l'historique local
// (sessions les plus récentes uniquement, voir note en bas de page).
function computeStats(history) {
  const sessions = history.length
  const totalRecipes = history.reduce((sum, entry) => sum + (entry.recipes?.length || 0), 0)

  const ingredientCounts = {}
  history.forEach((entry) => {
    ;(entry.ingredients || []).forEach((name) => {
      const key = name.trim().toLowerCase()
      if (!key) return
      ingredientCounts[key] = (ingredientCounts[key] || 0) + 1
    })
  })
  const topIngredients = Object.entries(ingredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const recipeCounts = {}
  history.forEach((entry) => {
    ;(entry.recipes || []).forEach((r) => {
      const key = r.name
      if (!recipeCounts[key]) recipeCounts[key] = { id: r.id, name: r.name, emoji: r.emoji, count: 0 }
      recipeCounts[key].count += 1
    })
  })
  const topRecipes = Object.values(recipeCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { sessions, totalRecipes, topIngredients, topRecipes }
}

// Page "Statistiques" : petit bonus gamifié basé sur l'historique local
// (localStorage), sans envoi de données à un serveur.
export default function StatsPage() {
  const { state, goTo, goToIngredient } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const stats = useMemo(() => computeStats(state.history), [state.history])
  const hasData = stats.sessions > 0

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<ChartGlyph className="w-full h-full" />}
        tone="zest"
        title={s.title}
        subtitle={s.subtitle}
      />

      {!hasData ? (
        <div className="mt-8 card p-8 text-center flex flex-col items-center">
          <IllustrationTile tone="zest" size="lg" className="mb-4">
            <ChartGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500 text-sm max-w-xs">{s.empty}</p>
          <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            {s.start}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <div className="text-3xl font-extrabold text-fresh-700">{stats.sessions}</div>
              <p className="text-sm text-neutral-500 mt-1">{s.sessions(stats.sessions)}</p>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-extrabold text-fresh-700">{stats.totalRecipes}</div>
              <p className="text-sm text-neutral-500 mt-1">{s.totalRecipes(stats.totalRecipes)}</p>
            </div>
          </div>

          {stats.topIngredients.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900 mb-2">{s.topIngredients}</h3>
              <div className="flex flex-wrap gap-2">
                {stats.topIngredients.map(([name, count]) => (
                  <button key={name} onClick={() => goToIngredient(name)} className="chip">
                    {name} <span className="text-neutral-400">×{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stats.topRecipes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900 mb-2">{s.topRecipes}</h3>
              <div className="space-y-2">
                {stats.topRecipes.map((r) => (
                  <div key={r.name} className="card p-3 flex items-center justify-between">
                    <span className="text-sm text-neutral-800">
                      {r.emoji} {localizeRecipeName(r, lang)}
                    </span>
                    <span className="badge badge-fresh">×{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 text-xs text-neutral-400 text-center">{s.footer(stats.sessions)}</p>
        </>
      )}
    </div>
  )
}
