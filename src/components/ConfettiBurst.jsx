import { useEffect, useState } from 'react'

// Petite pluie de confettis discrète, déclenchée une seule fois quand des
// recettes viennent d'être générées avec succès (voir ResultsPage.jsx +
// state.justGenerated dans AppContext.jsx). Purement décoratif
// (pointer-events-none, aria-hidden) et éphémère : se retire tout seul via
// `onDone` une fois l'animation la plus longue terminée.
const COLORS = ['#22a86a', '#ff7a1a', '#43c084', '#ffbb6b', '#158a56', '#f05e0d', '#79d9a8']
const PIECE_COUNT = 22
const LIFETIME_MS = 1700

function makePieces() {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.25,
    duration: 1 + Math.random() * 0.6,
    rotate: Math.round(Math.random() * 360),
    drift: Math.round((Math.random() - 0.5) * 70),
    width: 5 + Math.round(Math.random() * 4),
    height: 8 + Math.round(Math.random() * 6),
  }))
}

export default function ConfettiBurst({ onDone }) {
  const [pieces] = useState(makePieces)

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), LIFETIME_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 h-0 z-50 overflow-visible" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm animate-confettiFall"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rotate': `${p.rotate}deg`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
