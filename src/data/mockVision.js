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

    // Gemini est invité à compter lui-même les unités visibles de chaque
    // ingrédient (voir le prompt dans api/analyze-fridge.js) et à renvoyer un
    // seul objet par ingrédient avec ce compte dans "count" — la consigne est
    // explicite : "un seul objet JSON par ingrédient... ne répète jamais le
    // même ingrédient dans plusieurs objets pour représenter plusieurs
    // unités". Si le modèle répète quand même le même ingrédient (photo
    // chargée, plusieurs zones distinctes), CHAQUE objet dupliqué porte donc
    // déjà sa propre tentative de compte TOTAL — pas un compte partiel à
    // additionner aux autres. Additionner (ancien comportement) pouvait
    // gonfler artificiellement le total au-delà de ce qui est réellement
    // visible (ex: "tomate" compté deux fois à 5 et 7 -> 12 au lieu de 7) :
    // on retient donc la plus grande estimation plutôt que leur somme, en
    // gardant la confiance la plus haute et en fusionnant les alternatives.
    const merged = new Map()
    for (const item of rawItems) {
      if (!item || typeof item.name !== 'string' || !item.name.trim()) continue
      const name = item.name.trim().toLowerCase()
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.6
      const alternatives = Array.isArray(item.alternatives) ? item.alternatives.filter(Boolean) : []
      const count = Number.isInteger(item.count) && item.count > 0 ? item.count : 1
      // Poids/volume (en grammes, ml compris) lu sur un emballage —
      // uniquement quand le prompt a pu le lire noir sur blanc (voir
      // api/analyze-fridge.js), jamais une estimation visuelle. `null`/absent
      // si non lisible : reste alors "quantité inconnue", jamais 0 (0
      // signifierait à tort "aucun", alors qu'on ne sait juste pas combien).
      const weightGrams = Number.isFinite(item.weightGrams) && item.weightGrams > 0 ? item.weightGrams : null

      const existing = merged.get(name)
      if (existing) {
        existing.count = Math.max(existing.count, count)
        existing.confidence = Math.max(existing.confidence, confidence)
        if (weightGrams !== null) {
          existing.weightGrams = existing.weightGrams === null ? weightGrams : existing.weightGrams + weightGrams
        }
        for (const alt of alternatives) {
          if (!existing.alternatives.includes(alt)) existing.alternatives.push(alt)
        }
      } else {
        merged.set(name, { name, confidence, alternatives, count, weightGrams })
      }
    }

    const items = [...merged.values()].map((item) => ({
      id: nextId(),
      name: item.name,
      confidence: item.confidence,
      alternatives: item.alternatives,
      checked: item.confidence >= 0.5,
      count: item.count,
      weightGrams: item.weightGrams,
    }))

    return { items }
  } catch (e) {
    // Même en cas d'erreur, on ne bloque jamais l'utilisateur : liste vide,
    // il complète à la main.
    console.warn('FrigoMind: analyse IA impossible', e)
    return { items: [] }
  }
}
