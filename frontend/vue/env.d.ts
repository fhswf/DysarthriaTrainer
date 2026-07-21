/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration (Build-time)
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
  readonly VITE_ENABLE_MOCK_MODE: string;

  // Optional API Configuration
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_API_RETRY_ATTEMPTS?: string;
  readonly VITE_LOG_LEVEL?: string;

  // Development Configuration
  readonly VITE_ENABLE_LOGGING?: string;
  readonly VITE_ENABLE_METRICS?: string;
  readonly VITE_MOCK_DELAY?: string;
  readonly VITE_MOCK_FAILURE_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
