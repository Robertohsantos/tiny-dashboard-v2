'use client'

import * as React from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
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

  const periodOptions = React.useMemo(() => getPeriodOptions(), [])
  const multiSelectOptions = React.useMemo(
    () =>
      periodOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [periodOptions],
  )

  const selectedValues = React.useMemo(() => [value], [value])

  const handleMultiSelectChange = (values: string[]) => {
    const nextValue = (values[0] as PeriodType) ?? value
    const { startDate, endDate } = calculateDateRange(nextValue)
    onPeriodChange(nextValue, startDate, endDate)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Período:
      </span>

      <MultiSelect
        value={selectedValues}
        onValueChange={handleMultiSelectChange}
        options={multiSelectOptions}
        label="Período"
        showLabel={false}
        placeholder={periodOptions.find((opt) => opt.value === value)?.label ?? 'Período'}
        searchable={false}
        selectionMode="single"
        showSelectAll={false}
      />
    </div>
  )
}
