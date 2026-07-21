/**
 * Localization Service - Mock Implementation
 * 
 * Provides mock translation functionality for testing.
 * Uses hardcoded translations and predictable behavior.
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
} from './localization.types';
import { DEFAULT_LOCALIZATION_CONFIG, LOCALE_INFO } from './localization.types';

/**
 * Mock translations for testing
 */
const MOCK_MESSAGES: Record<LocaleCode, LocaleMessages> = {
  en: {
    common: {
      ok: 'OK',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      username: 'Username',
      password: 'Password',
    },
    navigation: {
      home: 'Home',
      dashboard: 'Dashboard',
    },
    patients: {
      title: 'Patients',
      create: 'Create Patient',
    },
    
    validation: {
      required: '{field} is required',
      email: 'Invalid email address',
      minLength: '{field} must be at least {min} characters',
      min: '{field} must be at least {min}',
    },
    errors: {
      network: 'Network error occurred',
      server: 'Server error occurred',
    },
    messages: {
      welcome: 'Welcome, {name}!',
      saveSuccess: '{item} saved successfully',
    },
  },
  de: {
    common: {
      ok: 'OK',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      confirm: 'Bestätigen',
      success: 'Erfolg',
      warning: 'Warnung',
      close: 'Schließen',
    },
    auth: {
      login: 'Anmelden',
      logout: 'Abmelden',
      username: 'Benutzername',
      password: 'Passwort',
    },
    navigation: {
      home: 'Startseite',
      dashboard: 'Dashboard',
    },
    patients: {
      title: 'Patienten',
      create: 'Patient erstellen',
    },
    validation: {
      required: '{field} ist erforderlich',
      email: 'Ungültige E-Mail-Adresse',
      minLength: '{field} muss mindestens {min} Zeichen lang sein',
      min: '{field} muss mindestens {min} sein',
    },
    errors: {
      network: 'Netzwerkfehler aufgetreten',
      server: 'Serverfehler aufgetreten',
    },
    messages: {
      welcome: 'Willkommen, {name}!',
      saveSuccess: '{item} erfolgreich gespeichert',
    },
  },
};

/**
 * Create mock localization service implementation
 */
export function createMockLocalizationService(): LocalizationServiceInterface {
  let currentLocale: LocaleCode = DEFAULT_LOCALIZATION_CONFIG.defaultLocale;
  let config: LocalizationConfig = { ...DEFAULT_LOCALIZATION_CONFIG };
  // Create a deep copy of messages to avoid mutation issues
  const messages: Record<LocaleCode, LocaleMessages> = {
    en: JSON.parse(JSON.stringify(MOCK_MESSAGES.en)),
    de: JSON.parse(JSON.stringify(MOCK_MESSAGES.de)),
  };

  /**
   * Get nested value from object using dot notation
   */
  function getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Interpolate parameters into a string
   */
  function interpolate(str: string, params: TranslationParams): string {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  return {
    async init(): Promise<void> {
      // Mock initialization - nothing to do
      return Promise.resolve();
    },

    t(key: string, params?: TranslationParams): string {
      let translation = getNestedValue(messages[currentLocale], key);
      
      // Fallback
      if (!translation && currentLocale !== config.fallbackLocale) {
        translation = getNestedValue(messages[config.fallbackLocale], key);
      }
      
      // Return key if not found
      if (!translation) {
        return key;
      }
      
      // Interpolate
      if (params) {
        return interpolate(translation, params);
      }
      
      return translation;
    },

    te(key: string): boolean {
      const translation = getNestedValue(messages[currentLocale], key);
      if (translation) return true;
      
      // Check fallback
      if (currentLocale !== config.fallbackLocale) {
        return !!getNestedValue(messages[config.fallbackLocale], key);
      }
      
      return false;
    },

    tc(key: string, count: number, params?: TranslationParams): string {
      const allParams: TranslationParams = {
        ...params,
        count,
      };
      return this.t(key, allParams);
    },

    tm(key: string): DomainMessages | undefined {
      const value = getNestedValue(messages[currentLocale], key);
      if (typeof value === 'object' && value !== null) {
        return value as DomainMessages;
      }
      return undefined;
    },

    n(value: number, format: NumberFormat = 'decimal'): string {
      // Simple mock formatting
      if (currentLocale === 'de') {
        return value.toFixed(2).replace('.', ',');
      }
      return value.toFixed(2);
    },

    d(value: Date, format: DateFormat = 'medium'): string {
      // Simple mock formatting
      if (currentLocale === 'de') {
        return value.toLocaleDateString('de-DE');
      }
      return value.toLocaleDateString('en-US');
    },

    async setLocale(locale: LocaleCode): Promise<void> {
      if (!config.availableLocales.includes(locale)) {
        throw new Error(`Locale not available: ${locale}`);
      }
      currentLocale = locale;
    },

    getLocale(): LocaleCode {
      return currentLocale;
    },

    getAvailableLocales(): LocaleInfo[] {
      return config.availableLocales.map(code => LOCALE_INFO[code]);
    },

    getLocaleInfo(locale: LocaleCode): LocaleInfo | undefined {
      return LOCALE_INFO[locale];
    },

    updateConfig(newConfig: Partial<LocalizationConfig>): void {
      config = { ...config, ...newConfig };
    },

    getConfig(): LocalizationConfig {
      return { ...config };
    },

    mergeMessages(newMessages: Partial<LocaleMessages>): void {
      // Merge into local copy of messages
      messages[currentLocale] = {
        ...messages[currentLocale],
        ...newMessages,
      } as LocaleMessages;
    },
  };
}
