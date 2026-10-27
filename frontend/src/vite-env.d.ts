/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL của Laravel API, dùng chung cho RTK Query và Echo auth endpoint. */
  readonly VITE_API_URL?: string;
  /** Khớp REVERB_APP_KEY trong laravel_api/.env. */
  readonly VITE_REVERB_APP_KEY?: string;
  /** Khớp REVERB_HOST trong laravel_api/.env. */
  readonly VITE_REVERB_HOST?: string;
  /** Khớp REVERB_PORT trong laravel_api/.env (Reverb local chạy cổng 8081). */
  readonly VITE_REVERB_PORT?: string;
  /** http => ws://, https => wss://; khớp REVERB_SCHEME. */
  readonly VITE_REVERB_SCHEME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

