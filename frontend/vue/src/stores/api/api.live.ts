import type { AxiosResponse, AxiosError } from 'axios';
import type {
  ApiServiceInterface,
  RequestConfig,
  ApiResponse,
  BatchRequest,
  BatchResponse,
  CacheConfig,
  HttpClientConfig,
} from './api.types';
import { HttpClient } from './core/httpClient';
import { RequestCache } from './features/cache';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { getApiConfig, reportError, notifyNetworkError, notifyApiError, logApiEvent } from './communication';

export function createLiveService(): ApiServiceInterface {
  // Initialize with placeholder config - will be loaded from config service during initialize()
  let httpClientConfig: HttpClientConfig = {
    baseURL: '',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  };

  const cacheConfig: CacheConfig = {
    enabled: true,
    defaultTimeout: 60000,
    maxSize: 100,
  };

  let httpClient = new HttpClient(httpClientConfig);
  const cache = new RequestCache(cacheConfig);
  const authInterceptor = new AuthInterceptor();
  const responseInterceptor = new ResponseInterceptor();

  let initialized = false;

  // Helper to convert Axios response to our ApiResponse
  function toApiResponse<T>(axiosResponse: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: axiosResponse.data,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as Record<string, string>,
      config: axiosResponse.config as RequestConfig,
    };
  }

  // Error handler for response interceptor
  async function handleResponseError(error: AxiosError): Promise<never> {
    const context = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    };

    // Report to error service
    await reportError(error, context);

    // Notify user based on error type
    if (!error.response) {
      // Network error
      await notifyNetworkError(error);
    } else if (error.response.status >= 400) {
      // API error
      await notifyApiError(error, error.response.status);
    }

    throw error;
  }

  return {
    async initialize(): Promise<void> {
      if (initialized) return;

      logApiEvent('Initializing API Service');

      // Load config from config service
      try {
        const apiConfig = await getApiConfig();
        if (apiConfig) {
          httpClientConfig = {
            baseURL: apiConfig.baseURL,
            timeout: apiConfig.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: apiConfig.withCredentials,
          };

          const newCacheConfig: CacheConfig = {
            enabled: apiConfig.cache?.enabled ?? true,
            defaultTimeout: apiConfig.cache?.ttl ?? 60000,
            maxSize: apiConfig.cache?.maxSize ?? 100,
          };

          // Recreate HTTP client with new config
          httpClient = new HttpClient(httpClientConfig);
          
          // Update cache config
          cache.updateConfig(newCacheConfig);
          
          logApiEvent('Loaded API config from config service', apiConfig);
        }
      } catch (err) {
        console.warn('[API] Failed to load config from config service:', err);
      }

      // Initialize HTTP client
      httpClient.initialize();

      // Setup interceptors
      const axiosInstance = httpClient.getInstance();
      authInterceptor.setup(axiosInstance);
      
      responseInterceptor.setHandlers(
        (response) => response,
        handleResponseError
      );
      responseInterceptor.setup(axiosInstance);

      initialized = true;
      logApiEvent('API Service initialized', { baseURL: httpClientConfig.baseURL });
    },

    cleanup(): void {
      if (!initialized) return;

      const axiosInstance = httpClient.getInstance();
      authInterceptor.cleanup(axiosInstance);
      responseInterceptor.cleanup(axiosInstance);
      httpClient.cleanup();
      cache.clear();

      initialized = false;
      logApiEvent('API Service cleaned up');
    },

    async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
      // Check cache first (only for GET requests)
      if (config?.useCache !== false && cache.has(url, config?.params)) {
        const cached = cache.get<ApiResponse<T>>(url, config?.params);
        if (cached) {
          logApiEvent('Cache hit', { url });
          return cached;
        }
      }

      const axiosInstance = httpClient.getInstance();
      const response = await axiosInstance.get<T>(url, config as any);
      const apiResponse = toApiResponse(response);

      // Cache successful responses
      if (config?.useCache !== false && cacheConfig.enabled) {
        cache.set(url, apiResponse, config?.params, config?.cacheTimeout);
      }

      return apiResponse;
    },

    async post<T = any, D = any>(
      url: string,
      data?: D,
      config?: RequestConfig
    ): Promise<ApiResponse<T>> {
      const axiosInstance = httpClient.getInstance();
      const response = await axiosInstance.post<T>(url, data, config as any);
      
      // Invalidate cache for this URL (POST might modify data)
      cache.clear();
      
      return toApiResponse(response);
    },

    async put<T = any, D = any>(
      url: string,
      data?: D,
      config?: RequestConfig
    ): Promise<ApiResponse<T>> {
      const axiosInstance = httpClient.getInstance();
      const response = await axiosInstance.put<T>(url, data, config as any);
      
      // Invalidate cache
      cache.clear();
      
      return toApiResponse(response);
    },

    async patch<T = any, D = any>(
      url: string,
      data?: D,
      config?: RequestConfig
    ): Promise<ApiResponse<T>> {
      const axiosInstance = httpClient.getInstance();
      const response = await axiosInstance.patch<T>(url, data, config as any);
      
      // Invalidate cache
      cache.clear();
      
      return toApiResponse(response);
    },

    async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
      const axiosInstance = httpClient.getInstance();
      const response = await axiosInstance.delete<T>(url, config as any);
      
      // Invalidate cache
      cache.clear();
      
      return toApiResponse(response);
    },

    async head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
      const axiosInstance = httpClient.getInstance();
      const response = await axiosInstance.head<T>(url, config as any);
      return toApiResponse(response);
    },

    async batchRequests<T = any>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
      const axiosInstance = httpClient.getInstance();
      
      const promises = requests.map(async (req): Promise<BatchResponse<T>> => {
        try {
          let response: AxiosResponse;
          
          switch (req.method) {
            case 'GET':
              response = await axiosInstance.get(req.url, req.config as any);
              break;
            case 'POST':
              response = await axiosInstance.post(req.url, req.data, req.config as any);
              break;
            case 'PUT':
              response = await axiosInstance.put(req.url, req.data, req.config as any);
              break;
            case 'PATCH':
              response = await axiosInstance.patch(req.url, req.data, req.config as any);
              break;
            case 'DELETE':
              response = await axiosInstance.delete(req.url, req.config as any);
              break;
            case 'HEAD':
              response = await axiosInstance.head(req.url, req.config as any);
              break;
            default:
              throw new Error(`Unsupported method: ${req.method}`);
          }

          return {
            success: true,
            data: response.data,
            status: response.status,
          };
        } catch (error: any) {
          return {
            success: false,
            error,
            status: error.response?.status || 0,
          };
        }
      });

      return Promise.all(promises);
    },

    setBaseURL(baseURL: string): void {
      httpClient.updateBaseURL(baseURL);
      logApiEvent('Base URL updated', { baseURL });
    },

    setTimeout(timeout: number): void {
      httpClient.updateTimeout(timeout);
      logApiEvent('Timeout updated', { timeout });
    },

    setAuthToken(token: string): void {
      authInterceptor.setToken(token);
      logApiEvent('Auth token set');
    },

    clearAuthToken(): void {
      authInterceptor.clearToken();
      logApiEvent('Auth token cleared');
    },

    setDefaultConfig(config: Partial<RequestConfig>): void {
      if (config.headers) {
        httpClient.updateHeaders(config.headers);
      }
      logApiEvent('Default config updated', config);
    },

    clearCache(): void {
      cache.clear();
      logApiEvent('Cache cleared');
    },

    getCacheStats() {
      return cache.getStats();
    },

    setCacheConfig(config: CacheConfig): void {
      cache.updateConfig(config);
      logApiEvent('Cache config updated', config);
    },

    isInitialized(): boolean {
      return initialized;
    },

    getBaseURL(): string {
      return httpClient.getConfig().baseURL;
    },

    getTimeout(): number {
      return httpClient.getConfig().timeout;
    },

    getAxiosInstance() {
      try {
        return httpClient.getInstance();
      } catch {
        return null;
      }
    },
  };
}
