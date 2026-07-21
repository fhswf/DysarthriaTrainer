import type { AxiosInstance } from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'blob' | 'text' | 'arraybuffer';
  
  // Cache options
  useCache?: boolean;
  cacheTimeout?: number;
  
  // Retry options
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // Interceptor options
  skipAuthInterceptor?: boolean;
  skipErrorInterceptor?: boolean;
  
  // Custom options
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface BatchRequest {
  method: HttpMethod;
  url: string;
  data?: any;
  config?: RequestConfig;
}

export interface BatchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  status: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface CacheConfig {
  enabled: boolean;
  defaultTimeout: number;
  maxSize: number;
}

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  withCredentials?: boolean;
}

export interface InterceptorConfig {
  onRequest?: (config: any) => any;
  onRequestError?: (error: any) => any;
  onResponse?: (response: any) => any;
  onResponseError?: (error: any) => any;
}

export interface ApiServiceInterface {
  // Initialization
  initialize(): Promise<void>;
  cleanup(): void;
  
  // HTTP Methods
  get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T = any, D = any>(url: string, data?: D, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T = any, D = any>(url: string, data?: D, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T = any, D = any>(url: string, data?: D, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  
  // Batch operations
  batchRequests<T = any>(requests: BatchRequest[]): Promise<BatchResponse<T>[]>;
  
  // Configuration
  setBaseURL(baseURL: string): void;
  setTimeout(timeout: number): void;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
  setDefaultConfig(config: Partial<RequestConfig>): void;
  
  // Cache management
  clearCache(): void;
  getCacheStats(): CacheStats;
  setCacheConfig(config: CacheConfig): void;
  
  // State
  isInitialized(): boolean;
  getBaseURL(): string;
  getTimeout(): number;
  getAxiosInstance(): AxiosInstance | null;
}
