/* eslint-disable @typescript-eslint/no-require-imports */
import redis from '@/modules/core/services/redis'

export let store: any = null

if (typeof window === 'undefined' && redis) {
  const { createRedisStoreAdapter } = require('@igniter-js/adapter-redis')
  store = createRedisStoreAdapter(redis)
}
