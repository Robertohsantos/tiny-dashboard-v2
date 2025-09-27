/**
 * Custom Vitest matchers for Zod schema testing
 * Provides intuitive assertions for schema validation
 */

import { expect } from 'vitest'
import { z } from 'zod'
import type { SafeParseError, ZodType, ZodTypeDef } from 'zod'

/**
 * Extend Vitest matchers interface
 */
interface CustomMatchers<R = unknown> {
  /**
   * Assert that data passes validation for a given schema
   * @param schema - Zod schema to test against
   */
  toPassValidation(schema: z.ZodSchema): R

  /**
   * Assert that data fails validation with specific error
   * @param schema - Zod schema to test against
   * @param expectedError - Expected error details
   */
  toFailValidationWith(
    schema: z.ZodSchema,
    expectedError?: {
      path?: (string | number)[]
      message?: string
      code?: string
    },
  ): R

  /**
   * Assert that a ZodResult has an error for a specific field
   * @param field - Field path that should have an error
   */
  toHaveValidationError(field: string | (string | number)[]): R

  /**
   * Assert that a schema transforms data as expected
   * @param schema - Zod schema to test against
   * @param expectedOutput - Expected transformed output
   */
  toTransformTo(schema: z.ZodSchema, expectedOutput: unknown): R

  /**
   * Assert that all items in an array pass validation
   * @param schema - Zod schema to test each item against
   */
  toAllPassValidation(schema: z.ZodSchema): R

  /**
   * Assert that a schema accepts optional fields correctly
   * @param schema - Zod schema to test
   * @param optionalFields - List of optional field names
   */
  toHaveOptionalFields(schema: z.ZodSchema, optionalFields: string[]): R
}

declare module 'vitest' {
  interface Assertion<T> extends CustomMatchers<T> {
    readonly _zodMatchersBrand?: never
  }

  interface AsymmetricMatchersContaining extends CustomMatchers<unknown> {
    readonly _zodMatchersBrand?: never
  }
}

/**
 * Implementation of custom matchers
 */
expect.extend({
  /**
   * Check if data passes schema validation
   */
  toPassValidation(received: unknown, schema: z.ZodSchema) {
    const result = schema.safeParse(received)

    if (result.success) {
      return {
        pass: true,
        message: () => `Expected data not to pass validation`,
        actual: received,
        expected: 'validation failure',
      }
    } else {
      return {
        pass: false,
        message: () =>
          `Expected data to pass validation\n\n` +
          `Validation errors:\n${formatZodErrors(result.error)}\n\n` +
          `Received:\n${JSON.stringify(received, null, 2)}`,
        actual: received,
        expected: 'valid data',
      }
    }
  },

  /**
   * Check if data fails validation with specific error
   */
  toFailValidationWith(
    received: unknown,
    schema: z.ZodSchema,
    expectedError?: {
      path?: (string | number)[]
      message?: string
      code?: string
    },
  ) {
    const result = schema.safeParse(received)

    if (result.success) {
      return {
        pass: false,
        message: () =>
          `Expected data to fail validation but it passed\n\n` +
          `Received:\n${JSON.stringify(received, null, 2)}`,
        actual: 'validation passed',
        expected: 'validation failure',
      }
    }

    if (!expectedError) {
      return {
        pass: true,
        message: () => `Expected data to pass validation`,
        actual: 'validation failed',
        expected: 'validation success',
      }
    }

    const errors = result.error.errors
    let hasExpectedError = true
    let errorDetails = ''

    if (expectedError.path) {
      const hasPathError = errors.some(
        (err) =>
          JSON.stringify(err.path) === JSON.stringify(expectedError.path),
      )
      if (!hasPathError) {
        hasExpectedError = false
        errorDetails += `Expected error at path ${JSON.stringify(expectedError.path)} but not found\n`
      }
    }

    if (expectedError.message) {
      const hasMessageError = errors.some((err) =>
        err.message.includes(expectedError.message!),
      )
      if (!hasMessageError) {
        hasExpectedError = false
        errorDetails += `Expected error message containing "${expectedError.message}" but not found\n`
      }
    }

    if (expectedError.code) {
      const hasCodeError = errors.some((err) => err.code === expectedError.code)
      if (!hasCodeError) {
        hasExpectedError = false
        errorDetails += `Expected error code "${expectedError.code}" but not found\n`
      }
    }

    if (hasExpectedError) {
      return {
        pass: true,
        message: () => `Expected data not to fail with specified error`,
        actual: 'expected error found',
        expected: 'different error',
      }
    } else {
      return {
        pass: false,
        message: () =>
          `Expected specific validation error but got different errors\n\n` +
          errorDetails +
          `\nActual errors:\n${formatZodErrors(result.error)}`,
        actual: result.error.errors,
        expected: expectedError,
      }
    }
  },

  /**
   * Check if a validation result has an error for a specific field
   */
  toHaveValidationError(
    received: z.SafeParseReturnType<unknown, unknown>,
    field: string | (string | number)[],
  ) {
    const fieldPath = Array.isArray(field) ? field : [field]

    if (received.success) {
      return {
        pass: false,
        message: () =>
          `Expected validation to have error for field ${JSON.stringify(fieldPath)} ` +
          `but validation passed`,
        actual: 'validation passed',
        expected: `error at ${JSON.stringify(fieldPath)}`,
      }
    }

    const hasFieldError = received.error.errors.some(
      (err) => JSON.stringify(err.path) === JSON.stringify(fieldPath),
    )

    if (hasFieldError) {
      const fieldError = received.error.errors.find(
        (err) => JSON.stringify(err.path) === JSON.stringify(fieldPath),
      )
      return {
        pass: true,
        message: () =>
          `Expected not to have validation error for field ${JSON.stringify(fieldPath)}`,
        actual: fieldError,
        expected: 'no error',
      }
    } else {
      return {
        pass: false,
        message: () =>
          `Expected validation error for field ${JSON.stringify(fieldPath)} but not found\n\n` +
          `Actual errors:\n${formatZodErrors(received.error)}`,
        actual: received.error.errors.map((e) => e.path),
        expected: fieldPath,
      }
    }
  },

  /**
   * Check if schema transforms data correctly
   */
  toTransformTo<Input, Output>(
    received: Input,
    schema: ZodType<Output, ZodTypeDef, Input>,
    expectedOutput: Output,
  ) {
    const result = schema.safeParse(received)

    if (!result.success) {
      return {
        pass: false,
        message: () =>
          `Expected data to be transformed but validation failed\n\n` +
          `Errors:\n${formatZodErrors(result.error)}`,
        actual: 'validation failed',
        expected: expectedOutput,
      }
    }

    const isEqual =
      JSON.stringify(result.data) === JSON.stringify(expectedOutput)

    if (isEqual) {
      return {
        pass: true,
        message: () =>
          `Expected data not to transform to ${JSON.stringify(expectedOutput)}`,
        actual: result.data,
        expected: 'different output',
      }
    } else {
      return {
        pass: false,
        message: () =>
          `Expected transformed data to equal:\n${JSON.stringify(expectedOutput, null, 2)}\n\n` +
          `But got:\n${JSON.stringify(result.data, null, 2)}`,
        actual: result.data,
        expected: expectedOutput,
      }
    }
  },

  /**
   * Check if all items in array pass validation
   */
  toAllPassValidation(received: unknown[], schema: z.ZodSchema) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected an array but received ${typeof received}`,
        actual: typeof received,
        expected: 'array',
      }
    }

    const results = received.map((item, index) => ({
      index,
      item,
      result: schema.safeParse(item),
    }))

    const failures = results.filter(
      (result): result is {
        index: number
        item: unknown
        result: SafeParseError<unknown>
      } => !result.result.success,
    )

    if (failures.length === 0) {
      return {
        pass: true,
        message: () => `Expected at least one item to fail validation`,
        actual: 'all passed',
        expected: 'some failures',
      }
    } else {
      const errorDetails = failures
        .map(
          (failure) =>
            `Item at index ${failure.index}:\n${formatZodErrors(failure.result.error)}`,
        )
        .join('\n\n')

      return {
        pass: false,
        message: () =>
          `Expected all items to pass validation but ${failures.length} failed:\n\n${errorDetails}`,
        actual: `${failures.length} failures`,
        expected: 'all pass',
      }
    }
  },

  /**
   * Check if schema handles optional fields correctly
   */
  toHaveOptionalFields(
    received: Record<string, unknown>,
    schema: z.ZodSchema,
    optionalFields: string[],
  ) {
    const results: {
      field: string
      withoutField: boolean
      withUndefined: boolean
    }[] = []

    for (const field of optionalFields) {
      // Test without the field
      const dataWithoutField = { ...received }
      delete dataWithoutField[field]
      const resultWithout = schema.safeParse(dataWithoutField)

      // Test with undefined
      const dataWithUndefined = { ...received, [field]: undefined }
      const resultWithUndefined = schema.safeParse(dataWithUndefined)

      results.push({
        field,
        withoutField: resultWithout.success,
        withUndefined: resultWithUndefined.success,
      })
    }

    const failures = results.filter((r) => !r.withoutField || !r.withUndefined)

    if (failures.length === 0) {
      return {
        pass: true,
        message: () => `Expected some optional fields to be required`,
        actual: 'all optional',
        expected: 'some required',
      }
    } else {
      const errorDetails = failures
        .map((f) => {
          let detail = `Field "${f.field}":`
          if (!f.withoutField) detail += ' required when omitted'
          if (!f.withUndefined) detail += ' required when undefined'
          return detail
        })
        .join('\n')

      return {
        pass: false,
        message: () =>
          `Expected fields to be optional but validation failed:\n${errorDetails}`,
        actual: failures,
        expected: 'all optional',
      }
    }
  },
})

/**
 * Helper function to format Zod errors nicely
 */
function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `[${err.path.join('.')}]` : '[root]'
      return `  ${path}: ${err.message} (${err.code})`
    })
    .join('\n')
}

/**
 * Export helper functions for use in tests
 */
export { formatZodErrors }
