/**
 * Error Service - Mock Implementation
 * 
 * Test implementation with simple console logging.
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
  ValidationError,
  ErrorContext,
  DisplayedError,
} from './error.types';

export function createMockService(): ErrorServiceInterface {
  const config: ErrorConfig = {
    enableAutoRecovery: false,
    enableUserNotifications: false,
    enableErrorReporting: false,
    enableConsoleLog: true,
    displayErrors: false,
    maxHistorySize: 10,
    maxRecoveryAttempts: 1,
  };

  const history: ErrorHistoryEntry[] = [];
  const displayedErrors: DisplayedError[] = [];
  const strategies = new Map<ErrorCategory, RecoveryStrategy[]>();

  let idCounter = 0;

  function generateId(): string {
    return `mock-error-${++idCounter}`;
  }

  // Initialization
  async function initialize(): Promise<void> {
    console.log('[ERROR SERVICE MOCK] Initialized');
  }

  function cleanup(): void {
    console.log('[ERROR SERVICE MOCK] Cleaned up');
    history.length = 0;
    displayedErrors.length = 0;
  }

  // Error handling
  async function handleError(error: any, context?: ErrorContext): Promise<ProcessedError> {
    const processedError: ProcessedError = {
      id: generateId(),
      originalError: error,
      category: categorizeError(error),
      severity: 'medium' as ErrorSeverity,
      message: error.message || 'Unknown error',
      userMessage: 'An error occurred',
      technicalMessage: error.message || 'Unknown error',
      recoverable: false,
      timestamp: new Date(),
      context,
    };

    console.log('[ERROR SERVICE MOCK] Handled error:', processedError);

    history.push({
      ...processedError,
      recovered: false,
      displayedToUser: false,
    });

    return processedError;
  }

  async function handleApiError(error: any, context?: ErrorContext): Promise<ProcessedError> {
    console.log('[ERROR SERVICE MOCK] Handled API error');
    return handleError(error, { ...context, source: 'api' });
  }

  async function handleValidationError(
    errors: ValidationError[],
    context?: ErrorContext
  ): Promise<ProcessedError> {
    console.log('[ERROR SERVICE MOCK] Handled validation error:', errors);
    return handleError({ validationErrors: errors }, { ...context, source: 'validation' });
  }

  async function handleNetworkError(error: any, context?: ErrorContext): Promise<ProcessedError> {
    console.log('[ERROR SERVICE MOCK] Handled network error');
    return handleError(error, { ...context, source: 'network' });
  }

  // Error processing
  function processError(error: any): ProcessedError {
    return {
      id: generateId(),
      originalError: error,
      category: 'unknown',
      severity: 'medium',
      message: error.message || 'Unknown error',
      userMessage: 'An error occurred',
      technicalMessage: error.message || 'Unknown error',
      recoverable: false,
      timestamp: new Date(),
    };
  }

  function categorizeError(error: any): ErrorCategory {
    if (error.status === 401) return 'authentication';
    if (error.status === 403) return 'authorization';
    if (error.validationErrors) return 'validation';
    if (error.code === 'NETWORK_ERROR') return 'network';
    return 'unknown';
  }

  // Error recovery
  async function attemptRecovery(error: ProcessedError): Promise<boolean> {
    console.log('[ERROR SERVICE MOCK] Attempted recovery for:', error.id);
    return false;
  }

  function registerRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    console.log('[ERROR SERVICE MOCK] Registered recovery strategy for:', category);
    if (!strategies.has(category)) {
      strategies.set(category, []);
    }
    strategies.get(category)!.push(strategy);
  }

  // Error history
  function getErrorHistory(options?: HistoryOptions): ErrorHistoryEntry[] {
    let filtered = [...history];

    if (options?.category) {
      filtered = filtered.filter(e => e.category === options.category);
    }

    if (options?.severity) {
      filtered = filtered.filter(e => e.severity === options.severity);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  function clearErrorHistory(): void {
    console.log('[ERROR SERVICE MOCK] Cleared error history');
    history.length = 0;
  }

  function getHistoryStats() {
    return {
      total: history.length,
      recovered: history.filter(e => e.recovered).length,
      byCategory: {},
      bySeverity: {},
    };
  }

  function getErrorStats() {
    return getHistoryStats();
  }

  // Error display
  function showError(error: ProcessedError): void {
    console.log('[ERROR SERVICE MOCK] Showing error:', error.userMessage);
    displayedErrors.push({
      id: error.id,
      error,
      displayedAt: new Date(),
      dismissed: false,
    });
  }

  function dismissError(id: string): void {
    console.log('[ERROR SERVICE MOCK] Dismissing error:', id);
    const index = displayedErrors.findIndex(e => e.id === id);
    if (index !== -1) {
      displayedErrors.splice(index, 1);
    }
  }

  function getDisplayedErrors(): DisplayedError[] {
    return [...displayedErrors];
  }

  // Configuration
  function updateConfiguration(newConfig: Partial<ErrorConfig>): void {
    console.log('[ERROR SERVICE MOCK] Updated config:', newConfig);
    Object.assign(config, newConfig);
  }

  function updateConfig(newConfig: Partial<ErrorConfig>): void {
    updateConfiguration(newConfig);
  }

  function getConfiguration(): ErrorConfig {
    return { ...config };
  }

  function getConfig(): ErrorConfig {
    return getConfiguration();
  }

  // Utilities
  function getSeverity(category: ErrorCategory): ErrorSeverity {
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

  return {
    // Initialization
    initialize,
    cleanup,

    // Error handling
    handleError,
    handleApiError,
    handleValidationError,
    handleNetworkError,

    // Error processing
    processError,
    categorizeError,

    // Error recovery
    attemptRecovery,
    registerRecoveryStrategy,

    // Error history
    getErrorHistory,
    clearErrorHistory,
    getHistoryStats,

    // Error display
    showError,
    dismissError,
    getDisplayedErrors,

    // Configuration
    updateConfiguration,
    getConfiguration,

    // Utilities (internal, not in interface)
  };
}
