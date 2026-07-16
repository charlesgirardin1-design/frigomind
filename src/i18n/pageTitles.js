// Titres et descriptions <meta> par page, utilisés par App.jsx pour mettre à
// jour document.title et la balise meta description à chaque changement de
// vue. FrigoMind est une SPA sans routeur (pas de react-router), donc chaque
// "page" ne correspond pas à une URL distincte — mais on met quand même à
// jour ces balises pour un onglet de navigateur plus clair et un meilleur
// contexte si la page est partagée/indexée.
const SITE_NAME = 'FrigoMind'

const TITLES = {
  fr: {
    home: `${SITE_NAME} — Photo → Ingrédients → Recettes`,
    upload: `Ajouter une photo — ${SITE_NAME}`,
    validate: `Vérifier les ingrédients — ${SITE_NAME}`,
    results: `Vos recettes — ${SITE_NAME}`,
    history: `Historique — ${SITE_NAME}`,
    favorites: `Mes favoris — ${SITE_NAME}`,
    recipesBrowse: `Toutes les recettes — ${SITE_NAME}`,
    recipe: `Recette — ${SITE_NAME}`,
    suggestion: `Boîte à idées — ${SITE_NAME}`,
    ingredient: `Recettes par ingrédient — ${SITE_NAME}`,
    about: `À propos — ${SITE_NAME}`,
    faq: `Questions fréquentes — ${SITE_NAME}`,
    blog: `Astuces anti-gaspi — ${SITE_NAME}`,
    stats: `Vos statistiques — ${SITE_NAME}`,
    changelog: `Nouveautés — ${SITE_NAME}`,
    legal: `Mentions légales — ${SITE_NAME}`,
    login: `Connexion — ${SITE_NAME}`,
    settings: `Paramètres — ${SITE_NAME}`,
    notfound: `Page introuvable — ${SITE_NAME}`,
  },
  en: {
    home: `${SITE_NAME} — Photo → Ingredients → Recipes`,
    upload: `Add a photo — ${SITE_NAME}`,
    validate: `Check ingredients — ${SITE_NAME}`,
    results: `Your recipes — ${SITE_NAME}`,
    history: `History — ${SITE_NAME}`,
    favorites: `My favorites — ${SITE_NAME}`,
    recipesBrowse: `All recipes — ${SITE_NAME}`,
    recipe: `Recipe — ${SITE_NAME}`,
    suggestion: `Suggestion box — ${SITE_NAME}`,
    ingredient: `Recipes by ingredient — ${SITE_NAME}`,
    about: `About — ${SITE_NAME}`,
    faq: `FAQ — ${SITE_NAME}`,
    blog: `Zero-waste tips — ${SITE_NAME}`,
    stats: `Your stats — ${SITE_NAME}`,
    changelog: `What's new — ${SITE_NAME}`,
    legal: `Legal notice — ${SITE_NAME}`,
    login: `Sign in — ${SITE_NAME}`,
    settings: `Settings — ${SITE_NAME}`,
    notfound: `Page not found — ${SITE_NAME}`,
  },
}

const DESCRIPTIONS = {
  fr: {
    home: 'FrigoMind : prenez en photo votre frigo, obtenez la liste des ingrédients détectés et des idées de recettes personnalisées en quelques secondes.',
    upload: 'Prenez une photo de votre frigo ou de votre placard pour détecter automatiquement vos ingrédients.',
    validate: 'Vérifiez et ajustez la liste des ingrédients détectés avant de générer vos recettes.',
    results: 'Découvrez des recettes personnalisées à partir des ingrédients que vous avez chez vous.',
    history: 'Retrouvez toutes vos sessions de recettes générées précédemment.',
    favorites: 'Retrouvez toutes les recettes que vous avez mises de côté.',
    recipesBrowse: 'Le catalogue de recettes en libre recherche arrive bientôt.',
    recipe: 'Ingrédients, quantités et étapes détaillées pour cette recette FrigoMind.',
    suggestion: 'Proposez une idée de fonctionnalité ou signalez un bug à l\'équipe FrigoMind.',
    ingredient: 'Trouvez des recettes à partir d\'un ingrédient précis que vous avez chez vous.',
    about: 'Découvrez le fonctionnement de FrigoMind et sa mission anti-gaspillage alimentaire.',
    faq: 'Réponses aux questions fréquentes sur FrigoMind.',
    blog: 'Astuces pratiques pour réduire le gaspillage alimentaire au quotidien.',
    stats: 'Consultez vos statistiques personnelles d\'utilisation de FrigoMind.',
    changelog: 'Toutes les nouveautés et améliorations récentes de FrigoMind.',
    legal: 'Mentions légales et politique de confidentialité de FrigoMind.',
    login: 'Connectez-vous à FrigoMind pour retrouver votre historique et vos favoris sur tous vos appareils.',
    settings: 'Gérez les informations de votre compte FrigoMind.',
    notfound: 'Cette page n\'existe pas ou plus.',
  },
  en: {
    home: 'FrigoMind: take a photo of your fridge, get the list of detected ingredients and personalized recipe ideas in seconds.',
    upload: 'Take a photo of your fridge or pantry to automatically detect your ingredients.',
    validate: 'Check and adjust the detected ingredient list before generating your recipes.',
    results: 'Discover personalized recipes based on the ingredients you have at home.',
    history: 'Find all your previously generated recipe sessions.',
    favorites: 'Find all the recipes you have saved.',
    recipesBrowse: 'The free-search recipe catalog is coming soon.',
    recipe: 'Ingredients, quantities, and detailed steps for this FrigoMind recipe.',
    suggestion: 'Suggest a feature idea or report a bug to the FrigoMind team.',
    ingredient: 'Find recipes based on a specific ingredient you have at home.',
    about: 'Learn how FrigoMind works and its mission against food waste.',
    faq: 'Answers to frequently asked questions about FrigoMind.',
    blog: 'Practical tips to reduce food waste every day.',
    stats: 'View your personal FrigoMind usage statistics.',
    changelog: 'All the recent news and improvements to FrigoMind.',
    legal: 'FrigoMind legal notice and privacy policy.',
    login: 'Sign in to FrigoMind to find your history and favorites on all your devices.',
    settings: 'Manage your FrigoMind account information.',
    notfound: 'This page does not exist.',
  },
}

// Applique le titre et la meta description correspondant à la vue et la
// langue courantes. Retombe sur la page d'accueil si la vue est inconnue.
export function applyPageMeta(view, lang) {
  const titles = TITLES[lang] || TITLES.fr
  const descriptions = DESCRIPTIONS[lang] || DESCRIPTIONS.fr
  document.title = titles[view] || titles.home

  const description = descriptions[view] || descriptions.home
  let meta = document.querySelector('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', description)
}
