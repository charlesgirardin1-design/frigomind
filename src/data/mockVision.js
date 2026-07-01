// -----------------------------------------------------------------------------
// mockVision.js
// Simule un modèle de vision par ordinateur (type Claude Vision) qui analyse
// une photo de frigo/table et retourne les aliments probablement visibles.
//
// 🔌 INTÉGRATION FUTURE AVEC UNE VRAIE API (Claude Vision) :
// Remplacer le corps de `analyzeImage()` par un appel réseau vers un backend
// qui appelle l'API Claude avec l'image en base64, par ex. :
//
//   const response = await fetch('/api/analyze-fridge', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ image: imageDataUrl }),
//   })
//   const data = await response.json()
//   // data attendu au même format que ci-dessous : { items, alternatives }
//
// Le prompt côté serveur pourrait ressembler à :
//   "Voici une photo d'un frigo ou d'une table. Liste les aliments visibles
//    au format JSON: [{name, confidence}]. Si un aliment est ambigu, propose
//    des alternatives possibles."
//
// ⚠️ Ne JAMAIS appeler une clé API Claude directement depuis le navigateur :
// toujours passer par un backend qui garde la clé secrète.
// -----------------------------------------------------------------------------

// Quelques scénarios de détection réalistes, avec un peu d'incertitude
// volontaire (confidence < 0.6) pour illustrer le comportement "jamais bloqué
// par une mauvaise détection" : on propose alors des alternatives.
const SCENARIOS = [
  {
    items: [
      { name: 'œufs', confidence: 0.95 },
      { name: 'tomates', confidence: 0.9 },
      { name: 'fromage', confidence: 0.82 },
      { name: 'lait', confidence: 0.55, alternatives: ['crème fraîche', 'yaourt'] },
      { name: 'oignon', confidence: 0.7 },
    ],
  },
  {
    items: [
      { name: 'poulet', confidence: 0.88 },
      { name: 'riz', confidence: 0.8 },
      { name: 'poivron', confidence: 0.6 },
      { name: 'carotte', confidence: 0.75 },
      { name: 'ail', confidence: 0.5, alternatives: ['échalote', 'oignon'] },
    ],
  },
  {
    items: [
      { name: 'pâtes', confidence: 0.92 },
      { name: 'tomates', confidence: 0.85 },
      { name: 'parmesan', confidence: 0.58, alternatives: ['fromage râpé', 'comté'] },
      { name: 'basilic', confidence: 0.65 },
      { name: 'ail', confidence: 0.7 },
    ],
  },
  {
    items: [
      { name: 'pain', confidence: 0.9 },
      { name: 'jambon', confidence: 0.83 },
      { name: 'fromage', confidence: 0.78 },
      { name: 'beurre', confidence: 0.6 },
      { name: 'salade', confidence: 0.52, alternatives: ['épinards', 'roquette'] },
    ],
  },
  {
    items: [
      { name: 'yaourt', confidence: 0.87 },
      { name: 'banane', confidence: 0.8 },
      { name: 'miel', confidence: 0.55, alternatives: ['confiture', 'sucre'] },
      { name: 'flocons d\'avoine', confidence: 0.6 },
    ],
  },
  {
    items: [
      { name: 'thon en boîte', confidence: 0.75 },
      { name: 'pois chiches', confidence: 0.7 },
      { name: 'tomates', confidence: 0.82 },
      { name: 'oignon rouge', confidence: 0.58, alternatives: ['oignon', 'échalote'] },
      { name: 'citron', confidence: 0.65 },
    ],
  },
  {
    items: [
      { name: 'champignons', confidence: 0.79 },
      { name: 'crème fraîche', confidence: 0.6 },
      { name: 'poulet', confidence: 0.7 },
      { name: 'échalote', confidence: 0.5, alternatives: ['oignon', 'ail'] },
    ],
  },
  {
    items: [
      { name: 'pommes de terre', confidence: 0.9 },
      { name: 'lardons', confidence: 0.65, alternatives: ['jambon', 'bacon'] },
      { name: 'fromage', confidence: 0.8 },
      { name: 'oignon', confidence: 0.72 },
    ],
  },
  {
    items: [
      { name: 'courgette', confidence: 0.82 },
      { name: 'œufs', confidence: 0.88 },
      { name: 'fromage', confidence: 0.7 },
      { name: 'menthe', confidence: 0.48, alternatives: ['basilic', 'persil'] },
    ],
  },
  {
    items: [
      { name: 'épinards', confidence: 0.76 },
      { name: 'fromage blanc', confidence: 0.6 },
      { name: 'œufs', confidence: 0.85 },
      { name: 'noix', confidence: 0.5, alternatives: ['graines', 'amandes'] },
    ],
  },
]

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `ing-${idCounter}-${Date.now()}`
}

/**
 * Simule l'analyse IA d'une photo. Retourne toujours un résultat exploitable
 * (jamais un blocage total), avec des scores de confiance et des alternatives
 * pour les items incertains.
 * @param {string} imageDataUrl - image encodée en base64 (non utilisée par le mock, juste pour coller à la vraie API)
 * @returns {Promise<{items: Array}>}
 */
export async function analyzeImage(imageDataUrl) {
  await delay(1100 + Math.random() * 500) // simule le temps de traitement IA

  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]

  const items = scenario.items.map((item) => ({
    id: nextId(),
    name: item.name,
    confidence: item.confidence,
    alternatives: item.alternatives || [],
    checked: item.confidence >= 0.5, // pré-coché par défaut si probable
  }))

  return { items }
}
