import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { localizeRecipeName } from '../data/recipesDB.js'
import RecipeModal from '../components/RecipeModal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, CalendarGlyph } from '../components/Illustrations.jsx'
import { DAYS_OF_WEEK } from '../utils/storage.js'
import { dedupeIngredientList, copyTextToClipboard } from '../utils/shoppingList.js'

const DAY_LABELS = {
  fr: {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche',
  },
  en: {
    lundi: 'Monday',
    mardi: 'Tuesday',
    mercredi: 'Wednesday',
    jeudi: 'Thursday',
    vendredi: 'Friday',
    samedi: 'Saturday',
    dimanche: 'Sunday',
  },
}

const STRINGS = {
  fr: {
    title: 'Planning de la semaine',
    subtitle: 'Glissez une recette favorite sur un jour (ou touchez-la pour la sélectionner, puis touchez un jour sur mobile).',
    empty: "Ajoutez d'abord des recettes à vos favoris (❤️) pour pouvoir les planifier ici.",
    seeFavorites: '❤️ Voir mes favoris',
    yourFavorites: 'Vos recettes favorites',
    selected: (name) => `« ${name} » sélectionnée — touchez un jour pour l'y assigner.`,
    removeAria: (day) => `Retirer la recette de ${day}`,
    tapToAssign: 'Toucher pour assigner',
    noRecipe: 'Aucune recette',
    shoppingList: '🛒 Liste de courses de la semaine',
    copy: 'Copier',
    copied: '✅ Copié',
  },
  en: {
    title: 'Weekly planning',
    subtitle: 'Drag a favorite recipe onto a day (or tap it to select it, then tap a day on mobile).',
    empty: 'First add recipes to your favorites (❤️) so you can plan them here.',
    seeFavorites: '❤️ See my favorites',
    yourFavorites: 'Your favorite recipes',
    selected: (name) => `"${name}" selected — tap a day to assign it.`,
    removeAria: (day) => `Remove the recipe from ${day}`,
    tapToAssign: 'Tap to assign',
    noRecipe: 'No recipe',
    shoppingList: '🛒 Weekly shopping list',
    copy: 'Copy',
    copied: '✅ Copied',
  },
}

// Page "Planning de la semaine" : on assigne des recettes favorites aux 7
// jours, par glisser-déposer (desktop) ou en sélectionnant une recette puis
// en touchant un jour (mobile, plus fiable que le drag-and-drop tactile).
// En bas, liste de courses agrégée sur toutes les recettes de la semaine.
export default function PlanningPage() {
  const { state, goTo, assignRecipeToDay, clearDay } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const dayLabels = DAY_LABELS[lang]
  const [selectedFavId, setSelectedFavId] = useState(null)
  const [activeRecipe, setActiveRecipe] = useState(null)
  const [copied, setCopied] = useState(false)

  const favorites = state.favorites
  const selectedRecipe = favorites.find((r) => r.favId === selectedFavId) || null

  function handleDragStart(e, recipe) {
    e.dataTransfer.setData('text/plain', recipe.favId)
  }

  function handleDrop(e, day) {
    e.preventDefault()
    const favId = e.dataTransfer.getData('text/plain')
    const recipe = favorites.find((r) => r.favId === favId)
    if (recipe) assignRecipeToDay(day, recipe)
  }

  function handleDayClick(day) {
    const assigned = state.planning[day]
    if (assigned) {
      setActiveRecipe(assigned)
      return
    }
    if (selectedRecipe) {
      assignRecipeToDay(day, selectedRecipe)
      setSelectedFavId(null)
    }
  }

  const weekRecipes = DAYS_OF_WEEK.map((day) => state.planning[day]).filter(Boolean)
  const shoppingList = dedupeIngredientList(weekRecipes.flatMap((r) => r.missingIngredients || []))

  async function handleCopy() {
    const ok = await copyTextToClipboard(shoppingList.join('\n'))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<CalendarGlyph className="w-full h-full" />}
        title={s.title}
        subtitle={s.subtitle}
      />

      {favorites.length === 0 ? (
        <div className="mt-8 card p-8 text-center flex flex-col items-center">
          <IllustrationTile tone="fresh" size="lg" className="mb-4">
            <CalendarGlyph className="w-full h-full" />
          </IllustrationTile>
          <p className="text-neutral-500 text-sm max-w-xs">{s.empty}</p>
          <button onClick={() => goTo('favorites')} className="btn-primary mt-4 px-5 py-2.5 text-sm">
            {s.seeFavorites}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-7">
            <h3 className="font-semibold text-neutral-900 mb-2 text-sm">{s.yourFavorites}</h3>
            <div className="flex flex-wrap gap-2">
              {favorites.map((recipe) => (
                <button
                  key={recipe.favId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, recipe)}
                  onClick={() => setSelectedFavId(selectedFavId === recipe.favId ? null : recipe.favId)}
                  className={`chip cursor-grab active:cursor-grabbing ${
                    selectedFavId === recipe.favId ? 'chip-active' : ''
                  }`}
                >
                  {recipe.emoji} {localizeRecipeName(recipe, lang)}
                </button>
              ))}
            </div>
            {selectedRecipe && (
              <p className="text-xs text-fresh-700 mt-2">{s.selected(localizeRecipeName(selectedRecipe, lang))}</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const recipe = state.planning[day]
              return (
                <div
                  key={day}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={() => handleDayClick(day)}
                  className={`card p-4 cursor-pointer min-h-[84px] flex flex-col justify-center transition ${
                    !recipe && selectedRecipe ? 'border-fresh-300 bg-fresh-50/40' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                    {dayLabels[day]}
                  </p>
                  {recipe ? (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-neutral-800 truncate">
                        {recipe.emoji} {localizeRecipeName(recipe, lang)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clearDay(day)
                        }}
                        aria-label={s.removeAria(dayLabels[day])}
                        className="shrink-0 text-neutral-300 hover:text-red-500 text-sm px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-neutral-300">
                      {selectedRecipe ? s.tapToAssign : s.noRecipe}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {shoppingList.length > 0 && (
            <div className="mt-8 card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-neutral-900">{s.shoppingList}</h3>
                <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">
                  {copied ? s.copied : s.copy}
                </button>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {shoppingList.map((name) => (
                  <li key={name} className="chip !cursor-default">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeRecipe && <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
    </div>
  )
}
