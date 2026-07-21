import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export class AuthInterceptor {
  private token: string | null = null;
  private requestInterceptorId: number | null = null;

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  setup(axiosInstance: AxiosInstance): void {
    this.requestInterceptorId = axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip if explicitly disabled
        if ((config as any).skipAuthInterceptor) {
          return config;
        }

        // Add auth token if available
        if (this.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );
  }

  cleanup(axiosInstance: AxiosInstance): void {
    if (this.requestInterceptorId !== null) {
      axiosInstance.interceptors.request.eject(this.requestInterceptorId);
      this.requestInterceptorId = null;
    }
  }
}
