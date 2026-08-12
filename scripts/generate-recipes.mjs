#!/usr/bin/env node
// -----------------------------------------------------------------------------
// scripts/generate-recipes.mjs
// Script à lancer manuellement (jamais depuis l'app) pour générer un lot de
// nouvelles recettes via Gemini, dans le format exact de src/data/recipesDB.js
// (voir RECIPE_SCHEMA_EXAMPLE ci-dessous). Ne modifie JAMAIS recipesDB.js
// directement : écrit un fichier JSON à relire, que vous copiez vous-même
// dans le tableau RECIPES après vérification (cohérence, sécurité
// alimentaire, doublons de fond même si les id sont uniques).
//
// Pourquoi un script Gemini plutôt qu'une API de recettes externe
// (Spoonacular, Edamam...) : ces API sont majoritairement en anglais et
// interdisent contractuellement de stocker durablement leurs données dans
// votre propre base — exactement ce que ce script doit faire. Gemini génère
// le contenu directement dans le bon format et la bonne langue, sans ce
// problème de licence, et sans coût supplémentaire (même clé/quota que le
// reste de l'app, voir GEMINI_API_KEY).
//
// Usage :
//   GEMINI_API_KEY=xxx node scripts/generate-recipes.mjs [options]
//
// Options :
//   --count N       Nombre de recettes à générer (défaut 15, max 30/appel —
//                    au-delà, relancez le script plusieurs fois : chaque
//                    appel relit les id déjà présents dans recipesDB.js pour
//                    éviter les doublons).
//   --theme "texte" Thème/contrainte libre à donner à Gemini, ex :
//                    "recettes vegan rapides (moins de 20 minutes)",
//                    "desserts de fruits de saison", "cuisine asiatique
//                    healthy". Si omis, Gemini choisit librement en essayant
//                    de varier par rapport à ce qui existe déjà.
//   --out chemin.json  Fichier de sortie (défaut : scripts/generated-recipes/
//                    <horodatage>.json).
//
// Variables d'environnement :
//   GEMINI_API_KEY (obligatoire) : même clé que celle configurée sur Vercel
//     pour api/analyze-fridge.js et api/normalize-product.js.
//   GEMINI_MODEL (optionnel) : défaut "gemini-2.5-flash".
// -----------------------------------------------------------------------------

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RECIPES } from '../src/data/recipesDB.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_MODEL = 'gemini-2.5-flash'
const MAX_COUNT_PER_CALL = 30

const KNOWN_CUISINES = ['rapide', 'healthy', 'gourmand']
const KNOWN_LEVELS = ['facile', 'moyen']

// Mots-clés non-végétariens (même liste que src/logic/recipeEngine.js) : sert
// à vérifier que Gemini ne tague pas 'vegetarien' une recette qui contient
// en réalité de la viande/poisson dans required OU optional — bug réel
// trouvé et corrigé sur 18 recettes existantes plus tôt (voir historique
// git), donc explicitement gardé contre à la génération plutôt que découvert
// après coup.
const NON_VEGETARIAN_KEYWORDS = [
  'poulet', 'boeuf', 'bœuf', 'porc', 'jambon', 'lardons', 'bacon', 'viande',
  'thon', 'saumon', 'poisson', 'crevette', 'fruits de mer', 'dinde', 'canard',
  'agneau', 'veau', 'saucisse', 'chorizo',
]

function parseArgs(argv) {
  const args = { count: 15, theme: '', out: null }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--count') args.count = Number(argv[++i]) || args.count
    else if (argv[i] === '--theme') args.theme = argv[++i] || ''
    else if (argv[i] === '--out') args.out = argv[++i] || null
  }
  return args
}

function buildIngredientVocabularyHint() {
  // Échantillon d'ingrédients déjà utilisés dans la base, pour orienter
  // Gemini vers des noms déjà reconnus par le moteur de catégorisation
  // (categorizeIngredient dans src/data/dishPatterns.js) plutôt que des
  // formulations inhabituelles qui ne matcheraient rien.
  const names = new Set()
  for (const r of RECIPES) {
    for (const ing of [...r.required, ...r.optional]) names.add(ing)
    if (names.size >= 120) break
  }
  return [...names].slice(0, 120).join(', ')
}

function buildPrompt({ count, theme, existingIds, ingredientHint }) {
  return `Tu es un cuisinier qui rédige des fiches recettes "réalistes niveau étudiant" pour une app
française (FrigoMind) qui suggère des recettes à partir d'ingrédients qu'on a déjà chez soi.

Génère exactement ${count} NOUVELLES recettes, au format JSON strict décrit ci-dessous. ${
    theme ? `Contrainte/thème : ${theme}.` : "Varie les styles, cuisines et catégories d'ingrédients pour compléter une base existante déjà riche."
  }

TON D'ÉCRITURE — le plus important : écris comme un vrai cuisinier qui explique sa recette à un ami,
PAS comme une notice technique générée par une IA. Concrètement :
- Varie la structure des phrases d'une étape à l'autre. N'ouvre pas systématiquement chaque étape par
  un verbe à l'infinitif suivi mécaniquement du même schéma ("Couper X. Ajouter Y. Cuire Z.") — mélange
  des tournures, des repères sensoriels ("jusqu'à ce que ça embaume", "quand les bords dorent",
  "quand la lame glisse facilement dedans") et des petites explications du pourquoi ("pour qu'elle
  reste croquante", "ça évite qu'il attache").
- Évite le jargon creux et les formulations passe-partout répétées d'une recette à l'autre.
- Reste concret et court : pas de blabla, juste une vraie voix humaine plutôt qu'un ton robotique.

RÈGLES IMPORTANTES :
- "id" : slug unique en kebab-case (minuscules, tirets), qui ne doit JAMAIS être un des identifiants
  suivants déjà utilisés (liste ci-dessous) : ${existingIds}
- "intro"/"introEn" : UNE phrase d'accroche chaleureuse (pas un résumé technique) qui donne envie, en
  français pour "intro", en anglais pour "introEn" (traduction fidèle, même ton). Évite de répéter la
  même structure de phrase d'une recette à l'autre dans le lot.
- "tip"/"tipEn" : UNE astuce de cuisinier concrète et spécifique à CETTE recette (une variante possible,
  un geste technique qui change le résultat, une astuce de conservation ou d'accompagnement) — jamais
  une astuce générique qui irait pour n'importe quel plat.
- "required" : les ingrédients VRAIMENT indispensables à la recette (pas sel/poivre/huile/eau — jamais
  comptés comme manquants par l'app, inutile de les lister en required).
- "optional" : ingrédients facultatifs qui améliorent la recette sans être indispensables.
- RÈGLE STRICTE : si "diet" contient "vegetarien", ni "required" ni "optional" ne doivent contenir de
  viande ou poisson (poulet, bœuf, porc, jambon, lardons, bacon, thon, saumon, crevette, dinde, canard,
  agneau, veau, saucisse, chorizo, etc.) — même en option "si disponible". C'est une règle stricte,
  pas une suggestion : une recette végétarienne ne doit JAMAIS inviter à ajouter de la viande.
- Utilise autant que possible des noms d'ingrédients déjà présents dans cette liste (mêmes mots,
  singulier/pluriel) pour bien matcher avec le reste de l'app : ${ingredientHint}
- "cuisine" doit être EXACTEMENT l'une de : ${KNOWN_CUISINES.join(', ')}.
- "level" doit être EXACTEMENT l'une de : ${KNOWN_LEVELS.join(', ')}.
- "diet" est un tableau pouvant contenir "vegetarien", "vegan", "sans-gluten" (vide si aucun ne s'applique).
- "steps"/"stepsEn" : 3 à 5 étapes claires et concrètes, en français pour "steps", en anglais pour
  "stepsEn" (traduction fidèle, pas un résumé).
- "time" : minutes réalistes (entier).
- "emoji" : un seul emoji pertinent.

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format
exact :
{"recipes": [
  {
    "id": "exemple-slug-unique",
    "name": "Nom en français",
    "nameEn": "English name",
    "intro": "Une phrase d'accroche chaleureuse et spécifique à cette recette.",
    "introEn": "A warm, recipe-specific hook sentence.",
    "tip": "Une astuce concrète propre à cette recette.",
    "tipEn": "A concrete tip specific to this recipe.",
    "emoji": "🍳",
    "time": 20,
    "level": "facile",
    "cuisine": "rapide",
    "diet": ["vegetarien"],
    "required": ["ingrédient 1", "ingrédient 2"],
    "optional": ["ingrédient 3"],
    "steps": ["Étape 1.", "Étape 2.", "Étape 3."],
    "stepsEn": ["Step 1.", "Step 2.", "Step 3."]
  }
]}`
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

function containsNonVegKeyword(ingredients) {
  const joined = ingredients.join(' ').toLowerCase()
  return NON_VEGETARIAN_KEYWORDS.some((kw) => joined.includes(kw))
}

// Valide une recette générée : rejette (avec raison) plutôt que de corriger
// silencieusement — mieux vaut relancer que d'intégrer une recette bancale
// sans que l'utilisateur le sache.
function validateRecipe(recipe, existingIdSet, seenIdsThisBatch) {
  const errors = []
  if (!recipe || typeof recipe !== 'object') return ['objet recette invalide']

  if (typeof recipe.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(recipe.id)) {
    errors.push('id manquant ou pas en kebab-case')
  } else if (existingIdSet.has(recipe.id)) {
    errors.push(`id "${recipe.id}" existe déjà dans recipesDB.js`)
  } else if (seenIdsThisBatch.has(recipe.id)) {
    errors.push(`id "${recipe.id}" dupliqué dans ce même lot`)
  }

  if (!recipe.name?.trim()) errors.push('name manquant')
  if (!recipe.nameEn?.trim()) errors.push('nameEn manquant')
  if (!recipe.intro?.trim()) errors.push('intro manquante')
  if (!recipe.introEn?.trim()) errors.push('introEn manquante')
  if (!recipe.tip?.trim()) errors.push('tip manquante')
  if (!recipe.tipEn?.trim()) errors.push('tipEn manquante')
  if (!recipe.emoji?.trim()) errors.push('emoji manquant')
  if (!Number.isFinite(recipe.time) || recipe.time <= 0) errors.push('time invalide')
  if (!KNOWN_LEVELS.includes(recipe.level)) errors.push(`level invalide: ${recipe.level}`)
  if (!KNOWN_CUISINES.includes(recipe.cuisine)) errors.push(`cuisine invalide: ${recipe.cuisine}`)
  if (!Array.isArray(recipe.required) || recipe.required.length === 0) errors.push('required vide')
  if (!Array.isArray(recipe.optional)) errors.push('optional doit être un tableau (vide accepté)')
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) errors.push('steps vide')
  if (!Array.isArray(recipe.stepsEn) || recipe.stepsEn.length === 0) errors.push('stepsEn vide')
  if (!Array.isArray(recipe.diet)) errors.push('diet doit être un tableau (vide accepté)')

  if (Array.isArray(recipe.diet) && recipe.diet.includes('vegetarien')) {
    const allIngredients = [...(recipe.required || []), ...(recipe.optional || [])]
    if (containsNonVegKeyword(allIngredients)) {
      errors.push('taguée "vegetarien" mais contient un ingrédient carné/poisson')
    }
  }

  return errors
}

async function callGemini({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Erreur API Gemini (${response.status}): ${errText}`)
  }
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Réponse Gemini vide (pas de texte dans candidates[0])')
  const parsed = extractJson(text)
  if (!parsed || !Array.isArray(parsed.recipes)) {
    throw new Error('Réponse Gemini invalide : JSON attendu au format {"recipes": [...]}')
  }
  return parsed.recipes
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY manquante. Lancez : GEMINI_API_KEY=xxx node scripts/generate-recipes.mjs')
    process.exit(1)
  }

  const args = parseArgs(process.argv.slice(2))
  const count = Math.min(Math.max(1, args.count), MAX_COUNT_PER_CALL)
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  const existingIdSet = new Set(RECIPES.map((r) => r.id))
  // On ne montre à Gemini qu'un échantillon des id existants (1045 id en
  // entier serait inutilement verbeux) : suffisant pour qu'il évite les
  // collisions évidentes ; la vraie garantie vient de validateRecipe, qui
  // vérifie chaque id généré contre la liste COMPLÈTE avant d'accepter quoi
  // que ce soit.
  const idSample = [...existingIdSet].slice(0, 200).join(', ')
  const ingredientHint = buildIngredientVocabularyHint()

  console.log(`Génération de ${count} recette(s) via ${model}${args.theme ? ` (thème: "${args.theme}")` : ''}...`)

  const prompt = buildPrompt({ count, theme: args.theme, existingIds: idSample, ingredientHint })
  const rawRecipes = await callGemini({ apiKey, model, prompt })

  const accepted = []
  const rejected = []
  const seenIdsThisBatch = new Set()

  for (const recipe of rawRecipes) {
    const errors = validateRecipe(recipe, existingIdSet, seenIdsThisBatch)
    if (errors.length === 0) {
      accepted.push(recipe)
      seenIdsThisBatch.add(recipe.id)
    } else {
      rejected.push({ recipe, errors })
    }
  }

  const outDir = args.out ? path.dirname(args.out) : path.join(__dirname, 'generated-recipes')
  await mkdir(outDir, { recursive: true })
  const outPath = args.out || path.join(outDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  await writeFile(outPath, JSON.stringify(accepted, null, 2), 'utf-8')

  console.log(`\n✅ ${accepted.length} recette(s) valide(s) écrite(s) dans ${outPath}`)
  if (rejected.length) {
    console.log(`\n⚠️  ${rejected.length} recette(s) rejetée(s) :`)
    for (const { recipe, errors } of rejected) {
      console.log(`  - ${recipe?.id || recipe?.name || '(sans id)'}: ${errors.join('; ')}`)
    }
  }
  console.log('\nProchaine étape : relisez le fichier JSON généré, puis copiez les entrées retenues')
  console.log('dans le tableau RECIPES de src/data/recipesDB.js.')
}

main().catch((err) => {
  console.error('Échec de la génération :', err.message)
  process.exit(1)
})
