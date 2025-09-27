import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import {
  useForm,
  UseFormReturn,
  type UseFormProps,
} from 'react-hook-form'
import type { ZodSchema } from 'zod'

type HookFormParams<TSchema extends ZodSchema, TContext> = UseFormProps<
  TSchema['_output'],
  TContext
>

type SubmitCallback<TSchema extends ZodSchema> = (
  values: TSchema['_output'],
) => void | Promise<void>

type UseFormOptions<TSchema extends ZodSchema> = Omit<
  HookFormParams<TSchema, any>,
  'resolver'
> & {
  schema: TSchema
  defaultValues?: TSchema['_output']
  onSubmit?: SubmitCallback<TSchema>
}

type HandleSubmitArgs<TSchema extends ZodSchema> = Parameters<
  ReturnType<UseFormReturn<TSchema['_output']>['handleSubmit']>
>

type HandleSubmitFn<TSchema extends ZodSchema> = (
  ...args: HandleSubmitArgs<TSchema>
) => void

type Return<TSchema extends ZodSchema> = UseFormReturn<TSchema['_output']> & {
  onSubmit: HandleSubmitFn<TSchema>
}

export function useFormWithZod<TSchema extends ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  mode,
  ...rest
}: UseFormOptions<TSchema>): Return<TSchema> {
  const form = useForm<TSchema['_output']>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    ...rest,
  })

  const prevDefaultValuesRef = useRef(defaultValues)

  useEffect(() => {
    if (mode !== 'onChange') {
      return undefined
    }

    const safeSubmit = onSubmit ?? (() => {})
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const subscription = form.watch(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        void form.handleSubmit(safeSubmit)()
      }, 2000)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [form, mode, onSubmit])

  useEffect(() => {
    const isDefaultValuesDifferent =
      JSON.stringify(prevDefaultValuesRef.current) !==
      JSON.stringify(defaultValues)

    if (defaultValues && isDefaultValuesDifferent) {
      prevDefaultValuesRef.current = defaultValues
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const safeOnSubmit = onSubmit ?? (() => {})
  const submitHandler = form.handleSubmit(safeOnSubmit)

  const handleFormSubmit: HandleSubmitFn<TSchema> = (...args) => {
    void submitHandler(...args)
  }

  return {
    ...form,
    onSubmit: handleFormSubmit,
  }
}
