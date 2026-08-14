import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'

// Petite frise "Photo → Validation → Recettes" affichée en haut des trois
// pages du parcours principal (UploadPage, ValidatePage, ResultsPage), pour
// que l'utilisateur sache toujours où il en est. `step` est 1-indexé (1 =
// Photo). Purement visuel : ne navigue pas au clic (les étapes ne sont pas
// forcément déjà atteignables dans l'autre sens, ex: revenir à "Photo" perd
// les ingrédients validés).
export default function FlowStepper({ step }) {
  const lang = useLanguage()
  const s = COMMON[lang].flow
  const steps = [s.photo, s.validate, s.recipes]

  return (
    <ol className="flex items-center justify-center gap-2 mb-6 select-none" aria-label={steps.join(' → ')}>
      {steps.map((label, i) => {
        const n = i + 1
        const isDone = n < step
        const isCurrent = n === step
        return (
          <li key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                  isDone
                    ? 'bg-fresh-500 text-white'
                    : isCurrent
                      ? 'bg-fresh-100 text-fresh-700 ring-2 ring-fresh-400'
                      : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                }`}
                aria-hidden
              >
                {isDone ? '✓' : n}
              </span>
              <span
                className={`text-xs font-medium ${
                  isCurrent
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : isDone
                      ? 'text-neutral-500 dark:text-neutral-400'
                      : 'text-neutral-400 dark:text-neutral-600'
                }`}
              >
                {label}
              </span>
            </div>
            {n < steps.length && (
              <span
                className={`w-6 sm:w-10 h-px shrink-0 ${isDone ? 'bg-fresh-400' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
