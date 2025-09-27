import { createHash } from 'crypto'
import { z } from 'zod'
import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'

type LeadCreatedPayload = {
  email: string
  name?: string
  phone?: string
}

type MailchimpMemberResponse = {
  id: string
  email_address: string
  status: string
}

type MailchimpSuccessResponse = {
  success: true
  event: string
  timestamp: string
  action: 'created' | 'updated' | 'logged'
  contact?: {
    id: string
    email: string
    status: string
  }
}

type MailchimpErrorResponse = {
  success: false
  event: string
  timestamp: string
  error: string
  details?: unknown
}

type MailchimpHandlerResponse = MailchimpSuccessResponse | MailchimpErrorResponse

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isLeadCreatedPayload = (value: unknown): value is LeadCreatedPayload => {
  if (
    !value ||
    typeof value !== 'object' ||
    !('email' in value) ||
    typeof (value as { email: unknown }).email !== 'string'
  ) {
    return false
  }

  const { name, phone } = value as Record<string, unknown>

  return (
    (name === undefined || typeof name === 'string') &&
    (phone === undefined || typeof phone === 'string')
  )
}

const isMailchimpMemberResponse = (
  value: unknown,
): value is MailchimpMemberResponse => {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.email_address === 'string' &&
    typeof value.status === 'string'
  )
}

const hashEmail = (email: string): string => {
  return createHash('md5').update(email.toLowerCase()).digest('hex')
}

const getAuthHeader = (apiKey: string): string => {
  const encoded = Buffer.from(`anystring:${apiKey}`).toString('base64')
  return `Basic ${encoded}`
}

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error as { name?: string }).name === 'SyntaxError'
    ) {
      return null
    }

    throw error
  }
}

const mailchimpConfigSchema = z.object({
  apiKey: z.string().describe('Ex: your-mailchimp-api-key'),
  listId: z.string().describe('Ex: your-mailchimp-list-id'),
  serverPrefix: z.string().describe('Ex: us1'),
})

const mailchimpActionInputSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()).default({}),
})

type MailchimpConfig = z.infer<typeof mailchimpConfigSchema>
type MailchimpActionInput = z.infer<typeof mailchimpActionInputSchema>

export const mailchimp = PluginManager.plugin({
  slug: 'mailchimp',
  name: 'Mailchimp',
  schema: mailchimpConfigSchema,
  metadata: {
    verified: true,
    published: true,
    logo: 'https://imgs.search.brave.com/WyLHoQYyT-XYswNoKuwXfArznmREI9_09uh95dvdH5k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/YnJhbmRmZXRjaC5p/by9pZE12bnYzNmE0/L3cvNDAwL2gvNDAw/L3RoZW1lL2Rhcmsv/aWNvbi5qcGVnP2M9/MWJ4aWQ2NE11cDdh/Y3pld1NBWU1YJnQ9/MTY2ODUxNjA1NjUx/Mw',
    description:
      'Integrate your account with Mailchimp to manage your email campaigns.',
    category: 'email-marketing',
    developer: 'Mailchimp',
    screenshots: [],
    website: 'https://mailchimp.com/',
    links: {
      install: 'https://mailchimp.com/',
      guide: 'https://mailchimp.com/developer/',
    },
  },
  actions: {
    sendEvent: {
      name: 'Send Event',
      schema: mailchimpActionInputSchema,
      handler: async ({
        config,
        input,
      }: {
        config: MailchimpConfig
        input: MailchimpActionInput
      }): Promise<MailchimpHandlerResponse> => {
        const { apiKey, listId, serverPrefix } = config
        const { event, data } = input
        const timestamp = new Date().toISOString()
        const baseUrl = `https://${serverPrefix}.api.mailchimp.com/3.0`

        if (event === 'lead.created') {
          if (!isLeadCreatedPayload(data)) {
            return {
              success: false,
              event,
              timestamp,
              error: 'Invalid payload for lead.created event',
              details: data,
            }
          }

          const listMemberUrl = `${baseUrl}/lists/${listId}/members/${hashEmail(data.email)}`

          try {
            const response = await fetch(listMemberUrl, {
              method: 'PUT',
              headers: {
                Authorization: getAuthHeader(apiKey),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email_address: data.email,
                status: 'subscribed',
                merge_fields: {
                  FNAME: data.name ?? '',
                  LNAME: '',
                  PHONE: data.phone ?? '',
                },
                tags: ['lead', 'saas-boilerplate'],
              }),
            })

            const payload = await parseJson(response)

            if (!response.ok) {
              const detail =
                isRecord(payload) && typeof payload.detail === 'string'
                  ? payload.detail
                  : null

              return {
                success: false,
                event,
                timestamp,
                error:
                  detail ||
                  `Mailchimp API error: ${response.status} ${response.statusText}`,
                details: payload,
              }
            }

            if (!isMailchimpMemberResponse(payload)) {
              return {
                success: false,
                event,
                timestamp,
                error: 'Unexpected response format received from Mailchimp',
                details: payload,
              }
            }

            const mailchimpResponse = payload
            const action =
              mailchimpResponse.status === 'subscribed' ? 'updated' : 'created'

            return {
              success: true,
              event,
              timestamp,
              action,
              contact: {
                id: mailchimpResponse.id,
                email: mailchimpResponse.email_address,
                status: mailchimpResponse.status,
              },
            }
          } catch (error) {
            return {
              success: false,
              event,
              timestamp,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        }

        return {
          success: true,
          event,
          timestamp,
          action: 'logged',
        }
      },
    },
  },
})
