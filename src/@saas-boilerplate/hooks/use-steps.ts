import { useState } from 'react'
import type { Path, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'

/**
 * Represents a step in a multi-step form
 */
type Step<TFieldValues> = {
  id: string
  fields: Array<Path<TFieldValues>>
}
/**
 * Custom hook to manage multi-step form validation
 * @param form - React Hook Form instance
 * @param schema - Zod schema for form validation
 * @param steps - Array of form steps with fields to validate
 */
export function useSteps<
  TSchema extends z.AnyZodObject,
  TFieldValues extends z.infer<TSchema>,
>({
  form,
  schema,
  steps,
}: {
  form: UseFormReturn<TFieldValues>
  schema: TSchema
  steps: Step<TFieldValues>[]
}) {
  const [currentStep, setCurrentStep] = useState(0)

  // Business Rule: Validate only the fields defined for the current step
  function validateStep(step: number) {
    // Business Rule: Get the fields for the current step
    const stepFields = steps[step].fields

    // Business Rule: Initialize an array to store invalid fields
    const invalidFields = new Set<Path<TFieldValues>>()

    // Business Rule: Get the form data
    const formData = form.getValues()

    stepFields.forEach((field) => {
      form.clearErrors(field)
    })

    const validation = schema.safeParse(formData)

    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const issuePath = issue.path.join('.')
        const matchedField = stepFields.find((field) => {
          return (
            issuePath === field ||
            issuePath.startsWith(`${field}.`) ||
            field.startsWith(`${issuePath}.`)
          )
        })

        if (matchedField) {
          invalidFields.add(matchedField)
          form.setError(matchedField, {
            message: issue.message,
          })
        }
      })
    }

    // Business Rule: Return true if all fields are valid
    return invalidFields.size === 0
  }

  return { currentStep, setCurrentStep, validateStep }
}
