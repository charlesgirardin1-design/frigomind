import { useApp } from '../state/AppContext.jsx'

const FAQ_ITEMS = [
  {
    q: "L'IA se trompe-t-elle parfois sur les ingrédients détectés ?",
    a: "Oui, c'est possible, surtout sur une photo peu nette ou avec beaucoup d'aliments empilés. C'est pour ça que la liste est toujours modifiable : vous pouvez décocher, renommer (via les suggestions alternatives) ou ajouter un ingrédient manuellement avant de générer vos recettes.",
  },
  {
    q: 'Mes photos sont-elles conservées quelque part ?',
    a: "Non. La photo est envoyée à l'API Google Gemini uniquement pour l'analyse, via une fonction serverless qui ne la stocke pas. Elle n'est jamais sauvegardée sur un serveur FrigoMind.",
  },
  {
    q: "Est-ce que l'app est vraiment gratuite ?",
    a: "Oui. FrigoMind utilise Google Gemini, qui propose un palier gratuit sans carte bancaire pour la reconnaissance d'image. Si cette clé n'est pas configurée sur le déploiement, l'app fonctionne quand même : vous ajoutez simplement vos ingrédients à la main.",
  },
  {
    q: "Pourquoi certaines recettes proposées contiennent des ingrédients que je n'ai pas ?",
    a: "FrigoMind garantit que toutes les recettes proposées utilisent OBLIGATOIREMENT tous les ingrédients que vous avez validés. En revanche, elle peut suggérer un ou deux ingrédients supplémentaires à acheter, ou des basiques de placard (sel, poivre, huile...) qu'on suppose toujours disponibles.",
  },
  {
    q: "Que se passe-t-il si je n'ai pas assez d'ingrédients pour une vraie recette ?",
    a: "FrigoMind ne bloque jamais : si aucune recette de la base ne correspond à votre combinaison d'ingrédients, l'app génère automatiquement des recettes maison simples (poêlée, bol frais, gratin, soupe, wok) qui utilisent exactement ce que vous avez.",
  },
  {
    q: "C'est quoi le mode anti-gaspi ?",
    a: 'Une fonctionnalité bonus qui priorise les recettes utilisant des ingrédients périssables (comme les produits laitiers, la viande fraîche ou les herbes) pour vous aider à les consommer avant qu\'ils ne soient perdus.',
  },
  {
    q: "Mon historique de recettes est-il synchronisé entre mes appareils ?",
    a: "Non, il est stocké uniquement dans le navigateur utilisé (localStorage). Si vous changez d'appareil ou videz le cache de votre navigateur, l'historique repart de zéro.",
  },
  {
    q: 'Puis-je utiliser FrigoMind sans connexion internet ?',
    a: "La partie interface fonctionne, mais l'analyse photo par IA nécessite une connexion (elle appelle une API externe). Sans connexion, vous pouvez toujours ajouter vos ingrédients manuellement.",
  },
]

// Page FAQ : questions fréquentes sous forme de liste simple Q/R.
export default function FaqPage() {
  const { goTo } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Retour
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Questions fréquentes</h2>
      <p className="text-neutral-500 mt-1">Tout ce qu'il faut savoir pour bien utiliser FrigoMind.</p>

      <div className="mt-6 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="card p-4">
            <p className="font-semibold text-neutral-900">{item.q}</p>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
