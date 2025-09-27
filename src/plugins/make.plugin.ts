import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { z } from 'zod'

const makeConfigSchema = z.object({
  apiKey: z.string().describe('Ex: your-make-api-key'),
  workflowId: z.string().describe('Ex: your-make-workflow-id'),
  environment: z
    .enum(['production', 'staging', 'development'])
    .describe('Ex: production'),
})

const makeMessageSchema = z.object({
  message: z.string(),
})

const makeEventSchema = z.object({
  event: z.string(),
  data: z.unknown(),
})

type MakeConfig = z.infer<typeof makeConfigSchema>
type MakeMessagePayload = z.infer<typeof makeMessageSchema>
type MakeEventPayload = z.infer<typeof makeEventSchema>

export const make = PluginManager.plugin({
  slug: 'make',
  name: 'Make',
  schema: makeConfigSchema,
  metadata: {
    verified: true,
    published: true,
    logo: 'https://www.make.com/en/favicon.ico', // Example logo
    description:
      'Integrate your SaaS application with Make to streamline processes.',
    category: 'automations',
    developer: 'Make',
    screenshots: [],
    website: 'https://www.make.com/',
    links: {
      install: 'https://www.make.com/',
      guide: 'https://www.make.com/en/help',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: makeMessageSchema,
      handler: ({ input }: { input: MakeMessagePayload }) => {
        // Placeholder implementation; replace with Make API integration if needed
        console.log(`[Make] Sending message: ${input.message}`)
        return { success: true as const }
      },
    },

    sendEvent: {
      name: 'Send Event',
      schema: makeEventSchema,
      handler: async ({
        config,
        input,
      }: {
        config: MakeConfig
        input: MakeEventPayload
      }) => {
        const { apiKey, workflowId, environment } = config
        const { event, data } = input

        // Make webhook URL format (simplified)
        // In production, you would use the actual Make API
        const makeUrl = `https://hook.eu1.make.com/${workflowId}`

        const payload = {
          event,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'saas-boilerplate',
            environment,
            apiKey: apiKey.substring(0, 8) + '...', // Partial key for logging
          },
        }

        const response = await fetch(makeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'User-Agent': 'SaaS-Boilerplate/1.0',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `Make API error: ${response.status} ${response.statusText} - ${errorText}`,
          )
        }

        const responsePayload: unknown = await response.json()
        console.log(
          `[Make] Event "${event}" sent successfully to workflow ${workflowId}`,
          {
            environment,
            response: responsePayload,
          },
        )
        return responsePayload
      },
    },
  },
})
