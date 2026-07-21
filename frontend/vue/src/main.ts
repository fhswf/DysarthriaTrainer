import './assets/main.css'
import 'primeicons/primeicons.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import type { PrimeVueLocaleOptions } from 'primevue/config'
import locale from './locale.json'
import App from './App.vue'
import router from './router'
import dayjs from './dayjs-plugin'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primeuix/themes/aura'
import { bootstrapServices } from '@/services/serviceBootstrap'

// Extend Vue's global properties to include Day.js
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $dayjs: typeof dayjs
  }
}

const _locale = locale as Record<string, PrimeVueLocaleOptions>

/**
 * Initialize the application with service architecture
 */
async function initializeApp() {
  const app = createApp(App)

  // 1. Configure PrimeVue
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: false || 'none', // deactivates dark mode from system settings, why? error with html2canvas
      },
    },
    locale: _locale?.de,
  })
  app.use(ToastService)
  app.use(ConfirmationService)

  // 2. Install Pinia FIRST (required before service bootstrap)
  const pinia = createPinia()
  app.use(pinia)

  // 3. Bootstrap services (includes localization service)
  const bootstrapResult = await bootstrapServices({
    enableDevTools: import.meta.env.MODE === 'development',
    enablePerformanceTracking: true,
    enableMock: false,
  })

  if (!bootstrapResult.success) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Some services failed to initialize:', bootstrapResult.failedServices)
    // Application continues even if some services fail
  }

  // 4. Install router
  app.use(router)

  // 5. Make Day.js globally accessible
  app.config.globalProperties.$dayjs = dayjs

  // 6. Mount app
  app.mount('#app')

  // eslint-disable-next-line no-console
  console.log('🎉 Application initialized successfully')
}

// Start the app
initializeApp().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('💥 Failed to initialize application:', err)
})
