import { IllustrationTile } from './Illustrations.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'

// En-tête standard des pages secondaires : bouton retour + tuile illustrée +
// titre/sous-titre. Centralise un pattern auparavant dupliqué (et très nu)
// dans chaque page, pour une identité visuelle cohérente sur tout le site.
export default function PageHeader({ icon, tone = 'fresh', title, subtitle, onBack, backLabel, action }) {
  const lang = useLanguage()
  const label = backLabel ?? COMMON[lang].back
  return (
    <div className="mb-2">
      {onBack && (
        <button type="button" onClick={onBack} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
          {label}
        </button>
      )}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {icon && (
            <IllustrationTile tone={tone} size="md">
              {icon}
            </IllustrationTile>
          )}
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
            {subtitle && <p className="text-neutral-500 mt-1 text-sm max-w-md">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}
