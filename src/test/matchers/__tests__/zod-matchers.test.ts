/**
 * Tests for custom Zod matchers
 * Verifies that our custom Vitest matchers work correctly
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Test schemas
const StringSchema = z.string()
const NumberSchema = z.number()
const ObjectSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
  email: z.string().email().optional(),
})
const TransformSchema = z.string().transform((val) => val.toUpperCase())
const ArraySchema = z.array(z.number())

describe('Custom Zod Matchers', () => {
  describe('toPassValidation', () => {
    it('should pass for valid data', () => {
      expect('hello').toPassValidation(StringSchema)
      expect(42).toPassValidation(NumberSchema)
      expect({ name: 'John', age: 30 }).toPassValidation(ObjectSchema)
    })

    it('should fail for invalid data', () => {
      expect(() => {
        expect(123).toPassValidation(StringSchema)
      }).toThrow()

      expect(() => {
        expect('not a number').toPassValidation(NumberSchema)
      }).toThrow()
    })
  })

  describe('toFailValidationWith', () => {
    it('should pass when validation fails with expected error', () => {
      expect('not a number').toFailValidationWith(NumberSchema)

      expect({ name: 'John', age: -5 }).toFailValidationWith(ObjectSchema, {
        path: ['age'],
        code: 'too_small',
      })
    })

    it('should fail when validation passes', () => {
      expect(() => {
        expect('valid string').toFailValidationWith(StringSchema)
      }).toThrow()
    })

    it('should check specific error details', () => {
      const invalidData = { name: 'John', age: -5, email: 'invalid-email' }

      // Should pass - age has error
      expect(invalidData).toFailValidationWith(ObjectSchema, { path: ['age'] })

      // Should pass - email has error
      expect(invalidData).toFailValidationWith(ObjectSchema, {
        path: ['email'],
      })

      // Should fail - no error at this path
      expect(() => {
        expect(invalidData).toFailValidationWith(ObjectSchema, {
          path: ['name'],
        })
      }).toThrow()
    })
  })

  describe('toHaveValidationError', () => {
    it('should detect errors at specific paths', () => {
      const result = ObjectSchema.safeParse({
        name: 'John',
        age: -5,
        email: 'invalid',
      })

      expect(result).toHaveValidationError('age')
      expect(result).toHaveValidationError(['age'])
      expect(result).toHaveValidationError('email')
      expect(result).toHaveValidationError(['email'])
    })

    it('should fail when no error at path', () => {
      const result = ObjectSchema.safeParse({
        name: 'John',
        age: -5,
      })

      expect(() => {
        expect(result).toHaveValidationError('name')
      }).toThrow()

      expect(() => {
        expect(result).toHaveValidationError('email') // Optional field, no error
      }).toThrow()
    })

    it('should fail when validation passes', () => {
      const result = ObjectSchema.safeParse({
        name: 'John',
        age: 30,
      })

      expect(() => {
        expect(result).toHaveValidationError('age')
      }).toThrow()
    })
  })

  describe('toTransformTo', () => {
    it('should verify transformation', () => {
      expect('hello').toTransformTo(TransformSchema, 'HELLO')
      expect('world').toTransformTo(TransformSchema, 'WORLD')
    })

    it('should fail for incorrect transformation', () => {
      expect(() => {
        expect('hello').toTransformTo(TransformSchema, 'hello')
      }).toThrow()
    })

    it('should fail when validation fails', () => {
      expect(() => {
        expect(123).toTransformTo(TransformSchema, 'ANYTHING')
      }).toThrow()
    })
  })

  describe('toAllPassValidation', () => {
    it('should pass when all items are valid', () => {
      expect([1, 2, 3, 4, 5]).toAllPassValidation(NumberSchema)
      expect(['a', 'b', 'c']).toAllPassValidation(StringSchema)
    })

    it('should fail when any item is invalid', () => {
      expect(() => {
        expect([1, 2, 'three', 4]).toAllPassValidation(NumberSchema)
      }).toThrow()

      expect(() => {
        expect(['a', 'b', 3]).toAllPassValidation(StringSchema)
      }).toThrow()
    })

    it('should fail for non-arrays', () => {
      expect(() => {
        expect('not an array').toAllPassValidation(NumberSchema)
      }).toThrow()
    })
  })

  describe('toHaveOptionalFields', () => {
    const baseData = {
      name: 'John',
      age: 30,
      email: 'john@example.com',
    }

    it('should verify optional fields', () => {
      expect(baseData).toHaveOptionalFields(ObjectSchema, ['email'])
    })

    it('should fail for required fields', () => {
      expect(() => {
        expect(baseData).toHaveOptionalFields(ObjectSchema, ['name'])
      }).toThrow()

      expect(() => {
        expect(baseData).toHaveOptionalFields(ObjectSchema, ['age'])
      }).toThrow()
    })

    it('should handle multiple optional fields', () => {
      const SchemaWithOptionals = z.object({
        required: z.string(),
        optional1: z.string().optional(),
        optional2: z.number().optional(),
        optional3: z.boolean().optional(),
      })

      const data = {
        required: 'value',
        optional1: 'value',
        optional2: 42,
        optional3: true,
      }

      expect(data).toHaveOptionalFields(SchemaWithOptionals, [
        'optional1',
        'optional2',
        'optional3',
      ])

      expect(() => {
        expect(data).toHaveOptionalFields(SchemaWithOptionals, [
          'required',
          'optional1',
        ])
      }).toThrow()
    })
  })

  describe('Complex scenarios', () => {
    it('should handle nested objects', () => {
      const NestedSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            age: z.number(),
            bio: z.string().optional(),
          }),
        }),
      })

      const validData = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            bio: 'Developer',
          },
        },
      }

      expect(validData).toPassValidation(NestedSchema)

      const invalidData = {
        user: {
          name: 'John',
          profile: {
            age: 'thirty',
          },
        },
      }

      expect(invalidData).toFailValidationWith(NestedSchema, {
        path: ['user', 'profile', 'age'],
      })
    })

    it('should handle unions', () => {
      const UnionSchema = z.union([z.string(), z.number(), z.boolean()])

      expect('hello').toPassValidation(UnionSchema)
      expect(42).toPassValidation(UnionSchema)
      expect(true).toPassValidation(UnionSchema)
      expect({ object: true }).toFailValidationWith(UnionSchema)
    })

    it('should handle arrays with complex items', () => {
      const ComplexArraySchema = z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        }),
      )

      const validArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]

      expect(validArray).toPassValidation(ComplexArraySchema)
      expect(validArray).toAllPassValidation(
        z.object({ id: z.number(), name: z.string() }),
      )

      const invalidArray = [
        { id: 1, name: 'Item 1' },
        { id: '2', name: 'Item 2' }, // Invalid id type
        { id: 3, name: 'Item 3' },
      ]

      expect(() => {
        expect(invalidArray).toAllPassValidation(
          z.object({ id: z.number(), name: z.string() }),
        )
      }).toThrow()
    })
  })
})
