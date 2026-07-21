/**
 * Localization Service - Pinia Store
 *
 * Provides centralized access to localization functionality with reactivity.
 * Uses live implementation in production, mock in tests.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  LocalizationServiceInterface,
  LocaleCode,
  LocalizationConfig,
  LocaleMessages,
} from './localization.types'

// Determine which implementation to use
const useLive = import.meta.env.MODE !== 'test'

// Dynamically import the appropriate implementation
let implPromise: Promise<LocalizationServiceInterface>

if (useLive) {
  implPromise = import('./localization.live').then((m) => m.createLiveLocalizationService())
} else {
  implPromise = import('./localization.mock').then((m) => m.createMockLocalizationService())
}

/**
 * Localization store with reactive locale switching
 */
export const useLocalizationStore = defineStore('localization', () => {
  let impl: LocalizationServiceInterface | null = null

  // Reactive state for current locale
  const currentLocale = ref<LocaleCode>('en')
  const initialized = ref(false)

  // Ensure implementation is loaded
  async function ensureImpl(): Promise<LocalizationServiceInterface> {
    impl ??= await implPromise
    return impl
  }

  return {
    // Reactive state
    currentLocale: computed(() => currentLocale.value),
    initialized: computed(() => initialized.value),

    // Initialization
    async init() {
      const service = await ensureImpl()
      await service.init()
      // Update reactive state
      currentLocale.value = service.getLocale()
      initialized.value = true
    },

    // Translation (synchronous after init)
    t(key: string, params?: Record<string, string | number>) {
      if (!impl) {
        // eslint-disable-next-line no-console
        console.warn('Localization service not initialized yet')
        return key
      }
      return impl.t(key, params)
    },

    te(key: string) {
      if (!impl) return false
      return impl.te(key)
    },

    tc(key: string, count: number, params?: Record<string, string | number>) {
      if (!impl) {
        // eslint-disable-next-line no-console
        console.warn('Localization service not initialized yet')
        return key
      }
      return impl.tc(key, count, params)
    },

    tm(key: string) {
      if (!impl) return undefined
      return impl.tm(key)
    },

    // Formatting
    n(value: number, format?: 'decimal' | 'currency' | 'percent') {
      if (!impl) return String(value)
      return impl.n(value, format)
    },

    d(value: Date, format?: 'short' | 'medium' | 'long' | 'full') {
      if (!impl) return value.toLocaleDateString()
      return impl.d(value, format)
    },

    // Locale management
    async setLocale(locale: LocaleCode) {
      const service = await ensureImpl()
      await service.setLocale(locale)
      // Update reactive state to trigger component updates
      currentLocale.value = locale
    },

    getLocale() {
      if (!impl) return currentLocale.value
      return impl.getLocale()
    },

    async getAvailableLocales() {
      const service = await ensureImpl()
      return service.getAvailableLocales()
    },

    async getLocaleInfo(locale: LocaleCode) {
      const service = await ensureImpl()
      return service.getLocaleInfo(locale)
    },

    // Configuration
    async updateConfig(config: Partial<LocalizationConfig>) {
      const service = await ensureImpl()
      return service.updateConfig(config)
    },

    async getConfig() {
      const service = await ensureImpl()
      return service.getConfig()
    },

    // Messages
    async mergeMessages(messages: Partial<LocaleMessages>) {
      const service = await ensureImpl()
      return service.mergeMessages(messages)
    },
  }
})
