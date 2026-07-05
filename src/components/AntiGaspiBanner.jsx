import { isPerishable } from '../data/expiryData.js'
import { useLanguage } from '../state/LanguageContext.jsx'

const STRINGS = {
  fr: {
    label: 'Mode anti-gaspi',
    text: (list) => (
      <>
        {' '}: on priorise les recettes avec <strong>{list}</strong>, à utiliser rapidement.
      </>
    ),
  },
  en: {
    label: 'Zero-waste mode',
    text: (list) => (
      <>
        {' '}: recipes using <strong>{list}</strong> are prioritized — use them up soon.
      </>
    ),
  },
}

// Bandeau bonus "anti-gaspi" : affiché si des ingrédients périssables ont été
// validés, pour inciter à les utiliser en priorité.
export default function AntiGaspiBanner({ ingredientNames }) {
  const lang = useLanguage()
  const s = STRINGS[lang]
  const perishables = ingredientNames.filter((n) => isPerishable(n))
  if (perishables.length === 0) return null

  return (
    <div className="flex items-start gap-2.5 bg-zest-50 border border-zest-200 text-zest-800 rounded-xl2 px-4 py-3 text-sm">
      <span aria-hidden>♻️</span>
      <p>
        <strong>{s.label}</strong>
        {s.text(perishables.join(', '))}
      </p>
    </div>
  )
}
