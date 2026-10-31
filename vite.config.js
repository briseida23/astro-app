import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ES module workers: the rectification worker loads the ephemeris with a dynamic import.
  worker: { format: 'es' },
})
