import { useEffect, useState, useCallback } from 'react'
import { useApp } from '../state/AppContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { ShieldGlyph } from '../components/Illustrations.jsx'

// Page "Mentions légales / Confidentialité". Contenu générique de MVP :
// à personnaliser avec l'identité légale réelle de l'éditeur avant toute
// mise en production commerciale.
export default function LegalPage() {
  const { goTo } = useApp()
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
        title="Mentions légales & confidentialité"
        subtitle="Document type pour un projet MVP — à compléter avec l'identité légale réelle de l'éditeur avant toute exploitation commerciale."
      />

      <div className="mt-7 space-y-6 text-neutral-600 leading-relaxed text-sm">
        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Éditeur du site</h3>
          <p>
            FrigoMind est un projet édité par [Nom / raison sociale de l'éditeur — à compléter]. Pour
            toute question, contactez l'éditeur à l'adresse [email de contact à compléter].
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Hébergement</h3>
          <p>
            Le site est hébergé par Vercel Inc. Le code source est disponible sur GitHub. Aucune base de
            données serveur n'est utilisée : l'application fonctionne principalement côté navigateur.
          </p>
        </section>

        <section id="vos-informations-personnelles" className={sectionClass('vos-informations-personnelles')}>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Vos informations personnelles</h3>
          <p>
            Les photos que vous prenez sont envoyées à l'API Google Gemini (Google LLC) uniquement pour
            être analysées et détecter les aliments visibles, via une fonction serverless qui garde la clé
            API secrète côté serveur. FrigoMind ne stocke pas vos photos sur ses propres serveurs. Le
            traitement effectué par Google est soumis à sa propre politique de confidentialité.
          </p>
          <p className="mt-2">
            Votre historique de recettes générées est stocké uniquement en local dans votre navigateur
            (localStorage) : il n'est jamais transmis à un serveur FrigoMind et disparaît si vous videz
            les données de navigation de ce site.
          </p>
        </section>

        <section id="cookies" className={sectionClass('cookies')}>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Cookies</h3>
          <p>
            FrigoMind n'utilise pas de cookies de suivi publicitaire. Le localStorage du navigateur est
            utilisé uniquement pour conserver votre historique de recettes sur cet appareil.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Propriété intellectuelle</h3>
          <p>
            Le nom "FrigoMind", le contenu et le design de ce site sont la propriété de l'éditeur, sauf
            mention contraire. Les recettes proposées sont fournies à titre indicatif et ne remplacent pas
            un avis nutritionnel professionnel.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Responsabilité</h3>
          <p>
            L'analyse des ingrédients par IA peut comporter des erreurs ou approximations. Vérifiez
            toujours la fraîcheur et la comestibilité réelle de vos aliments avant de cuisiner : FrigoMind
            ne garantit pas l'exactitude de la détection automatique.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-neutral-900 mb-1.5">Contact</h3>
          <p>
            Pour toute question relative à ces mentions ou à vos données, utilisez la page{' '}
            <button onClick={() => goTo('faq')} className="text-fresh-700 underline underline-offset-2">
              FAQ
            </button>{' '}
            ou contactez directement l'éditeur du site.
          </p>
        </section>
      </div>
    </div>
  )
}
