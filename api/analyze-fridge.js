// -----------------------------------------------------------------------------
// api/analyze-fridge.js
// Fonction serverless Vercel (Node.js). Reçoit une photo en base64, appelle
// une IA multimodale côté serveur, et retourne la liste des ingrédients
// alimentaires détectés.
//
// Deux fournisseurs possibles, choisis automatiquement selon les clés
// présentes (Claude prioritaire si les deux sont configurées — meilleur
// suivi des consignes de rigueur du prompt ci-dessous) :
//
//  - ANTHROPIC_API_KEY (optionnel) : clé Claude créée sur
//    https://console.anthropic.com — payante à l'usage (pas de palier
//    gratuit), mais coût très faible pour une image (quelques milliers de
//    tokens par scan).
//  - ANTHROPIC_MODEL (optionnel) : par défaut "claude-sonnet-5".
//  - GEMINI_API_KEY (optionnel si ANTHROPIC_API_KEY est configurée, sinon
//    obligatoire) : clé Google Gemini créée gratuitement sur
//    https://aistudio.google.com/apikey (aucune carte bancaire requise pour
//    le palier gratuit) — l'option par défaut de l'app.
//  - GEMINI_MODEL (optionnel) : par défaut "gemini-2.5-flash". Si Google
//    renomme ses modèles, changez juste cette variable, aucun redéploiement
//    de code n'est nécessaire.
//
// Sans aucune clé configurée, la fonction retourne une liste vide plutôt que
// de planter : l'utilisateur peut toujours ajouter ses ingrédients à la main.
// -----------------------------------------------------------------------------

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5'

const JSON_FORMAT_RULES = `Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après, aucun bloc markdown), au format exact :
{"items": [{"name": "nom en français, singulier, minuscule", "confidence": 0.0 à 1.0, "alternatives": ["autre nom possible", "..."], "count": nombre d'unités visibles, "weightGrams": nombre ou null}]}

Méthode d'analyse (à suivre dans l'ordre, avant de répondre) :
1. Balaie l'image méthodiquement zone par zone (premier plan, arrière-plan, coins, étagères du haut comme du bas) plutôt que de te concentrer sur le premier objet remarqué. Un groupe d'objets identiques et visuellement dominant (ex : un filet de pommes de terre au premier plan) ne doit jamais te détourner des autres ingrédients différents présents ailleurs sur la photo, même petits, partiellement masqués ou en arrière-plan : liste-les tous.
2. Pour chaque ingrédient repéré, vérifie qu'il est RÉELLEMENT visible sur CETTE photo précise. N'ajoute jamais un ingrédient parce qu'il accompagne "typiquement" celui que tu viens de repérer (ex : ne pas ajouter "oignon" juste parce qu'il y a des pommes de terre) : chaque ingrédient listé doit correspondre à quelque chose que tu identifies distinctement sur l'image, jamais une supposition.
3. Une fois ta liste établie, relis-la une seconde fois en comparant à l'image : confirme que chaque ingrédient listé y est bien visible (retire ceux dont tu n'es plus sûr) et vérifie qu'aucun ingrédient différent visible sur la photo n'a été oublié.

Règles :
- "alternatives" ne doit contenir des valeurs que si l'ingrédient est ambigu (ex : peut être du lait ou de la crème fraîche). Sinon tableau vide.
- "count" : compte un par un, lentement, chaque unité individuelle de cet ingrédient réellement visible sur la photo (ex : 3 pommes de terre, 2 poivrons rouges) — y compris celles partiellement cachées ou coupées par le bord du cadre si elles sont identifiables sans ambiguïté, mais SANS deviner ni arrondir : ne compte que ce qui est effectivement visible, jamais une estimation approximative. Recompte une seconde fois avant de répondre pour vérifier ce chiffre — un groupe nombreux (ex : un tas ou un filet de pommes de terre) demande une attention particulière : compte chaque unité individuellement plutôt que d'estimer le tas globalement. Un seul objet JSON par ingrédient, avec ce compte total dedans — ne répète jamais le même ingrédient dans plusieurs objets pour représenter plusieurs unités. Pour un ingrédient qui ne se compte pas en unités distinctes (lait, farine, huile, riz en vrac...), utilise "count": 1.
- "weightGrams" : UNIQUEMENT si un poids ou un volume est clairement IMPRIMÉ et LISIBLE sur un emballage (ex : "500 g" sur un paquet de viande hachée, "1 L" sur une brique de lait, "250 g" sur un paquet de riz) — recopie alors ce nombre converti en grammes (1 L = 1000, 1 kg = 1000). Si plusieurs emballages identiques sont visibles, additionne leurs poids. Ne DEVINE JAMAIS un poids en estimant à l'œil la taille d'un tas, d'un morceau ou d'un objet sans étiquette lisible : dans ce cas, réponds null (ne jamais inventer une estimation approximative, mieux vaut ne rien dire que dire un chiffre faux).
- Ignore la vaisselle, les contenants, les meubles (frigo, placard, table, assiette...) : uniquement des aliments/ingrédients.
- Si aucun aliment n'est identifiable, réponds {"items": []}.`

const FRIGO_PROMPT = `Voici une photo d'un frigo, d'un placard ou d'une table avec des aliments.
Identifie tous les ingrédients alimentaires réellement visibles sur cette image.

${JSON_FORMAT_RULES}`

const PLACARD_PROMPT = `Voici une photo d'un placard, d'une étagère ou d'un garde-manger.
Identifie tous les ingrédients alimentaires SECS et de LONGUE CONSERVATION réellement visibles sur cette
image : pâtes, riz, légumineuses (lentilles, pois chiches...), conserves (thon, tomates, maïs...), épices,
farine, sucre, huile, céréales, etc. Inclus aussi les légumes qui se conservent naturellement hors du frigo
et se rangent couramment dans un placard ou un cellier (pommes de terre, oignons, échalotes, ail, courges,
potimarron...) s'ils sont visibles, même si ce sont des produits frais au sens strict. Ignore uniquement les
produits frais qui n'ont clairement rien à faire dans un placard (produits laitiers, viande, poisson...).

${JSON_FORMAT_RULES}`

const BOTH_PROMPT = `Voici une photo qui peut contenir à la fois des produits frais (frigo) et des produits secs
de longue conservation (placard) : pâtes, riz, légumineuses, conserves, épices, farine, sucre, huile,
céréales, mais aussi légumes, fruits, laitages, viandes, etc.
Identifie tous les ingrédients alimentaires réellement visibles sur cette image, frais comme secs, sans
te limiter à une seule de ces deux catégories.

${JSON_FORMAT_RULES}`

function buildPrompt(mode) {
  if (mode === 'placard') return PLACARD_PROMPT
  if (mode === 'both') return BOTH_PROMPT
  return FRIGO_PROMPT
}

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Les deux fournisseurs répondent parfois 429 "quota"/"rate limit" ou
// 503/529 "surchargé" — des erreurs explicitement transitoires côté
// fournisseur. Sans retentative, une seule surcharge passagère faisait
// échouer toute l'analyse et affichait "aucun ingrédient détecté" à
// l'utilisateur alors qu'un simple nouvel essai quelques centaines de ms
// plus tard aurait suffi. Bornée à 2 tentatives supplémentaires avec un
// court backoff pour rester dans le budget d'exécution de la fonction
// serverless.
const RETRYABLE_STATUSES = [429, 503, 529]

async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastResponse
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, options)
    if (response.ok || !RETRYABLE_STATUSES.includes(response.status)) {
      return response
    }
    lastResponse = response
    if (attempt < maxRetries) await sleep(500 * (attempt + 1))
  }
  return lastResponse
}

async function callGemini(apiKey, model, image, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
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
    return { items: [], error: `Erreur API Gemini (${response.status})` }
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = text ? extractJson(text) : null
  return { items: Array.isArray(parsed?.items) ? parsed.items : [] }
}

async function callClaude(apiKey, model, image, prompt) {
  const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('FrigoMind: erreur API Claude', response.status, errText)
    return { items: [], error: `Erreur API Claude (${response.status})` }
  }

  const data = await response.json()
  const text = data.content?.find((block) => block.type === 'text')?.text
  const parsed = text ? extractJson(text) : null
  return { items: Array.isArray(parsed?.items) ? parsed.items : [] }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ items: [], error: 'Méthode non autorisée' })
    return
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  if (!anthropicKey && !geminiKey) {
    // Aucune clé configurée : on ne bloque jamais l'utilisateur, liste vide.
    res.status(200).json({ items: [], error: 'Aucune clé IA configurée sur Vercel (ANTHROPIC_API_KEY ou GEMINI_API_KEY)' })
    return
  }

  const image = parseDataUrl(req.body?.image)
  if (!image) {
    res.status(400).json({ items: [], error: 'Image invalide' })
    return
  }

  const prompt = buildPrompt(req.body?.mode)

  try {
    const result = anthropicKey
      ? await callClaude(anthropicKey, process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL, image, prompt)
      : await callGemini(geminiKey, process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL, image, prompt)

    res.status(200).json(result)
  } catch (e) {
    console.error('FrigoMind: analyse IA impossible', e)
    res.status(200).json({ items: [] })
  }
}
