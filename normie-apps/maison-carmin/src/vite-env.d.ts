/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEADS_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
