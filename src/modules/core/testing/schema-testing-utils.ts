/**
 * Utility functions for testing Zod schemas
 * Provides helpers for common testing patterns
 */

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Test that a schema accepts valid data
 * @param schema - Zod schema to test
 * @param validData - Data that should pass validation
 * @returns Parsed data if successful
 */
export function expectSchemaToAccept<T>(
  schema: z.ZodSchema<T>,
  validData: unknown,
  message?: string,
): T {
  const result = schema.safeParse(validData)

  if (!result.success) {
    const errorMessage = message || 'Schema should accept valid data'
    throw new Error(
      `${errorMessage}\nErrors: ${JSON.stringify(result.error.errors, null, 2)}`,
    )
  }

  return result.data
}

/**
 * Test that a schema rejects invalid data
 * @param schema - Zod schema to test
 * @param invalidData - Data that should fail validation
 * @param expectedError - Optional: specific error to expect
 */
export function expectSchemaToReject<T>(
  schema: z.ZodSchema<T>,
  invalidData: unknown,
  expectedError?: {
    path?: string[]
    message?: string
    code?: string
  },
): z.ZodError {
  const result = schema.safeParse(invalidData)

  if (result.success) {
    throw new Error('Schema should reject invalid data but it passed')
  }

  if (expectedError) {
    const errors = result.error.errors

    if (expectedError.path) {
      const hasPathError = errors.some(
        (err) =>
          JSON.stringify(err.path) === JSON.stringify(expectedError.path),
      )
      if (!hasPathError) {
        throw new Error(
          `Expected error at path ${JSON.stringify(expectedError.path)} but not found`,
        )
      }
    }

    if (expectedError.message) {
      const hasMessageError = errors.some((err) =>
        err.message.includes(expectedError.message!),
      )
      if (!hasMessageError) {
        throw new Error(
          `Expected error message containing "${expectedError.message}" but not found`,
        )
      }
    }

    if (expectedError.code) {
      const hasCodeError = errors.some((err) => err.code === expectedError.code)
      if (!hasCodeError) {
        throw new Error(
          `Expected error code "${expectedError.code}" but not found`,
        )
      }
    }
  }

  return result.error
}

/**
 * Test that a schema transforms data correctly
 * @param schema - Zod schema to test
 * @param input - Input data
 * @param expectedOutput - Expected transformed output
 */
export function expectSchemaToTransform<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  expectedOutput: T,
): void {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw new Error(
      `Schema failed to parse input: ${JSON.stringify(result.error.errors)}`,
    )
  }

  expect(result.data).toEqual(expectedOutput)
}

/**
 * Get all error messages from a validation result
 * @param error - Zod error object
 * @returns Array of error messages
 */
export function getErrorMessages(error: z.ZodError): string[] {
  return error.errors.map((err) => err.message)
}

/**
 * Get all error paths from a validation result
 * @param error - Zod error object
 * @returns Array of error paths
 */
export function getErrorPaths(error: z.ZodError): string[][] {
  return error.errors.map((err) => err.path.map(String))
}

/**
 * Test schema with multiple valid inputs
 * @param schema - Zod schema to test
 * @param validCases - Array of valid test cases
 */
export function testValidCases<T>(
  schema: z.ZodSchema<T>,
  validCases: Array<{
    description: string
    input: unknown
    expected?: T
  }>,
): void {
  validCases.forEach(({ description, input, expected }) => {
    it(`should accept: ${description}`, () => {
      const result = schema.safeParse(input)
      expect(result.success).toBe(true)

      if (expected !== undefined && result.success) {
        expect(result.data).toEqual(expected)
      }
    })
  })
}

/**
 * Test schema with multiple invalid inputs
 * @param schema - Zod schema to test
 * @param invalidCases - Array of invalid test cases
 */
export function testInvalidCases<T>(
  schema: z.ZodSchema<T>,
  invalidCases: Array<{
    description: string
    input: unknown
    expectedError?: {
      path?: string[]
      message?: string
      code?: string
    }
  }>,
): void {
  invalidCases.forEach(({ description, input, expectedError }) => {
    it(`should reject: ${description}`, () => {
      const result = schema.safeParse(input)
      expect(result.success).toBe(false)

      if (expectedError && !result.success) {
        const errors = result.error.errors

        if (expectedError.path) {
          const hasPathError = errors.some(
            (err) =>
              JSON.stringify(err.path) === JSON.stringify(expectedError.path),
          )
          expect(hasPathError).toBe(true)
        }

        if (expectedError.message) {
          const hasMessageError = errors.some((err) =>
            err.message.includes(expectedError.message!),
          )
          expect(hasMessageError).toBe(true)
        }

        if (expectedError.code) {
          const hasCodeError = errors.some(
            (err) => err.code === expectedError.code,
          )
          expect(hasCodeError).toBe(true)
        }
      }
    })
  })
}

/**
 * Create a test suite for a schema
 * @param schemaName - Name of the schema for test description
 * @param schema - Zod schema to test
 * @param config - Test configuration
 */
export function createSchemaTestSuite<T>(
  schemaName: string,
  schema: z.ZodSchema<T>,
  config: {
    validCases: Array<{
      description: string
      input: unknown
      expected?: T
    }>
    invalidCases: Array<{
      description: string
      input: unknown
      expectedError?: {
        path?: string[]
        message?: string
        code?: string
      }
    }>
    edgeCases?: Array<{
      description: string
      input: unknown
      shouldPass: boolean
      expected?: T
    }>
  },
): void {
  describe(schemaName, () => {
    describe('Valid cases', () => {
      testValidCases(schema, config.validCases)
    })

    describe('Invalid cases', () => {
      testInvalidCases(schema, config.invalidCases)
    })

    const edgeCases = config.edgeCases ?? []

    if (edgeCases.length > 0) {
      describe('Edge cases', () => {
        edgeCases.forEach(
          ({ description, input, shouldPass, expected }) => {
            it(`edge case: ${description}`, () => {
              const result = schema.safeParse(input)
              expect(result.success).toBe(shouldPass)

              if (shouldPass && expected !== undefined && result.success) {
                expect(result.data).toEqual(expected)
              }
            })
          },
        )
      })
    }
  })
}

/**
 * Test that optional fields work correctly
 * @param schema - Zod schema to test
 * @param baseValidData - Valid base data
 * @param optionalFields - List of optional field names
 */
export function testOptionalFields<T>(
  schema: z.ZodSchema<T>,
  baseValidData: Record<string, unknown>,
  optionalFields: string[],
): void {
  describe('Optional fields', () => {
    optionalFields.forEach((field) => {
      it(`should accept data without optional field: ${field}`, () => {
        const dataWithoutField = { ...baseValidData }
        delete dataWithoutField[field]

        const result = schema.safeParse(dataWithoutField)
        expect(result.success).toBe(true)
      })

      it(`should accept data with undefined for optional field: ${field}`, () => {
        const dataWithUndefined = {
          ...baseValidData,
          [field]: undefined,
        }

        const result = schema.safeParse(dataWithUndefined)
        expect(result.success).toBe(true)
      })
    })
  })
}
