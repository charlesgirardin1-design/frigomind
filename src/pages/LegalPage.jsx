import { useEffect, useState, useCallback } from 'react'
import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { ShieldGlyph } from '../components/Illustrations.jsx'

const STRINGS = {
  fr: {
    title: 'Mentions légales & confidentialité',
    subtitle:
      "Document type pour un projet MVP — à compléter avec l'identité légale réelle de l'éditeur avant toute exploitation commerciale.",
    publisherTitle: 'Éditeur du site',
    publisherText:
      "FrigoMind est un projet édité par [Nom / raison sociale de l'éditeur — à compléter]. Pour toute question, contactez l'éditeur à l'adresse [email de contact à compléter].",
    hostingTitle: 'Hébergement',
    hostingText:
      'Le site est hébergé par Vercel Inc. Le code source est disponible sur GitHub. Aucune base de données serveur n\'est utilisée : l\'application fonctionne principalement côté navigateur.',
    personalDataTitle: 'Vos informations personnelles',
    personalDataText1:
      "Les photos que vous prenez sont envoyées à l'API Google Gemini (Google LLC) uniquement pour être analysées et détecter les aliments visibles, via une fonction serverless qui garde la clé API secrète côté serveur. FrigoMind ne stocke pas vos photos sur ses propres serveurs. Le traitement effectué par Google est soumis à sa propre politique de confidentialité.",
    personalDataText2:
      "Votre historique de recettes générées est stocké uniquement en local dans votre navigateur (localStorage) : il n'est jamais transmis à un serveur FrigoMind et disparaît si vous videz les données de navigation de ce site.",
    cookiesTitle: 'Cookies',
    cookiesText:
      "FrigoMind n'utilise pas de cookies de suivi publicitaire. Le localStorage du navigateur est utilisé uniquement pour conserver votre historique de recettes sur cet appareil.",
    ipTitle: 'Propriété intellectuelle',
    ipText:
      'Le nom "FrigoMind", le contenu et le design de ce site sont la propriété de l\'éditeur, sauf mention contraire. Les recettes proposées sont fournies à titre indicatif et ne remplacent pas un avis nutritionnel professionnel.',
    liabilityTitle: 'Responsabilité',
    liabilityText:
      "L'analyse des ingrédients par IA peut comporter des erreurs ou approximations. Vérifiez toujours la fraîcheur et la comestibilité réelle de vos aliments avant de cuisiner : FrigoMind ne garantit pas l'exactitude de la détection automatique.",
    contactTitle: 'Contact',
    contactPrefix: 'Pour toute question relative à ces mentions ou à vos données, utilisez la page',
    contactFaq: 'FAQ',
    contactSuffix: "ou contactez directement l'éditeur du site.",
  },
  en: {
    title: 'Legal notice & privacy',
    subtitle: "Template document for an MVP project — to be completed with the publisher's real legal identity before any commercial use.",
    publisherTitle: 'Site publisher',
    publisherText:
      'FrigoMind is a project published by [Publisher name / legal entity — to complete]. For any question, contact the publisher at [contact email to complete].',
    hostingTitle: 'Hosting',
    hostingText:
      'The site is hosted by Vercel Inc. The source code is available on GitHub. No server-side database is used: the application runs mostly in the browser.',
    personalDataTitle: 'Your personal data',
    personalDataText1:
      "Photos you take are sent to the Google Gemini API (Google LLC) only to be analyzed and detect visible food items, via a serverless function that keeps the API key secret server-side. FrigoMind does not store your photos on its own servers. Processing performed by Google is subject to its own privacy policy.",
    personalDataText2:
      "Your generated recipe history is stored only locally in your browser (localStorage): it is never sent to a FrigoMind server and disappears if you clear this site's browsing data.",
    cookiesTitle: 'Cookies',
    cookiesText:
      "FrigoMind doesn't use advertising tracking cookies. The browser's localStorage is only used to keep your recipe history on this device.",
    ipTitle: 'Intellectual property',
    ipText:
      'The name "FrigoMind", the content and the design of this site are the property of the publisher, unless stated otherwise. Suggested recipes are provided for informational purposes and do not replace professional nutritional advice.',
    liabilityTitle: 'Liability',
    liabilityText:
      "AI ingredient analysis may contain errors or approximations. Always check the actual freshness and edibility of your food before cooking: FrigoMind does not guarantee the accuracy of automatic detection.",
    contactTitle: 'Contact',
    contactPrefix: 'For any question about this notice or your data, use the',
    contactFaq: 'FAQ',
    contactSuffix: 'page or contact the site publisher directly.',
  },
}

// Page "Mentions légales / Confidentialité". Contenu générique de MVP :
// à personnaliser avec l'identité légale réelle de l'éditeur avant toute
// mise en production commerciale.
export default function LegalPage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const [highlighted, setHighlighted] = useState(null)

  // Scrolle jusqu'à la section correspondant à l'ancre courante (#cookies,
  // #vos-informations-personnelles...) et la surligne brièvement : la page
  // étant courte, le défilement seul est parfois trop discret pour qu'on
  // remarque qu'on est bien arrivé au bon endroit.
  const goToHashSection = useCallback(() => {
    if (typeof window === 'undefined') return
    const id = window.location.hash?.replace('#', '')
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlighted(id)
  }, [])

  useEffect(() => {
    // Au montage (arrivée depuis une autre page)...
    goToHashSection()
    // ...et à chaque changement d'ancre pendant qu'on est déjà sur la page
    // (ex : cliquer sur "Cookies" alors qu'on est déjà sur "Mentions légales").
    window.addEventListener('hashchange', goToHashSection)
    return () => window.removeEventListener('hashchange', goToHashSection)
  }, [goToHashSection])

  // Gère l'extinction du surlignage séparément : ainsi le timer est toujours
  // nettoyé proprement (démontage du composant, ou nouvelle section ciblée
  // avant la fin des 2 secondes) au lieu de s'accumuler.
  useEffect(() => {
    if (!highlighted) return
    const timer = setTimeout(() => setHighlighted(null), 2000)
    return () => clearTimeout(timer)
  }, [highlighted])

  const sectionClass = (id) =>
    `-mx-3 px-3 py-2 rounded-lg transition-colors duration-700 ${
      highlighted === id ? 'bg-fresh-50 ring-2 ring-fresh-200' : ''
    }`

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<ShieldGlyph className="w-full h-full" />}
        tone="neutral"
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-7 space-y-6 text-neutral-600 leading-relaxed text-sm">
        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.publisherTitle}</h3>
          <p>{s.publisherText}</p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.hostingTitle}</h3>
          <p>{s.hostingText}</p>
        </section>

        <section id="vos-informations-personnelles" className={sectionClass('vos-informations-personnelles')}>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.personalDataTitle}</h3>
          <p>{s.personalDataText1}</p>
          <p className="mt-2">{s.personalDataText2}</p>
        </section>

        <section id="cookies" className={sectionClass('cookies')}>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.cookiesTitle}</h3>
          <p>{s.cookiesText}</p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.ipTitle}</h3>
          <p>{s.ipText}</p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.liabilityTitle}</h3>
          <p>{s.liabilityText}</p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">{s.contactTitle}</h3>
          <p>
            {s.contactPrefix}{' '}
            <button onClick={() => goTo('faq')} className="text-fresh-700 underline underline-offset-2">
              {s.contactFaq}
            </button>{' '}
            {s.contactSuffix}
          </p>
        </section>
      </div>
    </div>
  )
}
