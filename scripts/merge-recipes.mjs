#!/usr/bin/env node
// Outil interne (pas documenté pour l'utilisateur final) : insère les
// recettes d'un fichier JSON généré par generate-recipes.mjs directement
// dans le tableau RECIPES de src/data/recipesDB.js, juste avant le `]` de
// fermeture, avec un formatage JS cohérent avec le reste du fichier
// (guillemets simples par défaut, doubles si la chaîne contient une
// apostrophe, pour éviter d'échapper "l'oignon", "d'huile", etc.).
import { readFile, writeFile } from 'node:fs/promises'

const [, , jsonPath] = process.argv
if (!jsonPath) {
  console.error('Usage: node scripts/merge-recipes.mjs <chemin.json>')
  process.exit(1)
}

function quote(str) {
  if (str.includes("'") && !str.includes('"')) return `"${str}"`
  return `'${str.replace(/'/g, "\\'")}'`
}

function formatArray(arr, indent) {
  if (arr.length === 0) return '[]'
  const inner = arr.map((v) => `${indent}  ${quote(v)},`).join('\n')
  return `[\n${inner}\n${indent}]`
}

function formatRecipe(r) {
  const i = '    '
  return `  {
${i}id: ${quote(r.id)},
${i}name: ${quote(r.name)},
${i}nameEn: ${quote(r.nameEn)},
${i}emoji: ${quote(r.emoji)},
${i}time: ${r.time},
${i}level: ${quote(r.level)},
${i}cuisine: ${quote(r.cuisine)},
${i}diet: ${formatArray(r.diet, i)},
${i}required: ${formatArray(r.required, i)},
${i}optional: ${formatArray(r.optional, i)},
${i}steps: ${formatArray(r.steps, i)},
${i}stepsEn: ${formatArray(r.stepsEn, i)},
  },`
}

async function main() {
  const recipes = JSON.parse(await readFile(jsonPath, 'utf-8'))
  const dbPath = new URL('../src/data/recipesDB.js', import.meta.url)
  const content = await readFile(dbPath, 'utf-8')

  const closingIndex = content.indexOf('\n]\n')
  if (closingIndex === -1) throw new Error('Fermeture du tableau RECIPES introuvable')

  const insertion = recipes.map(formatRecipe).join('\n')
  const updated = `${content.slice(0, closingIndex)}\n${insertion}${content.slice(closingIndex)}`
  await writeFile(dbPath, updated, 'utf-8')
  console.log(`✅ ${recipes.length} recette(s) insérée(s) dans src/data/recipesDB.js`)
}

main().catch((err) => {
  console.error('Échec de la fusion :', err.message)
  process.exit(1)
})
