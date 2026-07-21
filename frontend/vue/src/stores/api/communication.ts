/**
 * Communication Layer for API Service
 * 
 * This module handles cross-service communication with minimal dependencies.
 * Uses the service registry to access other services without direct imports.
 */

import { getServiceAsync } from '../../services/serviceRegistry';

/**
 * Communication interface for cross-service integration
 */
export interface ApiCommunicationInterface {
  getConfigService(): Promise<any>;
  getErrorService(): Promise<any>;
  getMessagingService(): Promise<any>;
  reportError(error: any, context?: Record<string, any>): Promise<void>;
  notifyNetworkError(error: any): Promise<void>;
  notifyApiError(error: any, status?: number): Promise<void>;
  logApiEvent(event: string, data?: any): void;
  getApiConfig(): Promise<any>;
}

/**
 * Get config service for API settings
 */
export async function getConfigService(): Promise<any> {
  try {
    return await getServiceAsync('config');
  } catch (err) {
    console.warn('[API] Config service not available:', err);
    return null;
  }
}

/**
 * Get error service for error reporting
 */
export async function getErrorService(): Promise<any> {
  try {
    return await getServiceAsync('error');
  } catch (err) {
    console.warn('[API] Error service not available:', err);
    return null;
  }
}

/**
 * Get messaging service for notifications
 */
export async function getMessagingService(): Promise<any> {
  try {
    return await getServiceAsync('messaging');
  } catch (err) {
    console.warn('[API] Messaging service not available:', err);
    return null;
  }
}

/**
 * Get API configuration from config service
 */
export async function getApiConfig(): Promise<any> {
  const config = await getConfigService();
  if (config) {
    try {
      return await config.getApiConfig();
    } catch (err) {
      console.warn('[API] Failed to get API config:', err);
    }
  }
  
  // Fallback to environment variables
  return {
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    withCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true',
    cache: {
      enabled: import.meta.env.VITE_API_CACHE_ENABLED === 'true',
      ttl: parseInt(import.meta.env.VITE_API_CACHE_TTL || '60000', 10),
      maxSize: parseInt(import.meta.env.VITE_API_CACHE_MAX_SIZE || '100', 10),
    },
  };
}

/**
 * Report an API error to error service
 */
export async function reportError(error: any, context?: Record<string, any>): Promise<void> {
  const errorService = await getErrorService();
  if (errorService) {
    try {
      await errorService.handleApiError(error, {
        source: 'api',
        operation: context?.method || 'request',
        ...context,
      });
      return;
    } catch (err) {
      console.warn('[API] Error service failed:', err);
    }
  }

  // Fallback to console
  console.error('[API] Error:', error, context);
}

/**
 * Notify user of network error via messaging service
 */
export async function notifyNetworkError(error: any): Promise<void> {
  const messaging = await getMessagingService();
  if (messaging) {
    try {
      await messaging.error(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection.'
      );
    } catch (err) {
      console.warn('[API] Messaging service failed:', err);
    }
  }
}

/**
 * Notify user of API error via messaging service
 */
export async function notifyApiError(error: any, status?: number): Promise<void> {
  const messaging = await getMessagingService();
  if (messaging) {
    try {
      let title = 'API Error';
      let message = 'An error occurred while processing your request.';
      
      if (status === 401) {
        title = 'Authentication Required';
        message = 'Please log in to continue.';
      } else if (status === 403) {
        title = 'Access Denied';
        message = 'You do not have permission to access this resource.';
      } else if (status === 404) {
        title = 'Not Found';
        message = 'The requested resource was not found.';
      } else if (status === 429) {
        title = 'Too Many Requests';
        message = 'Please wait a moment before trying again.';
      } else if (status && status >= 500) {
        title = 'Server Error';
        message = 'The server encountered an error. Please try again later.';
      }
      
      await messaging.error(title, message);
    } catch (err) {
      console.warn('[API] Messaging service failed:', err);
    }
  }
}

/**
 * Log API event for debugging
 */
export function logApiEvent(event: string, data?: any): void {
  if (import.meta.env.DEV) {
    console.log(`[API Event] ${event}`, data);
  }
}
