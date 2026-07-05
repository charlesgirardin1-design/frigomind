import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import RecipeCard from '../components/RecipeCard.jsx'
import RecipeModal from '../components/RecipeModal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, HeartPlateGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'Mes recettes favorites',
    subtitle:
      'Retrouvez ici les recettes mises de côté avec le bouton ❤️. Elles servent aussi de base pour votre planning de la semaine.',
    empty: 'Aucun favori pour le moment. Ouvrez une recette et cliquez sur 🤍 pour la garder sous la main.',
    start: '📸 Commencer',
    ctaText: '📅 Prêt·e à organiser votre semaine avec vos favoris ?',
    ctaButton: 'Voir le planning',
  },
  en: {
    title: 'My favorite recipes',
    subtitle: 'Recipes you saved with the ❤️ button, kept here. They also feed your weekly planning.',
    empty: 'No favorites yet. Open a recipe and tap 🤍 to keep it handy.',
    start: '📸 Get started',
    ctaText: '📅 Ready to plan your week with your favorites?',
    ctaButton: 'See planning',
  },
}

// Page "Mes favoris" : recettes mises de côté (❤️ sur une RecipeCard),
// persistées en localStorage. Sert de réservoir de recettes pour le planning
// de la semaine.
export default function FavoritesPage() {
  const { state, goTo, toggleFavorite } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [activeRecipe, setActiveRecipe] = useState(null)

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<HeartPlateGlyph className="w-full h-full" />}
        tone="zest"
        title={s.title}
        subtitle={s.subtitle}
      />

      {state.favorites.length === 0 ? (
        <div className="mt-8 card p-8 text-center flex flex-col items-center">
          <IllustrationTile tone="zest" size="lg" className="mb-4">
            <HeartPlateGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500 text-sm max-w-xs">{s.empty}</p>
          <button onClick={() => goTo('upload')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            {s.start}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.favorites.map((recipe) => (
              <RecipeCard
                key={recipe.favId}
                recipe={recipe}
                onOpen={setActiveRecipe}
                isFavorite
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          <div className="mt-8 card p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">{s.ctaText}</p>
            <button onClick={() => goTo('planning')} className="btn-primary !py-2.5 !px-5 text-sm shrink-0">
              {s.ctaButton}
            </button>
          </div>
        </>
      )}

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
