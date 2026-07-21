/**
 * Error Service Store
 * 
 * Pinia store wrapper for the Error Service with lazy loading.
 */

import { defineStore } from 'pinia';
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

interface ErrorStoreState {
  isReady: boolean;
  isLoading: boolean;
  loadError: Error | null;
  service: ErrorServiceInterface | null;
}

export const useErrorStore = defineStore('error', {
  state: (): ErrorStoreState => ({
    isReady: false,
    isLoading: false,
    loadError: null,
    service: null,
  }),

  actions: {
    async ensureInitialized(): Promise<void> {
      if (this.isReady && this.service) {
        return;
      }

      if (this.isLoading) {
        // Wait for ongoing initialization
        while (this.isLoading) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (this.isReady && this.service) {
          return;
        }
      }

      this.isLoading = true;
      this.loadError = null;

      try {
        const isMock = import.meta.env.VITE_USE_MOCK_ERROR === 'true';
        
        if (isMock) {
          const { createMockService } = await import('./error.mock');
          this.service = createMockService();
        } else {
          const { createLiveService } = await import('./error.live');
          this.service = createLiveService();
        }

        await this.service.initialize();
        this.isReady = true;
      } catch (error) {
        this.loadError = error as Error;
        console.error('[ERROR STORE] Failed to initialize:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async cleanup(): Promise<void> {
      if (this.service) {
        this.service.cleanup();
        this.service = null;
      }
      this.isReady = false;
    },

    // Error handling
    async handleError(error: any, context?: ErrorContext): Promise<ProcessedError> {
      await this.ensureInitialized();
      return this.service!.handleError(error, context);
    },

    async handleApiError(error: any, context?: ErrorContext): Promise<ProcessedError> {
      await this.ensureInitialized();
      return this.service!.handleApiError(error, context);
    },

    async handleValidationError(
      errors: ValidationError[],
      context?: ErrorContext
    ): Promise<ProcessedError> {
      await this.ensureInitialized();
      return this.service!.handleValidationError(errors, context);
    },

    async handleNetworkError(error: any, context?: ErrorContext): Promise<ProcessedError> {
      await this.ensureInitialized();
      return this.service!.handleNetworkError(error, context);
    },

    // Error processing
    async processError(error: any): Promise<ProcessedError> {
      await this.ensureInitialized();
      return this.service!.processError(error);
    },

    async categorizeError(error: any): Promise<ErrorCategory> {
      await this.ensureInitialized();
      return this.service!.categorizeError(error);
    },

    // Error recovery
    async attemptRecovery(error: ProcessedError): Promise<boolean> {
      await this.ensureInitialized();
      return this.service!.attemptRecovery(error);
    },

    async registerRecoveryStrategy(
      category: ErrorCategory,
      strategy: RecoveryStrategy
    ): Promise<void> {
      await this.ensureInitialized();
      this.service!.registerRecoveryStrategy(category, strategy);
    },

    // Error history
    async getErrorHistory(options?: HistoryOptions): Promise<ErrorHistoryEntry[]> {
      await this.ensureInitialized();
      return this.service!.getErrorHistory(options);
    },

    async clearErrorHistory(): Promise<void> {
      await this.ensureInitialized();
      this.service!.clearErrorHistory();
    },

    async getHistoryStats(): Promise<any> {
      await this.ensureInitialized();
      return this.service!.getHistoryStats();
    },

    // Error display
    async showError(error: ProcessedError): Promise<void> {
      await this.ensureInitialized();
      this.service!.showError(error);
    },

    async dismissError(id: string): Promise<void> {
      await this.ensureInitialized();
      this.service!.dismissError(id);
    },

    async getDisplayedErrors(): Promise<DisplayedError[]> {
      await this.ensureInitialized();
      return this.service!.getDisplayedErrors();
    },

    // Configuration
    async updateConfiguration(config: Partial<ErrorConfig>): Promise<void> {
      await this.ensureInitialized();
      this.service!.updateConfiguration(config);
    },

    async getConfiguration(): Promise<ErrorConfig> {
      await this.ensureInitialized();
      return this.service!.getConfiguration();
    },
  },
});
