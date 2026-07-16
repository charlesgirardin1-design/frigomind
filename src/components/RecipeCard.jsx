import { useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import { localizeRecipeName } from '../data/recipesDB.js'
import { extractCountryFlag } from '../utils/flag.js'

const LEVEL_STYLES = {
  facile: 'badge-fresh',
  moyen: 'badge-neutral',
}

// Angles (degrés) des particules de la petite explosion au moment où on
// ajoute une recette aux favoris — voir HeartBurst ci-dessous.
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const BURST_RADIUS = 16

// Petite explosion de particules autour du cœur, uniquement au moment où on
// AJOUTE un favori (pas au retrait, qui reste juste le "pop" existant) —
// chaque particule fixe sa distance/direction via --dx/--dy, une seule
// keyframe CSS (sparkBurst, voir tailwind.config.js) les anime toutes.
function HeartBurst() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {BURST_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180
        const dx = Math.round(Math.cos(rad) * BURST_RADIUS)
        const dy = Math.round(Math.sin(rad) * BURST_RADIUS)
        return (
          <span
            key={angle}
            className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-red-400 animate-sparkBurst"
            style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }}
          />
        )
      })}
    </span>
  )
}

// Carte compacte pour une recette, cliquable pour voir le détail complet.
// `onOpen` reçoit la recette entière (pas juste son id) : les recettes
// génériques réutilisent le même id d'une session à l'autre, donc seul
// l'objet complet permet de retrouver la bonne recette de façon fiable
// (favoris...).
export default function RecipeCard({ recipe, onOpen, isFavorite, onToggleFavorite, rating }) {
  const lang = useLanguage()
  const c = COMMON[lang].recipe
  // Compteur incrémenté à chaque clic sur le cœur : changer la `key` force React
  // à remonter le <span>, ce qui relance l'animation CSS à chaque clic (y compris
  // pour retirer un favori), sans dépendre d'un setTimeout à annuler.
  const [popTrigger, setPopTrigger] = useState(0)
  const [burstTrigger, setBurstTrigger] = useState(0)

  // Les recettes "cuisine du monde" ont leur drapeau intégré en fin de nom :
  // on l'en extrait pour l'afficher comme badge dédié sur l'icône plutôt
  // que noyé dans le titre.
  const displayName = localizeRecipeName(recipe, lang)
  const { flag, cleanName } = extractCountryFlag(displayName)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(recipe)
        }
      }}
      className="group card p-4 text-left w-full cursor-pointer hover:shadow-cardHover hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start justify-between gap-2">
        {/* Emoji dans une tuile colorée (comme les icon-badge de l'accueil)
            plutôt qu'un emoji flottant seul, pour donner plus de présence
            visuelle à chaque carte. Le drapeau pays (recettes du monde),
            s'il y en a un, est épinglé en badge sur le coin de la tuile. */}
        <div className="relative shrink-0">
          <div
            className={`icon-badge transition-transform duration-200 group-hover:scale-110 ${
              recipe.antiGaspi ? 'bg-zest-50' : 'bg-fresh-50'
            }`}
            aria-hidden
          >
            {recipe.emoji}
          </div>
          {flag && (
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white ring-1 ring-black/5 shadow-card flex items-center justify-center text-[11px] leading-none"
              aria-hidden
            >
              {flag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {recipe.antiGaspi && <span className="badge badge-zest whitespace-nowrap">{c.antiGaspi}</span>}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPopTrigger((n) => n + 1)
                if (!isFavorite) setBurstTrigger((n) => n + 1)
                onToggleFavorite(recipe)
              }}
              aria-label={isFavorite ? c.removeFromFavorites : c.addToFavorites}
              className={`relative text-lg leading-none transition ${
                isFavorite ? 'text-red-500' : 'text-neutral-300 hover:text-red-400'
              }`}
            >
              {burstTrigger > 0 && <HeartBurst key={burstTrigger} />}
              <span
                key={popTrigger}
                className={`inline-block ${popTrigger > 0 ? 'animate-heartPop' : ''}`}
              >
                {isFavorite ? '❤️' : '🤍'}
              </span>
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-2 font-semibold text-neutral-900 leading-snug">{cleanName}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="badge badge-neutral">⏱ {recipe.time} min</span>
        <span className={`badge ${LEVEL_STYLES[recipe.level] || 'badge-neutral'}`}>
          {c.level[recipe.level] || recipe.level}
        </span>
        <span className="badge badge-neutral capitalize">{c.cuisine[recipe.cuisine] || recipe.cuisine}</span>
        {/* Note perso en étoiles (favoris uniquement) : n'apparaît que si
            l'appelant fournit une note (voir FavoritesPage), sinon rien ne
            change pour les autres usages de RecipeCard. */}
        {rating > 0 && <span className="badge badge-zest whitespace-nowrap">⭐ {rating}/5</span>}
      </div>

      {recipe.missingIngredients?.length > 0 && (
        <p className="mt-2 text-xs text-neutral-400">
          {c.toBuy} : {recipe.missingIngredients.join(', ')}
        </p>
      )}

      <p className="mt-3 text-xs font-medium text-fresh-600">{c.seeRecipe}</p>
    </div>
  )
}
