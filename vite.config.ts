import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'masked-icon.svg'],
      manifest: {
        id: '/',
        name: 'Kitchen Toolbox',
        short_name: 'Kitchen',
        description: 'Everyday cooking and baking utilities.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#1c140f',
        background_color: '#1c140f',
        related_applications: [
          {
            platform: 'webapp',
            url: '/manifest.webmanifest',
            id: '/'
          }
        ],
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: 'masked-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
