import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The Swiss Ephemeris module, its WASM and the asteroid data load only after the main script runs,
 * one after another. Preload hints in index.html let the browser fetch them alongside the script.
 */
function preloadEphemeris() {
  let base = '/'
  return {
    name: 'preload-ephemeris',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return
      const files = Object.keys(ctx.bundle)
      const script = files.find((f) => /swisseph-[\w-]+\.js$/.test(f))
      const wasm = files.find((f) => /swisseph-[\w-]+\.wasm$/.test(f))
      // crossorigin="anonymous" matches fetch()'s same-origin credentials, so the preload is reused.
      const fetchHint = (href) => ({ tag: 'link', attrs: { rel: 'preload', href, as: 'fetch', crossorigin: 'anonymous' }, injectTo: 'head' })
      return [
        ...(script ? [{ tag: 'link', attrs: { rel: 'modulepreload', href: base + script }, injectTo: 'head' }] : []),
        ...(wasm ? [fetchHint(base + wasm)] : []),
        fetchHint(`${base}ephe/seas_18.se1`),
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadEphemeris()],
  // ES module workers: the rectification worker loads the ephemeris with a dynamic import.
  worker: { format: 'es' },
})
