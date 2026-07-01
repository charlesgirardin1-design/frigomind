import { useApp } from '../state/AppContext.jsx'

// En-tête simple et sticky, avec logo et accès rapide à l'historique.
export default function Header() {
  const { state, goTo, resetSession } = useApp()

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-100">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          className="flex items-center gap-2 font-extrabold text-lg text-neutral-900"
          onClick={() => {
            resetSession()
            goTo('home')
          }}
        >
          <span aria-hidden>🥕</span>
          <span>
            Frigo<span className="text-fresh-600">Mind</span>
          </span>
        </button>

        <button
          className={`text-sm font-medium px-3 py-1.5 rounded-full transition ${
            state.view === 'history' ? 'bg-fresh-50 text-fresh-700' : 'text-neutral-500 hover:text-neutral-900'
          }`}
          onClick={() => goTo('history')}
        >
          📜 Historique
        </button>
      </div>
    </header>
  )
}
