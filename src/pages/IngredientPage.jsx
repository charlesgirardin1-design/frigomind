import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { findRecipesUsingIngredient } from '../logic/recipeEngine.js'
import { isPerishable, isPantryStaple } from '../data/expiryData.js'
import { isFavoriteRecipe } from '../utils/storage.js'
import RecipeCard from '../components/RecipeCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, SearchGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'Recettes par ingrédient',
    subtitle:
      "Cherchez un ingrédient pour voir toutes les recettes qui l'utilisent, avec une astuce de conservation pour éviter de le gaspiller.",
    searchPlaceholder: 'ex : champignons',
    search: 'Chercher',
    pantryStaple: '🧂 Ingrédient de base : se conserve longtemps, toujours utile d\'en avoir sous la main.',
    perishable: '♻️ Périssable : à cuisiner rapidement (quelques jours au frigo en général) pour éviter le gaspillage.',
    general: 'Se conserve en général plusieurs jours à quelques semaines selon le mode de conservation.',
    matchesFound: (count, name) => `${count} recette${count > 1 ? 's' : ''} avec ${name}`,
    noMatches: (name) => `Aucune recette trouvée avec "${name}"`,
    noMatchesHint:
      'Essayez un autre nom, ou scannez votre frigo pour découvrir des recettes adaptées à ce que vous avez vraiment.',
    scan: '📸 Scanner mes ingrédients',
  },
  en: {
    title: 'Recipes by ingredient',
    subtitle: 'Search for an ingredient to see every recipe that uses it, plus a tip to avoid wasting it.',
    searchPlaceholder: 'e.g. mushrooms',
    search: 'Search',
    pantryStaple: '🧂 Pantry staple: keeps for a long time, always useful to have on hand.',
    perishable: '♻️ Perishable: cook it soon (usually a few days in the fridge) to avoid waste.',
    general: 'Generally keeps for several days to a few weeks depending on storage.',
    matchesFound: (count, name) => `${count} recipe${count > 1 ? 's' : ''} with ${name}`,
    noMatches: (name) => `No recipe found with "${name}"`,
    noMatchesHint: 'Try another name, or scan your fridge to discover recipes suited to what you really have.',
    scan: '📸 Scan my ingredients',
  },
}

// Page "Ingrédient" : cherchez un ingrédient (ou cliquez dessus depuis une
// recette ou vos statistiques) pour voir toutes les recettes de la base qui
// l'utilisent, plus une astuce de conservation anti-gaspi.
export default function IngredientPage() {
  const { state, goTo, goToIngredient, toggleFavorite, openRecipe } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [query, setQuery] = useState(state.activeIngredient || '')

  const name = state.activeIngredient?.trim()
  const matches = name ? findRecipesUsingIngredient(name) : []

  function handleSearch(e) {
    e.preventDefault()
    goToIngredient(query)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<SearchGlyph className="w-full h-full" />}
        title={s.title}
        subtitle={s.subtitle}
      />

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.searchPlaceholder}
          className="flex-1 text-sm border border-neutral-200 rounded-full px-4 py-2.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
        />
        <button type="submit" className="btn-secondary !py-2.5 !px-5 text-sm shrink-0">
          {s.search}
        </button>
      </form>

      {name && (
        <>
          <div className="mt-6 card p-4">
            <h3 className="font-semibold text-neutral-900 capitalize">{name}</h3>
            {isPantryStaple(name) ? (
              <p className="text-sm text-neutral-500 mt-1">{s.pantryStaple}</p>
            ) : isPerishable(name) ? (
              <p className="text-sm text-zest-700 mt-1">{s.perishable}</p>
            ) : (
              <p className="text-sm text-neutral-500 mt-1">{s.general}</p>
            )}
          </div>

          <h3 className="mt-6 font-semibold text-neutral-900">
            {matches.length > 0 ? s.matchesFound(matches.length, name) : s.noMatches(name)}
          </h3>

          {matches.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpen={openRecipe}
                  isFavorite={isFavoriteRecipe(state.favorites, recipe)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 card p-8 text-center flex flex-col items-center">
              <IllustrationTile tone="neutral" size="lg" className="mb-4">
                <SearchGlyph className="w-full h-full" />
              </IllustrationTile>
              <p className="text-neutral-500 text-sm max-w-xs">{s.noMatchesHint}</p>
              <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
                {s.scan}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
