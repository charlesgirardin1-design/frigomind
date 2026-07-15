import { useMemo, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { RECIPES } from '../data/recipesDB.js'
import RecipeCard from '../components/RecipeCard.jsx'
import RecipeModal from '../components/RecipeModal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, SearchGlyph } from '../components/Illustrations.jsx'

// Paire de "regional indicator symbols" (ex : 🇰🇷, 🇮🇳) : les 46 recettes de
// cuisine du monde n'ont pas de champ dédié, seul un drapeau ajouté en fin de
// `name`/`nameEn` permet de les repérer (voir le gros commentaire en tête de
// recipesDB.js pour le contexte i18n des recettes).
const FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u

function isWorldCuisine(recipe) {
  return FLAG_REGEX.test(recipe.name) || FLAG_REGEX.test(recipe.nameEn || '')
}

const ACCENTS_REGEX = /[̀-ͯ]/g

// Même logique de normalisation que normalize() dans recipeEngine.js :
// minuscules + suppression des accents, pour un matching tolérant qui
// fonctionne quelle que soit la langue de recherche de l'utilisateur.
function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(ACCENTS_REGEX, '')
}

const TIME_OPTIONS = [15, 30, 45, null]

const STRINGS = {
  fr: {
    title: 'Toutes les recettes',
    subtitle: 'Cherchez et filtrez librement parmi les 750 recettes de la base, sans passer par une photo.',
    searchPlaceholder: 'Chercher une recette (ex : gratin, poulet...)',
    worldCuisine: '🌍 Cuisine du monde',
    vegetarian: '🌱 Végétarien uniquement',
    timeLabel: 'Temps max',
    timeAll: 'Tout',
    timeUnder: (m) => `≤ ${m} min`,
    resultsCount: (n) => `${n} recette${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''}`,
    empty: 'Aucune recette ne correspond à ces filtres.',
    emptyHint: 'Essayez un autre mot-clé, ou relâchez un filtre.',
    reset: 'Réinitialiser les filtres',
  },
  en: {
    title: 'All recipes',
    subtitle: 'Freely search and filter through all 750 recipes in the database, no photo needed.',
    searchPlaceholder: 'Search a recipe (e.g. gratin, chicken...)',
    worldCuisine: '🌍 World cuisine',
    vegetarian: '🌱 Vegetarian only',
    timeLabel: 'Max time',
    timeAll: 'All',
    timeUnder: (m) => `≤ ${m} min`,
    resultsCount: (n) => `${n} recipe${n > 1 ? 's' : ''} found`,
    empty: 'No recipe matches these filters.',
    emptyHint: 'Try another keyword, or loosen a filter.',
    reset: 'Reset filters',
  },
}

const CUISINE_OPTIONS = ['rapide', 'healthy', 'gourmand']

// Page "Toutes les recettes" : catalogue libre des 750 recettes de la base,
// avec recherche texte + filtres (cuisine du monde, végétarien, type de
// cuisine, temps max). Contrairement au flux photo → validation → résultats,
// aucune contrainte d'ingrédients disponibles ici : on parcourt simplement
// la base RECIPES telle quelle.
export default function RecipesBrowsePage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const c = COMMON[lang].recipe
  const [query, setQuery] = useState('')
  const [worldOnly, setWorldOnly] = useState(false)
  const [vegetarianOnly, setVegetarianOnly] = useState(false)
  const [cuisine, setCuisine] = useState(null)
  const [maxTime, setMaxTime] = useState(null)
  const [activeRecipe, setActiveRecipe] = useState(null)

  const normalizedQuery = normalize(query)

  const results = useMemo(() => {
    return RECIPES.filter((recipe) => {
      if (normalizedQuery) {
        const matchesName =
          normalize(recipe.name).includes(normalizedQuery) || normalize(recipe.nameEn || '').includes(normalizedQuery)
        if (!matchesName) return false
      }
      if (worldOnly && !isWorldCuisine(recipe)) return false
      if (vegetarianOnly && !recipe.diet.includes('vegetarien')) return false
      if (cuisine && recipe.cuisine !== cuisine) return false
      if (maxTime && recipe.time > maxTime) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery, worldOnly, vegetarianOnly, cuisine, maxTime])

  function resetFilters() {
    setQuery('')
    setWorldOnly(false)
    setVegetarianOnly(false)
    setCuisine(null)
    setMaxTime(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<SearchGlyph className="w-full h-full" />}
        tone="fresh"
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.searchPlaceholder}
          className="w-full text-sm border border-neutral-200 rounded-full px-4 py-2.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setWorldOnly((v) => !v)}
          className={`chip ${worldOnly ? 'chip-active' : ''}`}
        >
          {s.worldCuisine}
        </button>
        <button
          type="button"
          onClick={() => setVegetarianOnly((v) => !v)}
          className={`chip ${vegetarianOnly ? 'chip-active' : ''}`}
        >
          {s.vegetarian}
        </button>
        {CUISINE_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setCuisine((cur) => (cur === opt ? null : opt))}
            className={`chip ${cuisine === opt ? 'chip-active' : ''}`}
          >
            {c.cuisine[opt]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-400">{s.timeLabel} :</span>
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt ?? 'all'}
            type="button"
            onClick={() => setMaxTime(opt)}
            className={`chip ${maxTime === opt ? 'chip-active' : ''}`}
          >
            {opt ? s.timeUnder(opt) : s.timeAll}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-neutral-700">{s.resultsCount(results.length)}</h3>
        <button type="button" onClick={resetFilters} className="text-xs text-neutral-400 hover:text-fresh-700 transition">
          {s.reset}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="mt-4 card p-8 text-center flex flex-col items-center">
          <IllustrationTile tone="neutral" size="lg" className="mb-4">
            <SearchGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500 text-sm max-w-xs">{s.empty}</p>
          <p className="text-neutral-400 text-xs max-w-xs mt-1">{s.emptyHint}</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onOpen={setActiveRecipe} />
          ))}
        </div>
      )}

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
