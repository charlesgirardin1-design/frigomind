// -----------------------------------------------------------------------------
// api/normalize-product.js
// Fonction serverless Vercel (Node.js). Reçoit le nom brut d'un produit
// scanné via code-barres (souvent une marque + un nom de gamme + un poids,
// ex: "Barilla Trofie Collezione 500g") et demande à Gemini de le traduire
// en un nom d'ingrédient culinaire générique en français ("pâtes"). Sert de
// filet de secours quand les métadonnées Open Food Facts (generic_name,
// categories_tags) sont absentes ou incomplètes — ce qui arrive souvent pour
// des produits moins connus — et qu'une simple liste de mots-clés locale
// (voir categorizeIngredient dans src/data/dishPatterns.js) ne peut pas
// reconnaître le produit. Sans ça, le nom de marque brut finissait tel quel
// dans une recette, et l'ingrédient non catégorisé pouvait être injecté dans
// n'importe quel type de plat.
//
// Si l'appelant fournit aussi une URL de photo produit (`imageUrl`, en
// général image_front_url/image_url d'Open Food Facts), l'appel Gemini
// devient multimodal (texte + image), comme dans api/analyze-fridge.js :
// utile quand le nom seul est trop vague pour trancher un détail visible
// sur l'emballage (ex : "Pâtes alimentaires aux oeufs" ne dit pas si ce sont
// des spaghetti, des tagliatelles ou des lasagnes).
//
// Variables d'environnement : les mêmes que api/analyze-fridge.js
// (GEMINI_API_KEY, GEMINI_MODEL optionnel).
//
// Sans clé configurée, ou en cas d'erreur (y compris un échec de
// récupération de l'image, qui ne fait alors que retomber sur le mode
// texte seul), la fonction renvoie { ingredient: null } plutôt que de
// planter : l'appelant retombe alors sur son nom déjà calculé localement,
// l'utilisateur n'est jamais bloqué.
// -----------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-2.5-flash'
const FETCH_TIMEOUT_MS = 7000
const IMAGE_FETCH_TIMEOUT_MS = 3500
const DEFAULT_IMAGE_MIME_TYPE = 'image/jpeg'

function buildPrompt({ name, brands, categoriesTags, hasImage }) {
  const hints = []
  if (brands) hints.push(`Marque(s) connue(s) : ${brands}`)
  if (categoriesTags?.length) hints.push(`Tags de catégorie Open Food Facts : ${categoriesTags.join(', ')}`)

  const imageInstructions = hasImage
    ? `\nUne photo de l'emballage du produit est jointe. Regarde-la attentivement pour repérer des détails
que le nom seul ne donne pas, en particulier (mais pas seulement) la forme exacte des pâtes si c'est un
produit à base de pâtes : spaghetti, penne, fusilli, tagliatelles, feuilles de lasagne, macaroni, gnocchi,
raviolis, coquillettes, etc. Utilise l'image comme information principale, et le nom/la marque/les tags
ci-dessus comme contexte complémentaire.\n`
    : ''

  return `Voici le nom d'un produit alimentaire scanné via son code-barres : "${name}"
${hints.join('\n')}
${imageInstructions}
Donne-moi le nom générique de l'ingrédient culinaire correspondant, en français, au singulier, en
minuscules, SANS marque ni nom de gamme ni quantité/poids. Quelques exemples :
- "Barilla Trofie Collezione 500g" -> "pâtes"
- "Nutella 400g" -> "pâte à tartiner au chocolat"
- "Yaourt nature Danone x4" -> "yaourt"
- "Lindt Excellence 70% Cacao" -> "chocolat noir"
${hasImage ? '- "Pâtes alimentaires aux oeufs" avec une photo montrant des spaghetti -> "spaghetti"\n' : ''}
Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format
exact : {"ingredient": "nom générique"}. Si tu ne peux vraiment pas déterminer d'ingrédient alimentaire
plausible, réponds {"ingredient": null}.`
}

// Récupère l'image produit et la convertit en base64 pour l'envoyer à Gemini
// en `inline_data`. Timeout court dédié : un serveur d'images lent ne doit
// pas manger tout le budget d'exécution avant même l'appel Gemini. En cas
// d'échec (réseau, timeout, statut non-200, type de contenu invalide), on
// retourne simplement null : l'appelant retombe alors sur le mode texte seul.
async function fetchImageAsBase64(imageUrl) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(imageUrl, { signal: controller.signal })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''
    const mimeType = contentType.startsWith('image/') ? contentType.split(';')[0].trim() : DEFAULT_IMAGE_MIME_TYPE

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { mimeType, base64 }
  } catch (e) {
    console.error('FrigoMind: récupération image produit impossible, repli sur texte seul', e)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch (e) {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ingredient: null, error: 'Méthode non autorisée' })
    return
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ ingredient: null, error: 'Nom de produit manquant' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(200).json({ ingredient: null })
    return
  }

  const brands = typeof req.body?.brands === 'string' ? req.body.brands.trim() : ''
  const categoriesTags = Array.isArray(req.body?.categoriesTags) ? req.body.categoriesTags.filter(Boolean) : []
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : ''

  // Récupération best-effort de la photo produit : un échec ici ne bloque
  // jamais la suite, on continue simplement sans image.
  const image = imageUrl ? await fetchImageAsBase64(imageUrl) : null

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const parts = [{ text: buildPrompt({ name, brands, categoriesTags, hasImage: !!image }) }]
    if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } })

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts }],
        // Pas de maxOutputTokens : gemini-2.5-flash consomme une partie du
        // budget de sortie pour son raisonnement interne avant d'émettre le
        // JSON final (particulièrement avec une image jointe) — une limite
        // trop serrée risque de tronquer la réponse avant le JSON utile,
        // faisant silencieusement échouer extractJson (voir
        // api/analyze-fridge.js, qui ne fixe aucune limite pour la même
        // raison).
        generationConfig: { responseMimeType: 'application/json' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('FrigoMind: erreur API Gemini (normalize-product)', response.status, errText)
      res.status(200).json({ ingredient: null })
      return
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = text ? extractJson(text) : null
    const ingredient = typeof parsed?.ingredient === 'string' ? parsed.ingredient.trim().toLowerCase() : null

    res.status(200).json({ ingredient: ingredient || null })
  } catch (e) {
    console.error('FrigoMind: normalisation Gemini impossible', e)
    res.status(200).json({ ingredient: null })
  } finally {
    clearTimeout(timeout)
  }
}
