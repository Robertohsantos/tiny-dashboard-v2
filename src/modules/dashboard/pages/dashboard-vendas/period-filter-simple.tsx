'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type PeriodType,
  calculateDateRange,
  getPeriodOptions,
} from '@/modules/dashboard/utils/period-utils'

interface PeriodFilterSimpleProps {
  value: PeriodType
  onPeriodChange: (type: PeriodType, start: Date, end: Date) => void
}

export function PeriodFilterSimple({
  value,
  onPeriodChange,
}: PeriodFilterSimpleProps) {
  const handleSelectChange = (newValue: string) => {
    const periodType = newValue as PeriodType
    const { startDate, endDate } = calculateDateRange(periodType)
    onPeriodChange(periodType, startDate, endDate)
  }

  const periodOptions = getPeriodOptions()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Período:
      </span>

      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
