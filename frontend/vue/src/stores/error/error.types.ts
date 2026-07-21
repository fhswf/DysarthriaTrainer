/**
 * Error Service Type Definitions
 * 
 * Defines all TypeScript interfaces for the Error Service including
 * error categories, processed errors, recovery strategies, and configuration.
 */

export type ErrorCategory =
  | 'network'
  | 'api'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'configuration'
  | 'runtime'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProcessedError {
  id: string;
  originalError: any;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: Date;
  context?: ErrorContext;
  stack?: string;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export interface ErrorContext {
  source?: string;
  operation?: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface ErrorHistoryEntry extends ProcessedError {
  recovered: boolean;
  recoveredAt?: Date;
  displayedToUser: boolean;
}

export interface DisplayedError {
  id: string;
  error: ProcessedError;
  displayedAt: Date;
  dismissed: boolean;
}

export interface RecoveryStrategy {
  name: string;
  canRecover: (error: ProcessedError) => boolean;
  recover: (error: ProcessedError) => Promise<boolean>;
  maxAttempts?: number;
}

export interface HistoryOptions {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  since?: Date;
  limit?: number;
}

export interface ErrorConfig {
  enableAutoRecovery: boolean;
  maxRecoveryAttempts: number;
  enableErrorReporting: boolean;
  enableConsoleLog: boolean;
  enableUserNotifications: boolean;
  displayErrors: boolean;
  maxHistorySize: number;
}

export interface ErrorServiceInterface {
  // Initialization
  initialize(): Promise<void>;
  cleanup(): void;

  // Error handling
  handleError(error: any, context?: ErrorContext): Promise<ProcessedError>;
  handleApiError(error: any, context?: ErrorContext): Promise<ProcessedError>;
  handleValidationError(errors: ValidationError[], context?: ErrorContext): Promise<ProcessedError>;
  handleNetworkError(error: any, context?: ErrorContext): Promise<ProcessedError>;
  
  // Error processing
  processError(error: any): ProcessedError;
  categorizeError(error: any): ErrorCategory;
  
  // Error recovery
  attemptRecovery(error: ProcessedError): Promise<boolean>;
  registerRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void;
  
  // Error history
  getErrorHistory(options?: HistoryOptions): ErrorHistoryEntry[];
  clearErrorHistory(): void;
  getHistoryStats(): any;
  
  // Error display
  showError(error: ProcessedError): void;
  dismissError(id: string): void;
  getDisplayedErrors(): DisplayedError[];
  
  // Configuration
  updateConfiguration(config: Partial<ErrorConfig>): void;
  getConfiguration(): ErrorConfig;
}
