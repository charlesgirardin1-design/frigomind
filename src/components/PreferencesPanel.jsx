import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'

const STRINGS = {
  fr: {
    title: 'Personnalisez vos recettes',
    maxTime: 'Temps maximum',
    cuisineType: 'Type de cuisine',
    vegetarian: '🌱 Végétarien uniquement',
    time: [
      { value: '10', label: '10 min' },
      { value: '20', label: '20 min' },
      { value: '30', label: '30 min' },
      { value: 'peu importe', label: 'Peu importe' },
    ],
    cuisine: [
      { value: 'toutes', label: 'Toutes' },
      { value: 'rapide', label: '⚡ Rapide' },
      { value: 'healthy', label: '🥗 Healthy' },
      { value: 'gourmand', label: '🧀 Gourmand' },
    ],
  },
  en: {
    title: 'Customize your recipes',
    maxTime: 'Maximum time',
    cuisineType: 'Cuisine type',
    vegetarian: '🌱 Vegetarian only',
    time: [
      { value: '10', label: '10 min' },
      { value: '20', label: '20 min' },
      { value: '30', label: '30 min' },
      { value: 'peu importe', label: 'No preference' },
    ],
    cuisine: [
      { value: 'toutes', label: 'All' },
      { value: 'rapide', label: '⚡ Quick' },
      { value: 'healthy', label: '🥗 Healthy' },
      { value: 'gourmand', label: '🧀 Indulgent' },
    ],
  },
}

// Panneau de personnalisation : temps max, type de cuisine, régime.
export default function PreferencesPanel() {
  const { state, setPreferences } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const { preferences } = state

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="font-semibold text-neutral-900 mb-3">{s.title}</h3>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1.5">{s.maxTime}</p>
          <div className="flex flex-wrap gap-2">
            {s.time.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreferences({ maxTime: opt.value })}
                className={`chip ${preferences.maxTime === opt.value ? 'chip-active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1.5">{s.cuisineType}</p>
          <div className="flex flex-wrap gap-2">
            {s.cuisine.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreferences({ cuisine: opt.value })}
                className={`chip ${preferences.cuisine === opt.value ? 'chip-active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={preferences.vegetarien}
            onChange={(e) => setPreferences({ vegetarien: e.target.checked })}
            className="checkbox-fresh"
          />
          <span className="text-sm text-neutral-700">{s.vegetarian}</span>
        </label>
      </div>
    </div>
  )
}
