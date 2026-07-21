import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

export class ResponseInterceptor {
  private responseInterceptorId: number | null = null;
  private onSuccess?: (response: AxiosResponse) => AxiosResponse;
  private onError?: (error: AxiosError) => Promise<any>;

  setHandlers(
    onSuccess?: (response: AxiosResponse) => AxiosResponse,
    onError?: (error: AxiosError) => Promise<any>
  ): void {
    this.onSuccess = onSuccess;
    this.onError = onError;
  }

  setup(axiosInstance: AxiosInstance): void {
    this.responseInterceptorId = axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.onSuccess) {
          return this.onSuccess(response);
        }
        return response;
      },
      (error: AxiosError) => {
        if (this.onError) {
          return this.onError(error);
        }
        return Promise.reject(error);
      }
    );
  }

  cleanup(axiosInstance: AxiosInstance): void {
    if (this.responseInterceptorId !== null) {
      axiosInstance.interceptors.response.eject(this.responseInterceptorId);
      this.responseInterceptorId = null;
    }
  }
}
