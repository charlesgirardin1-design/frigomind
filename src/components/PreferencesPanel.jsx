import { useApp } from '../state/AppContext.jsx'

const TIME_OPTIONS = [
  { value: '10', label: '10 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: 'peu importe', label: 'Peu importe' },
]

const CUISINE_OPTIONS = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'rapide', label: '⚡ Rapide' },
  { value: 'healthy', label: '🥗 Healthy' },
  { value: 'gourmand', label: '🧀 Gourmand' },
]

// Panneau de personnalisation : temps max, type de cuisine, régime.
export default function PreferencesPanel() {
  const { state, setPreferences } = useApp()
  const { preferences } = state

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="font-semibold text-neutral-900 mb-3">Personnalisez vos recettes</h3>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1.5">Temps maximum</p>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => (
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
          <p className="text-xs font-medium text-neutral-500 mb-1.5">Type de cuisine</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((opt) => (
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
          <span className="text-sm text-neutral-700">🌱 Végétarien uniquement</span>
        </label>
      </div>
    </div>
  )
}
