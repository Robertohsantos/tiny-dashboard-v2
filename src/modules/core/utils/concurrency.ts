/**
 * Concurrency control utilities
 * Manages parallel execution with limits
 */

/**
 * Execute promises with concurrency limit
 * @param tasks Array of tasks to execute
 * @param limit Maximum concurrent executions
 * @param onProgress Optional progress callback
 */
export async function withConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<
  Array<{ status: 'fulfilled' | 'rejected'; value?: T; error?: unknown }>
> {
  const results: Array<{
    status: 'fulfilled' | 'rejected'
    value?: T
    error?: unknown
  }> = []
  const executing: Promise<void>[] = []
  let completed = 0

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]

    const p = task()
      .then((value) => {
        completed++
        if (onProgress) onProgress(completed, tasks.length)
        results[i] = { status: 'fulfilled', value }
      })
      .catch((error) => {
        completed++
        if (onProgress) onProgress(completed, tasks.length)
        results[i] = { status: 'rejected', error }
      })

    executing.push(p)

    if (executing.length >= limit) await Promise.race(executing)
  }

  // Wait for all remaining promises
  await Promise.all(executing)

  return results
}

/**
 * Batch process items with concurrency limit
 * @param items Items to process
 * @param processor Function to process each item
 * @param options Processing options
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrency?: number
    batchSize?: number
    onProgress?: (completed: number, total: number) => void
    onError?: (item: T, error: unknown) => void
  } = {},
): Promise<{
  successful: R[]
  failed: Array<{ item: T; error: unknown }>
}> {
  const { concurrency = 5, batchSize = 10, onProgress, onError } = options

  const successful: R[] = []
  const failed: Array<{ item: T; error: unknown }> = []

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length))

    const tasks = batch.map((item, index) => async () => {
      try {
        const result = await processor(item)
        successful.push(result)
        return result
      } catch (error) {
        failed.push({ item, error })
        if (onError) {
          onError(item, error)
        }
        throw error
      }
    })

    await withConcurrencyLimit(tasks, concurrency, (completed, total) => {
      if (onProgress) {
        onProgress(i + completed, items.length)
      }
    })

    // Small delay between batches to avoid overwhelming the system
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return { successful, failed }
}

/**
 * Simple promise-based rate limiter
 */
export class RateLimiter {
  private queue: Array<() => void> = []
  private running = 0

  constructor(
    private maxConcurrent: number,
    private minTime: number = 0, // Minimum time between executions in ms
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot()

    this.running++
    const startTime = Date.now()

    try {
      const result = await fn()

      // Ensure minimum time between executions
      const elapsed = Date.now() - startTime
      if (this.minTime > 0 && elapsed < this.minTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minTime - elapsed),
        )
      }

      return result
    } finally {
      this.running--
      this.releaseSlot()
    }
  }

  private waitForSlot(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      this.queue.push(resolve)
    })
  }

  private releaseSlot(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    }
  }
}
