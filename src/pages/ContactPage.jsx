import { useState } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'

const MAX_LENGTH = 2000

const STRINGS = {
  fr: {
    title: 'Contact',
    subtitle: "Une idée, un bug, une question ? Écrivez-nous, on vous lit.",
    nameLabel: 'Nom / prénom',
    namePlaceholder: 'Votre nom',
    emailLabel: 'Email (optionnel)',
    emailPlaceholder: 'vous@exemple.com — pour qu\'on puisse vous répondre',
    categoryLabel: 'De quoi s\'agit-il ?',
    categories: [
      { value: 'idee', label: '💡 Idée / fonctionnalité' },
      { value: 'bug', label: '🐛 Bug' },
      { value: 'autre', label: '💬 Autre' },
    ],
    messageLabel: 'Message',
    messagePlaceholder: 'Décrivez votre idée ou le problème rencontré…',
    charsLeft: (n) => `${n} caractères restants`,
    submit: 'Envoyer',
    sending: 'Envoi…',
    success: 'Merci ! Votre message a bien été envoyé.',
    error: "Impossible d'envoyer votre message pour le moment.",
    tooShort: 'Écrivez au moins quelques mots avant d\'envoyer.',
    nameRequired: 'Le nom est requis.',
  },
  en: {
    title: 'Contact',
    subtitle: 'An idea, a bug, a question? Write to us, we read everything.',
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email (optional)',
    emailPlaceholder: 'you@example.com — so we can reply',
    categoryLabel: 'What is it about?',
    categories: [
      { value: 'idee', label: '💡 Idea / feature' },
      { value: 'bug', label: '🐛 Bug' },
      { value: 'autre', label: '💬 Other' },
    ],
    messageLabel: 'Message',
    messagePlaceholder: 'Describe your idea or the issue you ran into…',
    charsLeft: (n) => `${n} characters left`,
    submit: 'Send',
    sending: 'Sending…',
    success: 'Thanks! Your message has been sent.',
    error: 'Could not send your message right now.',
    tooShort: 'Write at least a few words before sending.',
    nameRequired: 'Name is required.',
  },
}

// Page "Contact" : formulaire public (pas de connexion requise), envoyé à
// /api/contact qui relaie par email via Resend (voir api/contact.js). Un
// champ "website" caché (piège à robots, jamais rempli par un humain) sert
// de protection anti-spam minimale sans capcha.
export default function ContactPage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('idee')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState({ phase: 'idle', error: '' })

  const canSubmit = name.trim().length > 0 && message.trim().length >= 5 && status.phase !== 'loading'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setStatus({ phase: 'error', error: s.nameRequired })
      return
    }
    if (message.trim().length < 5) {
      setStatus({ phase: 'error', error: s.tooShort })
      return
    }

    setStatus({ phase: 'loading', error: '' })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, category, message, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || String(res.status))

      setStatus({ phase: 'success', error: '' })
      setName('')
      setEmail('')
      setCategory('idee')
      setMessage('')
    } catch (err) {
      setStatus({ phase: 'error', error: err.message && err.message !== 'ok' ? `${s.error} (${err.message})` : s.error })
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        backLabel={COMMON[lang].backHome}
        icon={<span className="text-2xl">✉️</span>}
        tone="zest"
        title={s.title}
        subtitle={s.subtitle}
      />

      {status.phase === 'success' ? (
        <div className="mt-6 card p-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-neutral-700">{s.success}</p>
          <button onClick={() => setStatus({ phase: 'idle', error: '' })} className="btn-secondary mt-4 !py-2 !px-4 text-sm">
            {lang === 'fr' ? 'Envoyer un autre message' : 'Send another message'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">{s.nameLabel}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={s.namePlaceholder}
              className="w-full text-sm border border-neutral-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">{s.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={s.emailPlaceholder}
              className="w-full text-sm border border-neutral-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-fresh-400 focus:ring-2 focus:ring-fresh-100"
            />
          </div>

          {/* Champ honeypot : caché visuellement et du lecteur d'écran, mais
              présent dans le DOM pour que les bots qui remplissent tout
              formulaire automatiquement s'y fassent piéger. */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] w-px h-px opacity-0"
          />

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
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">{s.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={s.messagePlaceholder}
              rows={6}
              className="w-full text-sm rounded-xl border border-neutral-200 p-3 focus:outline-none focus:ring-2 focus:ring-fresh-300 resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1 text-right">{s.charsLeft(MAX_LENGTH - message.length)}</p>
          </div>

          {status.phase === 'error' && <p className="text-sm text-red-600">{status.error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.phase === 'loading' ? s.sending : s.submit}
          </button>
        </form>
      )}
    </div>
  )
}
