'use client'

import { useCallback, useEffect } from 'react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  VerticalStep,
  VerticalStepContent,
  VerticalStepFooter,
  VerticalStepHeader,
  VerticalStepHeaderDescription,
  VerticalStepHeaderTitle,
  VerticalStepSubmitButton,
} from '@/components/ui/form-step'
import { Input } from '@/components/ui/input'
import {
  SlugInputError,
  SlugInputField,
  SlugInputProvider,
  SlugInputRoot,
} from '@/components/ui/slug-input'
import { useFormContext } from 'react-hook-form'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { String } from '@/@saas-boilerplate/utils/string'
import { Url } from '@/@saas-boilerplate/utils/url'
import type { OrganizationOnboardingFormValues } from './organization-onboarding-form'

export interface OrganizationOnboardingFormCreateTeamStepProps {
  step: string
}

export function OrganizationOnboardingFormCreateTeamStep({
  step,
}: OrganizationOnboardingFormCreateTeamStepProps) {
  const form = useFormContext<OrganizationOnboardingFormValues>()

  const handleVerifySlug = useCallback(async (slug: string) => {
    try {
      const response = await api.organization.verify.mutate({
        body: { slug },
      })

      if (response.error || !response.data) {
        toast.error('Error checking URL availability')
        return false
      }

      return Boolean(response.data.available)
    } catch (error) {
      toast.error('Error checking URL availability')
      return false
    }
  }, [])

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name') {
        const slugValue = String.toSlug(value?.name ?? '')
        form.setValue('slug', slugValue, { shouldValidate: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  return (
    <VerticalStep step={step}>
      <VerticalStepHeader>
        <VerticalStepHeaderTitle>
          Configure your workspace
        </VerticalStepHeaderTitle>
        <VerticalStepHeaderDescription>
          Set the name and custom URL for your workspace.
        </VerticalStepHeaderDescription>
      </VerticalStepHeader>

      <VerticalStepContent>
        <div className="merge-form-section">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: My Awesome Workspace" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="slug"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL for your workspace</FormLabel>
                <FormControl>
                  <SlugInputProvider
                    {...field}
                    checkSlugExists={handleVerifySlug}
                  >
                    <SlugInputRoot>
                      <SlugInputField
                        name="slug"
                        baseURL={Url.get('/stores/')}
                      />
                      <SlugInputError />
                    </SlugInputRoot>
                  </SlugInputProvider>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </VerticalStepContent>

      <VerticalStepFooter>
        <VerticalStepSubmitButton>Next</VerticalStepSubmitButton>
      </VerticalStepFooter>
    </VerticalStep>
  )
}
