import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { COMMON } from '../i18n/common.js'
import { submitSuggestion } from '../utils/suggestions.js'
import PageHeader from '../components/PageHeader.jsx'

const MAX_LENGTH = 1000

const STRINGS = {
  fr: {
    title: 'Boîte à idées',
    subtitle: "Une fonctionnalité qui vous manque, un bug, une remarque ? Dites-le-nous.",
    categoryLabel: 'De quoi s\'agit-il ?',
    categories: [
      { value: 'idee', label: '💡 Idée / fonctionnalité' },
      { value: 'bug', label: '🐛 Bug' },
      { value: 'autre', label: '💬 Autre' },
    ],
    textLabel: 'Votre message',
    textPlaceholder: 'Décrivez votre idée ou le problème rencontré…',
    charsLeft: (n) => `${n} caractères restants`,
    submit: 'Envoyer',
    sending: 'Envoi…',
    success: 'Merci ! Votre suggestion a bien été envoyée.',
    error: "Impossible d'envoyer votre suggestion pour le moment. Réessayez plus tard.",
    tooShort: 'Écrivez au moins quelques mots avant d\'envoyer.',
  },
  en: {
    title: 'Suggestion box',
    subtitle: 'A missing feature, a bug, a remark? Let us know.',
    categoryLabel: 'What is it about?',
    categories: [
      { value: 'idee', label: '💡 Idea / feature' },
      { value: 'bug', label: '🐛 Bug' },
      { value: 'autre', label: '💬 Other' },
    ],
    textLabel: 'Your message',
    textPlaceholder: 'Describe your idea or the issue you ran into…',
    charsLeft: (n) => `${n} characters left`,
    submit: 'Send',
    sending: 'Sending…',
    success: 'Thanks! Your suggestion has been sent.',
    error: 'Could not send your suggestion right now. Try again later.',
    tooShort: 'Write at least a few words before sending.',
  },
}

// Page "Boîte à idées" : formulaire de suggestion libre, envoyé dans
// Firestore (collection `suggestions`, voir suggestions.js). Réservée aux
// comptes connectés — comme le reste des fonctionnalités bonus de l'app —
// pour limiter le spam sans avoir à mettre en place une protection dédiée.
export default function SuggestionPage() {
  const { goTo } = useApp()
  const { user } = useAuth()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const { showToast } = useToast()

  const [category, setCategory] = useState('idee')
  const [text, setText] = useState('')
  const [status, setStatus] = useState({ error: '', loading: false })

  async function handleSubmit(e) {
    e.preventDefault()
    if (text.trim().length < 5) {
      setStatus({ error: s.tooShort, loading: false })
      return
    }
    setStatus({ error: '', loading: true })
    try {
      await submitSuggestion({
        text,
        category,
        uid: user?.uid,
        email: user?.email,
        lang,
      })
      showToast(s.success)
      setText('')
      setCategory('idee')
      setStatus({ error: '', loading: false })
    } catch {
      setStatus({ error: s.error, loading: false })
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<span className="text-2xl">💡</span>}
        tone="zest"
        title={s.title}
        subtitle={s.subtitle}
      />

      <form onSubmit={handleSubmit} className="mt-6 card p-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1.5">{s.categoryLabel}</p>
          <div className="flex flex-wrap gap-2">
            {s.categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`chip ${category === c.value ? 'chip-active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1.5 block">{s.textLabel}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={s.textPlaceholder}
            rows={6}
            className="w-full text-sm rounded-xl border border-neutral-200 p-3 focus:outline-none focus:ring-2 focus:ring-fresh-300 resize-none"
          />
          <p className="text-xs text-neutral-400 mt-1 text-right">{s.charsLeft(MAX_LENGTH - text.length)}</p>
        </div>

        {status.error && <p className="text-sm text-red-600">{status.error}</p>}

        <button
          type="submit"
          disabled={status.loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.loading ? s.sending : s.submit}
        </button>
      </form>
    </div>
  )
}
