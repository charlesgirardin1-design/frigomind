// -----------------------------------------------------------------------------
// api/analyze-fridge.js
// Fonction serverless Vercel (Node.js). Reçoit une photo en base64, appelle
// l'API Claude Vision côté serveur (la clé API ne quitte jamais le backend),
// et retourne la liste des ingrédients alimentaires détectés.
//
// Variable d'environnement requise sur Vercel : ANTHROPIC_API_KEY
// (Project Settings → Environment Variables). Sans elle, la fonction retourne
// une liste vide plutôt que de planter, pour ne jamais bloquer l'utilisateur.
// -----------------------------------------------------------------------------

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

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
  // Le modèle répond en principe du JSON pur, mais on retire par sécurité
  // d'éventuels ```json ... ``` autour, ou du texte parasite.
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Pas de clé configurée : on ne bloque jamais l'utilisateur, liste vide.
    res.status(200).json({ items: [], error: 'ANTHROPIC_API_KEY non configurée sur Vercel' })
    return
  }

  const image = parseDataUrl(req.body?.image)
  if (!image) {
    res.status(400).json({ items: [], error: 'Image invalide' })
    return
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('FrigoMind: erreur API Claude', response.status, errText)
      res.status(200).json({ items: [], error: `Erreur API Claude (${response.status})` })
      return
    }

    const data = await response.json()
    const textBlock = data.content?.find((b) => b.type === 'text')
    const parsed = textBlock ? extractJson(textBlock.text) : null

    if (!parsed || !Array.isArray(parsed.items)) {
      res.status(200).json({ items: [] })
      return
    }

    res.status(200).json({ items: parsed.items })
  } catch (e) {
    console.error('FrigoMind: analyse Claude Vision impossible', e)
    res.status(200).json({ items: [] })
  }
}
