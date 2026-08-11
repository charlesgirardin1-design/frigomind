import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { categorizeIngredient } from '../data/dishPatterns.js'

const STRINGS = {
  fr: {
    ariaLabel: 'Scanner un code-barres',
    title: 'Scanner un produit',
    hint: 'Visez le code-barres du produit avec votre caméra.',
    unsupported: "Le scan de code-barres n'est pas pris en charge par ce navigateur — essayez avec Chrome sur Android, ou ajoutez l'ingrédient à la main.",
    cameraError: "Impossible d'accéder à la caméra. Vérifiez que vous avez autorisé l'accès dans votre navigateur.",
    looking: 'Recherche du produit…',
    notFound: "Produit non reconnu pour ce code-barres. Réessayez ou ajoutez l'ingrédient à la main.",
    close: 'Fermer',
    retry: 'Réessayer',
  },
  en: {
    ariaLabel: 'Scan a barcode',
    title: 'Scan a product',
    hint: 'Point your camera at the product barcode.',
    unsupported: "Barcode scanning isn't supported by this browser — try Chrome on Android, or add the ingredient by hand.",
    cameraError: 'Could not access the camera. Check that you allowed camera access in your browser.',
    looking: 'Looking up the product…',
    notFound: "This barcode wasn't recognized. Try again or add the ingredient by hand.",
    close: 'Close',
    retry: 'Retry',
  },
}

// Simplifie le nom produit renvoyé par Open Food Facts (souvent une marque +
// une description longue, ex: "Nutella - Ferrero - 400g") en gardant juste
// le premier segment, plus proche d'un nom d'ingrédient générique utilisable
// par le reste de l'app (matching avec ingredientQuantities.js etc. reste
// approximatif, comme pour tout ingrédient ajouté à la main).
function simplifyProductName(rawName) {
  return rawName.split(/[-,(]/)[0].trim().toLowerCase()
}

// Correspondance entre tags de catégorie Open Food Facts (ex: "en:pastas",
// "fr:pates-alimentaires") et un mot d'ingrédient générique français. Sert de
// filet de secours quand le nom produit n'est qu'une marque (ex: "Barilla")
// que categorizeIngredient (dishPatterns.js) ne peut pas classer.
const CATEGORY_TAG_TO_INGREDIENT = {
  pastas: 'pâtes',
  'pates-alimentaires': 'pâtes',
  rices: 'riz',
  cheeses: 'fromage',
  milks: 'lait',
  yogurts: 'yaourt',
  creams: 'crème',
  eggs: 'œuf',
  meats: 'viande',
  poultries: 'poulet',
  fishes: 'poisson',
  seafood: 'fruits de mer',
  chocolates: 'chocolat',
  tomatoes: 'tomate',
  onions: 'oignon',
  potatoes: 'pomme de terre',
  mushrooms: 'champignon',
  hams: 'jambon',
  sausages: 'saucisse',
  breads: 'pain',
  legumes: 'lentilles',
  pulses: 'lentilles',
  'canned-fish': 'thon',
  butters: 'beurre',
  sugars: 'sucre',
}

// Parcourt les tags de catégorie du plus spécifique (dernier de la liste) au
// plus général et renvoie le premier mot générique reconnu, ou null.
function categoryTagsToIngredient(tags) {
  if (!Array.isArray(tags)) return null
  for (let i = tags.length - 1; i >= 0; i--) {
    const key = tags[i]?.split(':').pop()
    if (key && CATEGORY_TAG_TO_INGREDIENT[key]) return CATEGORY_TAG_TO_INGREDIENT[key]
  }
  return null
}

// Dernier filet de secours quand ni le nom générique Open Food Facts, ni les
// mots-clés locaux (categorizeIngredient), ni les tags de catégorie n'ont
// permis de reconnaître le produit : les métadonnées Open Food Facts sont
// souvent absentes ou incomplètes (produits peu connus, gammes régionales,
// formes de pâtes obscures...), donc plutôt que de continuer à empiler des
// mots-clés locaux qui ne couvriront jamais tout, on demande directement à
// une IA (Gemini, via /api/normalize-product) de traduire le nom brut du
// produit en ingrédient générique. Ne bloque jamais l'utilisateur : toute
// erreur renvoie null, l'appelant garde alors son nom déjà calculé.
async function normalizeProductName({ name, brands, categoriesTags }) {
  try {
    const res = await fetch('/api/normalize-product', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, brands, categoriesTags }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.ingredient === 'string' && data.ingredient.trim() ? data.ingredient.trim() : null
  } catch {
    return null
  }
}

// Scanne un code-barres via l'API native BarcodeDetector (Chrome/Edge/
// Android — pas de librairie tierce) puis récupère le nom du produit via
// l'API publique et gratuite Open Food Facts (pas de clé requise). Le nom
// simplifié est renvoyé à `onDetected`, à charge de l'appelant de l'ajouter
// aux ingrédients (voir ValidatePage.jsx).
export default function BarcodeScanner({ onDetected, onClose }) {
  const lang = useLanguage()
  const s = STRINGS[lang]
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [phase, setPhase] = useState('scanning') // 'scanning' | 'looking' | 'error' | 'notfound' | 'cameraError'
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (!supported || phase !== 'scanning') return
    let cancelled = false

    async function start() {
      try {
        // Résolution haute + mise au point continue : sans ça le navigateur
        // choisit parfois un flux basse résolution et l'autofocus met du
        // temps à faire le point sur un code-barres tenu de près, ce qui
        // oblige à plusieurs essais avant une détection réussie. `focusMode`
        // n'est pas `exact`, donc les navigateurs qui ne le supportent pas
        // l'ignorent simplement, sans erreur.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: 'continuous',
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
        })

        async function tick() {
          if (cancelled || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              handleDetected(codes[0].rawValue)
              return
            }
          } catch {
            // Une frame illisible n'est pas une erreur fatale : on retente à
            // la frame suivante plutôt que d'abandonner le scan.
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) setPhase('cameraError')
      }
    }

    async function handleDetected(barcode) {
      stopCamera()
      setPhase('looking')
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_fr,generic_name,generic_name_fr,categories_tags,brands`
        )
        const data = await res.json()
        const product = data?.product
        const rawName = product?.product_name_fr || product?.product_name

        // `generic_name(_fr)` est censé contenir une description générique
        // (ex: "Pâtes alimentaires") plutôt qu'une marque, contrairement à
        // `product_name(_fr)` qui vaut souvent juste "Barilla". On le
        // préfère donc quand il est présent et non vide.
        const genericName = product?.generic_name_fr?.trim() || product?.generic_name?.trim()

        if (!rawName && !genericName) {
          setPhase('notfound')
          return
        }
        let candidateName = genericName ? genericName.toLowerCase() : simplifyProductName(rawName)

        // Si le nom retenu reste non catégorisable (typiquement une marque
        // ou un nom de gamme, ex: "barilla trofie collezione 500g"), on
        // tente d'abord les tags de catégorie Open Food Facts, puis en tout
        // dernier recours une normalisation par IA (voir normalizeProductName
        // ci-dessus) — un ingrédient 'other' est traité comme compatible
        // avec tous les archétypes de plats par recipeEngine.js, d'où
        // l'intérêt de le catégoriser correctement en amont plutôt que de
        // laisser un nom de marque brut finir dans une recette.
        if (categorizeIngredient(candidateName) === 'other') {
          const mapped = categoryTagsToIngredient(product?.categories_tags)
          if (mapped) {
            candidateName = mapped
          } else {
            const aiName = await normalizeProductName({
              name: rawName || genericName,
              brands: product?.brands,
              categoriesTags: product?.categories_tags,
            })
            if (aiName) candidateName = aiName
          }
        }

        onDetected(candidateName)
      } catch {
        setPhase('notfound')
      }
    }

    start()
    return () => {
      cancelled = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, phase])

  function handleClose() {
    stopCamera()
    onClose()
  }

  return (
    <div
      className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={s.ariaLabel}
      onClick={handleClose}
    >
      <div className="card p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-50">{s.title}</h2>

        {!supported && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">{s.unsupported}</p>}

        {supported && phase === 'cameraError' && (
          <p className="text-sm text-zest-700 dark:text-zest-400 mt-3">{s.cameraError}</p>
        )}

        {supported && phase === 'scanning' && (
          <>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 mb-3">{s.hint}</p>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full aspect-square object-cover rounded-xl2 bg-black"
            />
          </>
        )}

        {supported && phase === 'looking' && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">{s.looking}</p>}

        {supported && phase === 'notfound' && (
          <>
            <p className="text-sm text-zest-700 dark:text-zest-400 mt-3">{s.notFound}</p>
            <button type="button" onClick={() => setPhase('scanning')} className="btn-secondary mt-3 !py-2 !px-4 text-sm">
              {s.retry}
            </button>
          </>
        )}

        <button type="button" onClick={handleClose} className="btn-secondary w-full mt-4">
          {s.close}
        </button>
      </div>
    </div>
  )
}
