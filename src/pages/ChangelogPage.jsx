import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { PartyGlyph } from '../components/Illustrations.jsx'

// Historique des évolutions du site, dans l'ordre du plus récent au plus ancien.
const ENTRIES = {
  fr: [
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
      date: '2 juillet 2026',
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
  ],
  en: [
    {
      date: 'July 2, 2026',
      title: 'Favorites, weekly planning, ingredient search & pantry mode',
      items: [
        'New ❤️ button on every recipe to save it as a favorite, and a dedicated "My favorites" page.',
        'New "Weekly planning" page: drag (or tap) your favorite recipes onto the 7 days, with an aggregated shopping list copyable in one click.',
        'New "Recipes by ingredient" page: search for an ingredient to see every recipe that uses it, plus a zero-waste storage tip.',
        'On the upload page, an "Empty the pantry" mode steers the AI analysis toward dry, long-lasting products.',
        'In every recipe, a copyable shopping list for the ingredients you\'re missing.',
      ],
    },
    {
      date: 'July 2, 2026',
      title: 'New navigation, 404 page, and Blog / Stats / What\'s new pages',
      items: [
        'Added a navigation menu at the top of the site (with a mobile version).',
        'Added a custom 404 error page for invalid links.',
        'Enriched home page: more text, a "Why FrigoMind?" section, and food waste figures.',
        'New pages: zero-waste blog, personal stats, and this What\'s new page.',
      ],
    },
    {
      date: 'July 4, 2026',
      title: 'Visual redesign: illustrations and visual consistency',
      items: [
        'New custom illustrations (hand-drawn in SVG) for page headers and empty states, alongside emoji.',
        'All secondary pages (About, FAQ, Blog, Stats, Planning, Favorites, History, Legal notice...) now follow the same visual template as the home page.',
        'Enriched FAQ, sorted by topic (How it works, Privacy, Pricing, Technical).',
      ],
    },
    {
      date: 'Previous update',
      title: 'About, FAQ and Legal notice pages',
      items: ['Added About, FAQ, and Legal notice / Privacy pages, accessible from the footer.'],
    },
    {
      date: 'Previous update',
      title: 'Enriched recipes and smart emojis',
      items: [
        'The recipe database grows to 34 recipes, with more variety (fish, meat, vegetarian, fruit...).',
        'Emojis for automatically generated recipes now reflect the ingredients actually used.',
        'Stronger guarantee: every suggested recipe is required to use the ingredients photographed.',
      ],
    },
    {
      date: 'Previous update',
      title: 'More reliable photo analysis',
      items: [
        'Photos are now automatically resized before upload, to avoid analysis failures on very large photos (taken with a recent phone).',
      ],
    },
    {
      date: 'Initial version',
      title: 'FrigoMind launch',
      items: [
        'First deployment: photo → AI ingredient detection (Google Gemini) → editable list → 3 to 5 personalized recipes.',
        'Bonus from day one: zero-waste mode, "Surprise me" button, generated recipe history.',
      ],
    },
  ],
}

const STRINGS = {
  fr: {
    title: 'Nouveautés',
    subtitle: 'Ce qui a changé sur FrigoMind, mise à jour après mise à jour.',
  },
  en: {
    title: "What's new",
    subtitle: "What's changed on FrigoMind, update after update.",
  },
}

// Page "Nouveautés" : changelog en forme de frise chronologique.
export default function ChangelogPage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const entries = ENTRIES[lang]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<PartyGlyph className="w-full h-full" />}
        tone="zest"
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-7 relative pl-5">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-200" aria-hidden />
        <div className="space-y-4">
          {entries.map((entry, i) => (
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
