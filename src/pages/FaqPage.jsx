import { useApp } from '../state/AppContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { SearchGlyph } from '../components/Illustrations.jsx'

const FAQ_ITEMS = [
  {
    cat: 'Fonctionnement',
    q: "L'IA se trompe-t-elle parfois sur les ingrédients détectés ?",
    a: "Oui, c'est possible, surtout sur une photo peu nette ou avec beaucoup d'aliments empilés. C'est pour ça que la liste est toujours modifiable : vous pouvez décocher, renommer (via les suggestions alternatives) ou ajouter un ingrédient manuellement avant de générer vos recettes.",
  },
  {
    cat: 'Confidentialité',
    q: 'Mes photos sont-elles conservées quelque part ?',
    a: "Non. La photo est envoyée à l'API Google Gemini uniquement pour l'analyse, via une fonction serverless qui ne la stocke pas. Elle n'est jamais sauvegardée sur un serveur FrigoMind.",
  },
  {
    cat: 'Prix',
    q: "Est-ce que l'app est vraiment gratuite ?",
    a: "Oui. FrigoMind utilise Google Gemini, qui propose un palier gratuit sans carte bancaire pour la reconnaissance d'image. Si cette clé n'est pas configurée sur le déploiement, l'app fonctionne quand même : vous ajoutez simplement vos ingrédients à la main.",
  },
  {
    cat: 'Fonctionnement',
    q: "Pourquoi certaines recettes proposées contiennent des ingrédients que je n'ai pas ?",
    a: "FrigoMind garantit que toutes les recettes proposées utilisent OBLIGATOIREMENT tous les ingrédients que vous avez validés. En revanche, elle peut suggérer un ou deux ingrédients supplémentaires à acheter, ou des basiques de placard (sel, poivre, huile...) qu'on suppose toujours disponibles.",
  },
  {
    cat: 'Fonctionnement',
    q: "Que se passe-t-il si je n'ai pas assez d'ingrédients pour une vraie recette ?",
    a: "FrigoMind ne bloque jamais : si aucune recette de la base ne correspond à votre combinaison d'ingrédients, l'app génère automatiquement des recettes maison simples (poêlée, bol frais, gratin, soupe, wok) qui utilisent exactement ce que vous avez.",
  },
  {
    cat: 'Anti-gaspi',
    q: "C'est quoi le mode anti-gaspi ?",
    a: 'Une fonctionnalité bonus qui priorise les recettes utilisant des ingrédients périssables (comme les produits laitiers, la viande fraîche ou les herbes) pour vous aider à les consommer avant qu\'ils ne soient perdus.',
  },
  {
    cat: 'Technique',
    q: "Mon historique de recettes est-il synchronisé entre mes appareils ?",
    a: "Non, il est stocké uniquement dans le navigateur utilisé (localStorage). Si vous changez d'appareil ou videz le cache de votre navigateur, l'historique repart de zéro.",
  },
  {
    cat: 'Technique',
    q: 'Puis-je utiliser FrigoMind sans connexion internet ?',
    a: "La partie interface fonctionne, mais l'analyse photo par IA nécessite une connexion (elle appelle une API externe). Sans connexion, vous pouvez toujours ajouter vos ingrédients manuellement.",
  },
  {
    cat: 'Fonctionnement',
    q: 'Puis-je utiliser FrigoMind pour un régime particulier (végétarien, sans gluten...) ?',
    a: "Le panneau de préférences propose un filtre végétarien. Pour les autres régimes, vous pouvez décocher manuellement les ingrédients incompatibles avant de générer vos recettes : FrigoMind s'adapte toujours à la liste validée, jamais l'inverse.",
  },
  {
    cat: 'Prix',
    q: 'FrigoMind va-t-il rester gratuit ?',
    a: "FrigoMind est un projet MVP en évolution. L'objectif reste un usage gratuit pour l'analyse de base ; toute évolution du modèle sera annoncée sur la page Nouveautés.",
  },
]

const CATEGORY_TONE = {
  Fonctionnement: 'badge-fresh',
  Confidentialité: 'badge-neutral',
  Prix: 'badge-zest',
  'Anti-gaspi': 'badge-fresh',
  Technique: 'badge-neutral',
}

// Page FAQ : questions fréquentes, regroupées par thème.
export default function FaqPage() {
  const { goTo } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<SearchGlyph className="w-full h-full" />}
        tone="zest"
        title="Questions fréquentes"
        subtitle="Tout ce qu'il faut savoir pour bien utiliser FrigoMind."
      />

      <div className="mt-7 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-neutral-900">{item.q}</p>
              <span className={`badge ${CATEGORY_TONE[item.cat] || 'badge-neutral'} shrink-0 whitespace-nowrap`}>
                {item.cat}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-neutral-400">
        Une autre question ?{' '}
        <button onClick={() => goTo('about')} className="text-fresh-700 underline underline-offset-2">
          Voir la page À propos
        </button>
        .
      </p>
    </div>
  )
}
