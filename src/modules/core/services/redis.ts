import type { Redis } from 'ioredis'

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined
}

let redis: Redis | null = null

if (typeof window === 'undefined') {
  if (process.env.SKIP_REDIS === 'true') {
    console.log('⚠️  Redis connection skipped (SKIP_REDIS=true)')
  } else {
    try {
      const { Redis: RedisClient } = require('ioredis')

      redis =
        global._redis ??
        new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          retryStrategy: (times: number) => {
            if (times > 3) {
              console.error('❌ Redis connection failed after 3 attempts')
              return null
            }
            return Math.min(times * 200, 2000)
          },
        })

      if (process.env.NODE_ENV !== 'production') {
        global._redis = redis
      }

      redis.on('error', (err: Error) => {
        console.error('Redis connection error:', err.message)
      })

      redis.on('connect', () => {
        console.log('✅ Redis connected successfully')
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
    }
  }
}

export default redis
