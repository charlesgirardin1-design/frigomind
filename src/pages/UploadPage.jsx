import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { IllustrationTile, CameraGlyph } from '../components/Illustrations.jsx'
import { resizeImageFile } from '../utils/image.js'
import FlowStepper from '../components/FlowStepper.jsx'

// Les photos de smartphone (souvent 3-10 Mo) dépassent la limite de taille
// des fonctions serverless Vercel (~4,5 Mo) une fois encodées en base64,
// ce qui faisait échouer silencieusement l'analyse (liste vide, sans
// message d'erreur visible). resizeImageFile les redimensionne à 1600px max
// de large et les recompresse en JPEG qualité ~0.85 — un compromis qui garde
// assez de détail pour distinguer les ingrédients visuellement proches
// (pomme de terre/oignon...) ou repérer les petits objets à l'arrière-plan,
// tout en restant très largement sous la limite de taille une fois encodé.

const STRINGS = {
  fr: {
    title: 'Ajoutez une photo',
    subtitle: 'Votre frigo, un placard, ou quelques aliments sur la table.',
    fridge: '🧊 Vider le frigo',
    pantry: '🥫 Vider le placard',
    both: '🧊🥫 Frigo + placard',
    pantryHint: 'Mode placard : on cible les produits secs et de longue conservation (pâtes, riz, conserves, légumineuses...).',
    fridgeHint: 'Mode frigo : on cible les produits frais.',
    bothHint: 'Mode combiné : on cible à la fois les produits frais et les produits secs sur la même photo.',
    previewAlt: 'Aperçu de la photo importée',
    change: '✕ Changer',
    emptyState: 'Aucune image pour le moment. Prenez une photo ou importez-en une.',
    takePhoto: '📸 Prendre une photo',
    importPhoto: '🗂️ Importer une image',
    analyzing: 'Analyse en cours…',
    analyze: '🔍 Analyser mes ingrédients',
    // Séquence affichée pendant l'analyse (voir ANALYZING_STEP_MS) : avance
    // d'une étape à l'autre pour donner un sentiment de progression réelle
    // plutôt qu'un simple spinner statique — reste sur la dernière tant que
    // l'analyse n'est pas terminée, puisque sa durée réelle est imprévisible
    // (réseau + IA).
    analyzingSteps: ['🔍 On regarde votre photo…', '🧠 On identifie les ingrédients…', '✨ Presque prêt…'],
  },
  en: {
    title: 'Add a photo',
    subtitle: 'Your fridge, a cupboard, or a few items on the table.',
    fridge: '🧊 Empty the fridge',
    pantry: '🥫 Empty the pantry',
    both: '🧊🥫 Fridge + pantry',
    pantryHint: 'Pantry mode: targets dry, long-lasting products (pasta, rice, canned goods, legumes...).',
    fridgeHint: 'Fridge mode: targets fresh products.',
    bothHint: 'Combined mode: targets both fresh and dry products in the same photo.',
    previewAlt: 'Preview of the imported photo',
    change: '✕ Change',
    emptyState: 'No image yet. Take a photo or import one.',
    takePhoto: '📸 Take a photo',
    importPhoto: '🗂️ Import an image',
    analyzing: 'Analyzing…',
    analyze: '🔍 Analyze my ingredients',
    analyzingSteps: ['🔍 Looking at your photo…', '🧠 Identifying ingredients…', '✨ Almost there…'],
  },
}

// Durée d'une étape de la séquence "analyse en cours" (voir analyzingSteps
// ci-dessus). Ni trop courte (illisible), ni trop longue (a l'air figé).
const ANALYZING_STEP_MS = 1700

// Page d'upload : deux boutons (prendre une photo / importer une image),
// aperçu immédiat, puis lancement de l'analyse IA (mock).
export default function UploadPage() {
  const { state, setPhoto, analyzePhoto, goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [localPreview, setLocalPreview] = useState(state.photo)
  const [scanMode, setScanMode] = useState('frigo')
  const [analyzingStep, setAnalyzingStep] = useState(0)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  // Fait avancer la séquence de statuts pendant l'analyse (voir
  // analyzingSteps) — s'arrête sur la dernière étape plutôt que de boucler,
  // pour ne pas donner l'impression que l'analyse recommence à zéro si elle
  // prend plus de temps que prévu (réseau lent, IA surchargée...).
  useEffect(() => {
    if (!state.isAnalyzing) {
      setAnalyzingStep(0)
      return
    }
    const steps = STRINGS[lang].analyzingSteps
    const interval = setInterval(() => {
      setAnalyzingStep((n) => Math.min(n + 1, steps.length - 1))
    }, ANALYZING_STEP_MS)
    return () => clearInterval(interval)
  }, [state.isAnalyzing, lang])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImageFile(file)
      setLocalPreview(dataUrl)
      setPhoto(dataUrl)
    } catch (err) {
      // En cas de souci de redimensionnement (format exotique...), on retombe
      // sur le fichier original plutôt que de bloquer l'utilisateur.
      console.warn('FrigoMind: redimensionnement impossible, utilisation du fichier original', err)
      const reader = new FileReader()
      reader.onload = () => {
        setLocalPreview(reader.result)
        setPhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleAnalyze() {
    if (!localPreview) return
    await analyzePhoto(localPreview, scanMode)
    // La navigation vers 'validate' est gérée par le reducer (ANALYSIS_DONE)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      {/* Ligne de "scan" affichée sur l'aperçu photo pendant l'analyse IA :
          un dégradé fin qui balaie l'image de haut en bas, en boucle, pour
          rendre visible que l'IA "regarde" la photo (en complément du petit
          spinner déjà présent dans le bouton). Classe scoping ce composant
          uniquement, keyframe non présente dans tailwind.config.js. */}
      <style>{`
        .fm-scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(
            to bottom,
            rgba(34, 168, 106, 0) 0%,
            rgba(34, 168, 106, 0.35) 45%,
            rgba(255, 122, 26, 0.35) 55%,
            rgba(255, 122, 26, 0) 100%
          );
          animation: fmScanSweep 2.4s ease-in-out infinite;
        }
        @keyframes fmScanSweep {
          0% { top: -30%; }
          50% { top: 100%; }
          100% { top: -30%; }
        }
      `}</style>

      <button onClick={() => goTo('home')} className="text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        {COMMON[lang].back}
      </button>

      <FlowStepper step={1} />

      <h2 className="text-2xl font-bold text-neutral-900">{s.title}</h2>
      <p className="text-neutral-500 mt-1">{s.subtitle}</p>

      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setScanMode('frigo')}
          className={`chip ${scanMode === 'frigo' ? 'chip-active' : ''}`}
        >
          {s.fridge}
        </button>
        <button
          onClick={() => setScanMode('placard')}
          className={`chip ${scanMode === 'placard' ? 'chip-active' : ''}`}
        >
          {s.pantry}
        </button>
        <button
          onClick={() => setScanMode('both')}
          className={`chip ${scanMode === 'both' ? 'chip-active' : ''}`}
        >
          {s.both}
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-1.5">
        {scanMode === 'placard' ? s.pantryHint : scanMode === 'both' ? s.bothHint : s.fridgeHint}
      </p>

      <div className="mt-6 card p-4">
        {localPreview ? (
          <div className="relative overflow-hidden rounded-xl2">
            <img
              src={localPreview}
              alt={s.previewAlt}
              className="w-full max-h-80 object-cover rounded-xl2"
            />
            {state.isAnalyzing && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {/* Voile subtil pour faire ressortir le trait de scan */}
                <div className="absolute inset-0 bg-neutral-900/10" />
                <div className="fm-scan-line" />
              </div>
            )}
            <button
              onClick={() => {
                setLocalPreview(null)
                setPhoto(null)
              }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-card"
            >
              {s.change}
            </button>
          </div>
        ) : (
          <div className="relative border-2 border-dashed border-neutral-200 rounded-xl2 py-14 flex flex-col items-center justify-center text-center gap-3 overflow-hidden">
            <div
              className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-fresh-200/30 blur-3xl -z-10 animate-blob"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 -right-8 w-36 h-36 rounded-full bg-zest-200/30 blur-3xl -z-10 animate-blob"
              style={{ animationDelay: '-6s' }}
              aria-hidden
            />
            <IllustrationTile tone="fresh" size="lg">
              <CameraGlyph className="w-full h-full" />
            </IllustrationTile>
            <p className="text-neutral-500 text-sm px-6">{s.emptyState}</p>
          </div>
        )}
      </div>

      {!localPreview && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="btn-primary" onClick={() => cameraInputRef.current?.click()}>
            {s.takePhoto}
          </button>
          <button className="btn-secondary" onClick={() => galleryInputRef.current?.click()}>
            {s.importPhoto}
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {localPreview && (
        <div className="mt-5">
          <button
            onClick={handleAnalyze}
            disabled={state.isAnalyzing}
            className="btn-primary w-full sm:w-auto disabled:opacity-70 disabled:cursor-wait"
          >
            {state.isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {/* `key` sur l'étape : force un petit fondu à chaque
                    changement plutôt qu'un texte qui saute brutalement. */}
                <span key={analyzingStep} className="animate-fadeIn">
                  {s.analyzingSteps[analyzingStep]}
                </span>
              </span>
            ) : (
              s.analyze
            )}
          </button>
          {state.isAnalyzing && (
            <div className="mt-2.5 flex items-center gap-1.5" role="status" aria-label={s.analyzing}>
              {s.analyzingSteps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= analyzingStep ? 'w-6 bg-fresh-500' : 'w-1.5 bg-neutral-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
