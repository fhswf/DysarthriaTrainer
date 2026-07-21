/**
 * Localization Service - Live Implementation
 *
 * Provides real translation functionality with:
 * - Static locale loading with Vite glob imports
 * - Translation with interpolation
 * - Pluralization support
 * - Number and date formatting
 * - Locale persistence
 * - Fallback mechanism
 */

import type {
  LocalizationServiceInterface,
  LocalizationConfig,
  LocaleCode,
  LocaleInfo,
  LocaleMessages,
  TranslationParams,
  NumberFormat,
  DateFormat,
  DomainMessages,
} from './localization.types'
import { DEFAULT_LOCALIZATION_CONFIG, LOCALE_INFO } from './localization.types'
import { createLocalizationCommunication } from './communication'
import type { LocalizationCommunication } from './communication'

// Import locale files statically using Vite's glob import
// This avoids dynamic import issues and is better for bundling
const localeModules = import.meta.glob<{ default: LocaleMessages }>('@/locales/*/index.ts', {
  eager: true,
})

/**
 * Create live localization service implementation
 */
export function createLiveLocalizationService(): LocalizationServiceInterface {
  // Internal state
  let currentLocale: LocaleCode = DEFAULT_LOCALIZATION_CONFIG.defaultLocale
  let config: LocalizationConfig = { ...DEFAULT_LOCALIZATION_CONFIG }
  const messages: Record<LocaleCode, LocaleMessages | null> = {
    en: null,
    de: null,
  }
  const communication: LocalizationCommunication = createLocalizationCommunication()

  /**
   * Load locale messages from pre-imported modules
   */
  function loadLocale(locale: LocaleCode): LocaleMessages {
    try {
      // The glob import creates keys like '/src/locales/en/index.ts'
      // We need to find the matching module
      const matchingKey = Object.keys(localeModules).find((key) =>
        key.includes(`/locales/${locale}/index.ts`)
      )

      if (!matchingKey) {
        throw new Error(`Locale module not found: ${locale}`)
      }

      const localeModule = localeModules[matchingKey]
      return localeModule.default
    } catch (error) {
      communication.reportError(`Failed to load locale: ${locale}`, error as Error)
      throw error
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part]
      }
      return undefined
    }, obj) as string | undefined
  }

  /**
   * Interpolate parameters into a string
   */
  function interpolate(str: string, params: TranslationParams): string {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  /**
   * Get translation for a key with fallback
   */
  function getTranslation(key: string, locale: LocaleCode): string | undefined {
    const localeMessages = messages[locale]
    if (!localeMessages) return undefined

    return getNestedValue(localeMessages as unknown as Record<string, unknown>, key)
  }

  /**
   * Detect browser locale
   */
  function detectBrowserLocale(): LocaleCode | null {
    const browserLang = navigator.language.split('-')[0].toLowerCase()
    return config.availableLocales.includes(browserLang as LocaleCode)
      ? (browserLang as LocaleCode)
      : null
  }

  /**
   * Load locale from localStorage
   */
  function loadPersistedLocale(): LocaleCode | null {
    if (!config.persistLocale) return null

    try {
      const stored = localStorage.getItem(config.storageKey)
      if (stored && config.availableLocales.includes(stored as LocaleCode)) {
        return stored as LocaleCode
      }
    } catch (error) {
      communication.reportError('Failed to load persisted locale', error)
    }

    return null
  }

  /**
   * Save locale to localStorage
   */
  function persistLocale(locale: LocaleCode): void {
    if (!config.persistLocale) return

    try {
      localStorage.setItem(config.storageKey, locale)
    } catch (error) {
      communication.reportError('Failed to persist locale', error)
    }
  }

  // ============================================================================
  // Service Interface Implementation
  // ============================================================================

  return {
    async init(): Promise<void> {
      return Promise.resolve().then(() => {
        try {
          // Determine initial locale
          let initialLocale = config.defaultLocale

          // Try persisted locale first
          const persisted = loadPersistedLocale()
          if (persisted) {
            initialLocale = persisted
          }
          // Try browser detection if enabled
          else if (config.detectBrowserLocale) {
            const detected = detectBrowserLocale()
            if (detected) {
              initialLocale = detected
            }
          }

          // Load initial locale
          currentLocale = initialLocale
          messages[currentLocale] = loadLocale(currentLocale)

          // Pre-load fallback locale if different
          if (config.fallbackLocale !== currentLocale) {
            messages[config.fallbackLocale] = loadLocale(config.fallbackLocale)
          }
        } catch (error) {
          communication.reportError('Failed to initialize localization service', error as Error)
          throw error
        }
      })
    },

    t(key: string, params?: TranslationParams): string {
      // Try current locale
      let translation = getTranslation(key, currentLocale)

      // Fallback to fallback locale
      if (!translation && currentLocale !== config.fallbackLocale) {
        translation = getTranslation(key, config.fallbackLocale)
      }

      // Return key if not found
      if (!translation) {
        communication.reportError(`Translation not found: ${key}`)
        return key
      }

      // Interpolate parameters if provided
      if (params) {
        return interpolate(translation, params)
      }

      return translation
    },

    te(key: string): boolean {
      const translation = getTranslation(key, currentLocale)
      if (translation) return true

      // Check fallback
      if (currentLocale !== config.fallbackLocale) {
        return !!getTranslation(key, config.fallbackLocale)
      }

      return false
    },

    tc(key: string, count: number, params?: TranslationParams): string {
      const allParams: TranslationParams = {
        ...params,
        count,
      }

      // For now, simple implementation without plural rules
      // Can be extended with ICU message format or similar
      return this.t(key, allParams)
    },

    tm(key: string): DomainMessages | undefined {
      const localeMessages = messages[currentLocale]
      if (!localeMessages) return undefined

      const value = getNestedValue(localeMessages as unknown as Record<string, unknown>, key)
      // tm() is for getting message objects, not individual strings
      if (typeof value === 'object' && value !== null) {
        return value as DomainMessages
      }
      return undefined
    },

    n(value: number, format: NumberFormat = 'decimal'): string {
      try {
        const options: Intl.NumberFormatOptions = {}

        switch (format) {
          case 'currency':
            options.style = 'currency'
            options.currency = currentLocale === 'de' ? 'EUR' : 'USD'
            break
          case 'percent':
            options.style = 'percent'
            break
          default:
            options.style = 'decimal'
        }

        return new Intl.NumberFormat(currentLocale, options).format(value)
      } catch (error) {
        communication.reportError('Failed to format number', error)
        return String(value)
      }
    },

    d(value: Date, format: DateFormat = 'medium'): string {
      try {
        const options: Intl.DateTimeFormatOptions = {}

        switch (format) {
          case 'short':
            options.dateStyle = 'short'
            break
          case 'medium':
            options.dateStyle = 'medium'
            break
          case 'long':
            options.dateStyle = 'long'
            break
          case 'full':
            options.dateStyle = 'full'
            break
        }

        return new Intl.DateTimeFormat(currentLocale, options).format(value)
      } catch (error) {
        communication.reportError('Failed to format date', error)
        return value.toLocaleDateString()
      }
    },

    async setLocale(locale: LocaleCode): Promise<void> {
      if (!config.availableLocales.includes(locale)) {
        throw new Error(`Locale not available: ${locale}`)
      }

      const oldLocale = currentLocale

      // Load messages if not already loaded
      messages[locale] ??= loadLocale(locale)

      currentLocale = locale
      persistLocale(locale)

      // Notify about locale change
      await communication.notifyLocaleChange(oldLocale, locale)
    },

    getLocale(): LocaleCode {
      return currentLocale
    },

    getAvailableLocales(): LocaleInfo[] {
      return config.availableLocales.map((code) => LOCALE_INFO[code])
    },

    getLocaleInfo(locale: LocaleCode): LocaleInfo | undefined {
      return LOCALE_INFO[locale]
    },

    updateConfig(newConfig: Partial<LocalizationConfig>): void {
      config = { ...config, ...newConfig }
    },

    getConfig(): LocalizationConfig {
      return { ...config }
    },

    mergeMessages(newMessages: Partial<LocaleMessages>): void {
      const localeMessages = messages[currentLocale]
      if (!localeMessages) return

      messages[currentLocale] = {
        ...localeMessages,
        ...newMessages,
      } as LocaleMessages
    },
  }
}
