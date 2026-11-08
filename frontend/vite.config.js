import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Vite config: adds the React plugin (JSX/HMR) and the Tailwind v4 plugin.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
