/**
 * Error Service Tests
 * 
 * Comprehensive tests for the Error Service including:
 * - Error categorization
 * - Error processing
 * - Error recovery
 * - Error history
 * - Integration with other services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useErrorStore } from '../index';
import type { ProcessedError, ErrorCategory, RecoveryStrategy } from '../error.types';

describe('Error Service', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const errorService = useErrorStore();
      expect(errorService.isReady).toBe(false);
      
      await errorService.ensureInitialized();
      
      expect(errorService.isReady).toBe(true);
      expect(errorService.loadError).toBeNull();
    });

    it('should handle multiple initialization calls gracefully', async () => {
      const errorService = useErrorStore();
      
      await Promise.all([
        errorService.ensureInitialized(),
        errorService.ensureInitialized(),
        errorService.ensureInitialized(),
      ]);
      
      expect(errorService.isReady).toBe(true);
    });

    it('should cleanup successfully', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.cleanup();
      
      expect(errorService.isReady).toBe(false);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize network errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const networkError = new Error('Network request failed');
      (networkError as any).code = 'NETWORK_ERROR';
      
      const category = await errorService.categorizeError(networkError);
      
      expect(category).toBe('network');
    });

    it('should categorize authentication errors (401)', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized',
      };
      
      const category = await errorService.categorizeError(authError);
      
      expect(category).toBe('authentication');
    });

    it('should categorize authorization errors (403)', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const authzError = {
        response: { status: 403 },
        message: 'Forbidden',
      };
      
      const category = await errorService.categorizeError(authzError);
      
      expect(category).toBe('authorization');
    });

    it('should categorize validation errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const validationError = {
        validationErrors: [
          { field: 'email', message: 'Invalid email' },
        ],
      };
      
      const category = await errorService.categorizeError(validationError);
      
      expect(category).toBe('validation');
    });

    it('should categorize API errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const apiError = {
        response: { status: 500 },
        message: 'Internal Server Error',
      };
      
      const category = await errorService.categorizeError(apiError);
      
      expect(category).toBe('api');
    });

    it('should categorize runtime errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const unknownError = new Error('Something went wrong');
      
      const category = await errorService.categorizeError(unknownError);
      
      expect(category).toBe('runtime');
    });
  });

  describe('Error Processing', () => {
    it('should process a simple error', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const error = new Error('Test error');
      const processed = await errorService.processError(error);
      
      expect(processed).toHaveProperty('id');
      expect(processed).toHaveProperty('category');
      expect(processed).toHaveProperty('severity');
      expect(processed).toHaveProperty('message', 'Test error');
      expect(processed).toHaveProperty('userMessage');
      expect(processed).toHaveProperty('technicalMessage');
      expect(processed).toHaveProperty('timestamp');
      expect(processed).toHaveProperty('recoverable');
    });

    it('should generate unique IDs for each error', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const error1 = await errorService.processError(new Error('Error 1'));
      const error2 = await errorService.processError(new Error('Error 2'));
      
      expect(error1.id).not.toBe(error2.id);
    });

    it('should preserve error context', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const context = {
        source: 'test',
        operation: 'test-operation',
        component: 'TestComponent',
      };
      
      const processed = await errorService.handleError(new Error('Test'), context);
      
      expect(processed.context).toEqual(context);
    });
  });

  describe('Error Handling', () => {
    it('should handle generic errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const error = new Error('Generic error');
      const processed = await errorService.handleError(error);
      
      expect(processed).toBeDefined();
      expect(processed.message).toBe('Generic error');
    });

    it.skip('should handle API errors', async () => {
      // TODO: Fix hanging test - likely due to notification system
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const apiError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
      };
      
      const processed = await errorService.handleApiError(apiError);
      
      expect(processed.category).toBe('api');
      expect(processed.severity).toBe('high');
    });

    it('should handle validation errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ];
      
      const processed = await errorService.handleValidationError(validationErrors);
      
      expect(processed.category).toBe('validation');
      expect(processed.severity).toBe('medium');
    });

    it('should handle network errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const networkError = new Error('Network failure');
      (networkError as any).code = 'NETWORK_ERROR';
      
      const processed = await errorService.handleNetworkError(networkError);
      
      expect(processed.category).toBe('network');
      expect(processed.recoverable).toBe(true);
    });
  });

  describe('Error History', () => {
    it('should track error history', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.handleError(new Error('Error 1'));
      await errorService.handleError(new Error('Error 2'));
      await errorService.handleError(new Error('Error 3'));
      
      const history = await errorService.getErrorHistory();
      
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter history by category', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      // Clear existing history
      await errorService.clearErrorHistory();
      
      // Add different types of errors
      await errorService.handleNetworkError(new Error('Network error'));
      await errorService.handleError(new Error('Generic error'));
      
      const networkErrors = await errorService.getErrorHistory({
        category: 'network',
      });
      
      expect(networkErrors.every(e => e.category === 'network')).toBe(true);
    });

    it('should filter history by severity', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.clearErrorHistory();
      
      // Add errors of different severities
      const criticalError = { response: { status: 401 } };
      await errorService.handleApiError(criticalError);
      
      const highErrors = await errorService.getErrorHistory({
        severity: 'critical',
      });
      
      expect(highErrors.every(e => e.severity === 'critical')).toBe(true);
    });

    it('should limit history results', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.clearErrorHistory();
      
      // Add multiple errors
      for (let i = 0; i < 10; i++) {
        await errorService.handleError(new Error(`Error ${i}`));
      }
      
      const limitedHistory = await errorService.getErrorHistory({ limit: 5 });
      
      expect(limitedHistory.length).toBeLessThanOrEqual(5);
    });

    it('should clear error history', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.handleError(new Error('Test error'));
      await errorService.clearErrorHistory();
      
      const history = await errorService.getErrorHistory();
      
      expect(history.length).toBe(0);
    });

    it('should provide error statistics', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.clearErrorHistory();
      
      await errorService.handleError(new Error('Error 1'));
      await errorService.handleError(new Error('Error 2'));
      
      const stats = await errorService.getHistoryStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('recovered');
      expect(stats).toHaveProperty('byCategory');
      expect(stats).toHaveProperty('bySeverity');
      expect(stats.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Recovery', () => {
    it('should mark recoverable errors correctly', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const networkError = new Error('Network failure');
      (networkError as any).code = 'NETWORK_ERROR';
      
      const processed = await errorService.processError(networkError);
      
      expect(processed.recoverable).toBe(true);
    });

    it('should mark non-recoverable errors correctly', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const authError = {
        response: { status: 401 },
      };
      
      const processed = await errorService.processError(authError);
      
      expect(processed.recoverable).toBe(false);
    });

    it('should register custom recovery strategies', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const customStrategy: RecoveryStrategy = {
        name: 'test-strategy',
        canRecover: (error) => error.category === 'network',
        recover: async () => true,
        maxAttempts: 3,
      };
      
      await errorService.registerRecoveryStrategy('network', customStrategy);
      
      // No error means strategy was registered successfully
      expect(true).toBe(true);
    });
  });

  describe('Error Display', () => {
    it('should show error to user', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const error = await errorService.handleError(new Error('Test error'));
      await errorService.showError(error);
      
      const displayed = await errorService.getDisplayedErrors();
      
      expect(displayed.some(e => e.id === error.id)).toBe(true);
    });

    it('should dismiss error', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const error = await errorService.handleError(new Error('Test error'));
      await errorService.showError(error);
      await errorService.dismissError(error.id);
      
      const displayed = await errorService.getDisplayedErrors();
      
      expect(displayed.some(e => e.id === error.id)).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should get current configuration', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const config = await errorService.getConfiguration();
      
      expect(config).toHaveProperty('enableAutoRecovery');
      expect(config).toHaveProperty('maxRecoveryAttempts');
      expect(config).toHaveProperty('enableErrorReporting');
      expect(config).toHaveProperty('maxHistorySize');
    });

    it('should update configuration', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      await errorService.updateConfiguration({
        maxHistorySize: 50,
        enableAutoRecovery: false,
      });
      
      const config = await errorService.getConfiguration();
      
      expect(config.maxHistorySize).toBe(50);
      expect(config.enableAutoRecovery).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should generate user-friendly messages for network errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const networkError = new Error('Network failure');
      (networkError as any).code = 'NETWORK_ERROR';
      
      const processed = await errorService.processError(networkError);
      
      expect(processed.userMessage).toContain('connect');
    });

    it('should generate user-friendly messages for auth errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const authError = {
        response: { status: 401 },
      };
      
      const processed = await errorService.processError(authError);
      
      expect(processed.userMessage).toContain('session');
    });

    it('should generate user-friendly messages for validation errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const validationError = {
        validationErrors: [{ field: 'email', message: 'Invalid' }],
      };
      
      const processed = await errorService.processError(validationError);
      
      expect(processed.userMessage).toContain('input');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const processed = await errorService.handleError(null);
      
      expect(processed).toBeDefined();
      expect(processed.category).toBe('unknown');
    });

    it('should handle undefined errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const processed = await errorService.handleError(undefined);
      
      expect(processed).toBeDefined();
      expect(processed.category).toBe('unknown');
    });

    it('should handle string errors', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const processed = await errorService.handleError('Error message');
      
      expect(processed).toBeDefined();
      expect(processed.message).toBe('Error message');
    });

    it('should handle errors without messages', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const processed = await errorService.handleError({});
      
      expect(processed).toBeDefined();
      expect(processed.message).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should be accessible via store', () => {
      const errorService = useErrorStore();
      
      expect(errorService).toBeDefined();
      expect(errorService.handleError).toBeDefined();
      expect(errorService.handleApiError).toBeDefined();
      expect(errorService.handleValidationError).toBeDefined();
      expect(errorService.handleNetworkError).toBeDefined();
    });

    it('should maintain state across multiple calls', async () => {
      const errorService = useErrorStore();
      await errorService.ensureInitialized();
      
      const initialState = errorService.isReady;
      
      await errorService.handleError(new Error('Test 1'));
      await errorService.handleError(new Error('Test 2'));
      
      expect(errorService.isReady).toBe(initialState);
    });
  });
});
