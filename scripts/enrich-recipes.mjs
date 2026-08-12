#!/usr/bin/env node
// -----------------------------------------------------------------------------
// scripts/enrich-recipes.mjs
// Complète les recettes DÉJÀ en base qui n'ont pas encore de champ
// intro/introEn/tip/tipEn (voir generate-recipes.mjs, qui les exige pour
// toute NOUVELLE recette depuis peu) — patch recipesDB.js en place, n'ajoute
// aucune nouvelle recette. Traite un lot à la fois (limite de sortie du
// modèle) ; relancer plusieurs fois pour couvrir toute la base.
//
// Usage :
//   GEMINI_API_KEY=xxx node scripts/enrich-recipes.mjs [--count N] [--model xxx]
// -----------------------------------------------------------------------------

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RECIPES } from '../src/data/recipesDB.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_MODEL = 'gemini-flash-lite-latest'
const DEFAULT_COUNT = 40

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

function buildPrompt(batch) {
  const items = batch.map((r) => ({ id: r.id, name: r.name, required: r.required, optional: r.optional, steps: r.steps }))
  return `Tu es un cuisinier qui rédige des fiches recettes pour une app française (FrigoMind). Voici une
liste de recettes déjà existantes (nom, ingrédients, étapes de préparation). Pour CHACUNE, écris une
intro et une astuce, au format décrit plus bas.

TON D'ÉCRITURE — le plus important : écris comme un vrai cuisinier qui explique sa recette à un ami,
PAS comme une notice technique générée par une IA. Varie la structure des phrases d'une recette à
l'autre du lot (n'utilise pas systématiquement le même gabarit de phrase), reste concret et court, pas
de blabla ni de formulations passe-partout.

Pour chaque recette :
- "intro" : UNE phrase d'accroche chaleureuse et spécifique à CETTE recette précise (pas un résumé
  technique, pas une phrase qui irait pour n'importe quel plat), en français. Base-toi sur ses
  ingrédients/étapes réels.
- "introEn" : traduction fidèle de "intro" en anglais, même ton.
- "tip" : UNE astuce de cuisinier concrète et spécifique à CETTE recette (variante possible, geste
  technique qui change le résultat, astuce de conservation ou d'accompagnement) — jamais une astuce
  générique qui irait pour n'importe quel plat.
- "tipEn" : traduction fidèle de "tip" en anglais, même ton.

Recettes à traiter (utilise "id" tel quel pour identifier chaque réponse) :
${JSON.stringify(items)}

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format
exact, une entrée par recette ci-dessus, dans le même ordre :
{"enrichments": [
  {"id": "id-exact-de-la-recette", "intro": "...", "introEn": "...", "tip": "...", "tipEn": "..."}
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
  if (!parsed || !Array.isArray(parsed.enrichments)) {
    throw new Error('Réponse Gemini invalide : JSON attendu au format {"enrichments": [...]}')
  }
  return parsed.enrichments
}

function validateEnrichment(e, requestedIdSet) {
  const errors = []
  if (!e || typeof e !== 'object') return ['objet invalide']
  if (!requestedIdSet.has(e.id)) errors.push(`id "${e.id}" ne correspond à aucune recette demandée`)
  if (!e.intro?.trim()) errors.push('intro manquante')
  if (!e.introEn?.trim()) errors.push('introEn manquante')
  if (!e.tip?.trim()) errors.push('tip manquante')
  if (!e.tipEn?.trim()) errors.push('tipEn manquante')
  return errors
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Insère intro/introEn/tip/tipEn juste après la ligne `nameEn: ...,` du bloc
// de la recette `id` — repère le bloc via `id: 'xxx',` (guillemets simples
// OU doubles selon quote()), pas d'hypothèse sur le style de citation.
function patchRecipe(content, enrichment) {
  const idRegex = new RegExp(`(id: ['"]${escapeRegex(enrichment.id)}['"],\\n\\s*name: .*,\\n\\s*nameEn: .*,\\n)`)
  const match = content.match(idRegex)
  if (!match) return { content, patched: false }

  const blockStart = match.index + match[0].length
  // Garde-fou : ne jamais dupliquer si la recette a déjà une intro (ne
  // devrait pas arriver puisqu'on ne sélectionne que des recettes sans
  // intro en amont, mais on vérifie quand même avant d'écrire).
  if (content.slice(blockStart, blockStart + 20).trimStart().startsWith('intro:')) {
    return { content, patched: false }
  }

  const insertion = `    intro: ${quote(enrichment.intro)},
    introEn: ${quote(enrichment.introEn)},
    tip: ${quote(enrichment.tip)},
    tipEn: ${quote(enrichment.tipEn)},
`
  return {
    content: content.slice(0, blockStart) + insertion + content.slice(blockStart),
    patched: true,
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY manquante. Lancez : GEMINI_API_KEY=xxx node scripts/enrich-recipes.mjs')
    process.exit(1)
  }

  const { count, model } = parseArgs(process.argv.slice(2))
  const missing = RECIPES.filter((r) => !r.intro)
  console.log(`Recettes sans intro/tip : ${missing.length} / ${RECIPES.length}`)

  if (missing.length === 0) {
    console.log('✅ Toutes les recettes ont déjà une intro et une astuce.')
    return
  }

  const batch = missing.slice(0, count)
  console.log(`Enrichissement de ${batch.length} recette(s) via ${model}...`)

  const prompt = buildPrompt(batch)
  const enrichments = await callGemini({ apiKey, model, prompt })

  const requestedIdSet = new Set(batch.map((r) => r.id))
  const dbPath = new URL('../src/data/recipesDB.js', import.meta.url)
  let content = await readFile(dbPath, 'utf-8')

  let patchedCount = 0
  const rejected = []
  for (const e of enrichments) {
    const errors = validateEnrichment(e, requestedIdSet)
    if (errors.length) {
      rejected.push({ id: e?.id, errors })
      continue
    }
    const result = patchRecipe(content, e)
    if (!result.patched) {
      rejected.push({ id: e.id, errors: ['bloc recette introuvable dans recipesDB.js (id non trouvé, ou déjà enrichie)'] })
      continue
    }
    content = result.content
    patchedCount += 1
  }

  await writeFile(dbPath, content, 'utf-8')

  console.log(`\n✅ ${patchedCount} recette(s) enrichie(s) et écrites dans src/data/recipesDB.js`)
  if (rejected.length) {
    console.log(`\n⚠️  ${rejected.length} rejetée(s) :`)
    rejected.forEach(({ id, errors }) => console.log(`  - ${id}: ${errors.join('; ')}`))
  }
  console.log(`\nRestant après ce lot : ${missing.length - patchedCount}`)
}

main().catch((err) => {
  console.error('Échec de l\'enrichissement :', err.message)
  process.exit(1)
})
