export type ServiceName =
  | 'api'
  | 'messaging'
  | 'error'
  | 'auth'
  | 'config'
  | 'localization'
  | 'validation'
  | 'apiErrorIntegration'
  | 'mockApiIntegration'
  | 'performanceIntegration'
  | 'devToolsIntegration';

export interface ServiceRegistry {
  register(name: ServiceName, service: any): void;
  get<T = any>(name: ServiceName): T | undefined;
  getAsync<T = any>(name: ServiceName): Promise<T>;
  has(name: ServiceName): boolean;
  clear(): void;
  getAll(): Map<ServiceName, any>;
}

export interface ServiceWaiter {
  resolve: (service: any) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

export interface BootstrapOptions {
  enableMock?: boolean;
  enableDevTools?: boolean;
  enablePerformanceTracking?: boolean;
  apiBaseUrl?: string;
}

export interface BootstrapResult {
  success: boolean;
  initializedServices: ServiceName[];
  failedServices: string[];
  errors: Error[];
  duration: number;
}
