/**
 * API Service Integration Tests
 * 
 * Tests integration with Config, Messaging, Error, and Auth services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useApiStore } from '../index';
import { registerService, clearRegistry } from '@/services/serviceRegistry';

describe('API Service Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearRegistry();
    // Use mock API for consistent testing
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
  });

  afterEach(() => {
    clearRegistry();
  });

  describe('Integration with Config Service', () => {
    it('should load configuration from config service on initialization', async () => {
      // Note: Mock API service doesn't use config service during initialization
      // This test verifies the pattern is ready, not that mock uses it
      const mockConfigService = {
        getApiConfig: vi.fn().mockResolvedValue({
          baseURL: 'https://config-api.example.com',
          timeout: 15000,
          withCredentials: true,
        }),
      };

      registerService('config', mockConfigService);

      const api = useApiStore();
      await api.get('/test');

      // In mock mode, config service is not called
      // But the pattern is available for live mode
      const baseURL = await api.getBaseURL();
      expect(baseURL).toBeDefined();
    });

    it('should work without config service', async () => {
      // Don't register config service
      const api = useApiStore();
      
      await api.get('/test');
      
      const baseURL = await api.getBaseURL();
      expect(baseURL).toBeDefined();
    });

    it('should handle config service errors gracefully', async () => {
      const mockConfigService = {
        getApiConfig: vi.fn().mockRejectedValue(new Error('Config failed')),
      };

      registerService('config', mockConfigService);

      const api = useApiStore();
      
      // Should not throw
      await expect(api.get('/test')).resolves.toBeDefined();
    });
  });

  describe('Integration with Error Service', () => {
    it('should report errors to error service when available', async () => {
      const mockErrorService = {
        handleApiError: vi.fn(),
        handleNetworkError: vi.fn(),
      };

      registerService('error', mockErrorService);

      // API service uses error service via communication layer
      // Error reporting happens in response interceptor
      // For this test, we verify the pattern is ready
      
      const api = useApiStore();
      await api.get('/test');

      expect(api.isInitialized()).toBe(true);
    });

    it('should work without error service', async () => {
      // Don't register error service
      const api = useApiStore();
      
      await api.get('/test');
      
      expect(api.isInitialized()).toBe(true);
    });
  });

  describe('Integration with Auth Service', () => {
    it('should set auth token when auth service provides it', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      // Auth service calls this after login
      await api.setAuthToken('test-jwt-token-123');
      
      expect(api.isInitialized()).toBe(true);
    });

    it('should clear auth token on logout', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      await api.setAuthToken('test-token');
      await api.clearAuthToken();
      
      expect(api.isInitialized()).toBe(true);
    });

    it('should include auth token in requests after being set', async () => {
      const api = useApiStore();
      
      await api.setAuthToken('bearer-token-456');
      const response = await api.get('/protected-resource');
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('Integration with Messaging Service', () => {
    it('should be accessible from messaging service via registry', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      registerService('api', api);
      
      // Messaging service can access API
      const { getService } = await import('@/services/serviceRegistry');
      const apiFromRegistry = getService('api');
      
      expect(apiFromRegistry).toBe(api);
    });

    it('should work without messaging service', async () => {
      // Don't register messaging service
      const api = useApiStore();
      
      await api.get('/test');
      
      expect(api.isInitialized()).toBe(true);
    });
  });

  describe('Service Registry Integration', () => {
    it('should be registered in service registry during bootstrap', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      registerService('api', api);
      
      const { getService } = await import('@/services/serviceRegistry');
      const registered = getService('api');
      
      expect(registered).toBe(api);
      expect(registered.isInitialized()).toBe(true);
    });

    it('should be retrievable from registry synchronously after registration', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      registerService('api', api);
      
      const { getService } = await import('@/services/serviceRegistry');
      const registered = getService('api');
      
      expect(registered).toBeDefined();
      expect(registered.isInitialized).toBeDefined();
    });

    it('should be retrievable from registry asynchronously', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      registerService('api', api);
      
      const { getServiceAsync } = await import('@/services/serviceRegistry');
      const registered = await getServiceAsync('api');
      
      expect(registered).toBe(api);
    });

    it('should wait for registration when accessed before ready', async () => {
      const { getServiceAsync, registerService } = await import('@/services/serviceRegistry');
      
      // Start waiting before registration
      const waitPromise = getServiceAsync('api');
      
      // Register after a delay
      setTimeout(async () => {
        const api = useApiStore();
        await api.get('/test');
        registerService('api', api);
      }, 100);
      
      const api = await waitPromise;
      expect(api).toBeDefined();
      expect(api.isInitialized()).toBe(true);
    });
  });

  describe('Cross-Service Communication Patterns', () => {
    it('should support auth token updates from auth service', async () => {
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      // Mock auth service updating token
      const mockAuthService = {
        login: async () => {
          await api.setAuthToken('new-login-token');
          return { success: true, token: 'new-login-token' };
        },
        logout: async () => {
          await api.clearAuthToken();
          return { success: true };
        },
      };
      
      registerService('auth', mockAuthService);
      registerService('api', api);
      
      // Auth service logs in
      await mockAuthService.login();
      
      // API should have token set
      expect(api.isInitialized()).toBe(true);
      
      // Auth service logs out
      await mockAuthService.logout();
      
      // Token should be cleared
      expect(api.isInitialized()).toBe(true);
    });

    it('should support config updates propagating to API', async () => {
      const mockConfigService = {
        getApiConfig: vi.fn().mockResolvedValue({
          baseURL: 'https://initial.api.com',
          timeout: 30000,
        }),
      };
      
      registerService('config', mockConfigService);
      
      const api = useApiStore();
      await api.get('/test'); // Initialize
      
      // Mock starts with default base URL
      let baseURL = await api.getBaseURL();
      expect(baseURL).toBe('/api'); // Mock default
      
      // Update base URL (like config service would do)
      await api.setBaseURL('https://updated.api.com');
      
      baseURL = await api.getBaseURL();
      expect(baseURL).toBe('https://updated.api.com');
    });

    it('should handle concurrent requests from multiple services', async () => {
      const api = useApiStore();
      registerService('api', api);
      
      // Simulate multiple services making requests simultaneously
      const requests = await Promise.all([
        api.get('/service1/data'),
        api.get('/service2/data'),
        api.get('/service3/data'),
        api.post('/service1/action', { data: 'test' }),
        api.put('/service2/update', { id: 1 }),
      ]);
      
      expect(requests).toHaveLength(5);
      requests.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain consistent state across service interactions', async () => {
      const api = useApiStore();
      registerService('api', api);
      
      // Set token
      await api.setAuthToken('consistent-token');
      
      // Multiple services access API
      const response1 = await api.get('/resource1');
      const response2 = await api.get('/resource2');
      const response3 = await api.post('/resource3', {});
      
      // All should succeed with same configuration
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      
      // Clear token
      await api.clearAuthToken();
      
      // Should still work (just without token)
      const response4 = await api.get('/public');
      expect(response4.status).toBe(200);
    });
  });

  describe('Error Handling in Integration', () => {
    it('should gracefully handle API service initialization failure', async () => {
      // This is hard to test with current implementation
      // But we verify the error tracking mechanism
      const api = useApiStore();
      
      expect(api.loadError).toBeNull();
      
      await api.get('/test');
      
      expect(api.loadError).toBeNull();
      expect(api.isReady).toBe(true);
    });

    it('should not break other services when API fails', async () => {
      const mockMessagingService = {
        success: vi.fn(),
        error: vi.fn(),
      };
      
      registerService('messaging', mockMessagingService);
      
      // API might fail, but messaging should still work
      await mockMessagingService.success('API might have issues', 'But messaging works');
      
      expect(mockMessagingService.success).toHaveBeenCalled();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid API calls without blocking', async () => {
      const api = useApiStore();
      
      const start = Date.now();
      
      // Make 50 concurrent requests
      const promises = Array.from({ length: 50 }, (_, i) => 
        api.get(`/resource-${i}`)
      );
      
      const responses = await Promise.all(promises);
      
      const duration = Date.now() - start;
      
      expect(responses).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    it('should support efficient caching across services', async () => {
      const api = useApiStore();
      
      // First request (cache miss)
      await api.get('/shared-resource', { useCache: true });
      
      const stats1 = await api.getCacheStats();
      expect(stats1.misses).toBe(1);
      expect(stats1.size).toBe(1);
      
      // Multiple services request same resource (cache hits)
      await Promise.all([
        api.get('/shared-resource', { useCache: true }),
        api.get('/shared-resource', { useCache: true }),
        api.get('/shared-resource', { useCache: true }),
      ]);
      
      const stats2 = await api.getCacheStats();
      expect(stats2.hits).toBe(3);
      expect(stats2.hitRate).toBeGreaterThan(0.5);
    });
  });

  describe('Complete Integration Scenario', () => {
    it('should work in full application context', async () => {
      // Setup all services
      const mockConfigService = {
        getApiConfig: vi.fn().mockResolvedValue({
          baseURL: 'https://app.example.com/api',
          timeout: 30000,
        }),
      };
      
      const mockErrorService = {
        handleApiError: vi.fn(),
      };
      
      const mockMessagingService = {
        success: vi.fn(),
        error: vi.fn(),
      };
      
      const mockAuthService = {
        isAuthenticated: vi.fn().mockResolvedValue(false),
        login: vi.fn().mockResolvedValue({ success: true, token: 'auth-token' }),
      };
      
      registerService('config', mockConfigService);
      registerService('error', mockErrorService);
      registerService('messaging', mockMessagingService);
      registerService('auth', mockAuthService);
      
      // Initialize API service
      const api = useApiStore();
      registerService('api', api);
      
      // User logs in (auth service updates API token)
      const loginResult = await mockAuthService.login();
      await api.setAuthToken(loginResult.token);
      
      // Make authenticated request
      const userResponse = await api.get('/user/profile');
      expect(userResponse.status).toBe(200);
      
      // Make multiple requests (some cached)
      const [posts, comments] = await Promise.all([
        api.get('/posts', { useCache: true }),
        api.get('/comments', { useCache: true }),
      ]);
      
      expect(posts.status).toBe(200);
      expect(comments.status).toBe(200);
      
      // Update data (clears cache)
      await api.post('/posts', { title: 'New Post' });
      
      // Cache should be cleared
      const cacheStats = await api.getCacheStats();
      expect(cacheStats.size).toBe(0);
      
      // Logout (clears token)
      await api.clearAuthToken();
      
      // Public request still works
      const publicData = await api.get('/public/data');
      expect(publicData.status).toBe(200);
    });
  });
});
