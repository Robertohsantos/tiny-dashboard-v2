import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { z } from 'zod'
import { Url } from '@/@saas-boilerplate/utils/url'

export const discord = PluginManager.plugin({
  slug: 'discord',
  name: 'Discord 3',
  schema: z.object({
    webhookUrl: z
      .string()
      .describe('Ex: https://discord.com/api/webhooks/1234567890/abcdefg'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://logodownload.org/wp-content/uploads/2017/11/discord-logo-8-1.png',
    description:
      'Seamlessly connect your Discord server to receive real-time notifications and updates, keeping your team informed and engaged with automated alerts.',
    category: 'notifications',
    developer: 'Discord',
    screenshots: [],
    website: 'https://discord.com/',
    links: {
      install: 'https://discord.com/',
      guide: 'https://discord.com/developers/docs',
    },
  },
  actions: {
    sendEvent: {
      name: 'Send Event',
      schema: z.object({
        event: z.string(),
        data: z.unknown(),
      }),
      handler: async ({
        config,
        input,
      }: {
        config: { webhookUrl: string }
        input: { event: string; data: unknown }
      }) => {
        const { webhookUrl } = config
        const { event, data } = input

        if (event === 'lead.created') {
          const lead = toRecord(data)
          const leadId = getIdentifier(lead.id) ?? ''
          const leadUrl = Url.get(`/app/leads/${leadId}`)
          const leadName = getString(lead.name) ?? 'New Lead'
          const leadEmail = getString(lead.email) ?? 'N/A'

          const discordPayload: DiscordWebhookPayload = {
            content: '*New Lead Created!* 🚀',
            embeds: [
              {
                title: leadName,
                description: 'A new lead has been created.',
                color: 5814783,
                fields: [
                  { name: 'Name', value: leadName, inline: true },
                  { name: 'Email', value: leadEmail, inline: true },
                  { name: 'Link', value: `[View Lead](${leadUrl})` },
                ],
                footer: { text: `SaaS Boilerplate | Event: ${event}` },
                timestamp: new Date().toISOString(),
              },
            ],
          }
          await sendDiscordMessage(webhookUrl, discordPayload)
        } else if (event === 'submission.created') {
          const submission = toRecord(data)
          const lead = toRecord(submission.lead)
          const metadata = toRecord(submission.metadata)
          const formData = toRecord(metadata.data)

          const leadId = getIdentifier(lead.id) ?? ''
          const leadUrl = Url.get(`/app/leads/${leadId}`)
          const leadName = getString(lead.name)
          const leadEmail = getString(lead.email)
          const source = getString(metadata.source) ?? 'N/A'

          const fields: DiscordEmbedField[] = Object.entries(formData).map(
            ([key, value]) => ({
              name: formatKey(key),
              value: String(value),
              inline: true,
            }),
          )

          const discordPayload: DiscordWebhookPayload = {
            content: '*New Submission Received!* 📝',
            embeds: [
              {
                title: `Submission from ${leadName ?? leadEmail ?? 'Unknown'}`,
                description: `A new form submission has been received from *${source}*.`,
                color: 16776960,
                fields: [
                  ...fields,
                  { name: 'Link', value: `[View Lead Details](${leadUrl})` },
                ],
                footer: { text: `SaaS Boilerplate | Event: ${event}` },
                timestamp: new Date().toISOString(),
              },
            ],
          }
          await sendDiscordMessage(webhookUrl, discordPayload)
        }

        return { success: true }
      },
    },
  },
})

type DiscordEmbedField = { name: string; value: string; inline?: boolean }
type DiscordEmbed = {
  title?: string
  description?: string
  color?: number
  fields?: DiscordEmbedField[]
  footer?: { text: string }
  timestamp?: string
}
type DiscordWebhookPayload = {
  content?: string
  embeds?: DiscordEmbed[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null
const toRecord = (v: unknown): Record<string, unknown> => (isRecord(v) ? v : {})
const getString = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined
const getIdentifier = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined
const formatKey = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

async function sendDiscordMessage(
  webhookUrl: string,
  payload: DiscordWebhookPayload,
) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Discord API error: ${response.status}`)
  }
}
