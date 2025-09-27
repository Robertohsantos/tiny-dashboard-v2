'use client'

import * as React from 'react'
import { type PeriodType, calculateDateRange } from '@/modules/dashboard/utils/period-utils'

interface PeriodContextType {
  periodType: PeriodType
  startDate: Date
  endDate: Date
  setPeriod: (type: PeriodType, start: Date, end: Date) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const PeriodContext = React.createContext<PeriodContextType | undefined>(
  undefined,
)

export function usePeriod() {
  const context = React.useContext(PeriodContext)
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider')
  }
  return context
}

interface PeriodProviderProps {
  children: React.ReactNode
  initialPeriod?: PeriodType
}

export function PeriodProvider({
  children,
  initialPeriod = 'month',
}: PeriodProviderProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [periodType, setPeriodType] = React.useState<PeriodType>(initialPeriod)
  const [dates, setDates] = React.useState(() =>
    calculateDateRange(initialPeriod),
  )

  const setPeriod = React.useCallback(
    (type: PeriodType, start: Date, end: Date) => {
      setPeriodType(type)
      setDates({ startDate: start, endDate: end })
    },
    [],
  )

  const value = React.useMemo(
    () => ({
      periodType,
      startDate: dates.startDate,
      endDate: dates.endDate,
      setPeriod,
      isLoading,
      setIsLoading,
    }),
    [periodType, dates.startDate, dates.endDate, setPeriod, isLoading],
  )

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  )
}
