import { useApp } from '../state/AppContext.jsx'

// Page d'accueil : promesse claire + CTA unique pour lancer le flow en 3 clics,
// puis contenu explicatif enrichi (étapes, valeurs, anti-gaspi) pour rassurer
// et donner du contexte avant de se lancer.
export default function HomePage() {
  const { goTo } = useApp()

  const steps = [
    { icon: '📸', title: 'Photo', text: 'Prenez en photo votre frigo ou votre table.' },
    { icon: '✅', title: 'Validez', text: 'Corrigez la liste d\'ingrédients détectée.' },
    { icon: '🍽️', title: 'Cuisinez', text: 'Recevez 3 à 5 recettes prêtes à faire.' },
  ]

  const values = [
    {
      icon: '🌱',
      title: 'Anti-gaspi par défaut',
      text: 'FrigoMind priorise les ingrédients périssables pour vous aider à les cuisiner avant qu\'ils ne soient perdus.',
    },
    {
      icon: '🎯',
      title: 'Toujours une solution',
      text: 'Même avec une combinaison d\'ingrédients inhabituelle, l\'app garantit 3 à 5 recettes réalistes, jamais un cul-de-sac.',
    },
    {
      icon: '🔒',
      title: 'Respect de vos données',
      text: 'Vos photos servent uniquement à l\'analyse IA et ne sont jamais stockées sur nos serveurs.',
    },
    {
      icon: '💸',
      title: '100% gratuit',
      text: 'Propulsé par Google Gemini, sans carte bancaire ni abonnement caché.',
    },
  ]

  const countryWaste = [
    { country: '🇫🇷 France', kg: '~25 à 30 kg', source: 'ADEME' },
    { country: '🇬🇧 Royaume-Uni', kg: '~70 à 88 kg', source: 'WRAP' },
    { country: '🇺🇸 États-Unis', kg: '~71 à 73 kg', source: 'RTS / USDA' },
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
          propose des recettes simples et anti-gaspi. Pas d'inscription, pas de carte bancaire : ouvrez
          l'app, prenez une photo, cuisinez.
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
          <div key={s.title} className="card p-5 text-center hover:shadow-cardHover transition-shadow">
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

      <div className="mt-16">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center">
          Pourquoi FrigoMind ?
        </h2>
        <p className="text-neutral-500 text-sm text-center mt-2 max-w-lg mx-auto">
          Une app pensée pour arrêter de se demander "qu'est-ce qu'on mange ce soir" en regardant un frigo
          à moitié plein.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div key={v.title} className="card p-5 flex gap-3 hover:shadow-cardHover transition-shadow">
              <div className="text-2xl shrink-0" aria-hidden>
                {v.icon}
              </div>
              <div>
                <div className="font-semibold text-neutral-900">{v.title}</div>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center">
          Le gaspillage alimentaire en chiffres
        </h2>
        <p className="text-neutral-500 text-sm text-center mt-2 max-w-lg mx-auto">
          De quoi remettre en perspective l'intérêt de finir ce qu'il y a dans le frigo.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5 text-center">
            <div className="text-2xl font-extrabold text-fresh-700">1,05 milliard</div>
            <p className="text-sm text-neutral-500 mt-1">
              de tonnes de nourriture gaspillées chaque année dans le monde — soit plus d'1 milliard de
              repas jetés par jour.
            </p>
          </div>
          <div className="card p-5 text-center">
            <div className="text-2xl font-extrabold text-fresh-700">132 kg</div>
            <p className="text-sm text-neutral-500 mt-1">
              par personne et par an en moyenne dans le monde (dont environ 79 kg pour les seuls ménages).
            </p>
          </div>
        </div>

        <div className="mt-4 card p-5">
          <p className="font-semibold text-neutral-900 text-sm mb-3">
            Gaspillage alimentaire des ménages, par pays (ordres de grandeur)
          </p>
          <div className="space-y-2">
            {countryWaste.map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{c.country}</span>
                <span className="text-neutral-500">
                  {c.kg} / an / personne <span className="text-neutral-300">· {c.source}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            Sources : UNEP Food Waste Index Report 2024 (chiffres mondiaux, données 2022) ; ADEME (France) ;
            WRAP (Royaume-Uni) ; RTS / USDA (États-Unis). Les méthodologies de mesure diffèrent selon les
            pays, ces chiffres sont donc des ordres de grandeur plutôt qu'une comparaison stricte.
          </p>
        </div>
      </div>

      <div className="mt-16 card p-6 sm:p-8 text-center bg-fresh-50/60 border-fresh-100">
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
          Prêt à vider votre frigo intelligemment ?
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
          Une photo suffit pour démarrer. Vous pourrez toujours ajuster la liste d'ingrédients avant de
          voir vos recettes.
        </p>
        <button onClick={() => goTo('upload')} className="btn-primary text-base px-6 py-3 mt-5">
          📸 Prendre une photo
        </button>
      </div>

      <p className="mt-10 text-center text-xs text-neutral-400">
        L'analyse d'image utilise une IA multimodale gratuite (Google Gemini) pour reconnaître vos
        aliments. Vous pouvez toujours corriger ou compléter la liste à la main. Pour en savoir plus,
        consultez la{' '}
        <button onClick={() => goTo('faq')} className="underline underline-offset-2 hover:text-neutral-600">
          FAQ
        </button>{' '}
        ou la page{' '}
        <button onClick={() => goTo('about')} className="underline underline-offset-2 hover:text-neutral-600">
          À propos
        </button>
        .
      </p>
    </div>
  )
}
