/**
 * Validation Service Communication Layer
 *
 * Handles cross-service communication for the validation service.
 * Isolates dependencies on API, Messaging, and i18n services.
 */

import { getServiceAsync } from '@/services/serviceRegistry';

export interface ValidationCommunicationInterface {
  getApiService(): Promise<any>;
  getMessagingService(): Promise<any>;
  showValidationError(field: string, message: string): Promise<void>;
  checkUniqueValue(endpoint: string, field: string, value: unknown): Promise<boolean>;
}

/**
 * Create validation communication instance
 */
export const createValidationCommunication = (): ValidationCommunicationInterface => {
  return {
    /**
     * Get API service for remote validation
     */
    async getApiService() {
      try {
        return await getServiceAsync('api');
      } catch (err) {
        console.warn('API service not available for validation:', err);
        return null;
      }
    },

    /**
     * Get messaging service for showing validation errors
     */
    async getMessagingService() {
      try {
        return await getServiceAsync('messaging');
      } catch (err) {
        console.warn('Messaging service not available for validation:', err);
        return null;
      }
    },

    /**
     * Show validation error via messaging service
     */
    async showValidationError(field: string, message: string) {
      try {
        const messaging = await getServiceAsync('messaging');
        if (messaging) {
          await messaging.error(`Validation Error (${field})`, message);
        }
      } catch (err) {
        console.error('Failed to show validation error:', err);
      }
    },

    /**
     * Check if value is unique via API
     * Used for async validation (email uniqueness, username availability, etc.)
     */
    async checkUniqueValue(endpoint: string, field: string, value: unknown): Promise<boolean> {
      try {
        const api = await getServiceAsync('api');
        if (api) {
          const response = await api.post(endpoint, { [field]: value });
          return response.data.isUnique ?? true;
        }
        return true; // Assume valid if API not available
      } catch (err) {
        console.error('Failed to check unique value:', err);
        return true; // Don't block on API errors
      }
    },
  };
};
