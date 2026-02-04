// Augment the global CloudflareEnv interface from @opennextjs/cloudflare
declare global {
  interface CloudflareEnv {
    // Our app bindings from wrangler.toml
    DB: D1Database
    R2: R2Bucket
  }

  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      NODE_ENV: string
      CLOUDFLARE_ENV?: string
    }
  }
}

export {}
