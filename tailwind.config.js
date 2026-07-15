/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Vert "fraîcheur" — couleur principale de la marque
        fresh: {
          50: '#eefbf3',
          100: '#d5f5e0',
          200: '#aeeac7',
          300: '#79d9a8',
          400: '#43c084',
          500: '#22a86a',
          600: '#158a56',
          700: '#116e46',
          800: '#0f5738',
          900: '#0d4830',
        },
        // Orange "gourmand" — couleur d'accent / CTA secondaires
        zest: {
          50: '#fff7ed',
          100: '#ffedd4',
          200: '#ffd8a8',
          300: '#ffbb6b',
          400: '#ff943c',
          500: '#ff7a1a',
          600: '#f05e0d',
          700: '#c7460c',
          800: '#9e3811',
          900: '#7f3011',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        cardHover: '0 10px 28px rgba(15,23,42,0.12)',
        glow: '0 0 0 6px rgba(34,168,106,0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        popIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(12px,-14px) scale(1.05)' },
          '66%': { transform: 'translate(-10px,10px) scale(0.97)' },
        },
        // Petit "pop" tactile pour le cœur des favoris (scale avec léger rebond)
        heartPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        // Révélation progressive (translation + fondu), pensée pour être enchaînée
        // avec un délai croissant (effet stagger) sur une grille de cartes.
        rise: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        // Dégradé qui glisse en boucle, utilisé sur le texte de marque/accent.
        gradientShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Dérive organique (translation diagonale + fondu + micro-rotation),
        // pensée pour de petits emojis "en orbite" autour d'une icône —
        // volontairement moins régulière que `float`/`blob` pour un rendu
        // plus vivant (voir la page "Bientôt disponible").
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 0.35 },
          '35%': { transform: 'translate(var(--drift-x, 10px), calc(var(--drift-y, -14px) * -1)) rotate(-8deg) scale(1.08)', opacity: 1 },
          '70%': { transform: 'translate(calc(var(--drift-x, 10px) * -0.6), calc(var(--drift-y, -14px) * 0.5)) rotate(6deg) scale(0.96)', opacity: 0.7 },
        },
        // Bandeau lumineux qui balaie une barre de progression indéterminée,
        // pour un rendu "en construction" (voir la page "Bientôt disponible").
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(350%)' },
        },
        // Feuillet de calendrier qui bascule (rotation 3D sur l'axe X),
        // rejoué à chaque changement de chiffre via un remount par `key`
        // (même trick que heartPop) — voir la page "Bientôt disponible".
        calendarFlip: {
          '0%': { transform: 'rotateX(0deg)', opacity: 1 },
          '45%': { transform: 'rotateX(90deg)', opacity: 0.2 },
          '55%': { transform: 'rotateX(-90deg)', opacity: 0.2 },
          '100%': { transform: 'rotateX(0deg)', opacity: 1 },
        },
        // Curseur clignotant façon machine à écrire (voir la page
        // "Bientôt disponible").
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        popIn: 'popIn 0.2s ease-out both',
        float: 'float 4.5s ease-in-out infinite',
        blob: 'blob 12s ease-in-out infinite',
        heartPop: 'heartPop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        rise: 'rise 0.5s ease-out both',
        gradientShift: 'gradientShift 5s ease-in-out infinite',
        drift: 'drift 5s ease-in-out infinite',
        indeterminate: 'indeterminate 1.7s ease-in-out infinite',
        calendarFlip: 'calendarFlip 0.6s ease-in-out both',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
