/** @type {import('next').NextConfig} */
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default withPayload(nextConfig)
