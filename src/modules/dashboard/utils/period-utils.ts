export type PeriodType = 'today' | 'week' | 'month' | 'year'

export interface DateRange {
  startDate: Date
  endDate: Date
}

/**
 * Calculate date range based on period type
 */
export function calculateDateRange(
  periodType: PeriodType,
  referenceDate: Date = new Date(),
): DateRange {
  const now = new Date(referenceDate)
  let start: Date
  let end: Date

  switch (periodType) {
    case 'today':
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
      end = new Date(now)
      end.setHours(23, 59, 59, 999)
      break

    case 'week': {
      const weekRange = calculateWeekRange(now)
      start = weekRange.start
      end = weekRange.end
      break
    }

    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      break

    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      break

    default:
      // Default to month if unknown period type
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  return { startDate: start, endDate: end }
}

/**
 * Format period label for display
 */
export function formatPeriodLabel(periodType: PeriodType): string {
  const labels: Record<PeriodType, string> = {
    today: 'Hoje',
    week: 'Semana atual',
    month: 'Mês atual',
    year: 'Ano atual',
  }
  return labels[periodType]
}

/**
 * Get period options for select/dropdown
 */
export function getPeriodOptions(): Array<{
  value: PeriodType
  label: string
}> {
  return [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Semana atual' },
    { value: 'month', label: 'Mês atual' },
    { value: 'year', label: 'Ano atual' },
  ]
}

/**
 * Calculate the difference in days between two dates
 */
export function getDaysDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format date for API requests (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse date string to local date avoiding timezone issues
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day)
}

function calculateWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  const dayOfWeek = start.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}
