/// <reference types="vite/client" />

/**
 * Environment Variables Type Definitions
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PREFIX: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

