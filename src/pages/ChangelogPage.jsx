import { useApp } from '../state/AppContext.jsx'

// Historique des évolutions du site, dans l'ordre du plus récent au plus ancien.
const ENTRIES = [
  {
    date: "2 juillet 2026",
    title: 'Nouvelle navigation, page 404 et pages Blog / Stats / Nouveautés',
    items: [
      "Ajout d'un menu de navigation en haut du site (avec version mobile).",
      "Ajout d'une page d'erreur 404 personnalisée pour les liens invalides.",
      "Page d'accueil enrichie : plus de texte, section \"Pourquoi FrigoMind ?\" et chiffres du gaspillage alimentaire.",
      'Nouvelles pages : Blog anti-gaspi, Statistiques personnelles, et cette page Nouveautés.',
    ],
  },
  {
    date: 'Mise à jour précédente',
    title: 'Pages À propos, FAQ et Mentions légales',
    items: [
      "Ajout des pages À propos, FAQ et Mentions légales / Confidentialité, accessibles depuis le pied de page.",
    ],
  },
  {
    date: 'Mise à jour précédente',
    title: 'Recettes enrichies et emojis intelligents',
    items: [
      'La base de recettes passe à 34 recettes, avec plus de variété (poisson, viande, végétarien, fruits...).',
      'Les emojis des recettes générées automatiquement reflètent désormais les ingrédients réellement utilisés.',
      'Garantie renforcée : toutes les recettes proposées utilisent obligatoirement les ingrédients pris en photo.',
    ],
  },
  {
    date: 'Mise à jour précédente',
    title: "Fiabilisation de l'analyse photo",
    items: [
      "Les photos sont redimensionnées automatiquement avant l'envoi, pour éviter les échecs d'analyse sur les photos très lourdes (prises avec un téléphone récent).",
    ],
  },
  {
    date: 'Version initiale',
    title: 'Lancement de FrigoMind',
    items: [
      'Premier déploiement : photo → détection des ingrédients par IA (Google Gemini) → liste modifiable → 3 à 5 recettes personnalisées.',
      'Bonus dès le départ : mode anti-gaspi, bouton "Surprends-moi", historique des recettes générées.',
    ],
  },
]

// Page "Nouveautés" : changelog simple listant les évolutions du site.
export default function ChangelogPage() {
  const { goTo } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Retour
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Nouveautés</h2>
      <p className="text-neutral-500 mt-1 text-sm">
        Ce qui a changé sur FrigoMind, mise à jour après mise à jour.
      </p>

      <div className="mt-6 space-y-4">
        {ENTRIES.map((entry, i) => (
          <div key={i} className="card p-4">
            <p className="text-xs font-medium text-fresh-700">{entry.date}</p>
            <p className="font-semibold text-neutral-900 mt-0.5">{entry.title}</p>
            <ul className="list-disc list-inside text-sm text-neutral-500 mt-2 space-y-1">
              {entry.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
