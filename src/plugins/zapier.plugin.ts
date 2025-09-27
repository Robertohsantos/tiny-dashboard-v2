import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { z } from 'zod'

const isRecordOfUnknown = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const zapier = PluginManager.plugin({
  slug: 'zapier',
  name: 'Zapier',
  schema: z.object({
    apiKey: z.string().describe('Ex: your-zapier-api-key'),
    workspaceId: z.string().describe('Ex: your-zapier-workspace-id'),
    triggerId: z.string().describe('Ex: your-zapier-trigger-id'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://dubassets.com/integrations/clzlmz336000fjeqynwhfv8vo_S4yz4ak', // Zapier logo
    description:
      'Automate your workflows with Zapier, connecting your apps and services to create powerful automations without coding.',
    category: 'automations',
    developer: 'Zapier',
    screenshots: [],
    website:
      'https://www.pipelinersales.com/wp-content/uploads/2018/07/zapier.jpg',
    links: {
      install: 'https://zapier.com/',
      guide: 'https://zapier.com/help/',
    },
  },
  actions: {
    sendEvent: {
      name: 'Send Event',
      schema: z.object({
        event: z.string(),
        data: z.record(z.unknown()),
      }),
      handler: async ({
        config,
        input,
      }: {
        config: {
          apiKey: string
          workspaceId: string
          triggerId: string
        }
        input: {
          event: string
          data: Record<string, unknown>
        }
      }) => {
        const { apiKey, workspaceId, triggerId } = config
        const { event, data } = input

        const result = await tryCatch<Record<string, unknown>>(
          (async () => {
            // Zapier Webhook URL format
            const webhookUrl = `https://hooks.zapier.com/hooks/catch/${workspaceId}/${triggerId}/`

            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                apiKey,
                event,
                data,
                timestamp: new Date().toISOString(),
                source: 'saas-boilerplate',
              }),
            })

            if (!response.ok) {
              throw new Error(
                `Zapier API error: ${response.status} ${response.statusText}`,
              )
            }

            const responseData: unknown = await response.json()
            if (!isRecordOfUnknown(responseData)) {
              throw new Error('Unexpected Zapier response payload')
            }
            console.log(`[Zapier] Event "${event}" sent successfully`, {
              responseData,
            })
            return responseData
          })(),
        )

        return result
      },
    },
  },
})
