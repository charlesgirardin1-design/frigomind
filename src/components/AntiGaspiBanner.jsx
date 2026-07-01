import { isPerishable } from '../data/expiryData.js'

// Bandeau bonus "anti-gaspi" : affiché si des ingrédients périssables ont été
// validés, pour inciter à les utiliser en priorité.
export default function AntiGaspiBanner({ ingredientNames }) {
  const perishables = ingredientNames.filter((n) => isPerishable(n))
  if (perishables.length === 0) return null

  return (
    <div className="flex items-start gap-2.5 bg-zest-50 border border-zest-200 text-zest-800 rounded-xl2 px-4 py-3 text-sm">
      <span aria-hidden>♻️</span>
      <p>
        <strong>Mode anti-gaspi&nbsp;:</strong> on priorise les recettes avec{' '}
        <strong>{perishables.join(', ')}</strong>, à utiliser rapidement.
      </p>
    </div>
  )
}
