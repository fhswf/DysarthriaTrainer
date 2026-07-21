/**
 * Localization Service - Communication Layer
 *
 * Handles cross-service communication for the localization service.
 * Provides async-safe access to messaging and config services.
 */

import type { MessagingServiceInterface } from '@/stores/messaging/messaging.types'
import type { ConfigServiceInterface } from '@/stores/config/config.types'
import { getServiceAsync } from '@/services/serviceRegistry'
import type { LocaleCode } from './localization.types'

/**
 * Communication interface for localization service
 */
export interface LocalizationCommunication {
  /**
   * Get messaging service for notifications
   * @returns Messaging service or null if not available
   */
  getMessagingService(): Promise<MessagingServiceInterface | null>

  /**
   * Get config service for configuration integration
   * @returns Config service or null if not available
   */
  getConfigService(): Promise<ConfigServiceInterface | null>

  /**
   * Notify other services about locale change
   * @param oldLocale Previous locale
   * @param newLocale New locale
   */
  notifyLocaleChange(oldLocale: LocaleCode, newLocale: LocaleCode): Promise<void>

  /**
   * Report an error
   * @param error Error message
   * @param details Optional error details
   */
  reportError(error: string, details?: unknown): void
}

/**
 * Create localization communication layer
 */
export function createLocalizationCommunication(): LocalizationCommunication {
  return {
    async getMessagingService(): Promise<MessagingServiceInterface | null> {
      try {
        return await getServiceAsync<MessagingServiceInterface>('messaging')
      } catch {
        return null
      }
    },

    async getConfigService(): Promise<ConfigServiceInterface | null> {
      try {
        return await getServiceAsync<ConfigServiceInterface>('config')
      } catch {
        return null
      }
    },

    async notifyLocaleChange(oldLocale: LocaleCode, newLocale: LocaleCode): Promise<void> {
      try {
        const messaging = await this.getMessagingService()
        if (messaging) {
          // Optional: Notify user about locale change
          // messaging.info('Language Changed', `Switched from ${oldLocale} to ${newLocale}`);
        }

        // Emit custom event for other components
        window.dispatchEvent(
          new CustomEvent('locale-changed', {
            detail: { oldLocale, newLocale },
          })
        )
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to notify locale change:', error)
      }
    },

    reportError(error: string, details?: unknown): void {
      // eslint-disable-next-line no-console
      console.error(`[Localization Service] ${error}`, details)
    },
  }
}
