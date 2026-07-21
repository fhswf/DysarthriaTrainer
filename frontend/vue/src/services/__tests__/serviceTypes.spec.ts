import { describe, it, expect } from 'vitest';
import type {
  ServiceName,
  ServiceRegistry,
  ServiceWaiter,
  BootstrapOptions,
  BootstrapResult,
} from '../serviceTypes';

describe('Service Types', () => {
  describe('ServiceName', () => {
    it('should accept valid service names', () => {
      const validNames: ServiceName[] = [
        'api',
        'messaging',
        'error',
        'auth',
        'config',
        'apiErrorIntegration',
        'mockApiIntegration',
        'performanceIntegration',
        'devToolsIntegration',
      ];

      expect(validNames.length).toBe(9);
    });
  });

  describe('ServiceRegistry interface', () => {
    it('should define correct method signatures', () => {
      // This is a compile-time check, but we can verify the interface exists
      const mockRegistry: ServiceRegistry = {
        register: (name: ServiceName, service: any) => {},
        get: <T = any>(name: ServiceName): T | undefined => undefined,
        getAsync: async <T = any>(name: ServiceName): Promise<T> => ({} as T),
        has: (name: ServiceName): boolean => false,
        clear: () => {},
        getAll: (): Map<ServiceName, any> => new Map(),
      };

      expect(mockRegistry).toBeDefined();
      expect(typeof mockRegistry.register).toBe('function');
      expect(typeof mockRegistry.get).toBe('function');
      expect(typeof mockRegistry.getAsync).toBe('function');
      expect(typeof mockRegistry.has).toBe('function');
      expect(typeof mockRegistry.clear).toBe('function');
      expect(typeof mockRegistry.getAll).toBe('function');
    });
  });

  describe('ServiceWaiter interface', () => {
    it('should define correct properties', () => {
      const mockWaiter: ServiceWaiter = {
        resolve: (service: any) => {},
        reject: (error: Error) => {},
        timeout: undefined,
      };

      expect(mockWaiter).toBeDefined();
      expect(typeof mockWaiter.resolve).toBe('function');
      expect(typeof mockWaiter.reject).toBe('function');
    });

    it('should support optional timeout', () => {
      const waiterWithTimeout: ServiceWaiter = {
        resolve: () => {},
        reject: () => {},
        timeout: setTimeout(() => {}, 1000),
      };

      const waiterWithoutTimeout: ServiceWaiter = {
        resolve: () => {},
        reject: () => {},
      };

      expect(waiterWithTimeout.timeout).toBeDefined();
      expect(waiterWithoutTimeout.timeout).toBeUndefined();

      // Cleanup
      if (waiterWithTimeout.timeout) {
        clearTimeout(waiterWithTimeout.timeout);
      }
    });
  });

  describe('BootstrapOptions interface', () => {
    it('should support all optional properties', () => {
      const emptyOptions: BootstrapOptions = {};
      expect(emptyOptions).toBeDefined();

      const fullOptions: BootstrapOptions = {
        enableMock: true,
        enableDevTools: true,
        enablePerformanceTracking: true,
        apiBaseUrl: 'https://api.test.com',
      };

      expect(fullOptions.enableMock).toBe(true);
      expect(fullOptions.enableDevTools).toBe(true);
      expect(fullOptions.enablePerformanceTracking).toBe(true);
      expect(fullOptions.apiBaseUrl).toBe('https://api.test.com');
    });

    it('should support partial options', () => {
      const partialOptions: BootstrapOptions = {
        enableMock: true,
      };

      expect(partialOptions.enableMock).toBe(true);
      expect(partialOptions.enableDevTools).toBeUndefined();
    });
  });

  describe('BootstrapResult interface', () => {
    it('should define correct properties', () => {
      const result: BootstrapResult = {
        success: true,
        initializedServices: ['api', 'messaging'],
        failedServices: [],
        errors: [],
        duration: 123.45,
      };

      expect(result.success).toBe(true);
      expect(result.initializedServices).toHaveLength(2);
      expect(result.failedServices).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBe(123.45);
    });

    it('should support failure scenario', () => {
      const failureResult: BootstrapResult = {
        success: false,
        initializedServices: ['api'],
        failedServices: ['messaging', 'error'],
        errors: [new Error('Service failed'), new Error('Another error')],
        duration: 456.78,
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.initializedServices).toHaveLength(1);
      expect(failureResult.failedServices).toHaveLength(2);
      expect(failureResult.errors).toHaveLength(2);
    });

    it('should support ServiceName array in initializedServices', () => {
      const result: BootstrapResult = {
        success: true,
        initializedServices: ['api', 'messaging', 'error', 'auth', 'config'],
        failedServices: [],
        errors: [],
        duration: 100,
      };

      expect(result.initializedServices.every(name => typeof name === 'string')).toBe(true);
    });
  });

  describe('Type safety', () => {
    it('should enforce ServiceName type', () => {
      const validName: ServiceName = 'api';
      expect(validName).toBe('api');

      // This would cause a TypeScript error at compile time:
      // const invalidName: ServiceName = 'invalid';
    });

    it('should enforce BootstrapResult structure', () => {
      const result: BootstrapResult = {
        success: true,
        initializedServices: [],
        failedServices: [],
        errors: [],
        duration: 0,
      };

      // These properties are required
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('initializedServices');
      expect(result).toHaveProperty('failedServices');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('duration');
    });
  });
});
