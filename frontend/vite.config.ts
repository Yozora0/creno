import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En dev, le front appelle /api/... et Vite relaie vers Spring Boot : pas de souci de CORS.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
