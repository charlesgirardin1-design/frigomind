// -----------------------------------------------------------------------------
// api/contact.js
// Fonction serverless Vercel (Node.js). Reçoit un message du formulaire de
// contact public (voir src/pages/ContactPage.jsx) et l'envoie par email via
// l'API Resend (gratuite, sans carte bancaire pour le palier de base).
// Appel direct à l'API REST plutôt que le SDK npm `resend`, pour rester
// cohérent avec analyze-fridge.js (pas de dépendance supplémentaire pour un
// simple appel HTTP).
//
// Variable d'environnement (Project Settings → Environment Variables) :
//  - RESEND_API_KEY (obligatoire) : clé créée gratuitement sur
//    https://resend.com/api-keys
//
// Sans clé configurée, la fonction renvoie une erreur claire plutôt que de
// planter silencieusement.
// -----------------------------------------------------------------------------

const TO_EMAIL = 'charles.girardin1@gmail.com'
const FROM_EMAIL = 'FrigoMind <onboarding@resend.dev>'

const MAX_NAME_LENGTH = 200
const MAX_MESSAGE_LENGTH = 2000

const CATEGORY_LABELS = {
  idee: '💡 Idée / fonctionnalité',
  bug: '🐛 Bug',
  autre: '💬 Autre',
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml({ name, email, category, message }) {
  const rows = [
    ['Nom', escapeHtml(name)],
    ['Email', email ? escapeHtml(email) : '—'],
    ['Catégorie', CATEGORY_LABELS[category] || escapeHtml(category || '—')],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;background:#f9fafb;">${label}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#111827;">${value}</td></tr>`
    )
    .join('')

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#16a34a;">🥕 Nouveau message — FrigoMind</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">${rows}</table>
      <div style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;white-space:pre-wrap;color:#111827;">${escapeHtml(
        message
      )}</div>
    </div>
  `
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { name, email, category, message, website } = req.body || {}

  // Piège à robots : un champ invisible pour un visiteur humain (voir
  // ContactPage.jsx) que les bots remplissent souvent automatiquement. On ne
  // le signale pas comme une erreur, pour ne pas leur donner d'indice.
  if (website) {
    res.status(200).json({ ok: true })
    return
  }

  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Le nom est requis.' })
    return
  }
  if (typeof message !== 'string' || message.trim().length < 5) {
    res.status(400).json({ error: 'Le message doit contenir au moins 5 caractères.' })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    res.status(503).json({ error: 'Service de contact non configuré (RESEND_API_KEY manquante).' })
    return
  }

  const safeName = name.trim().slice(0, MAX_NAME_LENGTH)
  const safeMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH)
  const safeEmail = typeof email === 'string' && email.trim() ? email.trim().slice(0, MAX_NAME_LENGTH) : null

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        reply_to: safeEmail || undefined,
        subject: `FrigoMind — nouveau message de ${safeName}`,
        html: buildHtml({ name: safeName, email: safeEmail, category, message: safeMessage }),
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('FrigoMind contact: erreur API Resend', response.status, errText)
      res.status(502).json({ error: "Impossible d'envoyer le message pour le moment." })
      return
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('FrigoMind contact: envoi impossible', e)
    res.status(500).json({ error: "Impossible d'envoyer le message pour le moment." })
  }
}
