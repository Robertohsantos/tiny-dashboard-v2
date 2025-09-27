'use client'

import { z } from 'zod'
import type { CheckedState } from '@radix-ui/react-checkbox'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import { LoaderIcon } from '@/components/ui/loader-icon'
import { Checkbox } from '@/components/ui/checkbox'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

const upsertWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  secret: z.string().min(1, 'Secret is required'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
})

type UpsertWebhookFormValues = z.infer<typeof upsertWebhookSchema>

interface UpsertWebhookModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  availableEvents: string[]
  children?: React.ReactNode
}

export function UpsertWebhookModal({
  open,
  onOpenChange,
  availableEvents,
  children,
}: UpsertWebhookModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const handleSheetChange = useCallback((nextState: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextState)
    } else {
      setInternalOpen(nextState)
    }
  }, [isControlled, onOpenChange])
  const router = useRouter()
  const upsertWebhookMutation = api.webhook.create.useMutation()

  const form = useFormWithZod({
    schema: upsertWebhookSchema,
    defaultValues: {
      url: '',
      secret: '',
      events: [],
    },
    onSubmit: async (values) => {
      // Implementing error handling with tryCatch
      const result = await tryCatch(
        upsertWebhookMutation.mutate({
          body: {
            url: values.url,
            secret: values.secret,
            events: values.events,
          },
        }),
      )

      // Adding user feedback with toast
      if (result.error) {
        toast.error('Error creating webhook', {
          description: 'Please check your data and try again.',
        })
        return
      }

      toast.success('Webhook created successfully!')
      router.refresh()
      handleSheetChange(false)
    },
  })

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent>
        <Form {...form}>
          <form
            onSubmit={form.onSubmit}
            className="h-full flex flex-col space-y-6"
          >
            <SheetHeader>
              <SheetTitle>Create Webhook</SheetTitle>
              <SheetDescription>
                Configure a webhook to receive real-time updates about events in
                your workspace.
              </SheetDescription>
            </SheetHeader>

            <div className="merge-form-section flex-1">
              <FormField<UpsertWebhookFormValues, 'url'>
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://api.example.com/webhook"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<UpsertWebhookFormValues, 'secret'>
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Webhook secret" {...field} />
                    </FormControl>
                    <FormDescription>
                      This secret will be used to verify webhook requests
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<UpsertWebhookFormValues, 'events'>
                control={form.control}
                name="events"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Events</FormLabel>
                    <div className="space-y-2 max-h-[26rem] pr-4 overflow-y-auto">
                      {availableEvents.map((event) => {
                        const selectedEvents = field.value ?? []
                        const isSelected = selectedEvents.includes(event)

                        const handleCheckedChange = (checked: CheckedState) => {
                          const nextSelected = checked === true

                          const updatedEvents = nextSelected
                            ? selectedEvents.includes(event)
                              ? selectedEvents
                              : [...selectedEvents, event]
                            : selectedEvents.filter((value) => value !== event)

                          field.onChange(updatedEvents)
                        }

                        return (
                          <label
                            key={event}
                            className="flex cursor-pointer flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={handleCheckedChange}
                            />
                            <span className="font-normal">{event}</span>
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Webhook'}
                <LoaderIcon
                  icon={ArrowRightIcon}
                  isLoading={form.formState.isSubmitting}
                  className="w-4 h-4 ml-2"
                />
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
