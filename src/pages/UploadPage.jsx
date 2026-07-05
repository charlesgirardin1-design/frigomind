import { useRef, useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { IllustrationTile, CameraGlyph } from '../components/Illustrations.jsx'
import { resizeImageFile } from '../utils/image.js'

// Les photos de smartphone (souvent 3-10 Mo) dépassent la limite de taille
// des fonctions serverless Vercel (~4,5 Mo) une fois encodées en base64,
// ce qui faisait échouer silencieusement l'analyse (liste vide, sans
// message d'erreur visible). resizeImageFile les redimensionne à 1280px max
// de large et les recompresse en JPEG qualité ~0.82, largement suffisant pour
// la reconnaissance d'aliments par l'IA.

// Page d'upload : deux boutons (prendre une photo / importer une image),
// aperçu immédiat, puis lancement de l'analyse IA (mock).
export default function UploadPage() {
  const { state, setPhoto, analyzePhoto, goTo } = useApp()
  const [localPreview, setLocalPreview] = useState(state.photo)
  const [scanMode, setScanMode] = useState('frigo')
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

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
      <button onClick={() => goTo('home')} className="text-sm text-neutral-400 hover:text-neutral-700 mb-4">
        ← Retour
      </button>

      <h2 className="text-2xl font-bold text-neutral-900">Ajoutez une photo</h2>
      <p className="text-neutral-500 mt-1">Votre frigo, un placard, ou quelques aliments sur la table.</p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setScanMode('frigo')}
          className={`chip ${scanMode === 'frigo' ? 'chip-active' : ''}`}
        >
          🧊 Frigo
        </button>
        <button
          onClick={() => setScanMode('placard')}
          className={`chip ${scanMode === 'placard' ? 'chip-active' : ''}`}
        >
          🥫 Vider le placard
        </button>
      </div>
      <p className="text-xs text-neutral-400 mt-1.5">
        {scanMode === 'placard'
          ? 'Mode placard : on cible les produits secs et de longue conservation (pâtes, riz, conserves, légumineuses...).'
          : 'Mode frigo : on cible les produits frais.'}
      </p>

      <div className="mt-6 card p-4">
        {localPreview ? (
          <div className="relative">
            <img
              src={localPreview}
              alt="Aperçu de la photo importée"
              className="w-full max-h-80 object-cover rounded-xl2"
            />
            <button
              onClick={() => {
                setLocalPreview(null)
                setPhoto(null)
              }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-neutral-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-card"
            >
              ✕ Changer
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-neutral-200 rounded-xl2 py-14 flex flex-col items-center justify-center text-center gap-3">
            <IllustrationTile tone="fresh" size="lg">
              <CameraGlyph className="w-full h-full" />
            </IllustrationTile>
            <p className="text-neutral-400 text-sm px-6">
              Aucune image pour le moment. Prenez une photo ou importez-en une.
            </p>
          </div>
        )}
      </div>

      {!localPreview && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="btn-primary" onClick={() => cameraInputRef.current?.click()}>
            📸 Prendre une photo
          </button>
          <button className="btn-secondary" onClick={() => galleryInputRef.current?.click()}>
            🗂️ Importer une image
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
                Analyse en cours…
              </span>
            ) : (
              '🔍 Analyser mes ingrédients'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
