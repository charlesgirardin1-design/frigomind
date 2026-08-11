import { useMemo, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { CalendarGlyph } from '../components/Illustrations.jsx'
import { RECIPES } from '../data/recipesDB.js'
import { isFavoriteRecipe } from '../utils/storage.js'

const PAGE_SIZE = 24
const DIET_FILTERS = ['vegan', 'vegetarien', 'sans-gluten']
const CUISINE_FILTERS = ['rapide', 'healthy', 'gourmand']

const STRINGS = {
  fr: {
    title: 'Toutes les recettes',
    subtitle: (n) => `${n} recettes à parcourir librement, sans passer par une photo.`,
    searchPlaceholder: 'Chercher une recette ou un ingrédient…',
    allDiets: 'Tous régimes',
    allCuisines: 'Toutes cuisines',
    noResults: "Aucune recette ne correspond à ces critères. Essayez d'élargir votre recherche.",
    resultsCount: (n) => `${n} recette${n > 1 ? 's' : ''}`,
    loadMore: 'Voir plus de recettes',
  },
  en: {
    title: 'All recipes',
    subtitle: (n) => `${n} recipes to browse freely, no photo needed.`,
    searchPlaceholder: 'Search a recipe or an ingredient…',
    allDiets: 'All diets',
    allCuisines: 'All cuisines',
    noResults: 'No recipe matches these filters. Try widening your search.',
    resultsCount: (n) => `${n} recipe${n > 1 ? 's' : ''}`,
    loadMore: 'Show more recipes',
  },
}

// Page "Toutes les recettes" : recherche + filtres (régime, cuisine) sur
// l'ensemble de la base (RECIPES, ~1500 entrées), sans passer par le scan
// photo. Pagination locale (`visibleCount`) plutôt que tout rendre d'un
// coup : 1500 RecipeCard en une passe ferait ramer le rendu initial pour un
// gain nul (personne ne scrolle jusqu'au bout de toute façon).
export default function RecipesBrowsePage() {
  const { state, goTo, toggleFavorite, openRecipe } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const c = COMMON[lang].recipe

  const [query, setQuery] = useState('')
  const [dietFilter, setDietFilter] = useState(null)
  const [cuisineFilter, setCuisineFilter] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return RECIPES.filter((recipe) => {
      if (dietFilter && !recipe.diet?.includes(dietFilter)) return false
      if (cuisineFilter && recipe.cuisine !== cuisineFilter) return false
      if (q) {
        const haystack = [recipe.name, recipe.nameEn, ...recipe.required, ...recipe.optional]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [query, dietFilter, cuisineFilter])

  const visible = filtered.slice(0, visibleCount)

  function resetPaging() {
    setVisibleCount(PAGE_SIZE)
  }

  function toggleDiet(value) {
    setDietFilter((current) => (current === value ? null : value))
    resetPaging()
  }

  function toggleCuisine(value) {
    setCuisineFilter((current) => (current === value ? null : value))
    resetPaging()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<CalendarGlyph className="w-full h-full" />}
        tone="fresh"
        title={s.title}
        subtitle={s.subtitle(RECIPES.length)}
      />

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          resetPaging()
        }}
        placeholder={s.searchPlaceholder}
        className="mt-5 w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-2.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100 dark:focus:ring-fresh-900/40 bg-white dark:bg-neutral-900"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleDiet(null)}
          className={`chip ${dietFilter === null ? 'chip-active' : ''}`}
        >
          {s.allDiets}
        </button>
        {DIET_FILTERS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleDiet(tag)}
            className={`chip ${dietFilter === tag ? 'chip-active' : ''}`}
          >
            {c.dietLabels[tag]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleCuisine(null)}
          className={`chip ${cuisineFilter === null ? 'chip-active' : ''}`}
        >
          {s.allCuisines}
        </button>
        {CUISINE_FILTERS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleCuisine(tag)}
            className={`chip capitalize ${cuisineFilter === tag ? 'chip-active' : ''}`}
          >
            {c.cuisine[tag] || tag}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">{s.resultsCount(filtered.length)}</p>

      {filtered.length === 0 ? (
        <div className="mt-6 card p-8 text-center">
          <p className="text-neutral-500 text-sm">{s.noResults}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((recipe, index) => (
              <div
                key={recipe.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${Math.min(index % PAGE_SIZE, 10) * 50}ms` }}
              >
                <RecipeCard
                  recipe={recipe}
                  onOpen={openRecipe}
                  isFavorite={isFavoriteRecipe(state.favorites, recipe)}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setVisibleCount((n) => n + PAGE_SIZE)} className="btn-secondary">
                {s.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
