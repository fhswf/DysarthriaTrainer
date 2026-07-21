/**
 * Localization Service - Type Definitions
 * 
 * Provides TypeScript interfaces and types for the localization service.
 * Supports multiple languages with domain-based translation structure.
 */

// ============================================================================
// Locale Types
// ============================================================================

/**
 * Supported locale codes
 */
export type LocaleCode = 'en' | 'de';

/**
 * Information about a locale
 */
export interface LocaleInfo {
  code: LocaleCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Translation parameters for interpolation
 */
export type TranslationParams = Record<string, string | number>;

/**
 * Format options for number formatting
 */
export type NumberFormat = 'decimal' | 'currency' | 'percent';

/**
 * Format options for date formatting
 */
export type DateFormat = 'short' | 'medium' | 'long' | 'full';

// ============================================================================
// Message Structure Types
// ============================================================================

/**
 * Translation messages for a single domain
 */
export type DomainMessages = Record<string, string>;

/**
 * Complete locale messages structure
 */
export interface LocaleMessages {
  common: DomainMessages;
  auth: DomainMessages;
  navigation: DomainMessages;
  patients: DomainMessages;
  validation: DomainMessages;
  errors: DomainMessages;
  messages: DomainMessages;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Localization service configuration
 */
export interface LocalizationConfig {
  /** Default locale to use */
  defaultLocale: LocaleCode;
  
  /** Fallback locale when translation not found */
  fallbackLocale: LocaleCode;
  
  /** List of available locales */
  availableLocales: LocaleCode[];
  
  /** Whether to persist locale selection */
  persistLocale: boolean;
  
  /** Whether to detect browser locale on init */
  detectBrowserLocale: boolean;
  
  /** LocalStorage key for persisting locale */
  storageKey: string;
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Main localization service interface
 */
export interface LocalizationServiceInterface {
  /**
   * Initialize the localization service
   */
  init(): Promise<void>;
  
  /**
   * Translate a key with optional parameters
   * @param key Translation key (e.g., 'common.save')
   * @param params Optional interpolation parameters
   * @returns Translated string
   */
  t(key: string, params?: TranslationParams): string;
  
  /**
   * Check if a translation exists
   * @param key Translation key
   * @returns True if translation exists
   */
  te(key: string): boolean;
  
  /**
   * Translate with count-based selection (pluralization)
   * @param key Translation key
   * @param count Number for plural selection
   * @param params Optional interpolation parameters
   * @returns Translated string
   */
  tc(key: string, count: number, params?: TranslationParams): string;
  
  /**
   * Get all messages for a key (for objects)
   * @param key Translation key
   * @returns Messages object or undefined
   */
  tm(key: string): DomainMessages | undefined;
  
  /**
   * Format a number according to current locale
   * @param value Number to format
   * @param format Format type
   * @returns Formatted number string
   */
  n(value: number, format?: NumberFormat): string;
  
  /**
   * Format a date according to current locale
   * @param value Date to format
   * @param format Format type
   * @returns Formatted date string
   */
  d(value: Date, format?: DateFormat): string;
  
  /**
   * Set the current locale
   * @param locale Locale code to set
   */
  setLocale(locale: LocaleCode): Promise<void>;
  
  /**
   * Get the current locale
   * @returns Current locale code
   */
  getLocale(): LocaleCode;
  
  /**
   * Get information about available locales
   * @returns Array of locale information
   */
  getAvailableLocales(): LocaleInfo[];
  
  /**
   * Get information about a specific locale
   * @param locale Locale code
   * @returns Locale information or undefined
   */
  getLocaleInfo(locale: LocaleCode): LocaleInfo | undefined;
  
  /**
   * Update configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<LocalizationConfig>): void;
  
  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): LocalizationConfig;
  
  /**
   * Merge additional messages into current locale
   * @param messages Messages to merge
   */
  mergeMessages(messages: Partial<LocaleMessages>): void;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default localization configuration
 */
export const DEFAULT_LOCALIZATION_CONFIG: LocalizationConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  availableLocales: ['en', 'de'],
  persistLocale: true,
  detectBrowserLocale: true,
  storageKey: 'omnia-locale',
};

/**
 * Locale information registry
 */
export const LOCALE_INFO: Record<LocaleCode, LocaleInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
  },
};
