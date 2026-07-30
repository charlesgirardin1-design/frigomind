import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'

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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
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
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_fr`)
        const data = await res.json()
        const rawName = data?.product?.product_name_fr || data?.product?.product_name
        if (!rawName) {
          setPhase('notfound')
          return
        }
        onDetected(simplifyProductName(rawName))
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
