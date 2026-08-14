import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PreferencesPanel from '../components/PreferencesPanel.jsx'
import AntiGaspiBanner from '../components/AntiGaspiBanner.jsx'
import IngredientSuggestions from '../components/IngredientSuggestions.jsx'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { suggestComplementaryIngredients } from '../logic/recipeEngine.js'

const STRINGS = {
  fr: {
    title: "Voici ce que j'ai détecté",
    subtitle: 'Cochez, décochez, renommez ou ajoutez des ingrédients avant de générer vos recettes.',
    photoAlt: 'Photo analysée',
    emptyState:
      "Aucun ingrédient détecté automatiquement sur cette photo (photo peu nette, ou reconnaissance IA pas encore configurée sur ce déploiement). Ajoutez vos ingrédients manuellement ci-dessous 👇",
    orMaybe: 'Ou peut-être :',
    removeAria: (name) => `Supprimer ${name}`,
    decreaseCount: (name) => `Moins de ${name}`,
    increaseCount: (name) => `Plus de ${name}`,
    addPlaceholder: 'Ajouter un ingrédient (ex : oignon)',
    add: '+ Ajouter',
    scanBarcode: '📷 Scanner un code-barres',
    seeRecipes: '🍽️ Voir mes recettes',
    preparingRecipes: 'Préparation de vos recettes…',
    surpriseMe: "🎲 J'ai faim, surprends-moi",
    preparingSurprise: 'On cherche une surprise…',
    confidenceProbable: 'probable',
    confidenceToConfirm: 'à confirmer',
    confidenceUncertain: 'incertain',
  },
  en: {
    title: 'Here’s what I detected',
    subtitle: 'Check, uncheck, rename, or add ingredients before generating your recipes.',
    photoAlt: 'Analyzed photo',
    emptyState:
      "No ingredients were automatically detected in this photo (blurry photo, or AI recognition not yet configured on this deployment). Add your ingredients manually below 👇",
    orMaybe: 'Or maybe:',
    removeAria: (name) => `Remove ${name}`,
    decreaseCount: (name) => `Fewer ${name}`,
    increaseCount: (name) => `More ${name}`,
    addPlaceholder: 'Add an ingredient (e.g. onion)',
    add: '+ Add',
    scanBarcode: '📷 Scan a barcode',
    seeRecipes: '🍽️ See my recipes',
    preparingRecipes: 'Getting your recipes ready…',
    surpriseMe: "🎲 I'm hungry, surprise me",
    preparingSurprise: 'Finding a surprise…',
    confidenceProbable: 'likely',
    confidenceToConfirm: 'to confirm',
    confidenceUncertain: 'uncertain',
  },
}

function ConfidenceBadge({ confidence, s }) {
  if (confidence >= 0.75) {
    return <span className="badge badge-fresh">{s.confidenceProbable}</span>
  }
  if (confidence >= 0.5) {
    return <span className="badge badge-neutral">{s.confidenceToConfirm}</span>
  }
  return <span className="badge badge-zest">{s.confidenceUncertain}</span>
}

// Page de validation : liste modifiable des ingrédients détectés + préférences.
// Jamais bloquante : même avec 0 ingrédient détecté, l'utilisateur peut en
// ajouter à la main et continuer.
export default function ValidatePage() {
  const {
    state,
    toggleIngredient,
    renameIngredient,
    removeIngredient,
    addIngredient,
    setIngredientCount,
    generateFromValidated,
    surpriseMe,
    goTo,
  } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [newIngredient, setNewIngredient] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  // generateFromValidated/surpriseMe basculent state.view dès que la base de
  // recettes (chargée à la demande) répond : sans ce délai artificiel,
  // l'écran passe quasi instantanément à ResultsPage, ce qui ressemble à un
  // bug plutôt qu'à "l'IA réfléchit".
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'recipes' | 'surprise' | null

  const checkedNames = state.ingredients.filter((i) => i.checked).map((i) => i.name)
  const allNames = state.ingredients.map((i) => i.name)
  const hasAtLeastOne = checkedNames.length > 0
  const suggestions = suggestComplementaryIngredients(checkedNames, allNames)

  function handleAdd() {
    if (!newIngredient.trim()) return
    addIngredient(newIngredient)
    setNewIngredient('')
  }

  function handleGenerateFromValidated() {
    if (!hasAtLeastOne || isGenerating) return
    setPendingAction('recipes')
    setIsGenerating(true)
    setTimeout(() => {
      generateFromValidated()
    }, 650)
  }

  function handleSurpriseMe() {
    if (!hasAtLeastOne || isGenerating) return
    setPendingAction('surprise')
    setIsGenerating(true)
    setTimeout(() => {
      surpriseMe()
    }, 650)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-28 animate-fadeIn">
      <button onClick={() => goTo('upload')} className="text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        {COMMON[lang].back}
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">{s.title}</h2>
      <p className="text-neutral-500 mt-1">{s.subtitle}</p>

      {state.photo && (
        <img src={state.photo} alt={s.photoAlt} className="mt-4 w-28 h-28 object-cover rounded-xl2 shadow-card" />
      )}

      <div className="mt-5 card divide-y divide-neutral-100">
        {state.ingredients.length === 0 && (
          <p className="p-4 text-sm text-neutral-500 text-center">{s.emptyState}</p>
        )}

        {state.ingredients.map((ing, index) => (
          <div
            key={ing.id}
            className="p-3.5 flex items-center gap-3 animate-fadeIn"
            style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
          >
            <input
              type="checkbox"
              checked={ing.checked}
              onChange={() => toggleIngredient(ing.id)}
              className="checkbox-fresh shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium capitalize ${ing.checked ? 'text-neutral-900' : 'text-neutral-500 line-through'}`}>
                  {ing.name}
                </span>
                {/* Le comptage par photo reste une estimation IA, jamais
                    garanti exact (angle, occultation partielle...) — plutôt
                    qu'un badge figé, un vrai contrôle +/- pour corriger le
                    chiffre en un geste sans supprimer/rajouter l'ingrédient.
                    Un ingrédient ajouté à la main démarre aussi à 1 (voir
                    ADD_INGREDIENT dans AppContext.jsx) : même contrôle, pour
                    pouvoir préciser "j'en ai 10" et bénéficier du même
                    avertissement de quantité insuffisante dans la recette. */}
                {ing.count !== undefined && (
                  <div className="flex items-center gap-0.5 bg-neutral-100 rounded-full pl-1 pr-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => setIngredientCount(ing.id, ing.count - 1)}
                      aria-label={s.decreaseCount(ing.name)}
                      disabled={ing.count <= 1}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      −
                    </button>
                    <span className="text-xs font-medium text-neutral-700 min-w-[1.4em] text-center tabular-nums">
                      ×{ing.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIngredientCount(ing.id, ing.count + 1)}
                      aria-label={s.increaseCount(ing.name)}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
                    >
                      +
                    </button>
                  </div>
                )}
                <ConfidenceBadge confidence={ing.confidence} s={s} />
              </div>

              {ing.alternatives?.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-neutral-500">{s.orMaybe}</span>
                  {ing.alternatives.map((alt) => (
                    <button
                      key={alt}
                      onClick={() => renameIngredient(ing.id, alt)}
                      className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 hover:bg-fresh-100 text-neutral-600 hover:text-fresh-700 transition"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => removeIngredient(ing.id)}
              aria-label={s.removeAria(ing.name)}
              className="shrink-0 text-neutral-300 hover:text-red-500 text-lg leading-none px-1"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="p-3.5 flex items-center gap-2">
          <input
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={s.addPlaceholder}
            className="flex-1 text-sm border border-neutral-200 rounded-full px-4 py-2 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
          />
          <button onClick={handleAdd} className="btn-secondary !py-2 !px-4 text-sm">
            {s.add}
          </button>
        </div>
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-full text-sm text-neutral-500 hover:text-fresh-700 dark:hover:text-fresh-400 transition"
          >
            {s.scanBarcode}
          </button>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onDetected={(name) => {
            addIngredient(name)
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {hasAtLeastOne && suggestions.length > 0 && (
        <IngredientSuggestions suggestions={suggestions} onSelect={addIngredient} />
      )}

      {hasAtLeastOne && (
        <div className="mt-4">
          <AntiGaspiBanner ingredientNames={checkedNames} />
        </div>
      )}

      <div className="mt-5">
        <PreferencesPanel />
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-neutral-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleGenerateFromValidated}
            disabled={!hasAtLeastOne || isGenerating}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating && pendingAction === 'recipes' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {s.preparingRecipes}
              </span>
            ) : (
              s.seeRecipes
            )}
          </button>
          <button
            onClick={handleSurpriseMe}
            disabled={!hasAtLeastOne || isGenerating}
            className="btn-secondary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating && pendingAction === 'surprise' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
                {s.preparingSurprise}
              </span>
            ) : (
              s.surpriseMe
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
