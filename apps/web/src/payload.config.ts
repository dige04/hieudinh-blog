import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Weekly } from './collections/Weekly'
import { Media } from './collections/Media'
import { SiteConfig } from './globals/SiteConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Weekly, Media],
  globals: [SiteConfig],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor(),
  plugins: [
    // Supabase Storage is S3-compatible
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.SUPABASE_STORAGE_BUCKET || 'media',
      config: {
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.SUPABASE_S3_REGION || 'auto',
        endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
        forcePathStyle: true,
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-min-32-chars-long',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
