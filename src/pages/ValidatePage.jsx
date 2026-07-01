import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import PreferencesPanel from '../components/PreferencesPanel.jsx'
import AntiGaspiBanner from '../components/AntiGaspiBanner.jsx'

function ConfidenceBadge({ confidence }) {
  if (confidence >= 0.75) {
    return <span className="badge badge-fresh">probable</span>
  }
  if (confidence >= 0.5) {
    return <span className="badge badge-neutral">à confirmer</span>
  }
  return <span className="badge badge-zest">incertain</span>
}

// Page de validation : liste modifiable des ingrédients détectés + préférences.
// Jamais bloquante : même avec 0 ingrédient détecté, l'utilisateur peut en
// ajouter à la main et continuer.
export default function ValidatePage() {
  const { state, toggleIngredient, renameIngredient, removeIngredient, addIngredient, generateFromValidated, surpriseMe, goTo } =
    useApp()
  const [newIngredient, setNewIngredient] = useState('')

  const checkedNames = state.ingredients.filter((i) => i.checked).map((i) => i.name)
  const hasAtLeastOne = checkedNames.length > 0

  function handleAdd() {
    if (!newIngredient.trim()) return
    addIngredient(newIngredient)
    setNewIngredient('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-28 animate-fadeIn">
      <button onClick={() => goTo('upload')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Retour
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Voici ce que j'ai détecté</h2>
      <p className="text-neutral-500 mt-1">
        Cochez, décochez, renommez ou ajoutez des ingrédients avant de générer vos recettes.
      </p>

      {state.photo && (
        <img src={state.photo} alt="Photo analysée" className="mt-4 w-28 h-28 object-cover rounded-xl2 shadow-card" />
      )}

      <div className="mt-5 card divide-y divide-neutral-100">
        {state.ingredients.length === 0 && (
          <p className="p-4 text-sm text-neutral-400 text-center">
            Aucun ingrédient détecté automatiquement sur cette photo (photo peu nette, ou
            reconnaissance IA pas encore configurée sur ce déploiement). Ajoutez vos ingrédients
            manuellement ci-dessous 👇
          </p>
        )}

        {state.ingredients.map((ing) => (
          <div key={ing.id} className="p-3.5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={ing.checked}
              onChange={() => toggleIngredient(ing.id)}
              className="checkbox-fresh shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium capitalize ${ing.checked ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>
                  {ing.name}
                </span>
                <ConfidenceBadge confidence={ing.confidence} />
              </div>

              {ing.alternatives?.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-neutral-400">Ou peut-être :</span>
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
              aria-label={`Supprimer ${ing.name}`}
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
            placeholder="Ajouter un ingrédient (ex : oignon)"
            className="flex-1 text-sm border border-neutral-200 rounded-full px-4 py-2 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
          />
          <button onClick={handleAdd} className="btn-secondary !py-2 !px-4 text-sm">
            + Ajouter
          </button>
        </div>
      </div>

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
            onClick={generateFromValidated}
            disabled={!hasAtLeastOne}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🍽️ Voir mes recettes
          </button>
          <button
            onClick={surpriseMe}
            disabled={!hasAtLeastOne}
            className="btn-secondary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🎲 J'ai faim, surprends-moi
          </button>
        </div>
      </div>
    </div>
  )
}
