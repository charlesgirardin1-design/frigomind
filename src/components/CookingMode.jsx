import { useEffect, useRef, useState } from 'react'
import { localizeRecipeSteps } from '../data/recipesDB.js'
import { scaleIngredientQuantity } from '../utils/servings.js'

const STRINGS = {
  fr: {
    ariaLabel: 'Mode mains libres',
    title: 'Mode mains libres',
    stepLabel: (i, n) => `Étape ${i} / ${n}`,
    listening: '🎤 En écoute…',
    speaking: '🔊 Lecture…',
    tapMode: 'Utilisez les boutons ci-dessous.',
    voiceHint: 'Dites "suivant", "précédent", "répète" ou "quantités".',
    unsupportedVoice:
      "La reconnaissance vocale n'est pas prise en charge par ce navigateur — utilisez les boutons ci-dessous à la place.",
    micDenied: 'Micro refusé — utilisez les boutons ci-dessous pour naviguer.',
    heard: (text) => `🎤 J'ai entendu : "${text}"`,
    prev: '◀ Précédent',
    next: 'Suivant ▶',
    repeat: '🔁 Répéter',
    quantities: '📋 Quantités',
    close: '✕ Quitter',
    firstStepWarning: "Vous êtes déjà à la première étape.",
    finished: "C'est prêt ! Bon appétit 🎉",
    quantitiesIntro: 'Voici les quantités :',
    noQuantities: "Je n'ai pas de quantités précises pour cette recette.",
  },
  en: {
    ariaLabel: 'Hands-free mode',
    title: 'Hands-free mode',
    stepLabel: (i, n) => `Step ${i} / ${n}`,
    listening: '🎤 Listening…',
    speaking: '🔊 Reading…',
    tapMode: 'Use the buttons below.',
    voiceHint: 'Say "next", "previous", "repeat" or "quantities".',
    unsupportedVoice: "Voice recognition isn't supported by this browser — use the buttons below instead.",
    micDenied: 'Microphone denied — use the buttons below to navigate.',
    heard: (text) => `🎤 Heard: "${text}"`,
    prev: '◀ Previous',
    next: 'Next ▶',
    repeat: '🔁 Repeat',
    quantities: '📋 Quantities',
    close: '✕ Quit',
    firstStepWarning: "You're already on the first step.",
    finished: "It's ready! Enjoy your meal 🎉",
    quantitiesIntro: 'Here are the quantities:',
    noQuantities: "I don't have precise quantities for this recipe.",
  },
}

// Mots-clés reconnus par commande, normalisés (sans accents, minuscules) —
// comparés par inclusion dans le texte reconnu plutôt que par égalité stricte
// (la reconnaissance vocale renvoie souvent une phrase complète, ex: "ok
// passe à l'étape suivante" plutôt que juste "suivant").
const COMMANDS = {
  next: ['suivant', 'suivante', 'continue', 'next'],
  prev: ['precedent', 'precedente', 'retour', 'previous', 'back'],
  repeat: ['repete', 'repeter', 'redis', 'repeat', 'again'],
  quantities: ['quantite', 'quantites', 'ingredient', 'ingredients', 'quantity', 'quantities'],
  stop: ['stop', 'arrete', 'quitte', 'quitter', 'quit', 'exit', 'ferme'],
}

const ACCENTS_REGEX = /[̀-ͯ]/g

function normalize(str) {
  return str.trim().toLowerCase().normalize('NFD').replace(ACCENTS_REGEX, '')
}

function matchCommand(transcript) {
  const norm = normalize(transcript)
  for (const [command, keywords] of Object.entries(COMMANDS)) {
    if (keywords.some((kw) => norm.includes(kw))) return command
  }
  return null
}

// Guidage vocal pas-à-pas pour cuisiner mains libres : lit chaque étape à
// voix haute (SpeechSynthesis) puis écoute des commandes courtes
// (SpeechRecognition natif — pas de librairie tierce) pour avancer, reculer,
// répéter ou relire les quantités sans toucher l'écran. Les deux API sont
// séparées : la synthèse vocale est bien plus largement supportée que la
// reconnaissance, donc l'écran reste pleinement utilisable au doigt même
// quand seule la lecture à voix haute fonctionne (voir `sttSupported`).
export default function CookingMode({ recipe, servings, lang, onClose }) {
  const s = STRINGS[lang]
  const steps = localizeRecipeSteps(recipe, lang)
  const allIngredients = [...new Set([...recipe.required, ...recipe.optional])]

  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState('speaking') // 'speaking' | 'listening' | 'idle' | 'micDenied'
  const [heard, setHeard] = useState('')

  const recognitionRef = useRef(null)
  const activeRef = useRef(true) // false dès la fermeture, pour ignorer les callbacks tardifs
  const wakeLockRef = useRef(null)
  // `recognition.onresult` n'est branché qu'une fois (voir startListening),
  // mais doit toujours agir sur le stepIndex courant : on le fait passer par
  // ce ref (réassigné à chaque rendu, voir handleCommand plus bas) plutôt que
  // de fermer directement sur handleCommand, qui figerait stepIndex à sa
  // valeur du tout premier rendu.
  const handleCommandRef = useRef(() => {})

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const SpeechRecognitionCtor =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const sttSupported = !!SpeechRecognitionCtor

  const speechLang = lang === 'en' ? 'en-US' : 'fr-FR'

  function speak(text, onEnd) {
    if (!ttsSupported) {
      onEnd?.()
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = speechLang
    utterance.onend = () => activeRef.current && onEnd?.()
    utterance.onerror = () => activeRef.current && onEnd?.()
    setPhase('speaking')
    window.speechSynthesis.speak(utterance)
  }

  function startListening() {
    if (!sttSupported || !activeRef.current) return
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionCtor()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = speechLang

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        setHeard(s.heard(transcript))
        const command = matchCommand(transcript)
        if (command) handleCommandRef.current(command)
      }
      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          activeRef.current && setPhase('micDenied')
        }
      }
      // Le navigateur arrête l'écoute après un silence ou un résultat : on
      // relance automatiquement tant que le mode est actif et qu'on n'est
      // pas en train de parler (sinon le micro capterait la voix de l'app
      // elle-même et pourrait la confondre avec une commande).
      recognition.onend = () => {
        if (activeRef.current && phaseRef.current !== 'speaking' && phaseRef.current !== 'micDenied') {
          try {
            recognition.start()
          } catch {
            // déjà démarré / relance trop rapprochée : sans conséquence, le
            // prochain onend réessaiera.
          }
        }
      }
      recognitionRef.current = recognition
    }
    try {
      recognitionRef.current.start()
      setPhase('listening')
    } catch {
      // déjà en cours d'écoute : rien à faire.
    }
  }

  // Miroir de `phase` lisible depuis le callback `onend` ci-dessus, qui capture
  // sinon une valeur figée de `phase` au moment de la création du recognizer.
  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  function announceStep(index) {
    const text = `${s.stepLabel(index + 1, steps.length)}. ${steps[index]}`
    speak(text, startListening)
  }

  function handleCommand(command) {
    if (command === 'stop') {
      handleClose()
      return
    }
    if (command === 'next') {
      if (stepIndex >= steps.length - 1) {
        speak(s.finished, startListening)
        return
      }
      const next = stepIndex + 1
      setStepIndex(next)
      announceStep(next)
      return
    }
    if (command === 'prev') {
      if (stepIndex <= 0) {
        speak(s.firstStepWarning, startListening)
        return
      }
      const prev = stepIndex - 1
      setStepIndex(prev)
      announceStep(prev)
      return
    }
    if (command === 'repeat') {
      announceStep(stepIndex)
      return
    }
    if (command === 'quantities') {
      const withQty = allIngredients
        .map((ing) => {
          const qty = scaleIngredientQuantity(ing, servings)
          return qty ? `${ing}, ${qty}` : null
        })
        .filter(Boolean)
      const text = withQty.length ? `${s.quantitiesIntro} ${withQty.join('. ')}.` : s.noQuantities
      speak(text, startListening)
    }
  }

  // Réassigné à chaque rendu : garantit que le callback onresult (branché une
  // seule fois) déclenche toujours la version de handleCommand qui voit le
  // stepIndex courant.
  handleCommandRef.current = handleCommand

  function handleClose() {
    activeRef.current = false
    window.speechSynthesis?.cancel()
    recognitionRef.current?.abort()
    wakeLockRef.current?.release().catch(() => {})
    onClose()
  }

  useEffect(() => {
    activeRef.current = true

    // Empêche l'écran de s'éteindre pendant la recette (perdrait tout
    // l'intérêt du mode mains libres) — relâché automatiquement par le
    // navigateur si l'onglet passe en arrière-plan, donc pas besoin de
    // gestion manuelle de visibilité ici, juste de la libérer à la fermeture.
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock
      }).catch(() => {})
    }

    announceStep(0)

    return () => {
      activeRef.current = false
      window.speechSynthesis?.cancel()
      recognitionRef.current?.abort()
      wakeLockRef.current?.release().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleManualNav(direction) {
    window.speechSynthesis?.cancel()
    if (direction === 'next') handleCommand('next')
    else if (direction === 'prev') handleCommand('prev')
    else if (direction === 'repeat') handleCommand('repeat')
    else if (direction === 'quantities') handleCommand('quantities')
  }

  return (
    <div
      className="print:hidden fixed inset-0 z-50 flex flex-col bg-neutral-900 text-white animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={s.ariaLabel}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{s.title}</span>
        <button type="button" onClick={handleClose} className="text-sm text-neutral-300 hover:text-white">
          {s.close}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-6 py-4 text-center">
        <p className="text-fresh-400 font-semibold text-sm mb-3">{s.stepLabel(stepIndex + 1, steps.length)}</p>
        <p className="text-2xl sm:text-3xl font-bold leading-snug max-w-xl">{steps[stepIndex]}</p>

        <div className="mt-8 flex items-center gap-2 text-sm text-neutral-400">
          {phase === 'speaking' && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-fresh-400 animate-pulse" /> {s.speaking}
            </span>
          )}
          {phase === 'listening' && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> {s.listening}
            </span>
          )}
        </div>

        {!sttSupported && <p className="text-xs text-neutral-500 mt-2 max-w-xs">{s.unsupportedVoice}</p>}
        {sttSupported && phase === 'micDenied' && <p className="text-xs text-zest-400 mt-2 max-w-xs">{s.micDenied}</p>}
        {sttSupported && phase !== 'micDenied' && <p className="text-xs text-neutral-500 mt-2 max-w-xs">{s.voiceHint}</p>}
        {heard && <p className="text-xs text-neutral-400 mt-3 italic">{heard}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => handleManualNav('prev')}
          disabled={stepIndex === 0}
          className="col-span-1 py-4 rounded-xl2 bg-neutral-800 text-white font-semibold disabled:opacity-30"
        >
          {s.prev}
        </button>
        <button
          type="button"
          onClick={() => handleManualNav('next')}
          className="col-span-1 py-4 rounded-xl2 bg-fresh-600 text-white font-semibold"
        >
          {s.next}
        </button>
        <button
          type="button"
          onClick={() => handleManualNav('repeat')}
          className="col-span-1 py-3 rounded-xl2 bg-neutral-800 text-white text-sm"
        >
          {s.repeat}
        </button>
        <button
          type="button"
          onClick={() => handleManualNav('quantities')}
          className="col-span-1 py-3 rounded-xl2 bg-neutral-800 text-white text-sm"
        >
          {s.quantities}
        </button>
      </div>
    </div>
  )
}
