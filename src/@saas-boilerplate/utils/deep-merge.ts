type PlainObject = Record<string, unknown>

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export class DeepMerge {
  static merge<T extends PlainObject, U extends PlainObject[]>(
    target: T,
    ...sources: U
  ): T & U[number] {
    const output: PlainObject = isPlainObject(target) ? { ...target } : {}

    for (const source of sources) {
      if (!isPlainObject(source)) {
        continue
      }

      for (const [key, value] of Object.entries(source)) {
        const currentValue = output[key]

        if (isPlainObject(currentValue) && isPlainObject(value)) {
          output[key] = DeepMerge.merge(currentValue, value)
          continue
        }

        output[key] = value
      }
    }

    return output as T & U[number]
  }
}
