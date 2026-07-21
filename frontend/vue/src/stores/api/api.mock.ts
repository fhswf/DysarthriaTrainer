import type {
  ApiServiceInterface,
  RequestConfig,
  ApiResponse,
  BatchRequest,
  BatchResponse,
  CacheConfig,
  CacheStats,
} from './api.types';

export function createMockService(): ApiServiceInterface {
  let initialized = false;
  let baseURL = '/api';
  let timeout = 30000;
  let authToken: string | null = null;
  let defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

  // Simple cache simulation
  const cache = new Map<string, { data: any; expires: number }>();
  let cacheConfig: CacheConfig = { enabled: true, defaultTimeout: 60000, maxSize: 100 };
  let cacheHits = 0;
  let cacheMisses = 0;

  // Mock response data
  const mockData: Record<string, any> = {
    '/test': { message: 'Test successful' },
    '/users': [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ],
  };

  function generateCacheKey(url: string, params?: Record<string, any>): string {
    return params ? `${url}:${JSON.stringify(params)}` : url;
  }

  function createMockResponse<T>(data: T, status = 200): ApiResponse<T> {
    return {
      data,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { 'content-type': 'application/json' },
      config: {} as RequestConfig,
    };
  }

  return {
    async initialize(): Promise<void> {
      initialized = true;
    },

    cleanup(): void {
      initialized = false;
      cache.clear();
      authToken = null;
    },

    async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
      // Bypass cache entirely if useCache is false
      if (config?.useCache === false) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const data = (mockData[url] || { message: 'Mock data' }) as T;
        return createMockResponse<T>(data);
      }

      const cacheKey = generateCacheKey(url, config?.params);

      // Check cache
      if (cacheConfig.enabled) {
        const cached = cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          cacheHits++;
          return createMockResponse<T>(cached.data);
        }
        cacheMisses++;
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      const data = (mockData[url] || { message: 'Mock data' }) as T;
      const response = createMockResponse<T>(data);

      // Cache the response
      if (cacheConfig.enabled) {
        const ttl = config?.cacheTimeout || cacheConfig.defaultTimeout;
        cache.set(cacheKey, {
          data,
          expires: Date.now() + ttl,
        });
      }

      return response;
    },

    async post<T = any, D = any>(
      url: string,
      data?: D,
      _config?: RequestConfig
    ): Promise<ApiResponse<T>> {
      await new Promise((resolve) => setTimeout(resolve, 10));
      cache.clear(); // Invalidate cache on mutations
      return createMockResponse<T>({ success: true, data } as T);
    },

    async put<T = any, D = any>(
      url: string,
      data?: D,
      _config?: RequestConfig
    ): Promise<ApiResponse<T>> {
      await new Promise((resolve) => setTimeout(resolve, 10));
      cache.clear(); // Invalidate cache on mutations
      return createMockResponse<T>({ success: true, data } as T);
    },

    async patch<T = any, D = any>(
      url: string,
      data?: D,
      _config?: RequestConfig
    ): Promise<ApiResponse<T>> {
      await new Promise((resolve) => setTimeout(resolve, 10));
      cache.clear(); // Invalidate cache on mutations
      return createMockResponse<T>({ success: true, data } as T);
    },

    async delete<T = any>(url: string, _config?: RequestConfig): Promise<ApiResponse<T>> {
      await new Promise((resolve) => setTimeout(resolve, 10));
      cache.clear(); // Invalidate cache on mutations
      return createMockResponse<T>({ success: true } as T);
    },

    async head<T = any>(url: string, _config?: RequestConfig): Promise<ApiResponse<T>> {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return createMockResponse<T>({} as T);
    },

    async batchRequests<T = any>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
      await new Promise((resolve) => setTimeout(resolve, 10));

      return requests.map((req) => ({
        success: true,
        data: mockData[req.url] || { message: 'Mock data' },
        status: 200,
      }));
    },

    setBaseURL(url: string): void {
      baseURL = url;
    },

    setTimeout(ms: number): void {
      timeout = ms;
    },

    setAuthToken(token: string): void {
      authToken = token;
    },

    clearAuthToken(): void {
      authToken = null;
    },

    setDefaultConfig(config: Partial<RequestConfig>): void {
      if (config.headers) {
        defaultHeaders = { ...defaultHeaders, ...config.headers };
      }
    },

    clearCache(): void {
      cache.clear();
      cacheHits = 0;
      cacheMisses = 0;
    },

    getCacheStats(): CacheStats {
      const total = cacheHits + cacheMisses;
      return {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: total > 0 ? cacheHits / total : 0,
        size: cache.size,
      };
    },

    setCacheConfig(config: CacheConfig): void {
      cacheConfig = { ...cacheConfig, ...config };
    },

    isInitialized(): boolean {
      return initialized;
    },

    getBaseURL(): string {
      return baseURL;
    },

    getTimeout(): number {
      return timeout;
    },

    getAxiosInstance() {
      return null; // Mock doesn't have Axios instance
    },
  };
}
