import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // equivalent to 0.0.0.0
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.nip.io', // Allow all nip.io subdomains
    ],
    proxy: {
      // Forward API calls to the backend container so relative
      // VITE_API_BASE_URL=/ (see .env.development) works during `docker compose up`.
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
  ],
  optimizeDeps: {
    include: ['dayjs'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
