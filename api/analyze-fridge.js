// -----------------------------------------------------------------------------
// api/analyze-fridge.js
// Fonction serverless Vercel (Node.js). Reçoit une photo en base64, appelle
// l'API Google Gemini (multimodale, vraie option gratuite sans carte bancaire)
// côté serveur, et retourne la liste des ingrédients alimentaires détectés.
//
// Variables d'environnement (Project Settings → Environment Variables) :
//  - GEMINI_API_KEY (obligatoire) : clé créée gratuitement sur
//    https://aistudio.google.com/apikey (aucune carte bancaire requise pour
//    le palier gratuit).
//  - GEMINI_MODEL (optionnel) : identifiant du modèle à utiliser. Par défaut
//    "gemini-2.5-flash". Si Google renomme ses modèles, changez juste cette
//    variable, aucun redéploiement de code n'est nécessaire.
//
// Sans clé configurée, la fonction retourne une liste vide plutôt que de
// planter : l'utilisateur peut toujours ajouter ses ingrédients à la main.
// -----------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-2.5-flash'

const PROMPT = `Voici une photo d'un frigo, d'un placard ou d'une table avec des aliments.
Identifie tous les ingrédients alimentaires réellement visibles sur cette image.

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format exact :
{"items": [{"name": "nom en français, singulier, minuscule", "confidence": 0.0 à 1.0, "alternatives": ["autre nom possible", "..."]}]}

Règles :
- "alternatives" ne doit contenir des valeurs que si l'ingrédient est ambigu (ex : peut être du lait ou de la crème fraîche). Sinon tableau vide.
- Ignore la vaisselle, les contenants, les meubles (frigo, placard, table, assiette...) : uniquement des aliments/ingrédients.
- Si aucun aliment n'est identifiable, réponds {"items": []}.`

function parseDataUrl(dataUrl) {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl || '')
  if (!match) return null
  return { mediaType: match[1], base64: match[2] }
}

function extractJson(text) {
  // Avec responseMimeType "application/json", Gemini répond normalement en
  // JSON pur, mais on nettoie par sécurité d'éventuels artefacts de texte.
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
    res.status(405).json({ items: [], error: 'Méthode non autorisée' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Pas de clé configurée : on ne bloque jamais l'utilisateur, liste vide.
    res.status(200).json({ items: [], error: 'GEMINI_API_KEY non configurée sur Vercel' })
    return
  }

  const image = parseDataUrl(req.body?.image)
  if (!image) {
    res.status(400).json({ items: [], error: 'Image invalide' })
    return
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: image.mediaType, data: image.base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('FrigoMind: erreur API Gemini', response.status, errText)
      res.status(200).json({ items: [], error: `Erreur API Gemini (${response.status})` })
      return
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = text ? extractJson(text) : null

    if (!parsed || !Array.isArray(parsed.items)) {
      res.status(200).json({ items: [] })
      return
    }

    res.status(200).json({ items: parsed.items })
  } catch (e) {
    console.error('FrigoMind: analyse Gemini impossible', e)
    res.status(200).json({ items: [] })
  }
}
