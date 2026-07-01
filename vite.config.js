import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite : React + rechargement rapide, aucun réglage complexe nécessaire.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
