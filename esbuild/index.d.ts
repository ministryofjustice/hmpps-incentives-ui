export interface BuildConfig {
  isProduction: boolean

  app: {
    outDir: string
    entryPoints: string[]
    copy: { from: string; to: string }[]
  }

  assets: {
    outDir: string
    entryPoints: string[]
    copy: { from: string; to: string }[]
    clear: string[]
  }
}
