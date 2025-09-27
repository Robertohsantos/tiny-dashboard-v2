import { createBullMQAdapter } from '@igniter-js/adapter-bullmq'
import { store } from '@/modules/core/services/store'
import { z } from 'zod'
import { logger } from '@/modules/core/services/logger'
import { AppConfig } from '@/config/boilerplate.config.client'
import type { IgniterAppContext } from '@/igniter.context'

/**
 * Job queue adapter for background processing
 * @description Handles asynchronous job processing with BullMQ
 */
export const jobs = createBullMQAdapter<IgniterAppContext>({
  store: store ?? undefined,
  autoStartWorker: {
    concurrency: 1,
    debug: true,
  },
})

export const registeredJobs = jobs.merge({
  webhook: jobs.router({
    namespace: 'webhook',
    jobs: {
      dispatch: jobs.register({
        name: 'dispatch',
        input: z.object({
          webhook: z.object({
            id: z.string(),
            url: z.string().url(),
            secret: z.string(),
            events: z.array(z.string()),
          }),
          payload: z.record(z.any()), // Dynamic payload for the webhook
          eventName: z.string(), // The specific event that triggered the webhook
          retries: z.number().default(0), // Number of retry attempts
        }),
        handler: async ({ input, context }) => {
          // Business Logic: Attempt to dispatch the webhook
          try {
            logger.info(
              `Dispatching webhook ${input.webhook.id} for event ${input.eventName} to ${input.webhook.url}`,
            )

            const response = await fetch(input.webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-App-Name': AppConfig.name,
                'X-Webhook-Secret': input.webhook.secret,
                'X-Event-Name': input.eventName,
              },
              body: JSON.stringify(input.payload),
            })

            if (!response.ok) {
              // Observation: Webhook dispatch failed, throw an error to trigger retry
              const errorText = await response.text()
              throw new Error(
                `Webhook dispatch failed with status ${response.status}: ${errorText}`,
              )
            }

            logger.info(
              `Webhook ${input.webhook.id} dispatched successfully for event ${input.eventName}`,
            )
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error)

            logger.error(
              `Failed to dispatch webhook ${input.webhook.id} for event ${input.eventName}: ${message}`,
            )

            throw error
          }
        },
      }),
    },
  }),
})
