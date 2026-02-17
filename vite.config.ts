import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SingTheVerse',
        short_name: 'SingVerse',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#0f172a',
        icons: []
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/kjv\.json$/,
            handler: 'CacheFirst',
            options: { cacheName: 'kjv-data' }
          }
        ]
      }
    })
  ]
});
