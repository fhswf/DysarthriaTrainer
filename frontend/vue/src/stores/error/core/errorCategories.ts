/**
 * Error Categories
 * 
 * Categorizes errors based on their type and characteristics.
 */

import type { ErrorCategory } from '../error.types';

export class ErrorCategories {
  categorize(error: any): ErrorCategory {
    // Network errors
    if (this.isNetworkError(error)) {
      return 'network';
    }

    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return 'authentication';
    }

    // Authorization errors
    if (this.isAuthorizationError(error)) {
      return 'authorization';
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return 'validation';
    }

    // API errors
    if (this.isApiError(error)) {
      return 'api';
    }

    // Configuration errors
    if (this.isConfigurationError(error)) {
      return 'configuration';
    }

    // Runtime errors
    if (error instanceof Error) {
      return 'runtime';
    }

    return 'unknown';
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.message?.toLowerCase().includes('network') ||
      error?.message?.toLowerCase().includes('fetch') ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ERR_NETWORK' ||
      !navigator.onLine
    );
  }

  private isAuthenticationError(error: any): boolean {
    return (
      error?.response?.status === 401 ||
      error?.status === 401 ||
      error?.code === 'UNAUTHENTICATED'
    );
  }

  private isAuthorizationError(error: any): boolean {
    return (
      error?.response?.status === 403 ||
      error?.status === 403 ||
      error?.code === 'FORBIDDEN'
    );
  }

  private isValidationError(error: any): boolean {
    return (
      error?.response?.status === 422 ||
      error?.status === 422 ||
      error?.response?.data?.errors ||
      Array.isArray(error?.validationErrors)
    );
  }

  private isApiError(error: any): boolean {
    return (
      error?.response?.status >= 400 ||
      error?.isAxiosError === true
    );
  }

  private isConfigurationError(error: any): boolean {
    return (
      error?.message?.toLowerCase().includes('config') ||
      error?.code === 'ERR_CONFIGURATION'
    );
  }
}
