import { useApp } from '../state/AppContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { PartyGlyph } from '../components/Illustrations.jsx'

// Historique des évolutions du site, dans l'ordre du plus récent au plus ancien.
const ENTRIES = [
  {
    date: '2 juillet 2026',
    title: 'Favoris, planning de la semaine, recherche par ingrédient et mode placard',
    items: [
      "Nouveau bouton ❤️ sur chaque recette pour la garder en favori, et une page \"Mes favoris\" dédiée.",
      "Nouvelle page \"Planning de la semaine\" : glissez (ou touchez) vos recettes favorites sur les 7 jours, avec liste de courses agrégée copiable en un clic.",
      "Nouvelle page \"Recettes par ingrédient\" : cherchez un ingrédient pour voir toutes les recettes qui l'utilisent et une astuce de conservation anti-gaspi.",
      "Sur la page d'upload, un mode \"Vider le placard\" oriente l'analyse IA vers les produits secs et de longue conservation.",
      "Dans chaque recette, une liste de courses copiable pour les ingrédients qu'il vous manque.",
    ],
  },
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
    date: '4 juillet 2026',
    title: 'Refonte visuelle : illustrations et cohérence graphique',
    items: [
      "Nouvelles illustrations sur mesure (dessinées en SVG) pour habiller les en-têtes de page et les états vides, en plus des emoji.",
      "Toutes les pages secondaires (À propos, FAQ, Blog, Stats, Planning, Favoris, Historique, Mentions légales...) suivent désormais le même gabarit visuel que la page d'accueil.",
      "FAQ enrichie et classée par thème (Fonctionnement, Confidentialité, Prix, Technique).",
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

// Page "Nouveautés" : changelog en forme de frise chronologique.
export default function ChangelogPage() {
  const { goTo } = useApp()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<PartyGlyph className="w-full h-full" />}
        tone="zest"
        title="Nouveautés"
        subtitle="Ce qui a changé sur FrigoMind, mise à jour après mise à jour."
      />

      <div className="mt-7 relative pl-5">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-200" aria-hidden />
        <div className="space-y-4">
          {ENTRIES.map((entry, i) => (
            <div key={i} className="relative">
              <span
                className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                  i === 0 ? 'bg-fresh-500' : 'bg-neutral-300'
                }`}
                aria-hidden
              />
              <div className="card p-4">
                <p className="text-xs font-medium text-fresh-700">{entry.date}</p>
                <p className="font-semibold text-neutral-900 mt-0.5">{entry.title}</p>
                <ul className="list-disc list-inside text-sm text-neutral-500 mt-2 space-y-1">
                  {entry.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
