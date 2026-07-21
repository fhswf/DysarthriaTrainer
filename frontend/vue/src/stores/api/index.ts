import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  ApiServiceInterface,
  RequestConfig,
  ApiResponse,
  BatchRequest,
  BatchResponse,
  CacheConfig,
  CacheStats,
} from './api.types';
import { createLiveService } from './api.live';
import { createMockService } from './api.mock';

export const useApiStore = defineStore('api', () => {
  // State
  const isReady = ref(false);
  const isLoading = ref(false);
  const loadError = ref<Error | null>(null);

  // Service instance (lazy loaded)
  let serviceInstance: ApiServiceInterface | null = null;

  // Determine which service to use
  const useMock = import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.MODE === 'test';

  /**
   * Ensures the service is initialized before use
   */
  async function ensureInitialized(): Promise<ApiServiceInterface> {
    if (serviceInstance && isReady.value) {
      return serviceInstance;
    }

    if (isLoading.value) {
      // Wait for initialization to complete
      return new Promise((resolve, reject) => {
        const checkReady = setInterval(() => {
          if (isReady.value && serviceInstance) {
            clearInterval(checkReady);
            resolve(serviceInstance);
          } else if (loadError.value) {
            clearInterval(checkReady);
            reject(loadError.value);
          }
        }, 50);
      });
    }

    isLoading.value = true;
    loadError.value = null;

    try {
      // Create service instance
      serviceInstance = useMock ? createMockService() : createLiveService();

      // Initialize the service
      await serviceInstance.initialize();

      isReady.value = true;
      return serviceInstance;
    } catch (error) {
      loadError.value = error instanceof Error ? error : new Error(String(error));
      throw loadError.value;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * HTTP Methods
   */
  async function get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const service = await ensureInitialized();
    return service.get<T>(url, config);
  }

  async function post<T = any, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const service = await ensureInitialized();
    return service.post<T, D>(url, data, config);
  }

  async function put<T = any, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const service = await ensureInitialized();
    return service.put<T, D>(url, data, config);
  }

  async function patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const service = await ensureInitialized();
    return service.patch<T, D>(url, data, config);
  }

  async function deleteRequest<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const service = await ensureInitialized();
    return service.delete<T>(url, config);
  }

  async function head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const service = await ensureInitialized();
    return service.head<T>(url, config);
  }

  async function batchRequests<T = any>(
    requests: BatchRequest[]
  ): Promise<BatchResponse<T>[]> {
    const service = await ensureInitialized();
    return service.batchRequests<T>(requests);
  }

  /**
   * Configuration Methods
   */
  async function setBaseURL(baseURL: string): Promise<void> {
    const service = await ensureInitialized();
    service.setBaseURL(baseURL);
  }

  async function setTimeout(timeout: number): Promise<void> {
    const service = await ensureInitialized();
    service.setTimeout(timeout);
  }

  async function setAuthToken(token: string): Promise<void> {
    const service = await ensureInitialized();
    service.setAuthToken(token);
  }

  async function clearAuthToken(): Promise<void> {
    const service = await ensureInitialized();
    service.clearAuthToken();
  }

  async function setDefaultConfig(config: Partial<RequestConfig>): Promise<void> {
    const service = await ensureInitialized();
    service.setDefaultConfig(config);
  }

  /**
   * Cache Management
   */
  async function clearCache(): Promise<void> {
    const service = await ensureInitialized();
    service.clearCache();
  }

  async function getCacheStats(): Promise<CacheStats> {
    const service = await ensureInitialized();
    return service.getCacheStats();
  }

  async function setCacheConfig(config: CacheConfig): Promise<void> {
    const service = await ensureInitialized();
    service.setCacheConfig(config);
  }

  /**
   * Utility Methods
   */
  function isInitialized(): boolean {
    return isReady.value && serviceInstance !== null;
  }

  async function getBaseURL(): Promise<string> {
    const service = await ensureInitialized();
    return service.getBaseURL();
  }

  async function getTimeout(): Promise<number> {
    const service = await ensureInitialized();
    return service.getTimeout();
  }

  async function getAxiosInstance() {
    const service = await ensureInitialized();
    return service.getAxiosInstance();
  }

  /**
   * Lifecycle Methods
   */
  function cleanup(): void {
    if (serviceInstance) {
      serviceInstance.cleanup();
      serviceInstance = null;
    }
    isReady.value = false;
    isLoading.value = false;
    loadError.value = null;
  }

  return {
    // State
    isReady,
    isLoading,
    loadError,

    // HTTP Methods
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
    head,
    batchRequests,

    // Configuration
    setBaseURL,
    setTimeout,
    setAuthToken,
    clearAuthToken,
    setDefaultConfig,

    // Cache
    clearCache,
    getCacheStats,
    setCacheConfig,

    // Utilities
    isInitialized,
    getBaseURL,
    getTimeout,
    getAxiosInstance,

    // Lifecycle
    cleanup,
  };
});
