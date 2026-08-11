// -----------------------------------------------------------------------------
// api/normalize-product.js
// Fonction serverless Vercel (Node.js). Reçoit le nom brut d'un produit
// scanné via code-barres (souvent une marque + un nom de gamme + un poids,
// ex: "Barilla Trofie Collezione 500g") et demande à Gemini (texte, pas
// d'image ici) de le traduire en un nom d'ingrédient culinaire générique en
// français ("pâtes"). Sert de filet de secours quand les métadonnées Open
// Food Facts (generic_name, categories_tags) sont absentes ou incomplètes —
// ce qui arrive souvent pour des produits moins connus — et qu'une simple
// liste de mots-clés locale (voir categorizeIngredient dans
// src/data/dishPatterns.js) ne peut pas reconnaître le produit. Sans ça, le
// nom de marque brut finissait tel quel dans une recette, et l'ingrédient
// non catégorisé pouvait être injecté dans n'importe quel type de plat.
//
// Variables d'environnement : les mêmes que api/analyze-fridge.js
// (GEMINI_API_KEY, GEMINI_MODEL optionnel).
//
// Sans clé configurée, ou en cas d'erreur, la fonction renvoie
// { ingredient: null } plutôt que de planter : l'appelant retombe alors sur
// son nom déjà calculé localement, l'utilisateur n'est jamais bloqué.
// -----------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-2.5-flash'
const FETCH_TIMEOUT_MS = 7000

function buildPrompt({ name, brands, categoriesTags }) {
  const hints = []
  if (brands) hints.push(`Marque(s) connue(s) : ${brands}`)
  if (categoriesTags?.length) hints.push(`Tags de catégorie Open Food Facts : ${categoriesTags.join(', ')}`)

  return `Voici le nom d'un produit alimentaire scanné via son code-barres : "${name}"
${hints.join('\n')}

Donne-moi le nom générique de l'ingrédient culinaire correspondant, en français, au singulier, en
minuscules, SANS marque ni nom de gamme ni quantité/poids. Quelques exemples :
- "Barilla Trofie Collezione 500g" -> "pâtes"
- "Nutella 400g" -> "pâte à tartiner au chocolat"
- "Yaourt nature Danone x4" -> "yaourt"
- "Lindt Excellence 70% Cacao" -> "chocolat noir"

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format
exact : {"ingredient": "nom générique"}. Si tu ne peux vraiment pas déterminer d'ingrédient alimentaire
plausible, réponds {"ingredient": null}.`
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

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt({ name, brands, categoriesTags }) }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 200 },
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
