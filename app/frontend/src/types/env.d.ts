/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_API_TIMEOUT: string
    readonly VITE_DEBUG_MODE: string
    readonly VITE_ENABLE_CACHE: string
    readonly VITE_CACHE_MAX_SIZE: string
    readonly VITE_ENABLE_TOASTS: string
    readonly VITE_AUTO_REFRESH_INTERVAL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
