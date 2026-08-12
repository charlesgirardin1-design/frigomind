#!/usr/bin/env node
// -----------------------------------------------------------------------------
// scripts/detail-recipe-steps.mjs
// Réécrit les étapes (`steps`/`stepsEn`) des recettes DÉJÀ en base pour les
// rendre plus détaillées : plus d'étapes, une action par étape, et surtout
// des quantités précises directement dans le texte ("couper les 600 g de
// pommes de terre" plutôt que "couper les pommes de terre"). Les quantités
// utilisées viennent de ingredientQuantities.js (base 4 personnes, comme
// affiché sur la fiche) pour rester cohérentes avec la liste d'ingrédients —
// jamais inventées. Patch recipesDB.js en place, ne touche à rien d'autre
// (nom, intro, tip, ingrédients... inchangés). Traite un lot à la fois ;
// relancer plusieurs fois pour couvrir toute la base (voir --marker pour
// suivre l'avancement sans dépendre d'un champ dédié).
//
// Usage :
//   GEMINI_API_KEY=xxx node scripts/detail-recipe-steps.mjs [--count N] [--model xxx]
// -----------------------------------------------------------------------------

import { readFile, writeFile } from 'node:fs/promises'
import { RECIPES } from '../src/data/recipesDB.js'
import { INGREDIENT_QUANTITIES, BASE_SERVINGS } from '../src/data/ingredientQuantities.js'

const DEFAULT_MODEL = 'gemini-flash-lite-latest'
const DEFAULT_COUNT = 12

function parseArgs(argv) {
  const args = { count: DEFAULT_COUNT, model: process.env.GEMINI_MODEL || DEFAULT_MODEL }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--count') args.count = Number(argv[++i]) || args.count
    else if (argv[i] === '--model') args.model = argv[++i] || args.model
  }
  return args
}

function quote(str) {
  if (str.includes("'") && !str.includes('"')) return `"${str}"`
  return `'${str.replace(/'/g, "\\'")}'`
}

function scaledQty(name) {
  const base = INGREDIENT_QUANTITIES[name]
  if (!base) return null
  // Référence à BASE_SERVINGS (4 personnes), identique à ce qu'affiche la
  // fiche par défaut — pas de mise à l'échelle ici, l'app recalcule déjà
  // dynamiquement selon le nombre de personnes choisi par l'utilisateur.
  return `${base.amount} ${base.unit}`
}

function buildIngredientLines(recipe) {
  const lines = []
  for (const ing of recipe.required || []) {
    const qty = scaledQty(ing)
    lines.push(qty ? `${ing}: ${qty} (obligatoire)` : `${ing} (obligatoire, quantité libre)`)
  }
  for (const ing of recipe.optional || []) {
    const qty = scaledQty(ing)
    lines.push(qty ? `${ing}: ${qty} (optionnel)` : `${ing} (optionnel, quantité libre)`)
  }
  return lines
}

function buildPrompt(batch) {
  const items = batch.map((r) => ({
    id: r.id,
    name: r.name,
    ingredients: buildIngredientLines(r),
    steps_actuelles: r.steps,
  }))
  return `Tu es un cuisinier qui réécrit des fiches recettes pour une app française (FrigoMind) afin de les
rendre plus précises et faciles à suivre pour un débutant. Voici une liste de recettes existantes avec
leurs ingrédients (et la quantité de référence pour ${BASE_SERVINGS} personnes quand elle est connue) et
leurs étapes actuelles, trop vagues. Réécris les étapes de CHACUNE.

RÈGLES IMPORTANTES :
- N'utilise QUE les ingrédients listés pour cette recette (n'en invente jamais un nouveau).
- Quand une quantité est donnée pour un ingrédient, mentionne-la explicitement dans l'étape où cet
  ingrédient est utilisé pour la première fois (ex : "Éplucher et couper 600 g de pommes de terre en
  cubes.", "Mélanger avec 100 ml de lait."). Pour un ingrédient marqué "optionnel", précise "si
  disponible" comme dans les étapes actuelles. Pour un ingrédient à "quantité libre" (sel, épices...),
  ne mets pas de chiffre, garde une formulation naturelle ("une pincée de sel", "au goût").
- Découpe en plus d'étapes qu'actuellement, une action précise par étape (préparation des ingrédients
  d'abord, puis cuisson, puis dressage) — vise 6 à 9 étapes selon la complexité du plat, jamais moins
  de 5.
- Garde le même déroulé/la même logique de cuisson que les étapes actuelles (ne change pas la recette),
  reformule juste en plus détaillé et précis.
- Ton naturel de cuisinier qui explique à un débutant, pas une notice technique robotique.

Recettes à traiter (utilise "id" tel quel pour identifier chaque réponse) :
${JSON.stringify(items)}

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format
exact, une entrée par recette ci-dessus, dans le même ordre :
{"recipes": [
  {"id": "id-exact-de-la-recette", "steps": ["étape 1 en français", "étape 2...", "..."], "stepsEn": ["step 1 in english", "step 2...", "..."]}
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

function validateEntry(e, requestedIdSet) {
  const errors = []
  if (!e || typeof e !== 'object') return ['objet invalide']
  if (!requestedIdSet.has(e.id)) errors.push(`id "${e.id}" ne correspond à aucune recette demandée`)
  if (!Array.isArray(e.steps) || e.steps.length < 4) errors.push('steps manquant ou trop court (< 4)')
  if (!Array.isArray(e.stepsEn) || e.stepsEn.length < 4) errors.push('stepsEn manquant ou trop court (< 4)')
  if (e.steps?.some((s) => typeof s !== 'string' || !s.trim())) errors.push('steps contient une entrée vide')
  if (e.stepsEn?.some((s) => typeof s !== 'string' || !s.trim())) errors.push('stepsEn contient une entrée vide')
  return errors
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Retrouve `${field}: [...]` (tableau, mono ou multi-lignes) dans le bloc de
// la recette `id` et remplace tout son contenu par `items`, en conservant le
// style d'indentation multi-lignes déjà utilisé dans le fichier (voir
// add-water-ingredient.mjs pour la même logique de bracket-matching).
function replaceArrayField(content, id, field, items) {
  const idRegex = new RegExp(`id: ['"]${escapeRegex(id)}['"],`)
  const idMatch = content.match(idRegex)
  if (!idMatch) return { content, patched: false }

  const searchFrom = idMatch.index + idMatch[0].length
  const fieldToken = `${field}: [`
  const fieldIdx = content.indexOf(fieldToken, searchFrom)
  if (fieldIdx === -1) return { content, patched: false }

  const arrStart = fieldIdx + fieldToken.length - 1 // index of '['
  let depth = 0
  let arrEnd = -1
  for (let i = arrStart; i < content.length; i += 1) {
    if (content[i] === '[') depth += 1
    else if (content[i] === ']') {
      depth -= 1
      if (depth === 0) {
        arrEnd = i
        break
      }
    }
  }
  if (arrEnd === -1) return { content, patched: false }

  const lineStart = content.lastIndexOf('\n', arrStart) + 1
  const baseIndent = content.slice(lineStart, fieldIdx)
  const itemIndent = `${baseIndent}  `
  const newInner = `\n${items.map((s) => `${itemIndent}${quote(s)},`).join('\n')}\n${baseIndent}`
  const newArrEnd = arrStart + 1 + newInner.length

  return {
    content: content.slice(0, arrStart + 1) + newInner + content.slice(arrEnd),
    patched: true,
    baseIndent,
    newArrEnd,
  }
}

// Insère `stepsDetailed: true,` juste après le tableau `stepsEn: [...]`
// (repéré par `newArrEnd`, l'index de son `]` dans le contenu déjà patché)
// — sert à filtrer les recettes déjà traitées d'un lot à l'autre, sans
// polluer le tableau `stepsEn` lui-même (qui est affiché tel quel).
function markStepsDetailed(content, arrEnd, baseIndent) {
  // content[arrEnd] === ']', suivi de ',\n' avant le champ suivant.
  const insertPos = arrEnd + 3
  return content.slice(0, insertPos) + `${baseIndent}stepsDetailed: true,\n` + content.slice(insertPos)
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY manquante. Lancez : GEMINI_API_KEY=xxx node scripts/detail-recipe-steps.mjs')
    process.exit(1)
  }

  const { count, model } = parseArgs(process.argv.slice(2))
  const missing = RECIPES.filter((r) => !r.stepsDetailed)
  console.log(`Recettes aux étapes pas encore détaillées : ${missing.length} / ${RECIPES.length}`)

  if (missing.length === 0) {
    console.log('✅ Toutes les recettes ont des étapes détaillées.')
    return
  }

  const batch = missing.slice(0, count)
  console.log(`Détaillage de ${batch.length} recette(s) via ${model}...`)

  const prompt = buildPrompt(batch)
  const entries = await callGemini({ apiKey, model, prompt })

  const requestedIdSet = new Set(batch.map((r) => r.id))
  const dbPath = new URL('../src/data/recipesDB.js', import.meta.url)
  let content = await readFile(dbPath, 'utf-8')

  let patchedCount = 0
  const rejected = []
  for (const e of entries) {
    const errors = validateEntry(e, requestedIdSet)
    if (errors.length) {
      rejected.push({ id: e?.id, errors })
      continue
    }
    const stepsResult = replaceArrayField(content, e.id, 'steps', e.steps)
    if (!stepsResult.patched) {
      rejected.push({ id: e.id, errors: ['bloc steps introuvable'] })
      continue
    }
    content = stepsResult.content
    const stepsEnResult = replaceArrayField(content, e.id, 'stepsEn', e.stepsEn)
    if (!stepsEnResult.patched) {
      rejected.push({ id: e.id, errors: ['bloc stepsEn introuvable'] })
      continue
    }
    content = markStepsDetailed(stepsEnResult.content, stepsEnResult.newArrEnd, stepsEnResult.baseIndent)
    patchedCount += 1
  }

  await writeFile(dbPath, content, 'utf-8')

  console.log(`\n✅ ${patchedCount} recette(s) détaillée(s) et écrites dans src/data/recipesDB.js`)
  if (rejected.length) {
    console.log(`\n⚠️  ${rejected.length} rejetée(s) :`)
    rejected.forEach(({ id, errors }) => console.log(`  - ${id}: ${errors.join('; ')}`))
  }
  console.log(`\nRestant après ce lot : ${missing.length - patchedCount}`)
}

main().catch((err) => {
  console.error('Échec du détaillage :', err.message)
  process.exit(1)
})
