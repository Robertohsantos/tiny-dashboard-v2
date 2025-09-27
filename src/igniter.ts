import { Igniter } from '@igniter-js/core'
import openapiJson from './docs/openapi.json' assert { type: 'json' }
import { createIgniterAppContext } from './igniter.context'
import { store } from '@/modules/core/services/store'
import { registeredJobs } from '@/modules/core/services/jobs'
import { logger } from '@/modules/core/services/logger'

/**
 * @description Initialize the Igniter Router
 * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
 */
const igniterBuilder = Igniter.context(createIgniterAppContext)

const builderWithStore = store ? igniterBuilder.store(store) : igniterBuilder

export const igniter = builderWithStore
  .jobs(registeredJobs)
  .logger(logger)
  .config({
    baseURL: process.env.NEXT_PUBLIC_IGNITER_API_URL || 'http://localhost:3000',
    basePATH: process.env.NEXT_PUBLIC_IGNITER_API_BASE_PATH || '/api/v1',
  })
  .docs({
    openapi: openapiJson as Record<string, unknown>,
    securitySchemes: {
      token: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your token',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
      },
    },
  })
  .create()
