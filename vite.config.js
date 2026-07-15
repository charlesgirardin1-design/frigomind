import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite : React + rechargement rapide, aucun réglage complexe nécessaire.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  define: {
    // Vercel renseigne automatiquement ces variables au build (aucune config
    // nécessaire côté projet) — on les expose au bundle client pour les
    // afficher sur la page admin ("dernier commit déployé"). En local
    // (npm run dev / build hors Vercel), ces valeurs sont simplement vides.
    __BUILD_COMMIT__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)),
    __BUILD_COMMIT_MESSAGE__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_MESSAGE || ''),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
