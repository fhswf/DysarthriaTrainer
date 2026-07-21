/**
 * Communication Layer for Messaging Service
 * 
 * This module handles cross-service communication with minimal dependencies.
 * Uses the service registry to access other services without direct imports.
 */

import { getServiceAsync } from '../../services/serviceRegistry';

/**
 * Get config service for messaging settings
 */
export async function getConfigService(): Promise<any> {
  try {
    return await getServiceAsync('config');
  } catch (err) {
    console.warn('[Messaging] Config service not available:', err);
    return null;
  }
}

/**
 * Get messaging configuration from config service
 */
export async function getMessagingConfig(): Promise<any> {
  const config = await getConfigService();
  if (config) {
    try {
      const messagingConfig = await config.get('messaging');
      if (messagingConfig) {
        return {
          maxMessages: messagingConfig.maxMessages || 1000,
          defaultToastLife: messagingConfig.defaultToastLife || 3000,
          debounceTime: messagingConfig.debounceTime || 1000,
          toastPosition: messagingConfig.toastPosition || 'top-right',
          enablePersistence: messagingConfig.enablePersistence ?? true,
        };
      }
    } catch (err) {
      console.warn('[Messaging] Failed to get messaging config:', err);
    }
  }
  
  // Fallback to environment variables
  return {
    maxMessages: parseInt(import.meta.env.VITE_MESSAGING_MAX_MESSAGES || '1000', 10),
    defaultToastLife: parseInt(import.meta.env.VITE_MESSAGING_DEFAULT_TOAST_LIFE || '3000', 10),
    debounceTime: parseInt(import.meta.env.VITE_MESSAGING_DEBOUNCE_TIME || '1000', 10),
    toastPosition: import.meta.env.VITE_MESSAGING_TOAST_POSITION || 'top-right',
    enablePersistence: import.meta.env.VITE_MESSAGING_ENABLE_PERSISTENCE !== 'false',
  };
}

/**
 * Reports a configuration error to the messaging service
 */
export function reportConfigError(error: string, context?: Record<string, any>): void {
  try {
    // This is here for future use - currently just logs
    console.error('[Messaging] Config error:', error, context);
  } catch (err) {
    console.error('[Messaging] Failed to report config error:', err);
  }
}

/**
 * Logs a messaging service event
 */
export function logMessagingEvent(event: string, data?: any): void {
  if (import.meta.env.DEV) {
    console.log(`[Messaging Event] ${event}`, data);
  }
}
