import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { IllustrationTile, CompassGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: "Oups, ce plat n'est pas au menu.",
    text: "La page que vous cherchez n'existe pas, ou a peut-être été mangée entre-temps. Retournez à l'accueil pour repartir sur une recette fraîche.",
    backHome: "🏠 Retour à l'accueil",
    seeFaq: 'Voir la FAQ',
    errorTitle: 'Erreur 404',
    errorText: "— page introuvable. Si vous pensez qu'il s'agit d'une erreur, vérifiez l'adresse saisie.",
  },
  en: {
    title: "Oops, this dish isn't on the menu.",
    text: "The page you're looking for doesn't exist, or may have been eaten in the meantime. Head back home to start fresh.",
    backHome: '🏠 Back to home',
    seeFaq: 'See the FAQ',
    errorTitle: '404 error',
    errorText: '— page not found. If you think this is a mistake, double-check the address you entered.',
  },
}

// Page 404 : affichée quand l'URL visitée ne correspond à aucune page connue.
// Ton léger et cohérent avec l'identité food-tech du site.
export default function NotFoundPage() {
  const { goTo, resetSession } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]

  const backHome = () => {
    resetSession()
    goTo('home')
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 pb-20 text-center animate-fadeIn">
      <IllustrationTile tone="zest" size="xl" className="mx-auto mb-6 animate-float">
        <CompassGlyph className="w-full h-full" />
      </IllustrationTile>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">{s.title}</h1>
      <p className="mt-3 text-neutral-500 text-base max-w-md mx-auto">{s.text}</p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={backHome} className="btn-primary text-base px-6 py-3.5">
          {s.backHome}
        </button>
        <button onClick={() => goTo('faq')} className="btn-secondary text-base px-6 py-3.5">
          {s.seeFaq}
        </button>
      </div>

      <div className="mt-12 card p-5 inline-block text-left max-w-sm mx-auto">
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">{s.errorTitle}</span> {s.errorText}
        </p>
      </div>
    </div>
  )
}
