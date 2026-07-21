/**
 * Error Processor
 * 
 * Processes raw errors into structured ProcessedError objects with
 * categorization, severity determination, and message generation.
 */

import type { ProcessedError, ErrorCategory, ErrorSeverity, ErrorContext } from '../error.types';
import { ErrorCategories } from './errorCategories';

export class ErrorProcessor {
  private categories: ErrorCategories;

  constructor(categories?: ErrorCategories) {
    this.categories = categories || new ErrorCategories();
  }

  process(error: unknown, context?: any): ProcessedError {
    const category = this.categorize(error);
    const severity = this.determineSeverity(error, category);
    const recoverable = this.isRecoverable(error, category);
    
    return {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalError: error,
      category,
      severity,
      message: this.extractMessage(error),
      details: this.extractDetails(error),
      timestamp: new Date(),
      context,
      stack: (error as any)?.stack,
      recoverable,
      userMessage: this.generateUserMessage(error, category),
      technicalMessage: this.generateTechnicalMessage(error),
    };
  }

  categorize(error: any): ErrorCategory {
    return this.categories.categorize(error);
  }

  determineSeverity(error: any, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (category === 'authentication' || category === 'configuration') {
      return 'critical';
    }

    // High severity
    if (category === 'api' && error.response?.status >= 500) {
      return 'high';
    }

    if (category === 'authorization') {
      return 'high';
    }

    // Medium severity
    if (category === 'validation' || category === 'network') {
      return 'medium';
    }

    // Low severity for everything else
    return 'low';
  }

  private isRecoverable(error: any, category: ErrorCategory): boolean {
    // Network errors are usually recoverable
    if (category === 'network') {
      return true;
    }

    // Timeout errors are recoverable
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') {
      return true;
    }

    // 5xx errors might be recoverable with retry
    if (error?.response?.status >= 500 && error?.response?.status < 600) {
      return true;
    }

    // Rate limit errors are recoverable after delay
    if (error?.response?.status === 429) {
      return true;
    }

    // Most other errors are not recoverable
    return false;
  }

  private extractMessage(error: any): string {
    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.statusText) {
      return error.response.statusText;
    }
    return 'An unknown error occurred';
  }

  private extractDetails(error: any): string | undefined {
    if (error?.response?.data?.detail) {
      return JSON.stringify(error.response.data.detail);
    }
    if (error?.response?.data?.errors) {
      return JSON.stringify(error.response.data.errors);
    }
    return undefined;
  }

  private generateUserMessage(error: any, category: ErrorCategory): string {
    switch (category) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'authentication':
        return 'Your session has expired. Please log in again.';
      case 'authorization':
        return 'You do not have permission to perform this action.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'api':
        return 'An error occurred while communicating with the server.';
      case 'configuration':
        return 'A configuration error occurred. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private generateTechnicalMessage(error: any): string {
    if (error?.stack) {
      return error.stack;
    }
    return JSON.stringify(error, null, 2);
  }
}
