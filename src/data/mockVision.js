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
 * @returns {Promise<{items: Array}>}
 */
export async function analyzeImage(imageDataUrl) {
  try {
    const response = await fetch('/api/analyze-fridge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl }),
    })

    if (!response.ok) {
      console.warn('FrigoMind: réponse API inattendue', response.status)
      return { items: [] }
    }

    const data = await response.json()
    const rawItems = Array.isArray(data.items) ? data.items : []

    const items = rawItems
      .filter((item) => item && typeof item.name === 'string' && item.name.trim())
      .map((item) => {
        const confidence = typeof item.confidence === 'number' ? item.confidence : 0.6
        return {
          id: nextId(),
          name: item.name.trim().toLowerCase(),
          confidence,
          alternatives: Array.isArray(item.alternatives) ? item.alternatives.filter(Boolean) : [],
          checked: confidence >= 0.5,
        }
      })

    return { items }
  } catch (e) {
    // Même en cas d'erreur, on ne bloque jamais l'utilisateur : liste vide,
    // il complète à la main.
    console.warn('FrigoMind: analyse IA impossible', e)
    return { items: [] }
  }
}
