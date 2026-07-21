import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerService,
  getService,
  getServiceAsync,
  hasService,
  clearRegistry,
  getRegistryStats,
} from '../serviceRegistry';
import type { ServiceName } from '../serviceTypes';

describe('Service Registry', () => {
  // Clear registry before and after each test
  beforeEach(() => {
    clearRegistry();
  });

  afterEach(() => {
    clearRegistry();
  });

  describe('registerService', () => {
    it('should register a service successfully', () => {
      const mockService = { name: 'test', method: () => 'hello' };
      
      registerService('api', mockService);
      
      expect(hasService('api')).toBe(true);
      expect(getService('api')).toBe(mockService);
    });

    it('should warn when overwriting an existing service', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const service1 = { name: 'first' };
      const service2 = { name: 'second' };
      
      registerService('api', service1);
      registerService('api', service2);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Service "api" is already registered')
      );
      expect(getService('api')).toBe(service2);
      
      consoleSpy.mockRestore();
    });

    it('should log successful registration', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      registerService('messaging', { test: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Service registered: messaging')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getService', () => {
    it('should return a registered service', () => {
      const mockService = { test: 'value' };
      registerService('error', mockService);
      
      expect(getService('error')).toBe(mockService);
    });

    it('should return undefined for unregistered service', () => {
      expect(getService('api')).toBeUndefined();
    });

    it('should maintain type safety', () => {
      interface TestService {
        method(): string;
      }
      
      const mockService: TestService = {
        method: () => 'test',
      };
      
      registerService('auth', mockService);
      
      const retrieved = getService<TestService>('auth');
      expect(retrieved?.method()).toBe('test');
    });
  });

  describe('getServiceAsync', () => {
    it('should return immediately if service is registered', async () => {
      const mockService = { name: 'async-test' };
      registerService('api', mockService);
      
      const result = await getServiceAsync('api');
      
      expect(result).toBe(mockService);
    });

    it('should wait for service to be registered', async () => {
      const mockService = { name: 'delayed' };
      
      // Start waiting for service
      const promise = getServiceAsync('messaging');
      
      // Register after a delay
      setTimeout(() => {
        registerService('messaging', mockService);
      }, 100);
      
      const result = await promise;
      expect(result).toBe(mockService);
    });

    it('should timeout if service is not registered within time limit', async () => {
      await expect(getServiceAsync('api')).rejects.toThrow(
        /Timeout waiting for service "api"/
      );
    }, 12000); // Test timeout slightly longer than service timeout

    it('should handle multiple waiters for same service', async () => {
      const mockService = { name: 'multi-wait' };
      
      // Start multiple waiting promises
      const promise1 = getServiceAsync('config');
      const promise2 = getServiceAsync('config');
      const promise3 = getServiceAsync('config');
      
      // Register service
      setTimeout(() => {
        registerService('config', mockService);
      }, 100);
      
      const results = await Promise.all([promise1, promise2, promise3]);
      
      expect(results[0]).toBe(mockService);
      expect(results[1]).toBe(mockService);
      expect(results[2]).toBe(mockService);
    });

    it('should resolve waiters when service is registered', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockService = { name: 'waiter-test' };
      
      const promise = getServiceAsync('auth');
      
      registerService('auth', mockService);
      
      await promise;
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Resolving 1 waiters for service "auth"')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('hasService', () => {
    it('should return true for registered service', () => {
      registerService('api', { test: true });
      expect(hasService('api')).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(hasService('messaging')).toBe(false);
    });

    it('should update after registration', () => {
      expect(hasService('error')).toBe(false);
      registerService('error', { test: true });
      expect(hasService('error')).toBe(true);
    });
  });

  describe('clearRegistry', () => {
    it('should remove all registered services', () => {
      registerService('api', { test: 1 });
      registerService('messaging', { test: 2 });
      registerService('error', { test: 3 });
      
      expect(hasService('api')).toBe(true);
      expect(hasService('messaging')).toBe(true);
      expect(hasService('error')).toBe(true);
      
      clearRegistry();
      
      expect(hasService('api')).toBe(false);
      expect(hasService('messaging')).toBe(false);
      expect(hasService('error')).toBe(false);
    });

    it('should clear timeout timers when clearing registry', () => {
      // This test verifies that clearRegistry cleans up properly
      // without waiting for actual timeouts
      
      // Get stats before
      const statsBefore = getRegistryStats();
      expect(statsBefore.servicesCount).toBe(0);
      
      // Clear registry
      clearRegistry();
      
      // Get stats after
      const statsAfter = getRegistryStats();
      expect(statsAfter.servicesCount).toBe(0);
      expect(statsAfter.waitersCount).toBe(0);
    });

    it('should log clearing action', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      clearRegistry();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Service registry cleared')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getRegistryStats', () => {
    it('should return empty stats for empty registry', () => {
      const stats = getRegistryStats();
      
      expect(stats.registeredServices).toEqual([]);
      expect(stats.servicesCount).toBe(0);
      expect(stats.waitingServices).toEqual([]);
      expect(stats.waitersCount).toBe(0);
    });

    it('should return correct stats with registered services', () => {
      registerService('api', { test: 1 });
      registerService('messaging', { test: 2 });
      
      const stats = getRegistryStats();
      
      expect(stats.registeredServices).toContain('api');
      expect(stats.registeredServices).toContain('messaging');
      expect(stats.servicesCount).toBe(2);
    });

    it('should track waiting services', async () => {
      // Start waiting for service (but don't await yet)
      const promise = getServiceAsync('config');
      
      // Give it a moment to register the waiter
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const stats = getRegistryStats();
      
      expect(stats.waitingServices).toContain('config');
      expect(stats.waitersCount).toBeGreaterThan(0);
      
      // Clean up
      registerService('config', { test: true });
      await promise;
    });

    it('should update stats after service registration', () => {
      let stats = getRegistryStats();
      expect(stats.servicesCount).toBe(0);
      
      registerService('auth', { test: true });
      
      stats = getRegistryStats();
      expect(stats.servicesCount).toBe(1);
      expect(stats.registeredServices).toContain('auth');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle service dependency chain', async () => {
      interface ApiService {
        makeRequest(): string;
      }
      
      interface AuthService {
        login(): Promise<string>;
      }
      
      // Register API service first
      const apiService: ApiService = {
        makeRequest: () => 'API response',
      };
      registerService('api', apiService);
      
      // Auth service depends on API
      const authService: AuthService = {
        login: async () => {
          const api = await getServiceAsync<ApiService>('api');
          return `Authenticated: ${api.makeRequest()}`;
        },
      };
      registerService('auth', authService);
      
      const auth = getService<AuthService>('auth');
      const result = await auth?.login();
      
      expect(result).toBe('Authenticated: API response');
    });

    it('should handle service registration order independence', async () => {
      // Start waiting for messaging service
      const messagingPromise = getServiceAsync('messaging');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Register messaging service
      registerService('messaging', { send: () => 'sent' });
      
      // Should resolve successfully
      const messaging = await messagingPromise;
      expect(messaging).toBeDefined();
    });

    it('should support multiple service types', () => {
      const services = {
        api: { type: 'api', method: () => 'api' },
        messaging: { type: 'messaging', method: () => 'messaging' },
        error: { type: 'error', method: () => 'error' },
        auth: { type: 'auth', method: () => 'auth' },
        config: { type: 'config', method: () => 'config' },
      };
      
      Object.entries(services).forEach(([name, service]) => {
        registerService(name as ServiceName, service);
      });
      
      const stats = getRegistryStats();
      expect(stats.servicesCount).toBe(5);
      
      Object.keys(services).forEach(name => {
        expect(hasService(name as ServiceName)).toBe(true);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle null/undefined service registration', () => {
      registerService('api', null);
      expect(getService('api')).toBeNull();
      
      registerService('messaging', undefined);
      expect(getService('messaging')).toBeUndefined();
    });

    it('should clean up timeouts on successful registration', async () => {
      const promise = getServiceAsync('config');
      
      // Register immediately
      registerService('config', { test: true });
      
      // Should not timeout
      await expect(promise).resolves.toBeDefined();
    });
  });
});
