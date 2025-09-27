/**
 * Validation utilities for API data
 * Integrates Zod schemas with services for runtime type safety
 */

import { z } from 'zod'

/**
 * Error class for validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError['errors'],
    public readonly rawData?: unknown,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validates API response data with Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Raw data to validate
 * @param errorMessage - Custom error message
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage = 'API response validation failed',
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error('Validation Error:', {
      errors: result.error.errors,
      data: data,
    })
    throw new ValidationError(errorMessage, result.error.errors, data)
  }

  return result.data
}

/**
 * Creates a validated API fetcher function
 * @param fetcher - Original fetcher function
 * @param schema - Zod schema to validate response
 * @returns Wrapped fetcher that validates response
 */
export function createValidatedFetcher<T, TArgs extends unknown[]>(
  fetcher: (...args: TArgs) => Promise<unknown>,
  schema: z.ZodSchema<T>,
) {
  return async (...args: TArgs): Promise<T> => {
    try {
      const data = await fetcher(...args)
      return validateApiResponse(
        schema,
        data,
        `Failed to validate response from ${fetcher.name}`,
      )
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof ValidationError) {
        throw error
      }
      // Wrap other errors
      throw new Error(
        `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

/**
 * Safely validates and transforms data
 * @param schema - Zod schema to validate against
 * @param data - Raw data to validate
 * @param fallback - Fallback value if validation fails
 * @returns Validated data or fallback
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.warn('Validation failed, using fallback:', {
      errors: result.error.errors,
      fallback,
    })
    return fallback
  }

  return result.data
}

/**
 * Validates partial data (useful for PATCH operations)
 * @param schema - Full Zod schema
 * @param data - Partial data to validate
 * @returns Validated partial data
 */
export function validatePartial<TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
  data: unknown,
): Partial<z.infer<typeof schema>> {
  return validateApiResponse(
    schema.partial(),
    data,
    'Partial data validation failed',
  )
}

/**
 * Batch validates an array of items
 * @param schema - Zod schema for individual items
 * @param items - Array of items to validate
 * @returns Object with valid items and errors
 */
export function batchValidate<T>(
  schema: z.ZodSchema<T>,
  items: unknown[],
): {
  valid: T[]
  invalid: Array<{ index: number; errors: z.ZodError['errors']; data: unknown }>
} {
  const valid: T[] = []
  const invalid: Array<{
    index: number
    errors: z.ZodError['errors']
    data: unknown
  }> = []

  items.forEach((item, index) => {
    const result = schema.safeParse(item)
    if (result.success) {
      valid.push(result.data)
    } else {
      invalid.push({
        index,
        errors: result.error.errors,
        data: item,
      })
    }
  })

  return { valid, invalid }
}

/**
 * Creates a type guard function from a Zod schema
 * @param schema - Zod schema
 * @returns Type guard function
 */
export function createTypeGuard<T>(
  schema: z.ZodSchema<T>,
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return schema.safeParse(value).success
  }
}

/**
 * Logs validation errors in development
 * @param error - Validation error
 * @param context - Additional context for debugging
 */
export function logValidationError(
  error: ValidationError | z.ZodError,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Validation Error')

    if (error instanceof ValidationError) {
      console.error('Message:', error.message)
      console.error('Errors:', error.errors)
      if (error.rawData) {
        console.error('Raw Data:', error.rawData)
      }
    } else {
      console.error('Errors:', error.errors)
    }

    if (context) {
      console.error('Context:', context)
    }

    console.groupEnd()
  }
}

/**
 * Strips unknown keys from an object based on a schema
 * Useful for sanitizing user input
 * @param schema - Zod schema
 * @param data - Data to strip
 * @returns Data with only known keys
 */
export function stripUnknownKeys<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T | null {
  const result = schema.safeParse(data)

  if (result.success) {
    return result.data
  }

  // Try to parse with strip option
  if (schema instanceof z.ZodObject) {
    const stripResult = schema.strip().safeParse(data)
    if (stripResult.success) {
      return stripResult.data as T
    }
  }

  return null
}
