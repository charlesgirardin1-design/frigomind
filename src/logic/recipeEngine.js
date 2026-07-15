// -----------------------------------------------------------------------------
// recipeEngine.js
// "Cerveau" de la génération de recettes. Prend les ingrédients validés par
// l'utilisateur + ses préférences, et retourne 3 à 5 recettes réalistes.
//
// Principes IA voulus par le produit :
//  - RÈGLE OBLIGATOIRE : chaque recette proposée doit impérativement utiliser
//    TOUS les ingrédients validés par l'utilisateur (ceux détectés sur la
//    photo, corrigés/complétés si besoin). Une recette peut en plus proposer
//    d'autres ingrédients (basiques de placard, ou ingrédients à acheter),
//    mais ne peut jamais ignorer un ingrédient que l'utilisateur possède déjà.
//  - ne jamais exiger d'ingrédients externes inutiles (les basiques type
//    sel/poivre/huile ne comptent jamais comme "manquants")
//  - ne jamais bloquer l'utilisateur : si aucune recette de la base ne
//    respecte la règle ci-dessus, on génère à la volée des recettes
//    "maison" qui, elles, utilisent forcément tous les ingrédients validés
//  - favoriser l'anti-gaspi : bonus de score pour les recettes qui utilisent
//    des ingrédients périssables (à consommer vite)
// -----------------------------------------------------------------------------

import { RECIPES } from '../data/recipesDB.js'
import { isPantryStaple, isPerishable } from '../data/expiryData.js'

// Mots-clés utilisés pour deviner si un ingrédient rend une recette
// "non végétarienne", afin de taguer correctement les recettes générées
// dynamiquement (voir buildGenericRecipes).
const NON_VEGETARIAN_KEYWORDS = [
  'poulet',
  'boeuf',
  'bœuf',
  'porc',
  'jambon',
  'lardons',
  'bacon',
  'viande',
  'thon',
  'saumon',
  'poisson',
  'crevette',
  'fruits de mer',
  'dinde',
  'canard',
  'agneau',
  'veau',
  'saucisse',
  'chorizo',
]

const ACCENTS_REGEX = /[̀-ͯ]/g

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(ACCENTS_REGEX, '') // retire les accents pour un matching plus tolerant
}

function includesIngredient(availableSet, ingredientName) {
  const target = normalize(ingredientName)
  for (const available of availableSet) {
    if (normalize(available) === target || normalize(available).includes(target) || target.includes(normalize(available))) {
      return true
    }
  }
  return false
}

/**
 * RÈGLE OBLIGATOIRE : vérifie qu'une recette utilise bien TOUS les
 * ingrédients validés par l'utilisateur (chacun doit se retrouver parmi les
 * ingrédients requis OU optionnels de la recette). La recette peut avoir en
 * plus d'autres ingrédients (basiques, ou à acheter) : ça ne pose pas de
 * souci, seul l'oubli d'un ingrédient déjà possédé est bloquant.
 */
function usesAllValidatedIngredients(recipe, available) {
  if (available.length === 0) return true
  const pool = [...recipe.required, ...recipe.optional]
  return available.every((ing) => includesIngredient(pool, ing))
}

function guessDiet(available) {
  const hasMeatOrFish = available.some((ing) => {
    const normalized = normalize(ing)
    return NON_VEGETARIAN_KEYWORDS.some((kw) => normalized.includes(normalize(kw)))
  })
  return hasMeatOrFish ? [] : ['vegetarien']
}

/**
 * Filet de sécurité absolu : génère des recettes "maison" à la volée qui
 * utilisent, par construction, TOUS les ingrédients validés par
 * l'utilisateur. Utilisé uniquement quand aucune recette de la base
 * RECIPES ne respecte la règle obligatoire (ex : combinaison inhabituelle
 * d'ingrédients) — ça garantit qu'on ne bloque jamais l'utilisateur tout en
 * respectant la contrainte "tous les ingrédients de la photo doivent
 * apparaître".
 */
function buildGenericRecipes(available) {
  const list = available.join(', ')
  const diet = guessDiet(available)
  const usesPerishable = available.some((ing) => isPerishable(ing))

  const templates = [
    {
      id: 'poelee-maison',
      styleEmoji: '🍳',
      name: `Poêlée maison (${list})`,
      time: 20,
      level: 'facile',
      cuisine: 'maison',
      steps: [
        `Couper tous vos ingrédients (${list}) en morceaux de taille similaire.`,
        "Faire chauffer un filet d'huile dans une poêle ou un wok.",
        'Faire revenir en premier les ingrédients les plus longs à cuire, puis ajouter les autres.',
        'Cuire 8 à 10 minutes à feu moyen-vif en remuant régulièrement.',
        "Assaisonner de sel, poivre (et ail/oignon si vous en avez) et servir chaud.",
      ],
    },
    {
      id: 'bol-frais-maison',
      styleEmoji: '🥗',
      name: `Bol frais (${list})`,
      time: 12,
      level: 'facile',
      cuisine: 'maison',
      steps: [
        `Couper finement tous vos ingrédients (${list}).`,
        'Les mélanger dans un saladier.',
        "Assaisonner d'un filet d'huile (ou de citron), sel et poivre.",
        'Servir frais, tel quel ou avec du pain.',
      ],
    },
    {
      id: 'gratin-four-maison',
      styleEmoji: '🧀',
      name: `Gratin au four (${list})`,
      time: 30,
      level: 'moyen',
      cuisine: 'maison',
      steps: [
        `Couper vos ingrédients (${list}) et les disposer dans un plat allant au four.`,
        'Ajouter un peu de fromage râpé si vous en avez.',
        "Enfourner 20 à 25 minutes à 200°C jusqu'à ce que ce soit doré.",
        'Servir chaud directement dans le plat.',
      ],
    },
    {
      id: 'soupe-maison',
      styleEmoji: '🍲',
      name: `Soupe maison (${list})`,
      time: 25,
      level: 'facile',
      cuisine: 'maison',
      steps: [
        `Couper tous vos ingrédients (${list}).`,
        "Faire revenir l'oignon ou l'ail quelques minutes si vous en avez.",
        "Ajouter le reste des ingrédients et couvrir d'eau (ou de bouillon).",
        'Laisser mijoter 20 minutes.',
        'Mixer pour un velouté, ou servir tel quel selon la texture voulue.',
      ],
    },
    {
      id: 'wok-minute-maison',
      styleEmoji: '🥘',
      name: `Wok minute (${list})`,
      time: 15,
      level: 'facile',
      cuisine: 'maison',
      steps: [
        `Couper tous vos ingrédients (${list}) en petits morceaux.`,
        "Faire chauffer un wok ou une grande poêle avec un filet d'huile.",
        'Saisir à feu vif 5 à 7 minutes en remuant constamment.',
        'Ajouter un peu de sauce soja si vous en avez.',
        'Servir immédiatement, bien chaud.',
      ],
    },
  ]

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    emoji: t.styleEmoji,
    time: t.time,
    level: t.level,
    cuisine: t.cuisine,
    diet,
    required: [...available],
    optional: ['sel', 'poivre', 'huile', 'ail', 'oignon'],
    steps: t.steps,
    generic: true,
    antiGaspi: usesPerishable,
  }))
}

/**
 * Calcule un score de correspondance pour une recette donnée.
 */
function scoreRecipe(recipe, availableIngredients) {
  const requiredMatched = recipe.required.filter((ing) => includesIngredient(availableIngredients, ing))
  const requiredMissing = recipe.required.filter((ing) => !includesIngredient(availableIngredients, ing) && !isPantryStaple(ing))
  const optionalMatched = recipe.optional.filter((ing) => includesIngredient(availableIngredients, ing))

  const requiredScore = recipe.required.length ? requiredMatched.length / recipe.required.length : 1
  const optionalBonus = recipe.optional.length ? (optionalMatched.length / recipe.optional.length) * 0.25 : 0

  // Bonus anti-gaspi : la recette utilise des ingrédients périssables présents
  const usesPerishable = [...recipe.required, ...recipe.optional].some(
    (ing) => includesIngredient(availableIngredients, ing) && isPerishable(ing)
  )
  const antiGaspiBonus = usesPerishable ? 0.15 : 0

  const score = requiredScore + optionalBonus + antiGaspiBonus

  return {
    score,
    requiredMatched,
    requiredMissing,
    optionalMatched,
    antiGaspi: usesPerishable,
  }
}

function applyPreferenceFilters(recipe, prefs) {
  if (prefs.maxTime && prefs.maxTime !== 'peu importe' && recipe.time > Number(prefs.maxTime)) {
    return false
  }
  if (prefs.cuisine && prefs.cuisine !== 'toutes' && recipe.cuisine !== prefs.cuisine) {
    return false
  }
  if (prefs.vegetarien && !recipe.diet.includes('vegetarien')) {
    return false
  }
  return true
}

/**
 * Génère entre 3 et 5 recettes à partir des ingrédients validés.
 * @param {string[]} validatedIngredients
 * @param {{maxTime?: string, cuisine?: string, vegetarien?: boolean}} prefs
 */
export function generateRecipes(validatedIngredients, prefs = {}) {
  const available = validatedIngredients.filter(Boolean)

  const scored = RECIPES.map((recipe) => ({
    recipe,
    ...scoreRecipe(recipe, available),
  }))

  // RÈGLE OBLIGATOIRE : on ne considère QUE les recettes qui utilisent tous
  // les ingrédients validés par l'utilisateur. Les recettes de la base qui
  // n'en utilisent qu'une partie sont exclues d'office, même si leur score
  // de correspondance serait par ailleurs bon.
  const mandatory = scored.filter((c) => usesAllValidatedIngredients(c.recipe, available))

  // 1) on tente d'abord avec TOUS les filtres de préférences appliqués
  let candidates = mandatory.filter(({ recipe }) => applyPreferenceFilters(recipe, prefs))

  // 2) on ne garde que les recettes avec au maximum 1 ingrédient requis manquant
  //    (règle "réaliste niveau étudiant" : pas besoin de courir acheter 3 choses)
  let strong = candidates.filter((c) => c.requiredMissing.length <= 1 && c.score > 0)

  strong.sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)

  let results = strong.slice(0, 5)

  // Anti-blocage (étape 1) : si moins de 3 résultats, on complète avec les
  // autres recettes de la base qui respectent quand même la règle
  // obligatoire — on relâche seulement la contrainte "score/ingrédients
  // manquants" (`strong`), jamais les préférences explicites de
  // l'utilisateur (végétarien, cuisine, temps max) : on repioche donc dans
  // `candidates` (déjà filtré par applyPreferenceFilters), pas dans
  // `mandatory`, pour qu'une préférence cochée reste absolue même quand on
  // doit compléter les résultats.
  if (results.length < 3) {
    const usedIds = new Set(results.map((r) => r.recipe.id))
    const fallback = candidates
      .filter((c) => !usedIds.has(c.recipe.id))
      .sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)
      .slice(0, 5 - results.length)
    results = [...results, ...fallback]
  }

  // Anti-blocage (étape 2, garantie absolue) : si la base de recettes ne
  // contient aucune combinaison respectant la règle obligatoire (ingrédients
  // trop variés/inhabituels), on génère des recettes "maison" qui utilisent
  // par construction tous les ingrédients validés. Ces recettes générées
  // doivent, elles aussi, respecter les préférences (ex : si l'utilisateur a
  // de la viande dans ses ingrédients validés et coche "végétarien
  // uniquement", on ne peut pas fabriquer de recette végé sans trahir la
  // règle obligatoire — on préfère alors proposer moins de 3 résultats
  // plutôt qu'ignorer la préférence silencieusement.
  if (results.length < 3 && available.length > 0) {
    const generic = buildGenericRecipes(available)
      .filter((recipe) => applyPreferenceFilters(recipe, prefs))
      .map((recipe) => ({
        recipe,
        score: 1 + (recipe.antiGaspi ? 0.15 : 0),
        requiredMatched: available,
        requiredMissing: [],
        optionalMatched: [],
        antiGaspi: recipe.antiGaspi,
      }))
    results = [...results, ...generic].slice(0, 5)
  }

  return results.map((r) => ({
    ...r.recipe,
    matchScore: Math.round(Math.min(r.score, 1.15) * 100),
    matchedIngredients: [...new Set([...r.requiredMatched, ...r.optionalMatched])],
    missingIngredients: r.requiredMissing,
    antiGaspi: r.antiGaspi,
  }))
}

/**
 * Suggère des ingrédients "complémentaires" à cocher sur la page de
 * validation (ex : pâtes + jambon détectés → suggère petits pois, carotte...).
 * Principe : on regarde toutes les recettes de la base qui partagent au
 * moins un ingrédient avec ce que l'utilisateur a déjà coché, puis on
 * remonte leurs ingrédients manquants (requis en priorité, optionnels en
 * second) — pondérés par la "proximité" de la recette (peu d'ingrédients
 * manquants = recette presque faisable = suggestion plus pertinente).
 * @param {string[]} checkedIngredients - ingrédients actuellement cochés
 * @param {string[]} [knownIngredients] - tous les ingrédients déjà listés sur
 *   la page (cochés ou non), pour ne jamais suggérer un doublon
 * @param {number} [limit]
 * @returns {string[]}
 */
export function suggestComplementaryIngredients(checkedIngredients, knownIngredients = checkedIngredients, limit = 6) {
  const available = checkedIngredients.filter(Boolean)
  const known = knownIngredients.filter(Boolean)
  if (available.length === 0) return []

  const tally = new Map()

  for (const recipe of RECIPES) {
    const pool = [...recipe.required, ...recipe.optional]
    const overlap = pool.filter((ing) => includesIngredient(available, ing))
    if (overlap.length === 0) continue

    const missingRequired = recipe.required.filter((ing) => !includesIngredient(known, ing) && !isPantryStaple(ing))
    const missingOptional = recipe.optional.filter((ing) => !includesIngredient(known, ing) && !isPantryStaple(ing))
    if (missingRequired.length + missingOptional.length === 0) continue

    // Plus la recette est proche d'être faisable avec ce qu'on a déjà, plus
    // ses ingrédients manquants sont mis en avant.
    const closeness = overlap.length / (overlap.length + missingRequired.length + missingOptional.length)

    missingRequired.forEach((name) => {
      const key = normalize(name)
      const weight = (tally.get(key)?.weight || 0) + closeness * 2
      tally.set(key, { name: tally.get(key)?.name || name, weight })
    })
    missingOptional.forEach((name) => {
      const key = normalize(name)
      const weight = (tally.get(key)?.weight || 0) + closeness
      tally.set(key, { name: tally.get(key)?.name || name, weight })
    })
  }

  return [...tally.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((entry) => entry.name)
}

/**
 * Retourne toutes les recettes de la base (brutes, non scorées) qui utilisent
 * un ingrédient donné, requis ou optionnel. Utilisé par la page "Ingrédient"
 * pour répondre à "quelles recettes puis-je faire avec X ?".
 * @param {string} ingredientName
 * @returns {object[]}
 */
export function findRecipesUsingIngredient(ingredientName) {
  const target = normalize(ingredientName)
  if (!target) return []
  return RECIPES.filter((recipe) =>
    [...recipe.required, ...recipe.optional].some((ing) => {
      const normalizedIng = normalize(ing)
      return normalizedIng.includes(target) || target.includes(normalizedIng)
    })
  )
}

/**
 * Bouton "J'ai faim → surprends-moi" : choisit une recette pondérée par son
 * score parmi les ingrédients disponibles, en ignorant les préférences.
 */
export function surpriseRecipe(validatedIngredients) {
  const all = generateRecipes(validatedIngredients, {})
  if (all.length === 0) return null
  // Tirage pondéré : plus le score est haut, plus la recette a de chances
  const weights = all.map((r) => Math.max(r.matchScore, 5))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < all.length; i += 1) {
    rand -= weights[i]
    if (rand <= 0) return all[i]
  }
  return all[0]
}
