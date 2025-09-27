type MetadataInput = string | Record<string, unknown> | null | undefined

const isRecordOfUnknown = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseMetadata(metadata: MetadataInput): Record<string, unknown>
export function parseMetadata<T extends Record<string, unknown>>(
  metadata: MetadataInput | T,
  defaultValue?: T,
): T
export function parseMetadata<T extends Record<string, unknown>>(
  metadata: MetadataInput | T,
  defaultValue?: T,
): Record<string, unknown> | T {
  const parseValue = (
    input: MetadataInput | T,
  ): Record<string, unknown> | null => {
    if (input == null) {
      return null
    }

    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input) as unknown
        return isRecordOfUnknown(parsed) ? parsed : null
      } catch {
        return null
      }
    }

    if (isRecordOfUnknown(input)) {
      return input
    }

    return null
  }

  const parsed = parseValue(metadata)

  if (defaultValue) {
    return Object.assign({}, defaultValue, parsed ?? {}) as T
  }

  return (parsed ?? {}) as T
}
