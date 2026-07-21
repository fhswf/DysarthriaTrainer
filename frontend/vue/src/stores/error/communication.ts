/**
 * Error Service Communication Layer
 * 
 * Handles cross-service communication for the Error Service.
 * Accesses Messaging, Config, and other services via the service registry.
 */

import { getServiceAsync } from '@/services/serviceRegistry';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ]);
}

export async function getMessagingService() {
  try {
    return await withTimeout(getServiceAsync('messaging'), 100);
  } catch {
    return null;
  }
}

export async function getConfigService() {
  try {
    return await withTimeout(getServiceAsync('config'), 100);
  } catch {
    return null;
  }
}

/**
 * Get error service configuration from config service
 */
export async function getErrorConfig(): Promise<any> {
  const config = await getConfigService();
  if (config) {
    try {
      const errorConfig = await config.get('error');
      if (errorConfig) {
        return {
          autoRecovery: errorConfig.autoRecovery ?? true,
          userNotifications: errorConfig.userNotifications ?? true,
          reporting: errorConfig.reporting ?? true,
          consoleLog: errorConfig.consoleLog ?? true,
          display: errorConfig.display ?? true,
          maxHistory: errorConfig.maxHistory || 100,
          maxRecoveryAttempts: errorConfig.maxRecoveryAttempts || 3,
        };
      }
    } catch (err) {
      console.warn('[Error] Failed to get error config:', err);
    }
  }

  // Fallback to environment variables
  return {
    autoRecovery: import.meta.env.VITE_ERROR_AUTO_RECOVERY !== 'false',
    userNotifications: import.meta.env.VITE_ERROR_USER_NOTIFICATIONS !== 'false',
    reporting: import.meta.env.VITE_ERROR_REPORTING !== 'false',
    consoleLog: import.meta.env.VITE_ERROR_CONSOLE_LOG !== 'false',
    display: import.meta.env.VITE_ERROR_DISPLAY !== 'false',
    maxHistory: parseInt(import.meta.env.VITE_ERROR_MAX_HISTORY || '100', 10),
    maxRecoveryAttempts: parseInt(import.meta.env.VITE_ERROR_MAX_RECOVERY_ATTEMPTS || '3', 10),
  };
}

export async function notifyUserOfError(error: any): Promise<void> {
  // Skip in test environment to avoid hanging
  if (import.meta.env.VITEST) {
    return;
  }
  
  try {
    const messaging = await getMessagingService();
    if (messaging) {
      const severity = error.severity || 'medium';
      const message = error.userMessage || error.message || 'An error occurred';
      
      switch (severity) {
        case 'critical':
        case 'high':
          await messaging.error(message);
          break;
        case 'medium':
          await messaging.warn(message);
          break;
        default:
          await messaging.info(message);
      }
    }
  } catch (err) {
    console.error('[ERROR SERVICE] Failed to notify user:', err);
  }
}

export async function logErrorToConsole(error: any): Promise<void> {
  const config = await getConfigService();
  const enableConsoleLog = config?.get?.('error.enableConsoleLog') ?? true;

  if (enableConsoleLog) {
    console.error('[ERROR SERVICE]', {
      id: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack,
    });
  }
}

export async function reportErrorToBackend(error: any): Promise<void> {
  try {
    const config = await getConfigService();
    const enableReporting = config?.get?.('error.enableErrorReporting') ?? false;

    if (!enableReporting) {
      return;
    }

    // In a real implementation, this would send the error to a backend endpoint
    // For now, just log it
    console.log('[ERROR SERVICE] Would report error to backend:', {
      id: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      timestamp: error.timestamp,
    });
  } catch (err) {
    console.error('[ERROR SERVICE] Failed to report error:', err);
  }
}

export async function notifyErrorRecovered(error: any): Promise<void> {
  // Skip in test environment
  if (import.meta.env.VITEST) {
    return;
  }
  
  try {
    const messaging = await getMessagingService();
    if (messaging) {
      await messaging.success('Connection restored', 'The issue has been resolved.');
    }
  } catch (err) {
    console.error('[ERROR SERVICE] Failed to notify recovery:', err);
  }
}
