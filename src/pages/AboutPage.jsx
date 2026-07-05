import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, FridgeGlyph, SproutGlyph, CameraGlyph, LockGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'À propos de FrigoMind',
    subtitle: 'Le concept, la mission anti-gaspi, et ce qu\'on fait de vos photos.',
    intro:
      "FrigoMind est né d'un constat simple : on ouvre le frigo, on ne sait pas quoi cuisiner avec ce qu'il y a dedans, et trop souvent des aliments finissent à la poubelle faute d'idée de recette. L'app propose une solution en 3 clics : une photo, une liste d'ingrédients détectée automatiquement, et des recettes réalistes à faire tout de suite.",
    missionTitle: 'Notre mission anti-gaspi',
    missionText:
      "En France, un foyer jette en moyenne plusieurs dizaines de kilos de nourriture par an, souvent par manque d'idée plutôt que par manque d'envie de cuisiner. FrigoMind priorise les ingrédients périssables (mode anti-gaspi) et garantit toujours au moins une suggestion de recette, même avec des combinaisons d'ingrédients inhabituelles : jamais de \"je ne sais pas quoi te proposer\".",
    howTitle: 'Comment ça marche',
    howSteps: [
      'Vous prenez en photo votre frigo, un placard, ou votre table.',
      'Une IA multimodale (Google Gemini) détecte les aliments réellement visibles sur la photo.',
      'Vous validez, corrigez ou complétez la liste d\'ingrédients.',
      'FrigoMind propose 3 à 5 recettes qui utilisent obligatoirement tout ce que vous avez.',
    ],
    photosTitle: 'Vos photos',
    photosText:
      "Les photos sont envoyées à l'API Google Gemini uniquement pour être analysées, via une fonction serverless qui garde la clé API secrète. Elles ne sont pas stockées sur un serveur FrigoMind. Votre historique de recettes est conservé uniquement dans votre navigateur (localStorage), jamais envoyé ailleurs.",
    outroPrefix:
      "FrigoMind est un projet MVP (produit minimum viable), pensé mobile-first, sans dépendance technique compliquée : React, Vite, Tailwind, et une IA gratuite. Pour en savoir plus, consultez la",
    outroOr: 'ou les',
  },
  en: {
    title: 'About FrigoMind',
    subtitle: "The concept, the zero-waste mission, and what we do with your photos.",
    intro:
      "FrigoMind was born from a simple observation: you open the fridge, you don't know what to cook with what's in there, and too often food ends up in the trash for lack of a recipe idea. The app offers a solution in 3 clicks: a photo, an automatically detected ingredient list, and realistic recipes you can make right away.",
    missionTitle: 'Our zero-waste mission',
    missionText:
      "In France, a household throws away tens of kilos of food per year on average, often from a lack of ideas rather than a lack of desire to cook. FrigoMind prioritizes perishable ingredients (zero-waste mode) and always guarantees at least one recipe suggestion, even with unusual ingredient combinations: never a \"I don't know what to suggest\".",
    howTitle: 'How it works',
    howSteps: [
      'You take a photo of your fridge, a cupboard, or your table.',
      'A multimodal AI (Google Gemini) detects the food actually visible in the photo.',
      'You confirm, correct or complete the ingredient list.',
      'FrigoMind suggests 3 to 5 recipes that all use everything you have.',
    ],
    photosTitle: 'Your photos',
    photosText:
      "Photos are sent to the Google Gemini API only to be analyzed, via a serverless function that keeps the API key secret. They are not stored on a FrigoMind server. Your recipe history is kept only in your browser (localStorage), never sent anywhere else.",
    outroPrefix:
      'FrigoMind is an MVP (minimum viable product) project, designed mobile-first, without complicated technical dependencies: React, Vite, Tailwind, and a free AI. To learn more, check out the',
    outroOr: 'or the',
  },
}

// Page "À propos" : présente le concept FrigoMind et la mission anti-gaspi.
export default function AboutPage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const c = COMMON[lang]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<FridgeGlyph className="w-full h-full" />}
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-7 space-y-5 text-neutral-600 leading-relaxed">
        <p>{s.intro}</p>

        <div className="card p-5 flex gap-4">
          <IllustrationTile tone="fresh" size="sm">
            <SproutGlyph className="w-full h-full" />
          </IllustrationTile>
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1.5">{s.missionTitle}</h3>
            <p className="text-sm">{s.missionText}</p>
          </div>
        </div>

        <div className="card p-5 flex gap-4">
          <IllustrationTile tone="zest" size="sm">
            <CameraGlyph className="w-full h-full" />
          </IllustrationTile>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 mb-1.5">{s.howTitle}</h3>
            <ol className="list-decimal list-inside text-sm space-y-1.5">
              {s.howSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="card p-5 flex gap-4">
          <IllustrationTile tone="neutral" size="sm">
            <LockGlyph className="w-full h-full" />
          </IllustrationTile>
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1.5">{s.photosTitle}</h3>
            <p className="text-sm">{s.photosText}</p>
          </div>
        </div>

        <p className="text-sm">
          {s.outroPrefix}{' '}
          <button onClick={() => goTo('faq')} className="text-fresh-700 underline underline-offset-2">
            {c.nav.faq}
          </button>{' '}
          {s.outroOr}{' '}
          <button onClick={() => goTo('legal')} className="text-fresh-700 underline underline-offset-2">
            {c.nav.legal}
          </button>
          .
        </p>
      </div>
    </div>
  )
}
