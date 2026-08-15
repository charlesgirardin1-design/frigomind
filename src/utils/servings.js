// -----------------------------------------------------------------------------
// servings.js
// Recalcule la quantité affichée d'un ingrédient pour un nombre de personnes
// donné, à partir de la table de référence (base 4 personnes) dans
// ingredientQuantities.js. Approximatif par nature (voir le commentaire de ce
// fichier) : arrondi à des paliers "faciles à mesurer" plutôt qu'exact.
// -----------------------------------------------------------------------------

import { BASE_SERVINGS, INGREDIENT_QUANTITIES } from '../data/ingredientQuantities.js'
import { translateIngredientName } from '../data/ingredientTranslations.js'
import { getPluralForm, PIECE_INGREDIENT_PLURALS } from '../data/ingredientPlurals.js'

const UNIT_TRANSLATIONS_EN = {
  bouquet: 'bunch',
  'boîte(s)': 'can(s)',
  'branche(s)': 'sprig(s)',
  'c. à café': 'tsp',
  'c. à soupe': 'tbsp',
  'feuille(s)': 'sheet(s)',
  'gousse / sachet': 'pod / packet',
  'gousse(s)': 'clove(s)',
  'morceau (3 cm)': 'piece (3 cm)',
  pincée: 'pinch',
  'pièce(s)': 'piece(s)',
  'tasse(s)': 'cup(s)',
  'tige(s)': 'stalk(s)',
  'tranche(s)': 'slice(s)',
}

function roundNice(amount, unit) {
  if (unit === 'g' || unit === 'ml') {
    const step = amount >= 200 ? 10 : 5
    return Math.max(step, Math.round(amount / step) * step)
  }
  if (unit === 'pincée') {
    return Math.max(1, Math.round(amount))
  }
  // Unités comptées à la pièce/cuillère/bouquet : paliers de 0,5.
  return Math.max(0.5, Math.round(amount * 2) / 2)
}

// Valeur numérique arrondie pour `servings`, avant toute mise en forme —
// partagée par scaleIngredientQuantity, getIngredientDisplayName et
// scaleStepText pour ne calculer l'arrondi qu'à un seul endroit.
function scaledAmountValue(base, servings) {
  const raw = base.amount * (servings / BASE_SERVINGS)
  return roundNice(raw, base.unit)
}

function formatAmount(n, lang = 'fr') {
  if (Number.isInteger(n)) return String(n)
  return lang === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ',')
}

// Au-delà de 1000, "1500 g"/"1500 ml" devient "1,5 kg"/"1,5 L" — plus court
// et plus lisible sur mobile, et plus proche de la façon dont on lit ou dit
// une quantité à voix haute qu'un nombre à 4 chiffres.
const BIG_UNIT = { g: 'kg', ml: 'L' }

// "gousse(s)", "tranche(s)"... s'accordent au nombre plutôt que de garder la
// notation "(s)" (utile pour le code, moche à l'affichage). "pièce(s)" n'est
// PAS traité ici : c'est un cas à part entièrement retiré (voir
// scaleIngredientQuantity), pas juste accordé.
function inflectUnit(unit, count) {
  if (!unit.includes('(s)')) return unit
  return unit.replace('(s)', count <= 1 ? '' : 's')
}

// Renvoie "200 g" / "1,5 kg" / "6" (bare, sans unité, pour les ingrédients
// comptés "à la pièce" — voir ingredientPlurals.js, le nom de l'ingrédient
// porte alors l'accord singulier/pluriel à la place) / null si l'ingrédient
// n'est pas dans la table (nom non reconnu — reste silencieux plutôt que
// d'afficher un chiffre inventé).
export function scaleIngredientQuantity(name, servings, lang = 'fr') {
  const base = INGREDIENT_QUANTITIES[name]
  if (!base) return null
  const rounded = scaledAmountValue(base, servings)

  const bigUnit = BIG_UNIT[base.unit]
  if (bigUnit && rounded >= 1000) {
    const big = Math.round(rounded / 100) / 10 // arrondi au dixième (précision à 100 g/100 ml)
    return `${formatAmount(big, lang)} ${bigUnit}`
  }
  if (base.unit === 'pièce(s)') {
    return formatAmount(rounded, lang)
  }
  const unit = lang === 'en' ? UNIT_TRANSLATIONS_EN[base.unit] || base.unit : base.unit
  return `${formatAmount(rounded, lang)} ${inflectUnit(unit, rounded)}`
}

// Nombre BRUT (pas de formatage/texte) d'unités nécessaires pour `servings`,
// uniquement pour les ingrédients comptés "à la pièce" (tomate, oignon,
// œuf...) — null pour tout le reste (poids/volume/cuillères...), pour
// lesquels comparer à un nombre d'unités scannées n'a pas de sens (on ne
// peut pas déduire un poids à partir d'une photo). Sert à RecipePage.jsx
// pour savoir si la quantité RÉELLEMENT scannée (state.ingredients[].count)
// suffit pour la recette au nombre de personnes choisi, ou s'il en manque.
export function getRequiredPieceCount(name, servings) {
  const base = INGREDIENT_QUANTITIES[name]
  if (!base || base.unit !== 'pièce(s)') return null
  return scaledAmountValue(base, servings)
}

// Même principe que getRequiredPieceCount, mais pour les ingrédients pesés
// (g) ou mesurés en volume (ml) — grammes et millilitres comptent 1 pour 1
// ici (comme le prompt Gemini qui convertit "1 L" en 1000, voir
// api/analyze-fridge.js), donc comparable directement au poids lu sur un
// emballage (state.ingredients[].weightGrams, voir mockVision.js). Renvoie
// null pour tout le reste (pièce(s), cuillères, bouquets...).
export function getRequiredWeightGrams(name, servings) {
  const base = INGREDIENT_QUANTITIES[name]
  if (!base || (base.unit !== 'g' && base.unit !== 'ml')) return null
  return scaledAmountValue(base, servings)
}

// Nom d'affichage d'un ingrédient, accordé au nombre calculé pour `servings`
// quand il est compté "à la pièce" ("6 ananas", "2 oignons rouges") —
// remplace la traduction brute (toujours au singulier ou toujours au
// pluriel selon comment le nom canonique est stocké) par la bonne forme.
// Pour les ingrédients pesés/mesurés, le nom ne s'accorde jamais au nombre
// ("500 g de bœuf" quel que soit le nombre de personnes) : on retombe alors
// simplement sur translateIngredientName.
export function getIngredientDisplayName(name, servings, lang = 'fr') {
  const base = INGREDIENT_QUANTITIES[name]
  if (base?.unit === 'pièce(s)') {
    const plural = getPluralForm(name, scaledAmountValue(base, servings), lang)
    if (plural) return plural
  }
  return translateIngredientName(name, lang)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function leadingNumber(str) {
  const match = /^([\d.,]+)/.exec(str)
  return match ? match[1] : null
}

// Fenêtre de texte tolérée entre un nombre et le nom d'ingrédient/unité
// repéré juste après (voir les 3 usages ci-dessous) : n'importe quel
// caractère SAUF une vraie ponctuation de fin de proposition (`,` `;` `.`),
// pour ne jamais laisser le lookahead déborder sur un AUTRE ingrédient
// mentionné plus loin dans la même phrase. Exception explicite pour "c."
// (abréviation de "cuillère", ex: "c. à soupe"/"c. à café") : SANS elle, le
// point de cette abréviation était lu à tort comme une fin de phrase et
// coupait le lookahead avant même d'atteindre le nom de l'ingrédient — bug
// réel qui empêchait "2 c. à soupe de miel"/"1 c. à café de cannelle" de se
// recalculer avec le nombre de personnes, quel que soit `servings` (audit
// systématique : ~1500 mentions concernées sur la base de recettes, tous
// les assaisonnements/toppings mesurés en cuillères).
const GAP = '(?:c\\.|[^,;.])'

// Texte de remplissage toléré à l'intérieur d'une parenthèse contenant une
// quantité ("nom (... NOMBRE unité ...)") — jamais de parenthèse imbriquée
// ([^()] exclut aussi bien "(" que ")"), borné pour rester raisonnable.
const PAREN_FILLER = '[^()]{0,25}'

// Motif regex identifiant un ingrédient donné (dans sa forme traduite pour
// `lang`) à l'intérieur d'un texte libre — "s?" sur CHAQUE mot (pas
// seulement le dernier) car le pluriel d'un nom composé porte souvent sur le
// premier mot ("pomme de terre" -> "pommes de terre", pas "pomme de
// terres"). Pas de `\b` autour : les caractères français comme œ/é/è ne sont
// pas reconnus comme "mots" par `\b` en JS (basé sur [A-Za-z0-9_]
// uniquement), ce qui ferait silencieusement échouer le repérage pour des
// ingrédients comme "œufs".
function buildIngredientPattern(displayName) {
  return displayName
    .split(' ')
    .map((word) => `${escapeRegex(word)}s?`)
    .join('\\s+')
}

// Variante utilisée uniquement pour les ingrédients "pièce(s)" : le texte
// libre écrit parfois le nom au singulier strict même quand le compte est
// > 1 ("4 pièce(s) de tomate", alors que le nom canonique "tomates" est
// stocké au pluriel) — un "s?" en fin de mot ne suffit alors pas à faire le
// lien. On construit le motif à partir des DEUX formes connues
// (ingredientPlurals.js), pas seulement de translateIngredientName.
function buildPieceIngredientPattern(name, lang, fallbackDisplayName) {
  const forms = PIECE_INGREDIENT_PLURALS[name]
  if (!forms) return buildIngredientPattern(fallbackDisplayName)
  const singular = lang === 'en' ? forms.enSingular : forms.frSingular
  const plural = lang === 'en' ? forms.enPlural : forms.frPlural
  const singularPattern = buildIngredientPattern(singular)
  if (singular === plural) return singularPattern
  const pluralPattern = buildIngredientPattern(plural)
  return `(?:${pluralPattern}|${singularPattern})`
}

// Les étapes détaillées (voir scripts/detail-recipe-steps.mjs) contiennent
// des quantités écrites en dur dans le texte pour BASE_SERVINGS personnes
// ("Coupez les 600 g de pommes de terre...", "1 pièce(s) de citron"), à
// partir des mêmes valeurs que ingredientQuantities.js — y compris la
// notation "pièce(s)"/"gousse(s)" écrite telle quelle par l'IA, jamais
// pensée pour de la prose. Cette fonction réécrit le texte en place, en deux
// temps :
//  1) toujours : nettoie ces notations moches ("1 pièce(s) de citron" ->
//     "1 citron", "3 gousse(s) d'ail" -> "3 gousses d'ail"), même à la
//     répartition d'origine (BASE_SERVINGS) ;
//  2) seulement si `servings` diffère de BASE_SERVINGS : recalcule aussi le
//     nombre lui-même, ancré sur le nom de l'ingrédient à proximité pour ne
//     jamais toucher un autre nombre de la même phrase (temps de cuisson,
//     température...).
export function scaleStepText(step, recipe, servings, lang = 'fr') {
  if (!recipe || !step) return step

  const ingredients = [...new Set([...(recipe.required || []), ...(recipe.optional || [])])]
  const shouldRescale = servings !== BASE_SERVINGS
  let result = step

  for (const ing of ingredients) {
    const base = INGREDIENT_QUANTITIES[ing]
    if (!base) continue
    // Le nettoyage de la formulation "pièce(s)" (ci-dessous) fonctionne même
    // pour une base fractionnaire (ex. "chou rouge": 0.5) grâce au nombre
    // capturé dans le texte. Les autres branches, elles, ancrent leur regex
    // sur `baseAmountStr` tel quel : une base non entière y reste gérable
    // (matché littéralement), seul le fallback final (dernier `if`) suppose
    // un nombre simple à recalculer — sans incidence ici car il ne
    // s'applique qu'aux unités non gérées explicitement plus haut.

    // Le texte des étapes est déjà traduit en anglais (stepsEn) quand
    // lang==='en' — le nom d'ingrédient à repérer doit donc l'être aussi,
    // sans quoi la recherche du nom français canonique ("fromage") ne
    // trouverait jamais rien dans un texte qui dit "cheese".
    const displayIngName = translateIngredientName(ing, lang)
    const ingPattern = buildIngredientPattern(displayIngName)
    const rounded = scaledAmountValue(base, servings)
    const baseAmountStr = String(base.amount)
    // Nombre à utiliser dans le texte : recalculé si `servings` a changé,
    // sinon la valeur de base mais reformatée localement (`formatAmount`,
    // pas `baseAmountStr` qui est la forme JS brute "0.5" utilisée pour
    // ancrer les regex sur le texte original — jamais pour l'affichage,
    // sans quoi le français afficherait un point au lieu d'une virgule).
    const numberInText = formatAmount(shouldRescale ? rounded : base.amount, lang)

    if (base.unit === 'pièce(s)') {
      // "1 pièce(s) de citron" / "6 pièce(s) d'ananas" / "4 piece(s) of
      // lemon" -> "1 citron" / "6 ananas" / "4 lemons" : capture le nombre,
      // "pièce(s) de/d'/of" et le nom de l'ingrédient EN UN SEUL bloc, et
      // remplace le tout par "nombre nom correctement accordé" — plus
      // fiable que retirer "pièce(s)" puis corriger le nom séparément.
      // Le nombre est CAPTURÉ dans le texte plutôt que supposé égal à
      // base.amount : certaines étapes générées par l'IA embarquent une
      // quantité qui ne correspond pas exactement à ingredientQuantities.js
      // (incohérence de données pré-existante) — capturer permet de quand
      // même nettoyer la formulation dans ce cas, au prix de ne pas
      // recalculer le nombre pour `servings` (on ne connaît alors pas le
      // ratio correct).
      const piecePattern = buildPieceIngredientPattern(ing, lang, displayIngName)
      const numberGroup = '(\\d+(?:[.,]\\d+)?)'
      const connector = "(?:de\\s+|d['’]|of\\s+)?"
      // "pièce(s)" (notation brute) mais aussi "pièce"/"pièces" déjà
      // accordé tel quel dans le texte ("2 pièces d'oignon") — c'est
      // exactement la formulation d'origine signalée par l'utilisateur
      // ("6 pièces d'ananas"), pas seulement sa variante avec "(s)" entre
      // parenthèses.
      const pieceWord = 'pi[eè]ces?(?:\\(s\\))?'
      // Jusqu'à 2 mots d'adjectif entre le connecteur et le nom repéré
      // ("1 piece(s) of finely chopped chili pepper") : capturés et
      // réinsérés tels quels (jamais retirés) devant le nom accordé, sans
      // quoi le sens de l'étape serait perdu.
      const adjPrefix = '((?:[^\\s.,;!?()]+\\s+){0,2}?)'
      const regex = new RegExp(`\\b${numberGroup}\\s*${pieceWord}\\s*${connector}${adjPrefix}${piecePattern}`, 'gi')
      result = result.replace(regex, (match, capturedNum, adjWords) => {
        const capturedValue = parseFloat(capturedNum.replace(',', '.'))
        const matchesBase = Number.isFinite(capturedValue) && Math.abs(capturedValue - base.amount) < 1e-9
        const displayNumberStr = matchesBase ? numberInText : capturedNum
        const displayCount = matchesBase ? rounded : capturedValue
        const displayName = getPluralForm(ing, displayCount, lang) || displayIngName
        return `${displayNumberStr} ${adjWords}${displayName}`
      })
      // Formulation inversée "chou (1 pièce(s))" / "cabbage (1 piece(s))" :
      // le nom précède le nombre entre parenthèses, notamment quand
      // l'ingrédient est aussi mentionné ailleurs dans la phrase sans
      // quantité. On retire alors juste la parenthèse plutôt que de
      // dupliquer le nom (déjà présent avant).
      const parenRegex = new RegExp(
        `${piecePattern}\\s*\\(${numberGroup}\\s*${pieceWord}(?:\\s+au\\s+total)?\\)`,
        'gi'
      )
      result = result.replace(parenRegex, (match) => match.replace(new RegExp(`\\s*\\(\\s*\\d+(?:[.,]\\d+)?\\s*${pieceWord}(?:\\s+au\\s+total)?\\)`, 'i'), ''))
      // Rare cas sans nombre du tout ("la pièce(s) de pâte à pizza",
      // "une pièce(s) de tortilla") : compte implicite 1, déterminant
      // français retiré (il ne s'accorderait pas forcément avec le nom qui
      // suit — ex. "la" devant "citron", masculin).
      const impliedOneRegex = new RegExp(`\\b(?:la|le|l['’]|une?|the)\\s+${pieceWord}\\s*${connector}${adjPrefix}${piecePattern}`, 'gi')
      result = result.replace(impliedOneRegex, (match, adjWords) => {
        const displayName = getPluralForm(ing, 1, lang) || displayIngName
        return `${formatAmount(1, lang)} ${adjWords}${displayName}`
      })
      // Formulation "3 bell pepper(s)" / "2 onion(s)" / voire "3 bell
      // peppers" déjà accordé tel quel sans aucun marqueur : le nom
      // lui-même porte l'accord (avec ou sans "(s)/(es)" explicite), sans
      // passer par le mot "pièce(s)" du tout. Repérée et corrigée ICI (pas
      // seulement par le filet de sécurité générique en fin de fonction,
      // voir inflectBracketedWords) pour que le NOMBRE soit aussi recalculé
      // pour `servings` — sinon la liste d'ingrédients et le texte des
      // étapes redeviennent incohérents entre eux dès que `servings`
      // change, exactement le bug signalé à l'origine par l'utilisateur.
      // `piecePattern` couvre déjà singulier ET pluriel (voir
      // buildPieceIngredientPattern) : le "(s)/(es)" entre parenthèses,
      // s'il est présent dans le texte, est simplement en plus.
      // Ici (contrairement à `adjPrefix` ci-dessus), aucun mot d'UNITÉ DE
      // MESURE ("ml", "g", "kg"...) n'est autorisé entre le nombre et le
      // nom : sans ça, "300 ml of tomato sauce" (un TOUT AUTRE ingrédient
      // mesuré en ml) se ferait lire comme "300 [ml][of] tomato" et
      // "tomato" s'y ferait accorder à tort ("300 ml of tomatoes sauce").
      // "of"/"de"/"d'" restent AUTORISÉS ici (contrairement à une première
      // version plus stricte) : ils servent aussi à des formulations
      // légitimes comme "1 head of lettuce" ("1 salade"), qu'un rejet trop
      // large empêcherait de jamais matcher.
      const bareNoConnectorPrefix = "((?:(?!\\b(?:ml|g|kg|l|tsp|tbsp|cup|cups|oz|lb|cm)\\b)[^\\s.,;!?()]+\\s+){0,2}?)"
      // Négatif après le nom : "4 avocado halves" ("4 moitiés d'avocat", pas
      // "4 avocats") — ici le nom sert de modificateur invariable devant un
      // autre nom qui porte le VRAI pluriel ; l'accorder aussi donnerait
      // "4 avocados halves" (double marque, faux). Rare mais net dès que ça
      // se présente.
      const notFollowedByPortionWord = '(?!\\s*(?:halves|slices|wedges|quarters|chunks|pieces|rings|cubes))'
      const directSuffixRegex = new RegExp(
        `\\b${numberGroup}\\s*${bareNoConnectorPrefix}${piecePattern}${notFollowedByPortionWord}(?:\\((?:s|es)\\))?\\b`,
        'gi'
      )
      result = result.replace(directSuffixRegex, (match, capturedNum, adjWords) => {
        const capturedValue = parseFloat(capturedNum.replace(',', '.'))
        const matchesBase = Number.isFinite(capturedValue) && Math.abs(capturedValue - base.amount) < 1e-9
        const displayNumberStr = matchesBase ? numberInText : capturedNum
        const displayCount = matchesBase ? rounded : capturedValue
        const displayName = getPluralForm(ing, displayCount, lang) || displayIngName
        return `${displayNumberStr} ${adjWords}${displayName}`
      })
      continue
    }

    if (base.unit === 'g' || base.unit === 'ml') {
      if (!shouldRescale) continue
      const scaled = scaleIngredientQuantity(ing, servings, lang)
      if (!scaled) continue
      // Forme "50 g of almonds"/"50 g d'amandes" : le nombre précède,
      // l'ingrédient suit dans les 30 caractères (lookahead avant).
      const regex = new RegExp(`\\b${baseAmountStr}\\s*${base.unit}\\b(?=${GAP}{0,30}${ingPattern})`, 'gi')
      result = result.replace(regex, scaled)
      // Forme inversée "almonds (50 g)"/"amandes (50 g)" : l'ingrédient
      // précède, le poids/volume est entre parenthèses — le lookahead
      // ci-dessus ne regarde jamais EN ARRIÈRE, donc ne matchait jamais
      // cette formulation (signalé : la liste d'ingrédients recalculait
      // bien "15 g" mais cette étape gardait "50 g", désynchronisées).
      // Même principe que la forme "chou (1 pièce(s))" déjà gérée plus haut
      // pour les ingrédients comptés à la pièce, mais ici on RECALCULE le
      // nombre au lieu de juste retirer la parenthèse (le poids n'est pas
      // redondant avec le nom comme peut l'être un compte à la pièce).
      // `PAREN_FILLER` tolère du texte de part et d'autre à l'intérieur —
      // audit systématique : la formulation réelle varie beaucoup ("bouillon
      // CHAUD (500 ml)", "eau (ENVIRON 500 ml)", "fromage (200 g AU TOTAL)",
      // "crème fraîche (PRIS DANS LES 200 ml)"...) — sans cette tolérance,
      // seule la forme exacte "nom (nombre unité)" collée était recalculée.
      const parenRegex = new RegExp(
        `(${ingPattern}${PAREN_FILLER}\\()(${PAREN_FILLER})${escapeRegex(baseAmountStr)}\\s*${base.unit}(${PAREN_FILLER})(\\))`,
        'gi'
      )
      result = result.replace(
        parenRegex,
        (match, nameToOpenParen, innerBefore, innerAfter, closeParen) =>
          `${nameToOpenParen}${innerBefore}${scaled}${innerAfter}${closeParen}`
      )
      continue
    }

    // Unités "gousse(s)", "tranche(s)"... : toujours accorder au nombre
    // (recalculé ou non), jamais garder la notation "(s)" telle quelle. Le
    // texte écrit parfois l'unité déjà normalement accordée, sans la
    // notation "(s)" du tout ("3 garlic cloves") — `unitAltPattern` reconnaît
    // aussi bien la forme brute ("gousse(s)"/"clove(s)") que ses formes
    // accordées explicites (singulier/pluriel), pour recalculer le nombre
    // dans tous les cas plutôt que seulement quand la notation "(s)" est
    // présente telle quelle.
    const rawUnit = lang === 'en' ? UNIT_TRANSLATIONS_EN[base.unit] || base.unit : base.unit
    if (rawUnit.includes('(s)')) {
      const singular = rawUnit.replace('(s)', '')
      const plural = rawUnit.replace('(s)', 's')
      const unitAltPattern = `(?:${escapeRegex(rawUnit)}|${escapeRegex(plural)}|${escapeRegex(singular)})`
      const unitRegex = new RegExp(unitAltPattern, 'gi')
      // NEARBY (pas de virgule/point-virgule/point dans la fenêtre) : sans
      // ça, "2 lemons, 2 sprigs of rosemary" laisse le lookahead de
      // `sprig(s)` "voir" jusqu'à travers la mention d'un AUTRE ingrédient
      // compté juste avant dans la même phrase, et le nombre du mauvais
      // ingrédient se fait réécrire à sa place.
      const numberRegex = new RegExp(`\\b${baseAmountStr}\\b(?=${GAP}{0,30}${unitAltPattern})`, 'gi')
      const count = shouldRescale ? rounded : base.amount
      result = result.replace(numberRegex, numberInText)
      result = result.replace(unitRegex, count <= 1 ? singular : plural)
      continue
    }

    if (!shouldRescale) continue
    const scaled = scaleIngredientQuantity(ing, servings, lang)
    const newNumber = leadingNumber(scaled)
    if (!newNumber) continue
    // Dernier filet (unités "c. à soupe"/"c. à café"/"pincée"...) : le
    // connecteur "NOMBRE UNITÉ de/d' NOM" est plus long que pour g/ml/
    // pièce(s) (ex: "2 c. à soupe de miel" = 15 caractères pile entre le
    // nombre et le nom) — un ancien seuil de 15 caractères ratait
    // silencieusement CE cas précis, laissant miel/huile/sucre/épices figés
    // à leur valeur de base dans le texte des étapes quel que soit le
    // nombre de personnes choisi (audit systématique : ~1500 mentions
    // concernées sur la base). 30 caractères couvre confortablement toutes
    // les unités existantes tout en restant borné par la ponctuation
    // ([^,;.]) pour ne jamais déborder sur un AUTRE ingrédient de la même
    // phrase.
    const regex = new RegExp(`\\b${baseAmountStr}\\b(?=${GAP}{0,30}${ingPattern})`, 'gi')
    result = result.replace(regex, newNumber)
    // Forme inversée "cannelle (1 c. à café)"/"cinnamon (1 tsp)" : même
    // principe que pour g/ml ci-dessus (voir PAREN_FILLER), mais ici seul le
    // NOMBRE change (l'unité — cuillère, pincée, gousse/sachet — ne
    // s'accorde jamais au pluriel en français comme en anglais dans ce
    // contexte, contrairement à gousse(s)/tranche(s) gérés juste au-dessus).
    const parenNumberRegex = new RegExp(
      `(${ingPattern}${PAREN_FILLER}\\()(${PAREN_FILLER})${escapeRegex(baseAmountStr)}(?=${PAREN_FILLER}${escapeRegex(rawUnit)})`,
      'gi'
    )
    result = result.replace(parenNumberRegex, (match, nameToOpenParen, innerBefore) => `${nameToOpenParen}${innerBefore}${newNumber}`)
  }

  return inflectBracketedWords(result)
}

// Filet de sécurité générique, appliqué APRÈS la boucle par ingrédient
// ci-dessus : certaines étapes écrivent l'accord directement sur le nom
// ("2 onion(s)", "3 box(es)", "2 branch(es) de thym") plutôt que via
// "pièce(s) de/d'/of NOM" — un choix de formulation de l'IA différent
// (et parfois avec un mot différent de celui de nos tables de traduction,
// ex. "box(es)" au lieu de "can(s)") que le repérage par nom d'ingrédient
// ci-dessus ne peut pas anticiper. Cette passe est volontairement
// AGNOSTIQUE du nom de l'ingrédient : elle repère juste "NOMBRE ... MOT(s)"
// ou "MOT(es)" n'importe où dans le texte et accorde MOT selon la valeur du
// nombre — un filet de sécurité plutôt qu'un remplacement du repérage par
// nom (qui reste nécessaire pour retirer "pièce(s)"/traiter les unités
// gousse(s)/tranche(s)/etc.).
function inflectBracketedWords(text) {
  const regex = /\b(\d+(?:[.,]\d+)?)\s+((?:[a-zà-ÿ-]+\s+){0,3}?)([a-zà-ÿ-]+)\((s|es)\)/gi
  return text.replace(regex, (match, num, prefix, word, suffix) => {
    const value = parseFloat(num.replace(',', '.'))
    const isSingular = !Number.isFinite(value) || value <= 1
    return `${num} ${prefix}${isSingular ? word : word + suffix}`
  })
}
