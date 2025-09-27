// next.config.ts
import { withIgniter } from '@igniter-js/core/adapters'
import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = withIgniter({
  serverExternalPackages: [
    '@aws-sdk/client-s3',
    '@igniter-js/adapter-bullmq',
    '@igniter-js/adapter-redis',
    '@prisma/client',
    'awilix',
    'bullmq',
    'ioredis',
    'nodemailer',
    'resend',
    'stripe',
  ],

  eslint: {
    ignoreDuringBuilds: true,
  },

  transpilePackages: ['better-auth'],

  // Configuração Webpack (para compatibilidade)
  webpack: (
    config: any,
    { dev, isServer }: { dev: boolean; isServer: boolean },
  ) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        './providers/prisma': false,
        './providers/auth': false,
        './providers/mail': false,
        './providers/payment': false,
        './providers/plugin-manager': false,
        './providers/jobs': false,
        './providers/store': false,
        './providers/redis': false,
        './providers/logger': false,
        './providers/telemetry': false,
        './igniter.server-context': false,
      }

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'node:fs': false,
        'node:path': false,
        net: false,
        dns: false,
        tls: false,
        child_process: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
      }

      config.externals = [
        ...(config.externals || []),
        '@prisma/client',
        'better-auth',
        'stripe',
        'nodemailer',
        'resend',
        'bullmq',
        'ioredis',
        '@aws-sdk/client-s3',
      ]
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        innerGraph: true,
        providedExports: true,
        concatenateModules: true,
      }

      // Ignore mock imports in production
      // This prevents mock files from being included in the production bundle
      config.plugins.push(
        new config.webpack.IgnorePlugin({
          resourceRegExp: /\/mocks\//,
          contextRegExp: /./,
        }),
      )
    }

    return config
  },
})

export default bundleAnalyzer(nextConfig)
