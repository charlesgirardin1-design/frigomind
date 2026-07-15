// -----------------------------------------------------------------------------
// reminders.js
// Rappel local anti-gaspi : sans serveur, sans clés VAPID, sans abonnement
// push — donc il ne peut s'afficher que lorsque FrigoMind est réellement
// ouvert (l'app ne peut pas "réveiller" le navigateur si elle est fermée).
// Concrètement : à l'ouverture de l'app, si l'utilisateur a activé les
// rappels, a accordé la permission de notification, et n'a pas généré de
// recettes depuis quelques jours, on affiche une notification locale
// suggérant de revenir cuisiner — au maximum une fois par jour.
// -----------------------------------------------------------------------------

import { scopedKey } from './storage.js'

const PREF_KEY = 'frigomind_reminders_enabled'
const LAST_SHOWN_KEY = 'frigomind_reminders_lastShown'
const STALE_AFTER_DAYS = 2
const MIN_GAP_HOURS = 20

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getReminderPreference(uid) {
  if (!isNotificationSupported()) return false
  try {
    return localStorage.getItem(scopedKey(PREF_KEY, uid)) === '1'
  } catch {
    return false
  }
}

export function setReminderPreference(uid, enabled) {
  try {
    localStorage.setItem(scopedKey(PREF_KEY, uid), enabled ? '1' : '0')
  } catch {
    // localStorage indisponible (navigation privée stricte...) : préférence
    // simplement pas persistée, pas bloquant pour le reste de l'app.
  }
}

function hoursSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / 3_600_000
}

const MESSAGES = {
  fr: {
    title: '🥕 Un petit creux ?',
    body: "Ça fait un moment — jetez un œil à votre frigo, FrigoMind a peut-être une idée pour vous.",
  },
  en: {
    title: '🥕 Feeling hungry?',
    body: "It's been a while — take a peek in your fridge, FrigoMind might have an idea for you.",
  },
}

// Appelé une fois au chargement de l'app (voir AppContext) une fois
// l'historique connu.
export function maybeShowReminder(uid, history, lang) {
  const messages = MESSAGES[lang] || MESSAGES.fr
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  if (!getReminderPreference(uid)) return

  const lastSession = history[0]?.date
  const isStale = !lastSession || hoursSince(lastSession) >= STALE_AFTER_DAYS * 24
  if (!isStale) return

  const lastShownKey = scopedKey(LAST_SHOWN_KEY, uid)
  let lastShown = null
  try {
    lastShown = localStorage.getItem(lastShownKey)
  } catch {
    // idem : navigation privée stricte, on continue sans persister.
  }
  if (lastShown && hoursSince(lastShown) < MIN_GAP_HOURS) return

  try {
    new Notification(messages.title, {
      body: messages.body,
      icon: 'https://i.ibb.co/zW91Yz1J/d65636ed-a1f8-4b6d-9a6e-3137c924b593.png',
    })
    localStorage.setItem(lastShownKey, new Date().toISOString())
  } catch {
    // Certains navigateurs refusent `new Notification()` hors service worker
    // sur mobile : on échoue silencieusement plutôt que de bloquer l'app.
  }
}
