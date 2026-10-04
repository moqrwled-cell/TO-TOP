import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'نحو الأفضل',
        short_name: 'نحو الأفضل',
        description: 'تطبيق تنظيم الوقت، العبادات، والأهداف',
        theme_color: '#1a1a1a',
        background_color: '#0f0f0f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192x192.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/icon-512x512.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
