import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { z } from 'zod'
import { Url } from '@/@saas-boilerplate/utils/url'

const slackConfigSchema = z.object({
  webhook: z
    .string()
    .describe('Ex: https://example.com/slack/webhook'),
})

const slackEventSchema = z.object({
  event: z.string(),
  data: z.unknown(),
})

type SlackConfig = z.infer<typeof slackConfigSchema>
type SlackEventPayload = z.infer<typeof slackEventSchema>

type SlackTextObject = {
  type: 'mrkdwn'
  text: string
}

type SlackSectionBlock = {
  type: 'section'
  text?: SlackTextObject
  fields?: SlackTextObject[]
}

type SlackDividerBlock = {
  type: 'divider'
}

type SlackContextBlock = {
  type: 'context'
  elements: SlackTextObject[]
}

type SlackBlock = SlackSectionBlock | SlackDividerBlock | SlackContextBlock

type SlackPayload = {
  blocks: SlackBlock[]
}

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
    .map(([key, value]) => `*${formatKey(key)}:*\n${String(value)}`)
    .join('\n\n')
}

export const slack = PluginManager.plugin({
  slug: 'slack',
  name: 'Slack',
  schema: slackConfigSchema,
  metadata: {
    verified: true,
    published: true,
    logo: 'https://a.slack-edge.com/80588/img/icons/app-256.png',
    description:
      'Integrate Slack to centralize your notifications, streamline team communication, and automate alerts directly into your workspace channels.',
    category: 'notifications',
    developer: 'Slack',
    screenshots: [],
    website: 'https://slack.com/',
    links: {
      install: 'https://slack.com/',
      guide: 'https://api.slack.com/start',
    },
  },
  actions: {
    sendEvent: {
      name: 'Send Event',
      schema: slackEventSchema,
      handler: async ({
        config,
        input,
      }: {
        config: SlackConfig
        input: SlackEventPayload
      }) => {
        const { webhook } = config
        const { event, data } = input

        let slackPayload: SlackPayload | null = null

        if (event === 'lead.created') {
          const leadData = toRecord(data)
          const leadId = getIdentifier(leadData.id) ?? ''
          const leadUrl = Url.get(`/app/leads/${leadId}`)
          const leadName = getString(leadData.name) ?? 'N/A'
          const leadEmail = getString(leadData.email) ?? 'N/A'

          slackPayload = {
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*New Lead Created!* 🚀\n<${leadUrl}|View Lead>`,
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Name:*\n${leadName}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Email:*\n${leadEmail}`,
                  },
                ],
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `SaaS Boilerplate | Event: *${event}* | ${new Date().toISOString()}`,
                  },
                ],
              },
            ],
          }
        } else if (event === 'submission.created') {
          const submissionData = toRecord(data)
          const leadInfo = toRecord(submissionData.lead)
          const metadata = toRecord(submissionData.metadata)
          const submissionFields = formatSubmissionFields(toRecord(metadata.data))

          const leadId = getIdentifier(leadInfo.id) ?? ''
          const leadUrl = Url.get(`/app/leads/${leadId}`)
          const leadName = getString(leadInfo.name)
          const leadEmail = getString(leadInfo.email)
          const source = getString(metadata.source) ?? 'N/A'

          slackPayload = {
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*New Submission Received!* 📝\n\n*From:* ${
                    leadName ?? leadEmail ?? 'Unknown lead'
                  }\n*Source:* ${source}`,
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: submissionFields,
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `<${leadUrl}|View Lead Details>`,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `SaaS Boilerplate | Event: *${event}* | ${new Date().toISOString()}`,
                  },
                ],
              },
            ],
          }
        }

        if (slackPayload) {
          await sendSlackMessage(webhook, slackPayload)
        }

        return { success: true }
      },
    },
  },
})

async function sendSlackMessage(webhookUrl: string, payload: SlackPayload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Slack API error: ${response.status} - ${errorText}`)
  }
}
