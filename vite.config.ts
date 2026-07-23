import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base path: no GitHub Pages (projeto) o app é servido em /<repo>/.
// O workflow do GitHub Actions injeta VITE_BASE automaticamente.
// Em dev/local usa '/'.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Orange Finance',
        short_name: 'Orange',
        description: 'Seu gerenciador financeiro pessoal — rápido, bonito e 100% offline.',
        lang: 'pt-BR',
        theme_color: '#0F1115',
        background_color: '#0F1115',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        shortcuts: [
          { name: 'Nova despesa', url: `${base}#/app/nova?tipo=despesa` },
          { name: 'Nova receita', url: `${base}#/app/nova?tipo=receita` },
          { name: 'Relatórios', url: `${base}#/app/relatorios` }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // O bundle principal passa de 2 MB; eleva o limite para precache offline.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } }
          }
        ]
      }
    })
  ],
  build: { target: 'es2020', sourcemap: false }
});
