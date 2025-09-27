import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { z } from 'zod'
import { Url } from '@/@saas-boilerplate/utils/url'

const telegramConfigSchema = z.object({
  chatId: z.string().describe('Telegram chat ID'),
  token: z.string().describe('Telegram bot token'),
})

const telegramEventSchema = z.object({
  event: z.string(),
  data: z.unknown(),
})

type TelegramConfig = z.infer<typeof telegramConfigSchema>
type TelegramEventPayload = z.infer<typeof telegramEventSchema>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {}

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const getIdentifier = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  return undefined
}

const formatKey = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatSubmissionFields = (record: Record<string, unknown>): string => {
  const entries = Object.entries(record)

  if (entries.length === 0) {
    return 'No additional submission data'
  }

  return entries
    .map(([key, value]) => `*${formatKey(key)}:* ${String(value)}`)
    .join('\n')
}

export const telegram = PluginManager.plugin({
  name: 'Telegram',
  slug: 'telegram',
  schema: telegramConfigSchema,
  metadata: {
    verified: true,
    published: true,
    logo: 'https://telegram.org/img/t_logo.png',
    description:
      'Effortlessly link your Telegram account to send and receive instant notifications.',
    category: 'notifications',
    developer: 'Telegram',
    screenshots: [],
    website: 'https://telegram.org/',
    links: {
      install: 'https://telegram.org/',
      guide: 'https://telegram.org/faq',
    },
  },
  actions: {
    sendEvent: {
      name: 'Send Event',
      schema: telegramEventSchema,
      handler: async ({
        config,
        input,
      }: {
        config: TelegramConfig
        input: TelegramEventPayload
      }) => {
        const { chatId, token } = config
        const { event, data } = input
        let message: string

        if (event === 'lead.created') {
          const leadData = toRecord(data)
          const leadId = getIdentifier(leadData.id) ?? ''
          const leadUrl = Url.get(`/app/leads/${leadId}`)
          const leadName = getString(leadData.name) ?? 'N/A'
          const leadEmail = getString(leadData.email) ?? 'N/A'
          const leadPhone = getString(leadData.phone) ?? 'N/A'

          message = `🚀 *New Lead Received*\n\n*Name:* ${leadName}\n*Email:* ${leadEmail}\n*Phone:* ${leadPhone}\n\n[View Lead Details](${leadUrl})`
        } else if (event === 'submission.created') {
          const submissionData = toRecord(data)
          const leadInfo = toRecord(submissionData.lead)
          const metadata = toRecord(submissionData.metadata)
          const submissionFields = toRecord(metadata.data)

          const leadId = getIdentifier(leadInfo.id) ?? ''
          const leadUrl = Url.get(`/app/leads/${leadId}`)
          const leadName = getString(leadInfo.name)
          const leadEmail = getString(leadInfo.email)
          const source = getString(metadata.source) ?? 'N/A'
          const formattedFields = formatSubmissionFields(submissionFields)

          message = `📝 *New Submission Received!*\n\n*From:* ${
            leadName ?? leadEmail ?? 'Unknown lead'
          }\n*Source:* ${source}\n\n*Details:*\n${formattedFields}\n\n[View Lead Details](${leadUrl})`
        } else {
          // Fallback for other events
          const serializedData = JSON.stringify(data, null, 2)
          message = `📢 *Event:* ${event}\n\n\`\`\`json\n${serializedData}\n\`\`\`\n\n_Timestamp: ${new Date().toISOString()}_\n_Source: SaaS Boilerplate_`
        }

        // Telegram Bot API URL
        const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`

        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        })

        if (!response.ok) {
          const errorPayload: unknown = await response.json()
          const errorRecord = toRecord(errorPayload)
          const description = getString(errorRecord.description)
          throw new Error(
            `Telegram API error: ${response.status} - ${
              description ?? response.statusText
            }`,
          )
        }

        const responsePayloadRaw: unknown = await response.json()
        const responsePayload = toRecord(responsePayloadRaw)
        const responseResult = toRecord(responsePayload.result)
        const messageIdValue = responseResult.message_id
        const messageId =
          typeof messageIdValue === 'string' || typeof messageIdValue === 'number'
            ? messageIdValue
            : undefined

        console.log(`[Telegram] Event "${event}" sent successfully`, {
          messageId,
        })
        return responsePayload
      },
    },
  },
})
