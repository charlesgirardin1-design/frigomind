import { useApp } from '../state/AppContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { IllustrationTile, FridgeGlyph, SproutGlyph, CameraGlyph, LockGlyph } from '../components/Illustrations.jsx'

// Page "À propos" : présente le concept FrigoMind et la mission anti-gaspi.
export default function AboutPage() {
  const { goTo } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<FridgeGlyph className="w-full h-full" />}
        title="À propos de FrigoMind"
        subtitle="Le concept, la mission anti-gaspi, et ce qu'on fait de vos photos."
      />

      <div className="mt-7 space-y-5 text-neutral-600 leading-relaxed">
        <p>
          FrigoMind est né d'un constat simple : on ouvre le frigo, on ne sait pas quoi cuisiner avec ce
          qu'il y a dedans, et trop souvent des aliments finissent à la poubelle faute d'idée de recette.
          L'app propose une solution en 3 clics : une photo, une liste d'ingrédients détectée
          automatiquement, et des recettes réalistes à faire tout de suite.
        </p>

        <div className="card p-5 flex gap-4">
          <IllustrationTile tone="fresh" size="sm">
            <SproutGlyph className="w-full h-full" />
          </IllustrationTile>
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1.5">Notre mission anti-gaspi</h3>
            <p className="text-sm">
              En France, un foyer jette en moyenne plusieurs dizaines de kilos de nourriture par an,
              souvent par manque d'idée plutôt que par manque d'envie de cuisiner. FrigoMind priorise les
              ingrédients périssables (mode anti-gaspi) et garantit toujours au moins une suggestion de
              recette, même avec des combinaisons d'ingrédients inhabituelles : jamais de "je ne sais pas
              quoi te proposer".
            </p>
          </div>
        </div>

        <div className="card p-5 flex gap-4">
          <IllustrationTile tone="zest" size="sm">
            <CameraGlyph className="w-full h-full" />
          </IllustrationTile>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 mb-1.5">Comment ça marche</h3>
            <ol className="list-decimal list-inside text-sm space-y-1.5">
              <li>Vous prenez en photo votre frigo, un placard, ou votre table.</li>
              <li>Une IA multimodale (Google Gemini) détecte les aliments réellement visibles sur la photo.</li>
              <li>Vous validez, corrigez ou complétez la liste d'ingrédients.</li>
              <li>FrigoMind propose 3 à 5 recettes qui utilisent obligatoirement tout ce que vous avez.</li>
            </ol>
          </div>
        </div>

        <div className="card p-5 flex gap-4">
          <IllustrationTile tone="neutral" size="sm">
            <LockGlyph className="w-full h-full" />
          </IllustrationTile>
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1.5">Vos photos</h3>
            <p className="text-sm">
              Les photos sont envoyées à l'API Google Gemini uniquement pour être analysées, via une
              fonction serverless qui garde la clé API secrète. Elles ne sont pas stockées sur un serveur
              FrigoMind. Votre historique de recettes est conservé uniquement dans votre navigateur
              (localStorage), jamais envoyé ailleurs.
            </p>
          </div>
        </div>

        <p className="text-sm">
          FrigoMind est un projet MVP (produit minimum viable), pensé mobile-first, sans dépendance
          technique compliquée : React, Vite, Tailwind, et une IA gratuite. Pour en savoir plus, consultez
          la <button onClick={() => goTo('faq')} className="text-fresh-700 underline underline-offset-2">FAQ</button>{' '}
          ou les{' '}
          <button onClick={() => goTo('legal')} className="text-fresh-700 underline underline-offset-2">
            mentions légales
          </button>
          .
        </p>
      </div>
    </div>
  )
}
