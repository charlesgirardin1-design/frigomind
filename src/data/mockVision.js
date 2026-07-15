// -----------------------------------------------------------------------------
// mockVision.js
// (nom de fichier conservé pour compatibilité, mais il n'y a rien de "mock"
// ici) : ce module envoie la photo à une vraie IA multimodale (Google Gemini,
// gratuite) via une fonction serverless Vercel (/api/analyze-fridge), qui
// garde la clé API secrète côté serveur. Il reconnaît un vocabulaire
// alimentaire large (œufs, fromage, lait, oignon, viande, légumes, etc.),
// pas seulement une dizaine de classes fixes.
//
// Prérequis pour que l'analyse fonctionne une fois déployé sur Vercel :
// définir la variable d'environnement GEMINI_API_KEY (clé gratuite, sans
// carte bancaire, créée sur https://aistudio.google.com/apikey) dans les
// réglages du projet Vercel (Settings → Environment Variables). Sans elle,
// l'API renvoie une liste vide et l'utilisateur peut toujours ajouter ses
// ingrédients à la main : l'app ne bloque jamais.
//
// ⚠️ En développement local (`npm run dev`), la route /api n'existe pas (elle
// n'est servie que par Vercel). C'est normal : la liste sera vide en local,
// utilisez `vercel dev` si vous voulez tester l'API en local.
// -----------------------------------------------------------------------------

let idCounter = 0
function nextId() {
  idCounter += 1
  return `ing-${idCounter}-${Date.now()}`
}

/**
 * Envoie la photo à l'API Claude Vision (via /api/analyze-fridge) et retourne
 * les ingrédients détectés. Ne bloque jamais l'utilisateur : toute erreur
 * (réseau, clé API absente, réponse invalide...) retourne une liste vide.
 * @param {string} imageDataUrl - image encodée en base64 (data URL)
 * @param {'frigo'|'placard'} [mode] - oriente l'IA vers les produits frais
 *   (frigo) ou les produits secs/longue conservation (placard, voir mode
 *   "vider le placard" sur la page d'upload)
 * @returns {Promise<{items: Array}>}
 */
export async function analyzeImage(imageDataUrl, mode = 'frigo') {
  try {
    const response = await fetch('/api/analyze-fridge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl, mode }),
    })

    if (!response.ok) {
      console.warn('FrigoMind: réponse API inattendue', response.status)
      return { items: [] }
    }

    const data = await response.json()
    const rawItems = Array.isArray(data.items) ? data.items : []

    // Gemini décrit ce qu'il voit item par item : une photo avec deux
    // courgettes renvoie souvent deux entrées "courgette" distinctes plutôt
    // qu'une seule avec une quantité. On regroupe donc ici par nom (même
    // ingrédient détecté plusieurs fois → une seule ligne + un compteur),
    // en gardant la confiance la plus haute et en fusionnant les
    // suggestions alternatives.
    const merged = new Map()
    for (const item of rawItems) {
      if (!item || typeof item.name !== 'string' || !item.name.trim()) continue
      const name = item.name.trim().toLowerCase()
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.6
      const alternatives = Array.isArray(item.alternatives) ? item.alternatives.filter(Boolean) : []

      const existing = merged.get(name)
      if (existing) {
        existing.count += 1
        existing.confidence = Math.max(existing.confidence, confidence)
        for (const alt of alternatives) {
          if (!existing.alternatives.includes(alt)) existing.alternatives.push(alt)
        }
      } else {
        merged.set(name, { name, confidence, alternatives, count: 1 })
      }
    }

    const items = [...merged.values()].map((item) => ({
      id: nextId(),
      name: item.name,
      confidence: item.confidence,
      alternatives: item.alternatives,
      checked: item.confidence >= 0.5,
      count: item.count,
    }))

    return { items }
  } catch (e) {
    // Même en cas d'erreur, on ne bloque jamais l'utilisateur : liste vide,
    // il complète à la main.
    console.warn('FrigoMind: analyse IA impossible', e)
    return { items: [] }
  }
}
