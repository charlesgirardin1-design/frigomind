// Petite bibliothèque d'illustrations maison (SVG en ligne, tracé simple,
// couleurs de la charte fresh/zest) utilisée pour habiller les en-têtes de
// page et les états vides, à la place des emoji seuls. Chaque glyphe est
// dessiné dans un viewBox 0 0 48 48, trait rond, `currentColor` pour hériter
// la couleur du conteneur (voir IllustrationTile).

// ---------- Fond "tuile illustrée" partagé ----------
// Reproduit le style des blobs flous déjà utilisés en page d'accueil, mais
// encapsulé pour être réutilisable partout (en-têtes, états vides, cartes).
const TONE_STYLES = {
  fresh: {
    bg: 'from-fresh-50 to-fresh-100/60',
    blobA: 'bg-fresh-300/50',
    blobB: 'bg-zest-200/40',
    icon: 'text-fresh-600',
  },
  zest: {
    bg: 'from-zest-50 to-zest-100/60',
    blobA: 'bg-zest-300/50',
    blobB: 'bg-fresh-200/40',
    icon: 'text-zest-600',
  },
  neutral: {
    bg: 'from-neutral-100 to-neutral-50',
    blobA: 'bg-neutral-300/40',
    blobB: 'bg-fresh-200/30',
    icon: 'text-neutral-500',
  },
}

const SIZE_STYLES = {
  sm: { tile: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
  md: { tile: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
  lg: { tile: 'w-24 h-24 rounded-3xl', icon: 'w-12 h-12' },
  xl: { tile: 'w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem]', icon: 'w-16 h-16 sm:w-20 sm:h-20' },
}

export function IllustrationTile({ tone = 'fresh', size = 'md', children, className = '' }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.fresh
  const s = SIZE_STYLES[size] || SIZE_STYLES.md

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br ${t.bg} ring-1 ring-black/5 shadow-card ${s.tile} ${className}`}
    >
      <div className={`pointer-events-none absolute -top-3 -left-3 w-10 h-10 rounded-full blur-xl ${t.blobA}`} aria-hidden />
      <div className={`pointer-events-none absolute -bottom-3 -right-3 w-10 h-10 rounded-full blur-xl ${t.blobB}`} aria-hidden />
      <div className={`relative ${s.icon} ${t.icon}`}>{children}</div>
    </div>
  )
}

// ---------- Glyphes ----------
// Tous en trait ("stroke"), rond, épaisseur ~3, pas de remplissage sauf
// accents ponctuels, pour rester cohérent d'un glyphe à l'autre.

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function FridgeGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <rect x="10" y="4" width="28" height="40" rx="5" />
      <line x1="10" y1="18" x2="38" y2="18" />
      <line x1="16" y1="9" x2="16" y2="14" />
      <line x1="16" y1="23" x2="16" y2="28" />
      <circle cx="30" cy="30" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PotGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <path d="M8 20h32l-2.5 16a4 4 0 0 1-4 3.5h-19a4 4 0 0 1-4-3.5L8 20Z" />
      <line x1="6" y1="20" x2="42" y2="20" />
      <path d="M14 20c0-5 4-9 10-9s10 4 10 9" />
      <path d="M18 6c-1.5 1.5-1.5 3 0 4.5" />
      <path d="M24 5c-1.5 1.5-1.5 3 0 4.5" />
      <path d="M30 6c-1.5 1.5-1.5 3 0 4.5" />
    </svg>
  )
}

export function HeartPlateGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <circle cx="24" cy="24" r="18" />
      <circle cx="24" cy="24" r="11" />
      <path d="M24 22c-2.4-3.4-8-2.6-8 1.8 0 3.6 4.6 6.4 8 9 3.4-2.6 8-5.4 8-9 0-4.4-5.6-5.2-8-1.8Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CalendarGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <rect x="6" y="9" width="36" height="33" rx="4" />
      <line x1="6" y1="18" x2="42" y2="18" />
      <line x1="15" y1="4" x2="15" y2="12" />
      <line x1="33" y1="4" x2="33" y2="12" />
      <circle cx="15" cy="27" r="2" fill="currentColor" stroke="none" />
      <circle cx="24" cy="27" r="2" fill="currentColor" stroke="none" />
      <circle cx="33" cy="27" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="34" r="2" fill="currentColor" stroke="none" />
      <circle cx="24" cy="34" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChartGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <line x1="7" y1="41" x2="41" y2="41" />
      <rect x="11" y="26" width="7" height="15" rx="1.5" />
      <rect x="21" y="17" width="7" height="24" rx="1.5" />
      <rect x="31" y="9" width="7" height="32" rx="1.5" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  )
}

export function BookGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <path d="M24 12c-4-3.5-9-4-15-3v27c6-1 11-0.5 15 3 4-3.5 9-4 15-3V9c-6-1-11-0.5-15 3Z" />
      <line x1="24" y1="12" x2="24" y2="39" />
    </svg>
  )
}

export function SearchGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <circle cx="21" cy="21" r="13" />
      <line x1="30.5" y1="30.5" x2="41" y2="41" />
      <path d="M15 21c0-3.5 2.7-6 6-6" />
    </svg>
  )
}

export function ShieldGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <path d="M24 5 8 11v11c0 11 7 17.5 16 21 9-3.5 16-10 16-21V11L24 5Z" />
      <path d="M16.5 24l5 5.5 10-11.5" />
    </svg>
  )
}

export function CompassGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M30 18l-4 10-10 4 4-10 10-4Z" fill="currentColor" stroke="none" opacity="0.9" />
      <circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SproutGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <path d="M24 42V24" />
      <path d="M24 24c0-8-6-13-14-13 0 8 6 13 14 13Z" />
      <path d="M24 20c0-6.5 5-10.5 11-10.5 0 6.5-5 10.5-11 10.5Z" />
    </svg>
  )
}

export function PartyGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <path d="M9 41 26 13l9 9L7 39" />
      <path d="M26 13l3-6" />
      <circle cx="36" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="41" cy="16" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="33" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="39" cy="23" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LockGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <rect x="10" y="21" width="28" height="20" rx="4" />
      <path d="M16 21v-6a8 8 0 0 1 16 0v6" />
      <circle cx="24" cy="30" r="2.2" fill="currentColor" stroke="none" />
      <line x1="24" y1="32" x2="24" y2="36" />
    </svg>
  )
}

export function ClockGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M24 14v10l7 5" />
    </svg>
  )
}

export function CameraGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" {...base} {...props}>
      <rect x="5" y="14" width="38" height="26" rx="5" />
      <path d="M17 14l2.5-5h9l2.5 5" />
      <circle cx="24" cy="27" r="7.5" />
      <circle cx="35" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
