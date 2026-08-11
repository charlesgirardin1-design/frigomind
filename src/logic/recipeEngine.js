// -----------------------------------------------------------------------------
// recipeEngine.js
// "Cerveau" de la génération de recettes. Prend les ingrédients validés par
// l'utilisateur + ses préférences, et retourne 3 à 5 recettes réalistes.
//
// Principes voulus par le produit :
//  - PRIORITÉ à la base de vraies recettes (recipesDB.js, ~1000 recettes) sur
//    toute génération à la volée : on cherche d'abord ce qui existe déjà.
//  - une recette n'a plus besoin d'utiliser LITTÉRALEMENT tous les
//    ingrédients validés par l'utilisateur pour être proposée — l'exiger
//    forçait le moteur à empiler des ingrédients hors sujet dans une même
//    recette dès que l'utilisateur avait beaucoup d'ingrédients différents
//    (ex: une "omelette" avec dix légumes + des pâtes). À la place, la
//    proportion d'ingrédients validés réellement utilisés par une recette
//    (`coverage`, voir scoreRecipe) est un simple facteur de score : plus une
//    recette met à profit ce qu'on a sous la main, mieux elle est classée,
//    mais une recette pertinente qui n'en utilise qu'une partie reste
//    proposée — les ingrédients qu'elle n'utilise pas sont listés
//    explicitement (`unusedIngredients`, affiché sur RecipePage.jsx) plutôt
//    que forcés dedans.
//  - ne jamais exiger d'ingrédients externes inutiles (les basiques type
//    sel/poivre/huile ne comptent jamais comme "manquants")
//  - ne jamais bloquer l'utilisateur : si vraiment aucune recette de la base
//    n'a le moindre rapport avec les ingrédients validés, on génère à la
//    volée une recette "maison" (voir buildSmartFallbackRecipes) — plafonnée
//    à un nombre réaliste d'ingrédients par plat (voir `maxIngredients` dans
//    dishPatterns.js), jamais un fourre-tout.
//  - favoriser l'anti-gaspi : bonus de score pour les recettes qui utilisent
//    des ingrédients périssables (à consommer vite)
// -----------------------------------------------------------------------------

import { RECIPES } from '../data/recipesDB.js'
import { isPantryStaple, isPerishable } from '../data/expiryData.js'
import { findFlavorPairings } from '../data/flavorPairings.js'
import { categorizeIngredient, DISH_PATTERNS } from '../data/dishPatterns.js'

// Mots-clés utilisés pour deviner si un ingrédient rend une recette
// "non végétarienne", afin de taguer correctement les recettes générées
// dynamiquement (voir buildSmartFallbackRecipes).
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

// Caractère "de mot" : lettre (y compris œ/æ, des ligatures que NFD ne
// décompose pas) ou chiffre. Sert à ne faire correspondre une phrase à une
// autre que sur de vraies limites de mot (voir containsPhrase ci-dessous).
const WORD_CHAR_REGEX = /[a-z0-9œæ]/
function isWordChar(char) {
  return !!char && WORD_CHAR_REGEX.test(char)
}

// Vrai si le caractère suivant la fin de `phrase` marque bien une limite de
// mot : fin de chaîne, caractère non-alphanumérique, ou un simple "s"/"x" de
// pluriel en toute fin de chaîne (pour tolérer un pluriel non normalisé, ex:
// "tomate" -> "tomates").
function hasWordBoundaryAfter(text, index) {
  if (index >= text.length) return true
  const char = text[index]
  if (!isWordChar(char)) return true
  return (char === 's' || char === 'x') && index === text.length - 1
}

// Vrai si `phrase` apparaît dans `text` comme un mot (ou groupe de mots)
// entier, jamais comme simple fragment au milieu d'un autre mot. Un simple
// `.includes()` faisait par exemple correspondre "veau" à l'intérieur de
// "oignon nouveau" — le moteur croyait alors que l'utilisateur avait déjà du
// veau alors qu'il n'avait qu'un oignon nouveau, faisant remonter à tort des
// recettes à base de veau (ou les faisant compter comme non-végétariennes).
function containsPhrase(text, phrase) {
  if (!phrase) return false
  let searchFrom = 0
  let index = text.indexOf(phrase, searchFrom)
  while (index !== -1) {
    const boundaryBefore = index === 0 || !isWordChar(text[index - 1])
    const boundaryAfter = hasWordBoundaryAfter(text, index + phrase.length)
    if (boundaryBefore && boundaryAfter) return true
    searchFrom = index + 1
    index = text.indexOf(phrase, searchFrom)
  }
  return false
}

function includesIngredient(availableSet, ingredientName) {
  const target = normalize(ingredientName)
  for (const available of availableSet) {
    const normAvailable = normalize(available)
    if (normAvailable === target || containsPhrase(normAvailable, target) || containsPhrase(target, normAvailable)) {
      return true
    }
  }
  return false
}

function guessDiet(available) {
  const hasMeatOrFish = available.some((ing) => {
    const normalized = normalize(ing)
    return NON_VEGETARIAN_KEYWORDS.some((kw) => containsPhrase(normalized, normalize(kw)))
  })
  return hasMeatOrFish ? [] : ['vegetarien']
}

/**
 * Teste un archétype de plat (voir dishPatterns.js) contre les ingrédients
 * disponibles : renvoie null si l'archétype n'a même pas lieu d'être
 * envisagé (aucun ingrédient de ses catégories "requires"), sinon la
 * répartition entre ingrédients qui trouvent leur place dans ce plat
 * (`compatible`) et ceux qui n'y ont vraiment rien à faire (`incompatible`,
 * ex: du lait dans une poêlée).
 *
 * `recognizedMatches` compte, parmi les ingrédients effectivement reconnus
 * (catégorie != 'other'), ceux qui correspondent à une catégorie "allow" de
 * ce pattern. Comme un ingrédient non catégorisé est toujours compté
 * "compatible" par défaut (voir categorizeIngredient dans dishPatterns.js),
 * ce chiffre sert de départage en cas d'égalité sur `incompatible.length`
 * (voir buildSmartFallbackRecipes) : il reflète combien ce pattern colle
 * vraiment aux ingrédients qu'on a pu identifier, sans se laisser influencer
 * par le nombre d'ingrédients non reconnus.
 */
function tryDishPattern(pattern, available) {
  const categorized = available.map((ing) => ({ ing, cat: categorizeIngredient(ing) }))
  const hasRequired = categorized.some(({ cat }) => pattern.requires.includes(cat))
  if (!hasRequired) return null

  const compatible = []
  const incompatible = []
  let recognizedMatches = 0
  for (const { ing, cat } of categorized) {
    if (cat === 'other' || pattern.allow.includes(cat)) {
      compatible.push({ ing, cat })
      if (cat !== 'other') recognizedMatches += 1
    } else {
      incompatible.push(ing)
    }
  }

  // Plafonne le nombre d'ingrédients réellement retenus pour CE plat (voir
  // `maxIngredients` dans dishPatterns.js) : un ingrédient peut être
  // catégoriquement compatible sans que le plat entier reste réaliste une
  // fois qu'on en accumule 8 ou 10 (ex: une "omelette" avec dix légumes
  // différents). Priorité aux catégories `requires` (le cœur du plat), puis
  // aux catégories pas encore représentées (diversité), plutôt qu'à l'ordre
  // d'arrivée — les ingrédients laissés de côté par manque de place
  // rejoignent `incompatible` (même traitement affiché que "pas utilisé
  // ici", voir buildSmartFallbackRecipes).
  const cap = pattern.maxIngredients || 6
  let kept = compatible
  let overflow = []
  if (compatible.length > cap) {
    const requiresSet = new Set(pattern.requires)
    const anchors = compatible.filter((c) => requiresSet.has(c.cat))
    const rest = compatible.filter((c) => !requiresSet.has(c.cat))
    const seenCategories = new Set()
    const restNewCategory = rest.filter((c) => (seenCategories.has(c.cat) ? false : (seenCategories.add(c.cat), true)))
    const restDuplicateCategory = rest.filter((c) => !restNewCategory.includes(c))
    kept = [...anchors, ...restNewCategory, ...restDuplicateCategory].slice(0, cap)
    const keptSet = new Set(kept)
    overflow = compatible.filter((c) => !keptSet.has(c)).map((c) => c.ing)
  }

  return {
    compatible: kept.map((c) => c.ing),
    incompatible: [...incompatible, ...overflow],
    recognizedMatches,
  }
}

/**
 * Filet de sécurité, repensé : au lieu de forcer tous les ingrédients
 * validés dans un même moule générique quel que soit leur bon sens culinaire
 * (l'ancienne version pouvait mettre du lait dans une "poêlée"), on
 * catégorise chaque ingrédient (voir dishPatterns.js) et on retient le ou
 * les archétypes de plat réalistes (omelette, gratin, salade, soupe,
 * poêlée) qui peuvent accueillir le plus d'entre eux. Si un ingrédient ne
 * trouve vraiment sa place nulle part (ex: le lait dans poulet+brocoli), ou
 * qu'il n'y a plus de place (voir `maxIngredients` dans tryDishPattern), on
 * le dit explicitement (`unusedIngredients`, affiché sur RecipePage.jsx)
 * plutôt que de l'y forcer — jamais plus de 2 recettes renvoyées ici pour
 * garder de la place aux vraies recettes de la base et aux mariages de
 * saveurs dans les résultats finaux.
 *
 * Tri : d'abord le moins d'ingrédients incompatibles (critère principal). En
 * cas d'égalité, on ne se contente plus de l'ordre d'apparition dans
 * DISH_PATTERNS (ce qui favorisait systématiquement "omelette-maison", premier
 * de la liste et le plus facile à envisager avec `requires: ['egg']`) : on
 * départage par `recognizedMatches`, c'est-à-dire le nombre d'ingrédients
 * *réellement catégorisés* (donc pas 'other') que ce pattern accueille. Ainsi,
 * un ingrédient non reconnu (ex: nom de produit scanné par code-barres qui ne
 * ressemble à rien) ne pousse plus artificiellement vers l'omelette : il ne
 * compte ni pour ni contre aucun archétype lors du départage.
 */
function buildSmartFallbackRecipes(available) {
  const diet = guessDiet(available)
  const usesPerishable = available.some((ing) => isPerishable(ing))

  const attempts = DISH_PATTERNS.map((pattern) => ({ pattern, result: tryDishPattern(pattern, available) }))
    .filter((a) => a.result)
    .sort((a, b) => {
      const byIncompatible = a.result.incompatible.length - b.result.incompatible.length
      if (byIncompatible !== 0) return byIncompatible
      return b.result.recognizedMatches - a.result.recognizedMatches
    })
    .slice(0, 2)

  return attempts.map(({ pattern, result }) => {
    const list = result.compatible.join(', ')
    const unusedNoteFr = result.incompatible.length
      ? [
          result.incompatible.length === 1
            ? `💡 ${result.incompatible[0]} ne trouve pas vraiment sa place dans cette préparation — gardez-le pour un autre usage.`
            : `💡 ${result.incompatible.join(', ')} ne trouvent pas vraiment leur place dans cette préparation — gardez-les pour un autre usage.`,
        ]
      : []
    const unusedNoteEn = result.incompatible.length
      ? [
          result.incompatible.length === 1
            ? `💡 ${result.incompatible[0]} doesn't really belong in this dish — save it for something else.`
            : `💡 ${result.incompatible.join(', ')} don't really belong in this dish — save them for something else.`,
        ]
      : []

    return {
      id: pattern.id,
      name: pattern.name(list),
      nameEn: pattern.nameEn(list),
      emoji: pattern.emoji,
      time: pattern.time,
      level: pattern.level,
      cuisine: 'maison',
      diet,
      required: result.compatible,
      optional: result.incompatible.length ? [...result.incompatible, 'sel', 'poivre', 'huile'] : ['sel', 'poivre', 'huile', 'ail', 'oignon'],
      steps: [...pattern.steps(list, result.compatible), ...unusedNoteFr],
      stepsEn: [...pattern.stepsEn(list, result.compatible), ...unusedNoteEn],
      generic: true,
      unusedIngredients: result.incompatible,
      antiGaspi: usesPerishable,
    }
  })
}

/**
 * Moteur de "mariages de saveurs" (voir flavorPairings.js) : transforme
 * chaque mariage reconnu dans `available` (ex: poireau + pomme + roquefort)
 * en une vraie recette nommée et expliquée — une alternative nettement plus
 * qualitative à buildSmartFallbackRecipes pour des combinaisons d'ingrédients
 * inhabituelles mais culinairement solides. `required` ne contient QUE les
 * ingrédients du mariage lui-même (jamais forcé avec le reste des
 * ingrédients validés, sans quoi on retrouverait le même défaut que le
 * moteur générique corrigeait : un ingrédient hors sujet — ex: du saumon
 * dans une tarte poireau/pomme/roquefort — écrasant la cohérence du plat).
 * Les ingrédients validés qui ne font pas partie du mariage rejoignent
 * `unusedIngredients` (même traitement affiché que pour les autres recettes,
 * voir RecipePage.jsx).
 */
function buildFlavorPairingRecipes(available) {
  const matches = findFlavorPairings(available)
  if (matches.length === 0) return []

  const diet = guessDiet(available)
  const usesPerishable = available.some((ing) => isPerishable(ing))

  return matches.map((pairing) => {
    const core = new Set([...pairing.ingredients, ...pairing.extras].map((ing) => normalize(ing)))
    const extraFromFridge = available.filter((ing) => !core.has(normalize(ing)))

    const unusedNoteFr = extraFromFridge.length
      ? [
          extraFromFridge.length === 1
            ? `💡 ${extraFromFridge[0]} ne trouve pas vraiment sa place dans cette recette — gardez-le pour un autre usage.`
            : `💡 ${extraFromFridge.join(', ')} ne trouvent pas vraiment leur place dans cette recette — gardez-les pour un autre usage.`,
        ]
      : []
    const unusedNoteEn = extraFromFridge.length
      ? [
          extraFromFridge.length === 1
            ? `💡 ${extraFromFridge[0]} doesn't really belong in this recipe — save it for something else.`
            : `💡 ${extraFromFridge.join(', ')} don't really belong in this recipe — save them for something else.`,
        ]
      : []

    return {
      id: `pairing-${pairing.id}`,
      name: pairing.name,
      nameEn: pairing.nameEn,
      emoji: pairing.emoji,
      time: pairing.time,
      level: pairing.level,
      cuisine: pairing.cuisine,
      diet,
      required: [...new Set([...pairing.ingredients, ...pairing.extras])],
      optional: ['sel', 'poivre', 'huile'],
      steps: [...pairing.steps, ...unusedNoteFr],
      stepsEn: [...pairing.stepsEn, ...unusedNoteEn],
      flavorPairing: true,
      pairingWhy: pairing.why,
      pairingWhyEn: pairing.whyEn,
      antiGaspi: usesPerishable,
      unusedIngredients: extraFromFridge,
    }
  })
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

  // Couverture : proportion des ingrédients validés par l'utilisateur que
  // cette recette utilise réellement (requis ou optionnels). N'est plus une
  // condition bloquante (voir generateRecipes) mais fait remonter les
  // recettes qui mettent à profit le plus de ce qu'on a sous la main. Les
  // ingrédients validés qui ne rentrent dans aucune recette proposée sont
  // listés dans `unusedIngredients` plutôt que forcés dedans.
  const pool = [...recipe.required, ...recipe.optional]
  const unusedIngredients = availableIngredients.filter((ing) => !includesIngredient(pool, ing))
  const usedCount = availableIngredients.length - unusedIngredients.length
  const coverage = availableIngredients.length ? usedCount / availableIngredients.length : 1
  const coverageBonus = coverage * 0.3

  const score = requiredScore + optionalBonus + antiGaspiBonus + coverageBonus

  return {
    score,
    requiredMatched,
    requiredMissing,
    optionalMatched,
    antiGaspi: usesPerishable,
    unusedIngredients,
    usedCount,
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

  // 1) on tente d'abord avec TOUS les filtres de préférences appliqués, en ne
  //    gardant que les recettes qui ont un minimum de rapport avec ce que
  //    l'utilisateur a réellement (au moins un ingrédient requis ou
  //    optionnel en commun) — pas besoin d'utiliser TOUT ce qu'il a validé
  //    (voir scoreRecipe : `coverage` influence juste le classement), mais
  //    une recette sans le moindre ingrédient en commun n'est pas pertinente.
  let candidates = scored
    .filter(({ recipe }) => applyPreferenceFilters(recipe, prefs))
    .filter((c) => available.length === 0 || c.requiredMatched.length + c.optionalMatched.length > 0)

  // 2) on ne garde que les recettes avec au maximum 1 ingrédient requis manquant
  //    (règle "réaliste niveau étudiant" : pas besoin de courir acheter 3 choses)
  let strong = candidates.filter((c) => c.requiredMissing.length <= 1 && c.score > 0)

  // Tri : d'abord le nombre d'ingrédients scannés réellement utilisés
  // (`usedCount`, ordre décroissant) — une recette qui met à profit plus de
  // ce qu'on a sous la main passe devant une autre juste parce que son ratio
  // requis/optionnel est "plus propre" avec moins d'ingrédients. Le score
  // (qualité de la correspondance) ne sert qu'à départager les recettes qui
  // utilisent le même nombre d'ingrédients scannés.
  strong.sort((a, b) => b.usedCount - a.usedCount || b.score - a.score || a.recipe.time - b.recipe.time)

  // Mariages de saveurs reconnus (voir flavorPairings.js) : mis en avant même
  // quand la base a déjà de bons résultats, car c'est justement le principe
  // de la fonctionnalité — révéler une association réussie avec des
  // ingrédients qui semblent incompatibles, pas seulement combler les trous
  // quand rien d'autre ne matche. Plafonné à 2 pour laisser de la place à
  // des résultats variés plutôt que de saturer les 5 emplacements.
  const pairingResults = buildFlavorPairingRecipes(available)
    .filter((recipe) => applyPreferenceFilters(recipe, prefs))
    .slice(0, 2)
    .map((recipe) => {
      // Le "mariage" lui-même est garanti présent (c'est la condition du
      // match), mais les `extras` propres à la recette (ex: pâte feuilletée
      // pour la tarte poireau/pomme/roquefort) peuvent, eux, manquer vraiment
      // — il ne faut jamais les afficher comme "déjà possédés".
      const requiredMissing = recipe.required.filter(
        (ing) => !includesIngredient(available, ing) && !isPantryStaple(ing)
      )
      return {
        recipe,
        score: 1.05 + (recipe.antiGaspi ? 0.15 : 0),
        requiredMatched: recipe.required.filter((ing) => includesIngredient(available, ing)),
        requiredMissing,
        optionalMatched: [],
        antiGaspi: recipe.antiGaspi,
        unusedIngredients: recipe.unusedIngredients || [],
      }
    })

  let results = [...pairingResults, ...strong].slice(0, 5)

  // Anti-blocage (étape 1) : si moins de 3 résultats, on complète avec les
  // autres recettes de la base pertinentes (`candidates`) en relâchant
  // seulement la contrainte "score/ingrédients manquants" (`strong`), jamais
  // les préférences explicites de l'utilisateur (végétarien, cuisine, temps
  // max), pour qu'une préférence cochée reste absolue même quand on doit
  // compléter les résultats.
  if (results.length < 3) {
    const usedIds = new Set(results.map((r) => r.recipe.id))
    const fallback = candidates
      .filter((c) => !usedIds.has(c.recipe.id))
      .sort((a, b) => b.usedCount - a.usedCount || b.score - a.score || a.recipe.time - b.recipe.time)
      .slice(0, 5 - results.length)
    results = [...results, ...fallback]
  }

  // Anti-blocage (étape 2, garantie absolue) : si la base de ~1000 recettes
  // n'a vraiment rien de pertinent (ingrédients trop variés/inhabituels), on
  // génère une recette "maison" à la volée (voir buildSmartFallbackRecipes),
  // plafonnée à un nombre réaliste d'ingrédients par plat plutôt qu'un
  // fourre-tout. Doit aussi respecter les préférences (ex : si l'utilisateur
  // a de la viande dans ses ingrédients validés et coche "végétarien
  // uniquement", on ne peut pas fabriquer de recette végé sans trahir ce
  // qu'il a réellement — on préfère alors proposer moins de 3 résultats
  // plutôt qu'ignorer la préférence silencieusement.
  if (results.length < 3 && available.length > 0) {
    const generic = buildSmartFallbackRecipes(available)
      .filter((recipe) => applyPreferenceFilters(recipe, prefs))
      .map((recipe) => ({
        recipe,
        score: 1 + (recipe.antiGaspi ? 0.15 : 0),
        requiredMatched: recipe.required,
        requiredMissing: [],
        optionalMatched: recipe.optional.filter((ing) => includesIngredient(available, ing)),
        antiGaspi: recipe.antiGaspi,
        unusedIngredients: recipe.unusedIngredients || [],
      }))
    results = [...results, ...generic].slice(0, 5)
  }

  return results.map((r) => ({
    ...r.recipe,
    matchScore: Math.round(Math.min(r.score, 1.15) * 100),
    matchedIngredients: [...new Set([...r.requiredMatched, ...r.optionalMatched])],
    missingIngredients: r.requiredMissing,
    antiGaspi: r.antiGaspi,
    unusedIngredients: r.unusedIngredients || [],
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
      return containsPhrase(normalizedIng, target) || containsPhrase(target, normalizedIng)
    })
  )
}

/**
 * Bouton "J'ai faim → surprends-moi" : choisit une recette pondérée par son
 * score parmi les ingrédients disponibles, en ignorant le temps max et le
 * type de cuisine (c'est le principe d'une surprise) — mais pas le régime
 * végétarien, qui est une contrainte alimentaire et non un simple goût :
 * l'ignorer pourrait proposer de la viande/poisson à quelqu'un qui a coché
 * "végétarien uniquement".
 */
export function surpriseRecipe(validatedIngredients, prefs = {}) {
  const all = generateRecipes(validatedIngredients, { vegetarien: prefs.vegetarien })
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
