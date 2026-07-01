import { useApp } from '../state/AppContext.jsx'

// Page d'accueil : promesse claire + CTA unique pour lancer le flow en 3 clics.
export default function HomePage() {
  const { goTo } = useApp()

  const steps = [
    { icon: '📸', title: 'Photo', text: 'Prenez en photo votre frigo ou votre table.' },
    { icon: '✅', title: 'Validez', text: 'Corrigez la liste d\'ingrédients détectée.' },
    { icon: '🍽️', title: 'Cuisinez', text: 'Recevez 3 à 5 recettes prêtes à faire.' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-16 animate-fadeIn">
      <div className="text-center">
        <span className="inline-block text-6xl mb-4" aria-hidden>
          🥕🍅🧀
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
          Votre frigo, vos recettes, <span className="text-fresh-600">en 3 clics</span>.
        </h1>
        <p className="mt-3 text-neutral-500 text-base sm:text-lg max-w-xl mx-auto">
          Prenez une photo de votre frigo ou de votre table, FrigoMind détecte les ingrédients et vous
          propose des recettes simples et anti-gaspi.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => goTo('upload')}
            className="btn-primary text-base px-6 py-3.5"
          >
            📸 Commencer
          </button>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="card p-5 text-center">
            <div className="text-3xl mb-2" aria-hidden>
              {s.icon}
            </div>
            <div className="font-semibold text-neutral-900">
              {i + 1}. {s.title}
            </div>
            <p className="text-sm text-neutral-500 mt-1">{s.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-neutral-400">
        L'analyse d'image utilise Claude Vision pour reconnaître vos aliments. Vous pouvez toujours
        corriger ou compléter la liste à la main.
      </p>
    </div>
  )
}
