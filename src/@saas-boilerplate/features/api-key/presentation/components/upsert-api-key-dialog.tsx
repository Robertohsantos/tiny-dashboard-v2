'use client'

import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import { LoaderIcon } from '@/components/ui/loader-icon'
import { Switch } from '@/components/ui/switch'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useState } from 'react'

const createApiKeySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  neverExpires: z.boolean().default(false),
  expiresAt: z.date().optional().nullable(),
})

type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>

interface CreateApiKeyModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function CreateApiKeyModal({
  open,
  onOpenChange,
  children,
}: CreateApiKeyModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const router = useRouter()

  const updateOpenState = (nextOpenState: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpenState)
      return
    }

    setInternalOpen(nextOpenState)
  }

  const form = useFormWithZod({
    schema: createApiKeySchema,
    defaultValues: {
      description: '',
      neverExpires: false,
      expiresAt: null,
    } satisfies CreateApiKeyFormValues,
    onSubmit: async (values) => {
      // Implementing error handling with tryCatch
      const result = await tryCatch(
        api.apiKey.create.mutate({
          body: {
            description: values.description,
            expiresAt: values.neverExpires ? null : values.expiresAt,
          },
        }),
      )

      // Adding user feedback with toast
      if (result.error) {
        toast.error('Error creating API key', {
          description: 'Please check your data and try again.',
        })
        return
      }

      toast.success('API key created successfully!')
      router.refresh()
      updateOpenState(false)
    },
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpenState) => {
        updateOpenState(nextOpenState)
        if (!nextOpenState) {
          form.reset()
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.onSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate an API key to authenticate with external services.
              </DialogDescription>
            </DialogHeader>

            <div className="merge-form-section">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g: Production API Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neverExpires"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                    <FormLabel>Never expires</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch('neverExpires') && (
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => {
                    const handleDateChange = (
                      event: ChangeEvent<HTMLInputElement>,
                    ) => {
                      const { value } = event.target
                      field.onChange(value ? new Date(value) : null)
                    }

                    const formattedValue = field.value
                      ? field.value.toISOString().split('T')[0]
                      : ''

                    return (
                      <FormItem>
                        <FormLabel>Expires on</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            onChange={handleDateChange}
                            value={formattedValue}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create API Key'}
                <LoaderIcon
                  icon={ArrowRightIcon}
                  isLoading={form.formState.isSubmitting}
                  className="w-4 h-4 ml-2"
                />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
