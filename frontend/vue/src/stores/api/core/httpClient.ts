import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { HttpClientConfig } from '../api.types';

export class HttpClient {
  private instance: AxiosInstance | null = null;
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  initialize(): void {
    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
      withCredentials: this.config.withCredentials,
    });
  }

  getInstance(): AxiosInstance {
    if (!this.instance) {
      throw new Error('HttpClient not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    if (this.instance) {
      this.instance.defaults.baseURL = baseURL;
    }
  }

  updateTimeout(timeout: number): void {
    this.config.timeout = timeout;
    if (this.instance) {
      this.instance.defaults.timeout = timeout;
    }
  }

  updateHeaders(headers: Record<string, string>): void {
    this.config.headers = { ...this.config.headers, ...headers };
    if (this.instance) {
      this.instance.defaults.headers.common = {
        ...this.instance.defaults.headers.common,
        ...headers,
      };
    }
  }

  getConfig(): HttpClientConfig {
    return { ...this.config };
  }

  cleanup(): void {
    this.instance = null;
  }
}
