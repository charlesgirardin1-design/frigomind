#!/usr/bin/env node
// -----------------------------------------------------------------------------
// scripts/add-water-ingredient.mjs
// De nombreuses recettes utilisent de l'eau dans leurs étapes ("couvrir
// d'eau", "cuire dans l'eau bouillante"...) sans jamais la lister comme
// ingrédient — la quantité n'était donc jamais précisée. Ce script détecte
// ces recettes via les étapes (texte, pas de champ dédié) et ajoute 'eau' à
// leur liste `optional` quand elle n'y est pas déjà, pour qu'elle apparaisse
// avec sa quantité de référence (voir ingredientQuantities.js) sur la fiche.
// Patch recipesDB.js en place, aucune recette ajoutée/supprimée.
//
// Usage : node scripts/add-water-ingredient.mjs [--dry-run]
// -----------------------------------------------------------------------------

import { readFile, writeFile } from 'node:fs/promises'
import { RECIPES } from '../src/data/recipesDB.js'

const EXCLUDE_PATTERN = /excès d'eau|retirer l'eau|essorer|eau de cuisson/i
const INCLUDE_PATTERN = /couvrir[^.]*eau|ajout[^.]*eau|verser[^.]*eau|eau bouillante|eau chaude|eau froide|eau salée|fond d'eau|couvre[^.]*eau/i

function needsWater(recipe) {
  if (recipe.required?.includes('eau') || recipe.optional?.includes('eau')) return false
  const sentences = (recipe.steps || []).join(' | ').split(/\. |\.\n|\||\.$/)
  return sentences.some((s) => INCLUDE_PATTERN.test(s) && !EXCLUDE_PATTERN.test(s))
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Insère 'eau' dans le tableau `optional: [...]` du bloc de la recette `id`
// (retrouvé via `id: 'xxx',`), en gérant aussi bien la forme mono-ligne
// (`optional: ['a', 'b'],`) que multi-lignes (un élément par ligne).
function patchRecipe(content, id) {
  const idRegex = new RegExp(`id: ['"]${escapeRegex(id)}['"],`)
  const idMatch = content.match(idRegex)
  if (!idMatch) return { content, patched: false }

  const searchFrom = idMatch.index + idMatch[0].length
  const optionalIdx = content.indexOf('optional: [', searchFrom)
  if (optionalIdx === -1) return { content, patched: false }

  const arrStart = optionalIdx + 'optional: ['.length - 1 // index of '['
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

  const inner = content.slice(arrStart + 1, arrEnd)

  if (inner.trim() === '') {
    const newContent = content.slice(0, arrStart + 1) + "'eau'" + content.slice(arrEnd)
    return { content: newContent, patched: true }
  }

  if (inner.includes('\n')) {
    const lineStart = content.lastIndexOf('\n', arrEnd) + 1
    const closingIndent = content.slice(lineStart, arrEnd)
    const itemIndent = closingIndent + '  '
    const insertion = `${itemIndent}'eau',\n`
    const newContent = content.slice(0, lineStart) + insertion + content.slice(lineStart)
    return { content: newContent, patched: true }
  }

  const newContent = content.slice(0, arrEnd) + ", 'eau'" + content.slice(arrEnd)
  return { content: newContent, patched: true }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const targets = RECIPES.filter(needsWater)
  console.log(`${targets.length} recette(s) utilisent de l'eau sans la lister comme ingrédient.`)

  if (dryRun) {
    targets.slice(0, 20).forEach((r) => console.log(`  - ${r.id}`))
    if (targets.length > 20) console.log(`  … et ${targets.length - 20} autres`)
    return
  }

  const dbPath = new URL('../src/data/recipesDB.js', import.meta.url)
  let content = await readFile(dbPath, 'utf-8')

  let patchedCount = 0
  const failed = []
  for (const r of targets) {
    const result = patchRecipe(content, r.id)
    if (!result.patched) {
      failed.push(r.id)
      continue
    }
    content = result.content
    patchedCount += 1
  }

  await writeFile(dbPath, content, 'utf-8')

  console.log(`\n✅ ${patchedCount} recette(s) patchée(s).`)
  if (failed.length) {
    console.log(`\n⚠️  ${failed.length} échec(s) (bloc introuvable) :`)
    failed.forEach((id) => console.log(`  - ${id}`))
  }
}

main().catch((err) => {
  console.error('Échec :', err.message)
  process.exit(1)
})
