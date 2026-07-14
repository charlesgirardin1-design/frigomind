import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
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

const STRINGS = {
  fr: {
    heading: (
      <>
        Votre frigo, vos recettes, <span className="text-gradient-fresh">en 3 clics</span>.
      </>
    ),
    intro:
      "Prenez une photo de votre frigo ou de votre table, FrigoMind détecte les ingrédients et vous propose des recettes simples et anti-gaspi. Pas d'inscription, pas de carte bancaire : ouvrez l'app, prenez une photo, cuisinez.",
    start: '📸 Commencer',
    steps: [
      { Icon: CameraGlyph, tone: 'fresh', title: 'Photo', text: 'Prenez en photo votre frigo ou votre table.' },
      { Icon: BookGlyph, tone: 'zest', title: 'Validez', text: "Corrigez la liste d'ingrédients détectée." },
      { Icon: PotGlyph, tone: 'fresh', title: 'Cuisinez', text: 'Recevez 3 à 5 recettes prêtes à faire.' },
    ],
    whyTitle: 'Pourquoi FrigoMind ?',
    whySubtitle:
      'Une app pensée pour arrêter de se demander "qu\'est-ce qu\'on mange ce soir" en regardant un frigo à moitié plein.',
    values: [
      {
        Icon: SproutGlyph,
        tone: 'fresh',
        title: 'Anti-gaspi par défaut',
        text: "FrigoMind priorise les ingrédients périssables pour vous aider à les cuisiner avant qu'ils ne soient perdus.",
      },
      {
        Icon: CompassGlyph,
        tone: 'zest',
        title: 'Toujours une solution',
        text: "Même avec une combinaison d'ingrédients inhabituelle, l'app garantit 3 à 5 recettes réalistes, jamais un cul-de-sac.",
      },
      {
        Icon: LockGlyph,
        tone: 'neutral',
        title: 'Respect de vos données',
        text: "Vos photos servent uniquement à l'analyse IA et ne sont jamais stockées sur nos serveurs.",
      },
      {
        Icon: PotGlyph,
        tone: 'fresh',
        title: '100% gratuit',
        text: 'Propulsé par Google Gemini, sans carte bancaire ni abonnement caché.',
      },
    ],
    wasteTitle: 'Le gaspillage alimentaire en chiffres',
    wasteSubtitle: "De quoi remettre en perspective l'intérêt de finir ce qu'il y a dans le frigo.",
    wasteWorldTonnes: '1,05 milliard',
    wasteWorldTonnesText:
      "de tonnes de nourriture gaspillées chaque année dans le monde — soit plus d'1 milliard de repas jetés par jour.",
    wastePerPerson: '132 kg',
    wastePerPersonText: 'par personne et par an en moyenne dans le monde (dont environ 79 kg pour les seuls ménages).',
    wasteCO2: '8 à 10 %',
    wasteCO2Text:
      "des émissions mondiales de gaz à effet de serre proviennent du gaspillage alimentaire — près de 5 fois les émissions du transport aérien.",
    wasteCost: '~1 000 milliards $',
    wasteCostText:
      "de dollars perdus chaque année dans le monde à cause du gaspillage alimentaire (coût économique direct, hors impacts environnementaux et sociaux).",
    chainTitle: 'Où se produit le gaspillage alimentaire dans le monde ?',
    chain: [
      { label: 'Ménages', pct: 60, tone: 'fresh' },
      { label: 'Restauration', pct: 28, tone: 'zest' },
      { label: 'Distribution / commerces', pct: 12, tone: 'neutral' },
    ],
    countryWaste: [
      { country: '🇫🇷 France', kg: '~20 à 30 kg', source: 'ADEME' },
      { country: '🇬🇧 Royaume-Uni', kg: '~88 kg', source: 'WRAP 2022' },
      { country: '🇺🇸 États-Unis', kg: '~73 kg', source: 'UNEP 2024' },
      { country: '🇩🇪 Allemagne', kg: '~75 kg', source: 'Thünen Institute' },
      { country: '🇮🇹 Italie', kg: '~30 kg', source: 'Waste Watcher / OWW-IT' },
    ],
    countryTableTitle: 'Gaspillage alimentaire des ménages, par pays (ordres de grandeur)',
    perYearPerson: '/ an / personne',
    sources:
      "Sources : UNEP Food Waste Index Report 2024 (chiffres mondiaux et États-Unis, données 2022) ; ADEME (France) ; WRAP, rapport 2022 (Royaume-Uni) ; Thünen Institute (Allemagne) ; Waste Watcher / OWW-IT (Italie) ; FAO / UNEP (coût économique). Les méthodologies de mesure diffèrent selon les pays (déclaratif vs. analyse des déchets), ces chiffres sont donc des ordres de grandeur plutôt qu'une comparaison stricte.",
    ctaTitle: 'Prêt à vider votre frigo intelligemment ?',
    ctaText:
      "Une photo suffit pour démarrer. Vous pourrez toujours ajuster la liste d'ingrédients avant de voir vos recettes.",
    ctaButton: '📸 Prendre une photo',
  },
  en: {
    heading: (
      <>
        Your fridge, your recipes, <span className="text-gradient-fresh">in 3 clicks</span>.
      </>
    ),
    intro:
      "Take a photo of your fridge or table, FrigoMind detects the ingredients and suggests simple, zero-waste recipes. No sign-up, no credit card: open the app, take a photo, start cooking.",
    start: '📸 Get started',
    steps: [
      { Icon: CameraGlyph, tone: 'fresh', title: 'Photo', text: 'Take a photo of your fridge or table.' },
      { Icon: BookGlyph, tone: 'zest', title: 'Confirm', text: 'Correct the detected ingredient list.' },
      { Icon: PotGlyph, tone: 'fresh', title: 'Cook', text: 'Get 3 to 5 ready-to-make recipes.' },
    ],
    whyTitle: 'Why FrigoMind?',
    whySubtitle:
      'An app designed to stop you wondering "what should we eat tonight" while staring at a half-full fridge.',
    values: [
      {
        Icon: SproutGlyph,
        tone: 'fresh',
        title: 'Zero-waste by default',
        text: 'FrigoMind prioritizes perishable ingredients to help you use them before they go to waste.',
      },
      {
        Icon: CompassGlyph,
        tone: 'zest',
        title: 'Always a solution',
        text: "Even with an unusual combination of ingredients, the app guarantees 3 to 5 realistic recipes — never a dead end.",
      },
      {
        Icon: LockGlyph,
        tone: 'neutral',
        title: 'Your data, respected',
        text: 'Your photos are only used for AI analysis and are never stored on our servers.',
      },
      {
        Icon: PotGlyph,
        tone: 'fresh',
        title: '100% free',
        text: 'Powered by Google Gemini, no credit card or hidden subscription.',
      },
    ],
    wasteTitle: 'Food waste, in numbers',
    wasteSubtitle: "A little perspective on why it's worth finishing what's in the fridge.",
    wasteWorldTonnes: '1.05 billion',
    wasteWorldTonnesText: 'tonnes of food wasted every year worldwide — more than 1 billion meals thrown away every day.',
    wastePerPerson: '132 kg',
    wastePerPersonText: 'per person per year on average worldwide (about 79 kg of that from households alone).',
    wasteCO2: '8 to 10%',
    wasteCO2Text:
      "of global greenhouse gas emissions come from food waste — almost 5 times the emissions of the aviation sector.",
    wasteCost: '~$1 trillion',
    wasteCostText:
      'lost worldwide every year because of food waste (direct economic cost, not counting environmental and social impacts).',
    chainTitle: 'Where does food waste happen worldwide?',
    chain: [
      { label: 'Households', pct: 60, tone: 'fresh' },
      { label: 'Food service', pct: 28, tone: 'zest' },
      { label: 'Retail', pct: 12, tone: 'neutral' },
    ],
    countryWaste: [
      { country: '🇫🇷 France', kg: '~20-30 kg', source: 'ADEME' },
      { country: '🇬🇧 United Kingdom', kg: '~88 kg', source: 'WRAP 2022' },
      { country: '🇺🇸 United States', kg: '~73 kg', source: 'UNEP 2024' },
      { country: '🇩🇪 Germany', kg: '~75 kg', source: 'Thünen Institute' },
      { country: '🇮🇹 Italy', kg: '~30 kg', source: 'Waste Watcher / OWW-IT' },
    ],
    countryTableTitle: 'Household food waste by country (rough estimates)',
    perYearPerson: '/ year / person',
    sources:
      'Sources: UNEP Food Waste Index Report 2024 (global figures and US, 2022 data); ADEME (France); WRAP, 2022 report (UK); Thünen Institute (Germany); Waste Watcher / OWW-IT (Italy); FAO / UNEP (economic cost). Measurement methodologies differ by country (self-reported diaries vs. waste analysis), so these figures are rough estimates rather than a strict comparison.',
    ctaTitle: 'Ready to empty your fridge smartly?',
    ctaText: 'One photo is all it takes to start. You can always adjust the ingredient list before seeing your recipes.',
    ctaButton: '📸 Take a photo',
  },
}

// Emoji des 4 cartes "chiffres du gaspillage", associés à un ton de couleur
// (icon-badge) pour leur donner la même présence visuelle que les icônes du
// reste du site plutôt que de rester des emoji nus.
const WASTE_STAT_ICONS = ['🌍', '⚖️', '🌫️', '💰']
const WASTE_STAT_TONES = ['bg-fresh-50', 'bg-zest-50', 'bg-neutral-100', 'bg-zest-50']

// Petit hook générique : révèle une section (animate-rise) seulement quand
// elle entre dans le viewport, plutôt qu'au montage de la page. Sans ça, les
// sections sous la ligne de flottaison (steps, values, stats gaspillage, CTA)
// avaient déjà fini leur animation avant que l'utilisateur ne scrolle
// jusqu'à elles — invisible en pratique.
function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

// Page d'accueil : promesse claire + CTA unique pour lancer le flow en 3 clics,
// puis contenu explicatif enrichi (étapes, valeurs, anti-gaspi) pour rassurer
// et donner du contexte avant de se lancer.
export default function HomePage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]

  const [stepsRef, stepsInView] = useInView()
  const [valuesRef, valuesInView] = useInView()
  const [wasteRef, wasteInView] = useInView()
  const [ctaRef, ctaInView] = useInView()

  // Déclenche le remplissage animé des barres de répartition (ménages /
  // restauration / distribution) une fois la section gaspillage visible à
  // l'écran : elles partent de 0% et rejoignent leur largeur cible via la
  // transition CSS, plutôt que d'apparaître déjà pleines hors champ.
  const [barsFilled, setBarsFilled] = useState(false)
  useEffect(() => {
    if (!wasteInView) return
    const t = setTimeout(() => setBarsFilled(true), 150)
    return () => clearTimeout(t)
  }, [wasteInView])

  const wasteStats = [
    { icon: WASTE_STAT_ICONS[0], tone: WASTE_STAT_TONES[0], value: s.wasteWorldTonnes, text: s.wasteWorldTonnesText },
    { icon: WASTE_STAT_ICONS[1], tone: WASTE_STAT_TONES[1], value: s.wastePerPerson, text: s.wastePerPersonText },
    { icon: WASTE_STAT_ICONS[2], tone: WASTE_STAT_TONES[2], value: s.wasteCO2, text: s.wasteCO2Text },
    { icon: WASTE_STAT_ICONS[3], tone: WASTE_STAT_TONES[3], value: s.wasteCost, text: s.wasteCostText },
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

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 animate-rise">
          {s.heading}
        </h1>
        <p
          className="mt-3 text-neutral-500 text-base sm:text-lg max-w-xl mx-auto animate-rise"
          style={{ animationDelay: '90ms' }}
        >
          {s.intro}
        </p>

        <div
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center animate-rise"
          style={{ animationDelay: '180ms' }}
        >
          <button onClick={() => goTo('upload')} className="btn-primary text-base px-6 py-3.5">
            {s.start}
          </button>
        </div>
      </div>

      <div ref={stepsRef} className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {s.steps.map((step, i) => (
          <div
            key={step.title}
            className={`card p-5 text-center ${stepsInView ? 'animate-rise' : 'opacity-0'}`}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <IllustrationTile tone={step.tone} size="sm" className="mx-auto mb-3">
              <step.Icon className="w-full h-full" />
            </IllustrationTile>
            <div className="font-semibold text-neutral-900">
              {i + 1}. {step.title}
            </div>
            <p className="text-sm text-neutral-500 mt-1">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="section-title">{s.whyTitle}</h2>
        <p className="section-subtitle">{s.whySubtitle}</p>

        <div ref={valuesRef} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {s.values.map((v, i) => (
            <div
              key={v.title}
              className={`card p-5 flex gap-3 ${valuesInView ? 'animate-rise' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
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

      <div ref={wasteRef} className="mt-16">
        <h2 className={`section-title ${wasteInView ? 'animate-rise' : 'opacity-0'}`}>{s.wasteTitle}</h2>
        <p
          className={`section-subtitle ${wasteInView ? 'animate-rise' : 'opacity-0'}`}
          style={{ animationDelay: '60ms' }}
        >
          {s.wasteSubtitle}
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wasteStats.map((stat, i) => (
            <div
              key={stat.value}
              className={`card p-5 text-center ${wasteInView ? 'animate-rise' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className={`icon-badge ${stat.tone} mx-auto mb-2 text-2xl`} aria-hidden>
                {stat.icon}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-fresh-700 tracking-tight">{stat.value}</div>
              <p className="text-sm text-neutral-500 mt-1">{stat.text}</p>
            </div>
          ))}
        </div>

        <div
          className={`mt-4 card p-5 ${wasteInView ? 'animate-rise' : 'opacity-0'}`}
          style={{ animationDelay: '360ms' }}
        >
          <p className="font-semibold text-neutral-900 text-sm mb-3">{s.chainTitle}</p>
          <div className="space-y-2.5">
            {s.chain.map((c, i) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-700">{c.label}</span>
                  <span className="text-neutral-500 font-medium">{c.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ease-out ${
                      c.tone === 'fresh' ? 'bg-fresh-500' : c.tone === 'zest' ? 'bg-zest-500' : 'bg-neutral-400'
                    }`}
                    style={{
                      width: barsFilled ? `${c.pct}%` : '0%',
                      transitionDuration: '900ms',
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mt-4 card p-5 ${wasteInView ? 'animate-rise' : 'opacity-0'}`}
          style={{ animationDelay: '420ms' }}
        >
          <p className="font-semibold text-neutral-900 text-sm mb-3">{s.countryTableTitle}</p>
          <div className="divide-y divide-neutral-100">
            {s.countryWaste.map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm py-2 first:pt-0 last:pb-0">
                <span className="text-neutral-700">{c.country}</span>
                <span className="text-neutral-500">
                  {c.kg} {s.perYearPerson} <span className="text-neutral-300">· {c.source}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3 pt-3 border-t border-neutral-100">{s.sources}</p>
        </div>
      </div>

      <div
        ref={ctaRef}
        className={`mt-16 card p-6 sm:p-8 text-center bg-gradient-to-br from-fresh-50 to-zest-50/60 border-fresh-100 shadow-glow ${
          ctaInView ? 'animate-rise' : 'opacity-0'
        }`}
      >
        <IllustrationTile tone="zest" size="md" className="mx-auto mb-3">
          <PotGlyph className="w-full h-full" />
        </IllustrationTile>
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900">{s.ctaTitle}</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">{s.ctaText}</p>
        <button onClick={() => goTo('upload')} className="btn-primary text-base px-6 py-3 mt-5">
          {s.ctaButton}
        </button>
      </div>
    </div>
  )
}
