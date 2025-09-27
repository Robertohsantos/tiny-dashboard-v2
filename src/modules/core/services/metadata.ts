import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import type { StandardSchemaV1 } from '@igniter-js/core'
import { prisma } from '@/modules/core/services/prisma'
import { DeepMerge } from '@/@saas-boilerplate/utils/deep-merge'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { parseMetadata } from '@/modules/core/utils/parse-metadata'

type PrismaDelegateMinimal = {
  findUnique(args: unknown): Promise<unknown>
  create(args: unknown): Promise<unknown>
  update(args: unknown): Promise<unknown>
}

type SchemaParser = {
  parse: (input: unknown) => unknown
  parseAsync?: (input: unknown) => Promise<unknown>
}

const isRecordOfUnknown = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Parameters for updating metadata in a Prisma model
 */
type UpdateParams<TField extends string, TSchema extends StandardSchemaV1> = {
  /**
   * The metadata field to update (usually 'metadata')
   */
  field: TField
  /**
   * The where clause to find the record to update
   */
  where: Record<string, unknown>
  /**
   * The Zod schema that defines the metadata structure
   */
  schema: TSchema
  /**
   * The data to merge into the existing metadata
   */
  data: StandardSchemaV1.InferInput<TSchema>
  /**
   * Optional fields to include in the response
   * @default {}
   */
  select?: Record<string, boolean>
  /**
   * Options for controlling the update behavior
   */
  options?: {
    /**
     * Whether to validate the existing metadata against the schema
     * @default false
     */
    validateExisting?: boolean
    /**
     * Whether to create a record if it doesn't exist (uses create instead of update)
     * @default false
     */
    createIfNotExists?: boolean
  }
}

/**
 * Return type for safe metadata operations
 */
type SafeUpdateResult<T> = {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    data?: unknown
  }
}

/**
 * Return type for Prisma's update operation
 */
type UpdateResult<TModel extends keyof PrismaClient> = PrismaClient[TModel]['update'] extends (
  ...args: unknown[]
) => Prisma.PrismaPromise<infer TResult>
  ? TResult
  : unknown

/**
 * Updates metadata for any Prisma model by merging new data with existing metadata
 *
 * @param model The prisma model to update (e.g., 'user', 'organization')
 * @param params Parameters including field name, where clause, schema, and data to merge
 * @returns The updated record from the database
 *
 * @example
 * ```typescript
 * // Define your metadata schema
 * const metadataSchema = z.object({
 *   preferences: z.object({
 *     theme: z.enum(['light', 'dark']).optional(),
 *     notifications: z.boolean().optional()
 *   })
 * });
 *
 * // Update user metadata
 * const updatedUser = await updateMetadata(
 *   'user',
 *   {
 *     field: 'metadata',
 *     where: { id: 'user-id' },
 *     schema: metadataSchema,
 *     data: { preferences: { theme: 'dark' } },
 *     select: { id: true, email: true, metadata: true }
 *   }
 * );
 * ```
 */
export async function updateMetadata<
  TModel extends keyof PrismaClient,
  TField extends string,
  TSchema extends StandardSchemaV1,
>(
  model: TModel,
  params: UpdateParams<TField, TSchema>,
): Promise<UpdateResult<TModel>> {
  const { data } = params

  const { field, where, schema, select = {}, options = {} } = params
  const { validateExisting = false, createIfNotExists = false } = options

  // Validate the input data against the schema
  const schemaParser = schema as unknown as SchemaParser
  const parsedData = await tryCatch(
    schemaParser.parseAsync
      ? schemaParser.parseAsync(data)
      : Promise.resolve(schemaParser.parse(data)),
  )

  if (parsedData.error) {
    throw new Error(`Invalid metadata: ${parsedData.error.message}`)
  }

  // Ensure the field is included in the select
  const finalSelect = {
    ...select,
    [field]: true,
  }

  // Get current record with the specified field
  const prismaDelegates = prisma as unknown as Record<
    string,
    PrismaDelegateMinimal
  >
  const delegate = prismaDelegates[String(model)]
  const record = (await delegate.findUnique({
    where,
    select: finalSelect,
  })) as Record<string, unknown> | null

  // Check if record exists
  if (!record) {
    if (createIfNotExists) {
      // Create a new record with the metadata
      const createArgs = {
        data: {
          ...where,
          [field]: data,
        },
        select: finalSelect,
      }
      return delegate.create(createArgs)
    }

    throw new Error(
      `Record not found in ${String(model)} with criteria: ${JSON.stringify(where)}`,
    )
  }

  // Get current metadata value
  const currentMetadata = record[field]

  // Validate current metadata exists or initialize it
  const baseMetadataRaw: Record<string, unknown> =
    typeof currentMetadata === 'string'
      ? parseMetadata<Record<string, unknown>>(currentMetadata)
      : isRecordOfUnknown(currentMetadata)
        ? currentMetadata
        : {}

  // Validate existing metadata if requested
  if (validateExisting && currentMetadata) {
    try {
      if (schemaParser.parseAsync) {
        await schemaParser.parseAsync(currentMetadata)
      } else {
        schemaParser.parse(currentMetadata)
      }
    } catch (error) {
      throw new Error(
        `Existing metadata is invalid: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Merge current metadata with new data
  if (!isRecordOfUnknown(data)) {
    throw new Error('Metadata update payload must be an object')
  }

  const mergedMetadata = DeepMerge.merge(baseMetadataRaw, data)

  const updatedMetadata =
    typeof record[field] === 'string'
      ? JSON.stringify(mergedMetadata)
      : mergedMetadata

  // Create the update data with the field to be updated
  const updateData = {
    [field]: updatedMetadata,
  }

  // Perform the update
  return delegate.update({
    where,
    data: updateData,
    select: finalSelect,
  })
}

/**
 * Safe version of updateMetadata that doesn't throw exceptions
 *
 * @param model The prisma model to update
 * @param params Parameters including field name, where clause, schema, and data to merge
 * @returns An object with success status, data or error information
 *
 * @example
 * ```typescript
 * const result = await updateMetadataSafe(
 *   'user',
 *   {
 *     field: 'metadata',
 *     where: { id: 'user-id' },
 *     schema: metadataSchema,
 *     data: { preferences: { theme: 'dark' } }
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Updated user:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function updateMetadataSafe<
  TModel extends keyof PrismaClient,
  TField extends string,
  TSchema extends StandardSchemaV1,
>(
  model: TModel,
  params: UpdateParams<TField, TSchema>,
): Promise<SafeUpdateResult<UpdateResult<TModel>>> {
  try {
    const result: UpdateResult<TModel> = await updateMetadata(model, params)
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: 'UNKNOWN_ERROR',
        data: error,
      },
    }
  }
}
