/**
 * Error Service - Live Implementation
 * 
 * Production error handling service with recovery, history, and notifications.
 * Processes errors, manages recovery strategies, and integrates with Messaging service.
 */

import type {
  ErrorServiceInterface,
  ProcessedError,
  ErrorConfig,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ErrorHistoryEntry,
  HistoryOptions,
} from './error.types';
import { ErrorCategories } from './core/errorCategories';
import { ErrorProcessor } from './core/errorProcessor';
import { ErrorHistory } from './features/errorHistory';
import { ErrorRecovery } from './features/errorRecovery';
import {
  notifyUserOfError,
  logErrorToConsole,
  reportErrorToBackend,
  notifyErrorRecovered,
} from './communication';

export function createLiveService(): ErrorServiceInterface {
  const config: ErrorConfig = {
    enableAutoRecovery: true,
    enableUserNotifications: true,
    enableErrorReporting: true,
    enableConsoleLog: true,
    displayErrors: true,
    maxHistorySize: 100,
    maxRecoveryAttempts: 3,
  };

  const categories = new ErrorCategories();
  const processor = new ErrorProcessor(categories);
  const history = new ErrorHistory(config.maxHistorySize);
  const recovery = new ErrorRecovery();

  // Track displayed errors to avoid duplicates
  const displayedErrors = new Map<string, Date>();
  const displayedErrorsList: any[] = [];
  const DISPLAY_COOLDOWN_MS = 5000; // 5 seconds

  // Register default recovery strategies
  recovery.registerDefaultStrategies();

  // Error handling
  async function handleError(error: unknown, context?: any): Promise<ProcessedError> {
    const processedError = processor.process(error, context);
    
    // Log to console
    await logErrorToConsole(processedError);

    // Add to history
    const historyEntry: ErrorHistoryEntry = {
      ...processedError,
      recovered: false,
      displayedToUser: false,
    };
    history.add(historyEntry);

    // Attempt recovery if enabled and error is recoverable
    if (config.enableAutoRecovery && processedError.recoverable) {
      try {
        await recovery.attemptRecovery(processedError, config.maxRecoveryAttempts);
        
        // Update history entry as recovered
        historyEntry.recovered = true;
        historyEntry.recoveredAt = new Date();

        // Notify user of recovery
        await notifyErrorRecovered(processedError);

        return processedError;
      } catch (recoveryError) {
        // Recovery failed, continue with error handling
      }
    }

    // Notify user if enabled and not recently displayed
    if (config.enableUserNotifications) {
      const shouldDisplay = !isRecentlyDisplayed(processedError.id);
      if (shouldDisplay) {
        await notifyUserOfError(processedError);
        displayedErrors.set(processedError.id, new Date());
        historyEntry.displayedToUser = true;
      }
    }

    // Report to backend if enabled
    if (config.enableErrorReporting) {
      await reportErrorToBackend(processedError);
    }

    return processedError;
  }

  function isRecentlyDisplayed(errorId: string): boolean {
    const lastDisplayed = displayedErrors.get(errorId);
    if (!lastDisplayed) {
      return false;
    }
    
    const elapsed = Date.now() - lastDisplayed.getTime();
    if (elapsed > DISPLAY_COOLDOWN_MS) {
      displayedErrors.delete(errorId);
      return false;
    }
    
    return true;
  }

  async function handleValidationError(
    validationErrors: Array<{ field: string; message: string }>,
    context?: any
  ): Promise<ProcessedError> {
    const error = {
      message: 'Validation failed',
      validationErrors,
    };
    return handleError(error, { ...context, errorType: 'validation' });
  }

  async function handleNetworkError(error: unknown, context?: any): Promise<ProcessedError> {
    return handleError(error, { ...context, errorType: 'network' });
  }

  async function handleApiError(error: any, context?: any): Promise<ProcessedError> {
    return handleError(error, { ...context, errorType: 'api' });
  }

  // Recovery management
  function registerRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    recovery.registerStrategy(category, strategy);
  }

  async function attemptRecovery(error: ProcessedError): Promise<boolean> {
    try {
      await recovery.attemptRecovery(error, config.maxRecoveryAttempts);
      
      // Update history
      const historyEntry = history.getAll({ limit: 100 }).find(e => e.id === error.id);
      if (historyEntry) {
        historyEntry.recovered = true;
        historyEntry.recoveredAt = new Date();
      }

      await notifyErrorRecovered(error);
      return true;
    } catch {
      return false;
    }
  }

  // History management
  function getErrorHistory(options?: HistoryOptions): ErrorHistoryEntry[] {
    return history.getAll(options);
  }

  function clearErrorHistory(): void {
    history.clear();
  }

  function getErrorStats() {
    return history.getStats();
  }

  // Configuration
  function updateConfig(newConfig: Partial<ErrorConfig>): void {
    Object.assign(config, newConfig);
    
    if (newConfig.maxHistorySize !== undefined) {
      history.setMaxSize(newConfig.maxHistorySize);
    }
  }

  function getConfig(): ErrorConfig {
    return { ...config };
  }

  // Utility methods
  function categorizeError(error: unknown): ErrorCategory {
    return categories.categorize(error);
  }

  function getSeverity(category: ErrorCategory): ErrorSeverity {
    // Simple mapping for severity determination
    const severityMap: Record<ErrorCategory, ErrorSeverity> = {
      authentication: 'critical',
      configuration: 'critical',
      authorization: 'high',
      api: 'high',
      network: 'medium',
      validation: 'medium',
      runtime: 'low',
      unknown: 'low',
    };
    return severityMap[category] || 'low';
  }

  function isRecoverable(error: ProcessedError): boolean {
    return error.recoverable;
  }

  function getUserMessage(error: ProcessedError): string {
    return error.userMessage;
  }

  function getTechnicalMessage(error: ProcessedError): string {
    return error.technicalMessage;
  }

  // Initialization
  async function initialize(): Promise<void> {
    // Initialize error service (if needed)
  }

  function cleanup(): void {
    displayedErrors.clear();
    displayedErrorsList.length = 0;
    history.clear();
  }

  // Error processing
  function processError(error: any): ProcessedError {
    return processor.process(error);
  }

  // Error display
  function showError(error: ProcessedError): void {
    const displayedError = {
      id: error.id,
      error,
      displayedAt: new Date(),
      dismissed: false,
    };
    displayedErrorsList.push(displayedError);
    displayedErrors.set(error.id, new Date());
  }

  function dismissError(id: string): void {
    const index = displayedErrorsList.findIndex(e => e.id === id);
    if (index !== -1) {
      displayedErrorsList.splice(index, 1);
    }
    displayedErrors.delete(id);
  }

  function getDisplayedErrors(): any[] {
    return [...displayedErrorsList];
  }

  return {
    // Initialization
    initialize,
    cleanup,

    // Error handling
    handleError,
    handleValidationError,
    handleNetworkError,
    handleApiError,

    // Error processing
    processError,
    categorizeError,

    // Recovery
    registerRecoveryStrategy,
    attemptRecovery,

    // History
    getErrorHistory,
    clearErrorHistory,
    getHistoryStats: getErrorStats,

    // Display
    showError,
    dismissError,
    getDisplayedErrors,

    // Configuration
    updateConfiguration: updateConfig,
    getConfiguration: getConfig,

    // Utilities (internal only, not in interface)
  };
}
