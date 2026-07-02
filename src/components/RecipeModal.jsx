import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { copyTextToClipboard } from '../utils/shoppingList.js'

// Modale plein détail d'une recette : ingrédients, étapes numérotées.
export default function RecipeModal({ recipe, onClose }) {
  const { goToIngredient } = useApp()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!recipe) return null

  const allIngredients = [...new Set([...recipe.required, ...recipe.optional])]
  const missing = recipe.missingIngredients || []

  function handleIngredientClick(ing) {
    onClose()
    goToIngredient(ing)
  }

  async function handleCopyList() {
    const ok = await copyTextToClipboard(missing.join('\n'))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-xl2 rounded-t-xl2 max-h-[90vh] overflow-y-auto animate-popIn"
      >
        <div className="sticky top-0 bg-white flex items-start justify-between p-5 border-b border-neutral-100">
          <div>
            <span className="text-3xl" aria-hidden>
              {recipe.emoji}
            </span>
            <h2 className="text-xl font-bold text-neutral-900 mt-1">{recipe.name}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <span className="badge badge-neutral">⏱ {recipe.time} min</span>
              <span className="badge badge-neutral">{recipe.level}</span>
              <span className="badge badge-neutral capitalize">{recipe.cuisine}</span>
              {recipe.antiGaspi && <span className="badge badge-zest">♻️ anti-gaspi</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-neutral-400 hover:text-neutral-900 text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-neutral-900 mb-2">Ingrédients</h3>
            <ul className="space-y-1 text-sm">
              {allIngredients.map((ing) => {
                const isMatched = recipe.matchedIngredients?.includes(ing)
                const isMissing = recipe.missingIngredients?.includes(ing)
                return (
                  <li key={ing} className="flex items-center gap-2">
                    <span aria-hidden>{isMissing ? '🛒' : '✅'}</span>
                    <button
                      onClick={() => handleIngredientClick(ing)}
                      className={`text-left underline decoration-dotted underline-offset-2 hover:text-fresh-700 ${
                        isMissing ? 'text-neutral-500' : 'text-neutral-800'
                      }`}
                    >
                      {ing}
                    </button>
                    {isMissing && <em className="text-xs text-zest-600">(à acheter)</em>}
                    {!isMissing && !isMatched && <em className="text-xs text-neutral-400"> (optionnel)</em>}
                  </li>
                )
              })}
            </ul>
          </div>

          {missing.length > 0 && (
            <div className="bg-zest-50 border border-zest-200 rounded-xl2 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-neutral-900 text-sm">🛒 Liste de courses</h3>
                <button onClick={handleCopyList} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">
                  {copied ? '✅ Copié' : 'Copier'}
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-1.5">{missing.join(', ')}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-neutral-900 mb-2">Étapes</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-700">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-fresh-100 text-fresh-700 font-semibold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
