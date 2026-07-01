import { useApp } from '../state/AppContext.jsx'

// Petits articles anti-gaspi : conseils de conservation et idées de recettes
// de restes. Contenu généraliste, pas de recette liée à un ingrédient précis.
const ARTICLES = [
  {
    emoji: '🧊',
    title: 'Bien ranger son frigo pour que les aliments tiennent plus longtemps',
    text: [
      "Le frigo n'est pas uniforme : le bas (juste au-dessus du bac à légumes) est la zone la plus froide, idéale pour la viande, le poisson et les produits laitiers ouverts. La porte, plus tempérée, convient aux condiments et boissons, pas au lait ou aux œufs.",
      "Les fruits et légumes se conservent mieux dans le bac dédié, qui limite leur dessèchement. Pensez aussi à séparer les fruits qui produisent de l'éthylène (pommes, bananes) des légumes sensibles, car ce gaz accélère leur maturation.",
      "Enfin, un frigo trop rempli refroidit moins bien : l'air doit pouvoir circuler entre les aliments pour que le froid soit homogène partout.",
    ],
  },
  {
    emoji: '🥕',
    title: 'Que faire avec des légumes un peu fatigués ?',
    text: [
      "Des légumes ramollis ou légèrement flétris ne sont pas perdus : ils sont parfaits pour une soupe, un velouté ou une poêlée, où la texture importe moins que dans une salade crue.",
      "Les fanes de carottes ou de radis, souvent jetées, peuvent se cuisiner comme des épinards ou finir en pesto. Les épluchures bien lavées (carotte, pomme de terre) peuvent même être passées au four avec un peu d'huile pour des chips maison.",
      "Un légume qui commence à germer (comme un oignon ou une pomme de terre) reste généralement utilisable : il suffit de retirer la partie germée avant cuisson.",
    ],
  },
  {
    emoji: '🍞',
    title: 'Pain dur, restes de riz ou de pâtes : rien ne se perd',
    text: [
      "Le pain rassis se transforme facilement en croûtons pour une salade ou une soupe, en pain perdu sucré ou salé, ou encore en chapelure maison une fois mixé et séché.",
      "Le riz ou les pâtes cuits en trop se réutilisent très bien le lendemain dans un riz sauté, une frittata, ou une salade froide avec ce qui traîne dans le frigo (légumes, fromage, restes de viande ou de poisson).",
      "Une astuce simple : gardez toujours un bocal \"restes\" au frigo pour regrouper les petites quantités de légumes cuits, elles font souvent une excellente base de soupe en fin de semaine.",
    ],
  },
  {
    emoji: '🏷️',
    title: 'DLC ou DDM : comprendre les dates sur les emballages',
    text: [
      "La DLC (date limite de consommation, \"à consommer jusqu'au\") concerne les produits périssables comme la viande fraîche ou le poisson : elle doit être respectée pour des raisons de sécurité alimentaire.",
      "La DDM (date de durabilité minimale, \"à consommer de préférence avant\") concerne des produits plus stables (pâtes, riz, conserves, biscuits) : après cette date, le produit peut perdre en qualité (goût, texture) mais reste souvent consommable sans risque, sous réserve d'un aspect et d'une odeur normaux.",
      "Confondre les deux est l'une des principales causes de gaspillage évitable à la maison : on jette par précaution un produit encore parfaitement bon.",
    ],
  },
]

// Page "Blog / Astuces anti-gaspi" : quelques articles courts et concrets.
export default function BlogPage() {
  const { goTo } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Retour
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Astuces anti-gaspi</h2>
      <p className="text-neutral-500 mt-1 text-sm">
        Quelques conseils simples pour jeter moins et cuisiner mieux ce que vous avez déjà.
      </p>

      <div className="mt-6 space-y-4">
        {ARTICLES.map((article) => (
          <article key={article.title} className="card p-5">
            <h3 className="font-semibold text-neutral-900 flex items-start gap-2">
              <span aria-hidden>{article.emoji}</span>
              <span>{article.title}</span>
            </h3>
            <div className="mt-2.5 space-y-2 text-sm text-neutral-500 leading-relaxed">
              {article.text.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-neutral-400">
        Envie de mettre ça en pratique ?{' '}
        <button onClick={() => goTo('upload')} className="text-fresh-700 underline underline-offset-2">
          Prenez en photo ce qu'il vous reste
        </button>
        .
      </p>
    </div>
  )
}
