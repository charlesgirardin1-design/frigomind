import { useApp } from '../state/AppContext.jsx'
import {
  IllustrationTile,
  FridgeGlyph,
  CameraGlyph,
  BookGlyph,
  PotGlyph,
  SproutGlyph,
  CompassGlyph,
  LockGlyph,
} from '../components/Illustrations.jsx'

// Page d'accueil : promesse claire + CTA unique pour lancer le flow en 3 clics,
// puis contenu explicatif enrichi (étapes, valeurs, anti-gaspi) pour rassurer
// et donner du contexte avant de se lancer.
export default function HomePage() {
  const { goTo } = useApp()

  const steps = [
    { Icon: CameraGlyph, tone: 'fresh', title: 'Photo', text: 'Prenez en photo votre frigo ou votre table.' },
    { Icon: BookGlyph, tone: 'zest', title: 'Validez', text: 'Corrigez la liste d\'ingrédients détectée.' },
    { Icon: PotGlyph, tone: 'fresh', title: 'Cuisinez', text: 'Recevez 3 à 5 recettes prêtes à faire.' },
  ]

  const values = [
    {
      Icon: SproutGlyph,
      tone: 'fresh',
      title: 'Anti-gaspi par défaut',
      text: 'FrigoMind priorise les ingrédients périssables pour vous aider à les cuisiner avant qu\'ils ne soient perdus.',
    },
    {
      Icon: CompassGlyph,
      tone: 'zest',
      title: 'Toujours une solution',
      text: 'Même avec une combinaison d\'ingrédients inhabituelle, l\'app garantit 3 à 5 recettes réalistes, jamais un cul-de-sac.',
    },
    {
      Icon: LockGlyph,
      tone: 'neutral',
      title: 'Respect de vos données',
      text: 'Vos photos servent uniquement à l\'analyse IA et ne sont jamais stockées sur nos serveurs.',
    },
    {
      Icon: PotGlyph,
      tone: 'fresh',
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
      <div className="relative text-center overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-fresh-200/40 blur-3xl -z-10 animate-blob"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full bg-zest-200/40 blur-3xl -z-10 animate-blob"
          style={{ animationDelay: '-4s' }}
          aria-hidden
        />

        <IllustrationTile tone="fresh" size="xl" className="mx-auto mb-5 animate-float">
          <FridgeGlyph className="w-full h-full" />
        </IllustrationTile>

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
          <div key={s.title} className="card p-5 text-center">
            <IllustrationTile tone={s.tone} size="sm" className="mx-auto mb-3">
              <s.Icon className="w-full h-full" />
            </IllustrationTile>
            <div className="font-semibold text-neutral-900">
              {i + 1}. {s.title}
            </div>
            <p className="text-sm text-neutral-500 mt-1">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="section-title">Pourquoi FrigoMind ?</h2>
        <p className="section-subtitle">
          Une app pensée pour arrêter de se demander "qu'est-ce qu'on mange ce soir" en regardant un frigo
          à moitié plein.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div key={v.title} className="card p-5 flex gap-3">
              <IllustrationTile tone={v.tone} size="sm">
                <v.Icon className="w-full h-full" />
              </IllustrationTile>
              <div>
                <div className="font-semibold text-neutral-900">{v.title}</div>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="section-title">Le gaspillage alimentaire en chiffres</h2>
        <p className="section-subtitle">
          De quoi remettre en perspective l'intérêt de finir ce qu'il y a dans le frigo.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5 text-center">
            <div className="text-3xl mb-1" aria-hidden>🌍</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-fresh-700 tracking-tight">1,05 milliard</div>
            <p className="text-sm text-neutral-500 mt-1">
              de tonnes de nourriture gaspillées chaque année dans le monde — soit plus d'1 milliard de
              repas jetés par jour.
            </p>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl mb-1" aria-hidden>⚖️</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-fresh-700 tracking-tight">132 kg</div>
            <p className="text-sm text-neutral-500 mt-1">
              par personne et par an en moyenne dans le monde (dont environ 79 kg pour les seuls ménages).
            </p>
          </div>
        </div>

        <div className="mt-4 card p-5">
          <p className="font-semibold text-neutral-900 text-sm mb-3">
            Gaspillage alimentaire des ménages, par pays (ordres de grandeur)
          </p>
          <div className="divide-y divide-neutral-100">
            {countryWaste.map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm py-2 first:pt-0 last:pb-0">
                <span className="text-neutral-700">{c.country}</span>
                <span className="text-neutral-500">
                  {c.kg} / an / personne <span className="text-neutral-300">· {c.source}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3 pt-3 border-t border-neutral-100">
            Sources : UNEP Food Waste Index Report 2024 (chiffres mondiaux, données 2022) ; ADEME (France) ;
            WRAP (Royaume-Uni) ; RTS / USDA (États-Unis). Les méthodologies de mesure diffèrent selon les
            pays, ces chiffres sont donc des ordres de grandeur plutôt qu'une comparaison stricte.
          </p>
        </div>
      </div>

      <div className="mt-16 card p-6 sm:p-8 text-center bg-gradient-to-br from-fresh-50 to-zest-50/60 border-fresh-100 shadow-glow">
        <IllustrationTile tone="zest" size="md" className="mx-auto mb-3">
          <PotGlyph className="w-full h-full" />
        </IllustrationTile>
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
    </div>
  )
}
