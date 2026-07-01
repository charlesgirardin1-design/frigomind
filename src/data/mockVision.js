// -----------------------------------------------------------------------------
// mockVision.js
// (nom de fichier conservé pour compatibilité, mais il n'y a PLUS rien de "mock"
// ici : ce module fait une VRAIE analyse d'image, exécutée 100% dans le
// navigateur avec TensorFlow.js + le modèle pré-entraîné COCO-SSD.
//
// Comment ça marche :
//  1. On charge le modèle COCO-SSD une seule fois (mis en cache en mémoire).
//  2. On donne l'image prise/importée par l'utilisateur au modèle.
//  3. Le modèle détecte les objets réellement présents sur la photo, avec un
//     score de confiance par objet.
//  4. On ne garde que les objets qui correspondent à un aliment/ingrédient, et
//     on traduit leur nom en français.
//
// ⚠️ Limite connue (assumée, choisie pour rester 100% gratuit et sans clé API) :
// COCO-SSD est un modèle généraliste entraîné sur 80 catégories d'objets du
// quotidien. Son vocabulaire "aliments" est limité à une dizaine de classes
// (banane, pomme, orange, brocoli, carotte, sandwich, hot-dog, pizza, donut,
// gâteau...). Il ne reconnaît PAS des ingrédients comme œufs, fromage, lait,
// oignon, viande crue, etc., car ce ne sont pas des classes du modèle.
// Dans ce cas, la liste détectée peut être vide : c'est normal, pas un bug.
// L'utilisateur peut toujours ajouter ses ingrédients manuellement ensuite.
//
// 🔌 Pour une détection plus précise (reconnaît vraiment tous les aliments),
// il faudrait brancher un vrai modèle de vision multimodal (ex : Claude
// Vision) via un backend qui garde la clé API secrète. Voir le README pour
// le plan d'intégration.
// -----------------------------------------------------------------------------

import * as tf from '@tensorflow/tfjs'

// Traduction des classes COCO-SSD vers des noms d'ingrédients en français.
// On ne garde volontairement QUE les classes qui correspondent à un aliment
// ou ingrédient réel (on exclut assiette, tasse, couverts, table, frigo...).
const COCO_TO_INGREDIENT = {
  banana: 'banane',
  apple: 'pomme',
  orange: 'orange',
  broccoli: 'brocoli',
  carrot: 'carotte',
  'hot dog': 'saucisse',
  pizza: 'pizza',
  donut: 'donut',
  cake: 'gâteau',
  sandwich: 'sandwich',
}

// Classes ignorées explicitement : ce sont des objets détectés par COCO-SSD
// mais qui ne sont pas des ingrédients (vaisselle, mobilier, personnes...).
// (On ne les liste pas : tout ce qui n'est pas dans COCO_TO_INGREDIENT est
// simplement ignoré par le filtre plus bas.)

let modelPromise = null

/**
 * Charge le modèle COCO-SSD une seule fois et le met en cache pour les
 * analyses suivantes (évite de re-télécharger les poids à chaque photo).
 */
function loadModel() {
  if (!modelPromise) {
    modelPromise = import('@tensorflow-models/coco-ssd').then(async (cocoSsd) => {
      await tf.ready()
      return cocoSsd.load({ base: 'lite_mobilenet_v2' })
    })
  }
  return modelPromise
}

/**
 * Transforme une image (data URL) en élément <img> chargé, prêt à être
 * analysé par le modèle.
 */
function loadImageElement(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = imageDataUrl
  })
}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `ing-${idCounter}-${Date.now()}`
}

/**
 * Analyse réellement la photo fournie et retourne les ingrédients détectés.
 * Ne bloque jamais l'utilisateur : si rien n'est reconnu, on retourne une
 * liste vide plutôt qu'une erreur, pour qu'il puisse ajouter à la main.
 * @param {string} imageDataUrl - image encodée en base64 (data URL)
 * @returns {Promise<{items: Array}>}
 */
export async function analyzeImage(imageDataUrl) {
  try {
    const [model, imgEl] = await Promise.all([loadModel(), loadImageElement(imageDataUrl)])

    // minScore bas (0.4) car on préfère proposer un item "incertain" plutôt
    // que de rater une détection ; l'utilisateur peut toujours décocher.
    const predictions = await model.detect(imgEl, 20, 0.4)

    // On ne garde que les classes qui correspondent à un aliment connu, et on
    // déduplique en gardant le meilleur score par ingrédient (ex : 2 bananes
    // détectées séparément ne doivent donner qu'une seule ligne "banane").
    const bestByIngredient = new Map()
    for (const pred of predictions) {
      const ingredientName = COCO_TO_INGREDIENT[pred.class]
      if (!ingredientName) continue // objet non alimentaire (tasse, table...), on ignore
      const existing = bestByIngredient.get(ingredientName)
      if (!existing || pred.score > existing.score) {
        bestByIngredient.set(ingredientName, { score: pred.score })
      }
    }

    const items = Array.from(bestByIngredient.entries()).map(([name, { score }]) => ({
      id: nextId(),
      name,
      confidence: score,
      alternatives: [],
      checked: score >= 0.5,
    }))

    return { items }
  } catch (e) {
    // Même en cas d'erreur (modèle indisponible, image invalide...), on ne
    // bloque jamais l'utilisateur : liste vide, il complète à la main.
    console.warn('FrigoMind: analyse IA impossible', e)
    return { items: [] }
  }
}
