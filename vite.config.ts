import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/armtemiy-lab/', // Важно для GitHub Pages
  plugins: [react(), tailwindcss()],
})
