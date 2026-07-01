import { useApp } from '../state/AppContext.jsx'

// Page 404 : affichée quand l'URL visitée ne correspond à aucune page connue.
// Ton léger et cohérent avec l'identité food-tech du site.
export default function NotFoundPage() {
  const { goTo, resetSession } = useApp()

  const backHome = () => {
    resetSession()
    goTo('home')
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 pb-20 text-center animate-fadeIn">
      <span className="inline-block text-7xl mb-4" aria-hidden>
        🥕🔍
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
        Oups, ce plat n'est pas au menu.
      </h1>
      <p className="mt-3 text-neutral-500 text-base max-w-md mx-auto">
        La page que vous cherchez n'existe pas, ou a peut-être été mangée entre-temps. Retournez à
        l'accueil pour repartir sur une recette fraîche.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={backHome} className="btn-primary text-base px-6 py-3.5">
          🏠 Retour à l'accueil
        </button>
        <button onClick={() => goTo('faq')} className="btn-secondary text-base px-6 py-3.5">
          Voir la FAQ
        </button>
      </div>

      <div className="mt-12 card p-5 inline-block text-left max-w-sm mx-auto">
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">Erreur 404</span> — page introuvable.
          Si vous pensez qu'il s'agit d'une erreur, vérifiez l'adresse saisie.
        </p>
      </div>
    </div>
  )
}
