'use client'

import { useState, useCallback } from 'react'

export interface UseMutationOptions<
  TData = unknown,
  TVariables = unknown,
  TError = unknown,
> {
  retry?: boolean | number
  retryDelay?: number
  onMutate?: (variables: TVariables) => Promise<void> | void
  onSuccess?: (data: TData, variables: TVariables) => Promise<void> | void
  onError?: (error: TError, variables: TVariables) => Promise<void> | void
  onSettled?: (context: {
    data?: TData
    error?: TError | null
    variables: TVariables
  }) => Promise<void> | void
}

export interface UseMutationResult<
  TData = unknown,
  TVariables = unknown,
  TError = unknown,
> {
  data: TData | undefined
  error: TError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  mutate: (variables: TVariables) => Promise<TData>
  reset: () => void
}

export function useMutation<
  TData = unknown,
  TVariables = unknown,
  TError = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables, TError> = {},
): UseMutationResult<TData, TVariables, TError> {
  const [state, setState] = useState<{
    data: TData | undefined
    error: TError | null
    status: 'idle' | 'loading' | 'error' | 'success'
  }>({
    data: undefined,
    error: null,
    status: 'idle',
  })

  const reset = useCallback(() => {
    setState({
      data: undefined,
      error: null,
      status: 'idle',
    })
  }, [])

  const { onMutate, onSuccess, onError, onSettled } = options

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        setState((prev) => ({ ...prev, status: 'loading' }))

        // Call onMutate if provided
        if (onMutate) {
          await onMutate(variables)
        }

        // Execute Server Action
        const data = await mutationFn(variables)

        setState({
          data,
          error: null,
          status: 'success',
        })

        // Call onSuccess if provided
        if (onSuccess) {
          await onSuccess(data, variables)
        }

        // Call onSettled if provided
        if (onSettled) {
          await onSettled({ data, error: null, variables })
        }

        return data
      } catch (error) {
        setState({
          data: undefined,
          error: error as TError,
          status: 'error',
        })

        // Call onError if provided
        if (onError) {
          await onError(error as TError, variables)
        }

        // Call onSettled if provided
        if (onSettled) {
          await onSettled({ data: undefined, error: error as TError, variables })
        }

        throw error
      }
    },
    [mutationFn, onError, onMutate, onSettled, onSuccess],
  )

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    mutate,
    reset,
  }
}
