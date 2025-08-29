interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_STORAGE_BUCKET?: string

  readonly VITE_FOLLOWERS_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
