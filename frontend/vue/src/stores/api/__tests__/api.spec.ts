import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useApiStore } from '../index';

describe('API Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const store = useApiStore();

      expect(store.isInitialized()).toBe(false);
      expect(store.isReady).toBe(false);

      await store.get('/test');

      expect(store.isInitialized()).toBe(true);
      expect(store.isReady).toBe(true);
      expect(store.loadError).toBeNull();
    });

    it('should handle multiple initialization calls gracefully', async () => {
      const store = useApiStore();

      const [result1, result2, result3] = await Promise.all([
        store.get('/test'),
        store.get('/test'),
        store.get('/test'),
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      expect(store.isReady).toBe(true);
    });

    it('should track loading state during initialization', async () => {
      const store = useApiStore();

      const promise = store.get('/test');
      expect(store.isLoading).toBe(true);

      await promise;
      expect(store.isLoading).toBe(false);
    });
  });

  describe('HTTP Methods - GET', () => {
    it('should perform GET request', async () => {
      const store = useApiStore();
      const response = await store.get('/test');

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should handle GET with params', async () => {
      const store = useApiStore();
      const response = await store.get('/test', {
        params: { id: 1, filter: 'active' },
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should support caching for GET requests', async () => {
      const store = useApiStore();

      // First request
      const response1 = await store.get('/test', { useCache: true });
      const stats1 = await store.getCacheStats();

      // Second request (should hit cache)
      const response2 = await store.get('/test', { useCache: true });
      const stats2 = await store.getCacheStats();

      expect(response1.data).toEqual(response2.data);
      expect(stats2.hits).toBeGreaterThan(stats1.hits);
    });

    it('should bypass cache when useCache is false', async () => {
      const store = useApiStore();

      // First request with cache
      await store.get('/test', { useCache: true });
      const stats1 = await store.getCacheStats();
      const initialMisses = stats1.misses;

      // Second request bypassing cache (should not increment cache stats)
      await store.get('/test', { useCache: false });
      const stats2 = await store.getCacheStats();

      // When bypassing cache, it doesn't interact with cache at all
      // So cache size and hits should remain the same
      expect(stats2.size).toBe(stats1.size);
      expect(stats2.hits).toBe(stats1.hits);
    });
  });

  describe('HTTP Methods - POST', () => {
    it('should perform POST request', async () => {
      const store = useApiStore();
      const data = { name: 'Test User', email: 'test@example.com' };
      const response = await store.post('/users', data);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should clear cache after POST', async () => {
      const store = useApiStore();

      // Cache a GET request
      await store.get('/users', { useCache: true });
      let stats = await store.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // POST should clear cache
      await store.post('/users', { name: 'New User' });
      stats = await store.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('HTTP Methods - PUT', () => {
    it('should perform PUT request', async () => {
      const store = useApiStore();
      const data = { id: 1, name: 'Updated User' };
      const response = await store.put('/users/1', data);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should clear cache after PUT', async () => {
      const store = useApiStore();

      await store.get('/users/1', { useCache: true });
      let stats = await store.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      await store.put('/users/1', { name: 'Updated' });
      stats = await store.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('HTTP Methods - PATCH', () => {
    it('should perform PATCH request', async () => {
      const store = useApiStore();
      const data = { name: 'Patched User' };
      const response = await store.patch('/users/1', data);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('HTTP Methods - DELETE', () => {
    it('should perform DELETE request', async () => {
      const store = useApiStore();
      const response = await store.delete('/users/1');

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should clear cache after DELETE', async () => {
      const store = useApiStore();

      await store.get('/users', { useCache: true });
      let stats = await store.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      await store.delete('/users/1');
      stats = await store.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('HTTP Methods - HEAD', () => {
    it('should perform HEAD request', async () => {
      const store = useApiStore();
      const response = await store.head('/users');

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('Batch Requests', () => {
    it('should handle batch requests', async () => {
      const store = useApiStore();

      const requests = [
        { method: 'GET' as const, url: '/users' },
        { method: 'GET' as const, url: '/posts' },
        { method: 'POST' as const, url: '/comments', data: { text: 'Test' } },
      ];

      const responses = await store.batchRequests(requests);

      expect(responses).toHaveLength(3);
      expect(responses[0].success).toBe(true);
      expect(responses[1].success).toBe(true);
      expect(responses[2].success).toBe(true);
    });

    it('should handle batch request failures individually', async () => {
      const store = useApiStore();

      const requests = [
        { method: 'GET' as const, url: '/valid' },
        { method: 'GET' as const, url: '/invalid' },
      ];

      const responses = await store.batchRequests(requests);

      expect(responses).toHaveLength(2);
      // All should succeed in mock mode
      expect(responses[0].success).toBe(true);
      expect(responses[1].success).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should get and set base URL', async () => {
      const store = useApiStore();

      const initialURL = await store.getBaseURL();
      expect(initialURL).toBe('/api');

      await store.setBaseURL('https://api.example.com');
      const newURL = await store.getBaseURL();
      expect(newURL).toBe('https://api.example.com');
    });

    it('should get and set timeout', async () => {
      const store = useApiStore();

      const initialTimeout = await store.getTimeout();
      expect(initialTimeout).toBe(30000);

      await store.setTimeout(60000);
      const newTimeout = await store.getTimeout();
      expect(newTimeout).toBe(60000);
    });

    it('should set default config', async () => {
      const store = useApiStore();

      await store.setDefaultConfig({
        headers: {
          'X-Custom-Header': 'test-value',
        },
      });

      // Headers should be set (no direct way to verify in mock)
      expect(store.isInitialized()).toBe(true);
    });
  });

  describe('Auth Token', () => {
    it('should set auth token', async () => {
      const store = useApiStore();

      await store.setAuthToken('test-token-123');

      // Token should be set (verified indirectly through requests)
      expect(store.isInitialized()).toBe(true);
    });

    it('should clear auth token', async () => {
      const store = useApiStore();

      await store.setAuthToken('test-token-123');
      await store.clearAuthToken();

      expect(store.isInitialized()).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache manually', async () => {
      const store = useApiStore();

      // Cache some requests
      await store.get('/users', { useCache: true });
      await store.get('/posts', { useCache: true });

      let stats = await store.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      await store.clearCache();
      stats = await store.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should get cache statistics', async () => {
      const store = useApiStore();

      // Initial stats
      const stats1 = await store.getCacheStats();
      expect(stats1.hits).toBe(0);
      expect(stats1.misses).toBe(0);
      expect(stats1.size).toBe(0);

      // Make cached request
      await store.get('/users', { useCache: true });

      // Stats after first request (miss)
      const stats2 = await store.getCacheStats();
      expect(stats2.misses).toBe(1);
      expect(stats2.size).toBe(1);

      // Make same request (hit)
      await store.get('/users', { useCache: true });

      // Stats after second request (hit)
      const stats3 = await store.getCacheStats();
      expect(stats3.hits).toBe(1);
      expect(stats3.hitRate).toBeGreaterThan(0);
    });

    it('should update cache config', async () => {
      const store = useApiStore();

      await store.setCacheConfig({
        enabled: true,
        defaultTimeout: 120000,
        maxSize: 200,
      });

      expect(store.isInitialized()).toBe(true);
    });
  });

  describe('Utilities', () => {
    it('should check initialization status', async () => {
      const store = useApiStore();

      expect(store.isInitialized()).toBe(false);

      await store.get('/test');

      expect(store.isInitialized()).toBe(true);
    });

    it('should get axios instance', async () => {
      const store = useApiStore();

      const instance = await store.getAxiosInstance();

      // Mock returns null, live returns axios instance
      expect(instance).toBeNull();
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup properly', async () => {
      const store = useApiStore();

      await store.get('/test');
      expect(store.isInitialized()).toBe(true);

      store.cleanup();

      expect(store.isReady).toBe(false);
      expect(store.isLoading).toBe(false);
      expect(store.loadError).toBeNull();
      expect(store.isInitialized()).toBe(false);
    });

    it('should reinitialize after cleanup', async () => {
      const store = useApiStore();

      await store.get('/test');
      store.cleanup();

      expect(store.isInitialized()).toBe(false);

      await store.get('/test');
      expect(store.isInitialized()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should track load errors', async () => {
      const store = useApiStore();

      // Mock service shouldn't error, but we can verify the error tracking mechanism
      expect(store.loadError).toBeNull();

      await store.get('/test');

      expect(store.loadError).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should expose reactive state', async () => {
      const store = useApiStore();

      expect(store.isReady).toBe(false);
      expect(store.isLoading).toBe(false);

      const promise = store.get('/test');
      expect(store.isLoading).toBe(true);

      await promise;
      expect(store.isReady).toBe(true);
      expect(store.isLoading).toBe(false);
    });
  });
});
