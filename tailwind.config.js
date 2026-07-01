/** @type {import('tailwindcss').Config} */
export default {
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
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        popIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        popIn: 'popIn 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
