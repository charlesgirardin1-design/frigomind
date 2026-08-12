// -----------------------------------------------------------------------------
// recipeVoice.js
// Donne une "voix" à la fiche recette : une courte phrase d'intro chaleureuse
// au-dessus des ingrédients, pour que la lecture ressemble à un vrai carnet
// de recettes plutôt qu'à une fiche technique.
//
// Les recettes générées récemment (voir scripts/generate-recipes.mjs) portent
// directement un champ `intro`/`introEn` écrit par l'IA avec une consigne de
// ton explicite — on l'utilise tel quel. Pour les ~2000 recettes plus
// anciennes qui n'ont pas ce champ (les réécrire toutes une par une prendrait
// des jours de quota IA), on compose localement une phrase à partir de
// données déjà fiables (temps, niveau, cuisine, ingrédient principal) plutôt
// que d'afficher un vide ou une phrase générique identique partout : le choix
// du gabarit est déterministe (dérivé de l'id de la recette), donc stable
// d'une visite à l'autre, mais varie d'une recette à l'autre.
// -----------------------------------------------------------------------------

// Petit hash de chaîne (FNV-1a simplifié) : suffisant pour répartir les
// recettes entre gabarits sans dépendance externe, pas pour de la crypto.
function hashString(str) {
  let hash = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

const INTRO_TEMPLATES_FR = [
  ({ mainIngredient, time }) => `${mainIngredient} tient la vedette de ce plat prêt en ${time} minutes.`,
  ({ mainIngredient, time, levelLabel }) => `Une recette ${levelLabel} qui met ${mainIngredient} à l'honneur — comptez ${time} minutes en cuisine.`,
  ({ mainIngredient, time }) => `${mainIngredient} et quelques ingrédients du quotidien suffisent pour ce plat prêt en ${time} minutes.`,
  ({ mainIngredient, time }) => `Un classique tout simple : ${mainIngredient} au centre, ${time} minutes chrono, et c'est prêt.`,
  ({ mainIngredient, time, levelLabel }) => `Idéal pour un soir de semaine — ${time} minutes suffisent pour ce plat ${levelLabel} à base de ${mainIngredient}.`,
  ({ mainIngredient, time }) => `On mise ici sur ${mainIngredient}, sublimé simplement, pour un plat prêt en ${time} minutes.`,
  ({ mainIngredient, time, levelLabel }) => `Une recette ${levelLabel} et sans prise de tête : ${mainIngredient} en vedette, ${time} minutes montre en main.`,
  ({ mainIngredient, time }) => `${mainIngredient} rencontre quelques bons produits pour un plat réconfortant, prêt en ${time} minutes.`,
  ({ mainIngredient, time }) => `Direction la cuisine : ${time} minutes chrono pour transformer ${mainIngredient} en un plat qui régale.`,
  ({ mainIngredient, time }) => `Simple et efficace — ${mainIngredient} est ici la star d'un plat prêt en ${time} minutes.`,
  ({ mainIngredient, time, cuisineLabel }) => `Un plat ${cuisineLabel} qui ne demande que ${time} minutes, avec ${mainIngredient} comme fil conducteur.`,
  ({ mainIngredient, time }) => `Rien de compliqué : ${mainIngredient}, un peu de temps (${time} minutes), et une belle assiette au bout.`,
]

const INTRO_TEMPLATES_EN = [
  ({ mainIngredient, time }) => `${mainIngredient} takes center stage in this ${time}-minute dish.`,
  ({ mainIngredient, time, levelLabel }) => `A ${levelLabel} recipe built around ${mainIngredient} — about ${time} minutes start to finish.`,
  ({ mainIngredient, time }) => `${mainIngredient} and a handful of everyday ingredients are all this ${time}-minute dish needs.`,
  ({ mainIngredient, time }) => `A simple classic: ${mainIngredient} front and center, ${time} minutes, done.`,
  ({ mainIngredient, time, levelLabel }) => `Great for a weeknight — just ${time} minutes for this ${levelLabel} ${mainIngredient} dish.`,
  ({ mainIngredient, time }) => `${mainIngredient}, kept simple, makes for a satisfying dish in ${time} minutes.`,
  ({ mainIngredient, time, levelLabel }) => `A ${levelLabel}, no-fuss recipe: ${mainIngredient} in the lead, ${time} minutes on the clock.`,
  ({ mainIngredient, time }) => `${mainIngredient} meets a few good pantry staples for a comforting dish, ready in ${time} minutes.`,
  ({ mainIngredient, time }) => `${time} minutes is all it takes to turn ${mainIngredient} into something worth savoring.`,
  ({ mainIngredient, time }) => `Simple and effective — ${mainIngredient} is the star of this ${time}-minute dish.`,
  ({ mainIngredient, time, cuisineLabel }) => `A ${cuisineLabel} dish that only takes ${time} minutes, built around ${mainIngredient}.`,
  ({ mainIngredient, time }) => `Nothing fancy: ${mainIngredient}, a bit of time (${time} minutes), and a good plate to show for it.`,
]

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str
}

/**
 * Phrase d'intro pour l'en-tête de la fiche recette. Utilise le texte écrit
 * par l'IA quand il existe (`recipe.intro`/`introEn`), sinon compose une
 * phrase locale variée mais stable (même recette -> même phrase à chaque
 * visite) à partir des données structurées déjà fiables.
 */
export function getRecipeIntro(recipe, lang, cuisineLabel, levelLabel) {
  const aiIntro = lang === 'en' ? recipe.introEn || recipe.intro : recipe.intro
  if (aiIntro?.trim()) return aiIntro.trim()

  const mainIngredientRaw = recipe.required?.[0] || recipe.optional?.[0]
  if (!mainIngredientRaw) return null

  const templates = lang === 'en' ? INTRO_TEMPLATES_EN : INTRO_TEMPLATES_FR
  const index = hashString(recipe.id || recipe.name || '') % templates.length
  return capitalize(
    templates[index]({
      mainIngredient: mainIngredientRaw,
      time: recipe.time,
      levelLabel: (levelLabel || '').toLowerCase(),
      cuisineLabel: (cuisineLabel || '').toLowerCase(),
    })
  )
}

/**
 * Astuce du chef, uniquement si l'IA en a écrit une (`recipe.tip`/`tipEn`) —
 * contrairement à l'intro, une astuce technique générique inventée côté
 * client risquerait de ne pas coller au plat (ou d'être fausse), donc on
 * n'en fabrique pas de repli : la section disparaît simplement si absente.
 */
export function getRecipeTip(recipe, lang) {
  const tip = lang === 'en' ? recipe.tipEn || recipe.tip : recipe.tip
  return tip?.trim() || null
}
