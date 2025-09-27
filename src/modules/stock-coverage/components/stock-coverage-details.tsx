/**
 * Stock Coverage Details Component
 * Displays advanced stock coverage metrics with visual indicators
 */

'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/modules/ui'

interface StockCoverageDetailsProps {
  coverageDays: number
  coverageDaysP90?: number
  coverageDaysP10?: number
  demandForecast?: number
  trendFactor?: number
  confidence?: number
  stockoutRisk?: number
  currentStock?: number
  minimumStock?: number
  className?: string
  showDetails?: boolean
}

export function StockCoverageDetails({
  coverageDays,
  coverageDaysP90,
  coverageDaysP10,
  demandForecast,
  trendFactor,
  confidence,
  stockoutRisk,
  currentStock,
  minimumStock,
  className,
  showDetails = false,
}: StockCoverageDetailsProps) {
  // Determine coverage status
  const getCoverageStatus = (days: number) => {
    if (days <= 7)
      return { label: 'Crítico', color: 'text-red-600', bg: 'bg-red-50' }
    if (days <= 15)
      return { label: 'Baixo', color: 'text-orange-600', bg: 'bg-orange-50' }
    if (days <= 30)
      return { label: 'Normal', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    if (days <= 60)
      return { label: 'Adequado', color: 'text-green-600', bg: 'bg-green-50' }
    return { label: 'Excesso', color: 'text-blue-600', bg: 'bg-blue-50' }
  }

  const status = getCoverageStatus(coverageDays)

  // Format trend
  const formatTrend = (factor: number) => {
    const percentage = ((factor - 1) * 100).toFixed(1)
    const isGrowing = factor > 1.02
    const isDeclining = factor < 0.98

    if (isGrowing) {
      return {
        icon: TrendingUp,
        text: `+${percentage}%`,
        color: 'text-green-600',
      }
    } else if (isDeclining) {
      return {
        icon: TrendingDown,
        text: `${percentage}%`,
        color: 'text-red-600',
      }
    } else {
      return { icon: null, text: 'Estável', color: 'text-gray-600' }
    }
  }

  const trend = trendFactor ? formatTrend(trendFactor) : null

  // Risk level
  const getRiskLevel = (risk: number) => {
    if (risk >= 0.7)
      return { label: 'Alto', color: 'text-red-600', bg: 'bg-red-100' }
    if (risk >= 0.4)
      return { label: 'Médio', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { label: 'Baixo', color: 'text-green-600', bg: 'bg-green-100' }
  }

  const riskLevel = stockoutRisk ? getRiskLevel(stockoutRisk) : null

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {/* Main coverage display */}
        <div className="flex items-center gap-2">
          <Badge
            className={cn('font-mono', status.color, status.bg)}
            variant="secondary"
          >
            {coverageDays.toFixed(0)} dias
          </Badge>

          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs">
                {status.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <p>Cobertura de estoque estimada</p>
                <p className="text-muted-foreground">
                  Baseado em {demandForecast?.toFixed(1) || '?'} un/dia
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Trend indicator */}
          {trend && trend.icon && (
            <Tooltip>
              <TooltipTrigger>
                <div className={cn('flex items-center gap-1', trend.color)}>
                  <trend.icon className="h-3 w-3" />
                  <span className="text-xs font-medium">{trend.text}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Tendência de demanda</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Confidence and risk indicators */}
        {showDetails && (
          <div className="space-y-2">
            {/* Coverage range */}
            {coverageDaysP10 && coverageDaysP90 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Intervalo:</span>
                <span className="font-mono">
                  {coverageDaysP90.toFixed(0)} - {coverageDaysP10.toFixed(0)}{' '}
                  dias
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      P90 (conservador) a P10 (otimista)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Confidence score */}
            {confidence !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confiança</span>
                  <span className="font-mono">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={confidence * 100} className="h-1" />
              </div>
            )}

            {/* Stockout risk */}
            {stockoutRisk !== undefined && riskLevel && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Risco de ruptura:
                </span>
                <Badge
                  variant="secondary"
                  className={cn('text-xs', riskLevel.color, riskLevel.bg)}
                >
                  {riskLevel.label}
                </Badge>
              </div>
            )}

            {/* Stock level indicator */}
            {currentStock !== undefined && minimumStock !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Nível de estoque
                  </span>
                  <span className="font-mono">
                    {currentStock} / {minimumStock} min
                  </span>
                </div>
                <Progress
                  value={(currentStock / Math.max(minimumStock * 2, 1)) * 100}
                  className="h-1"
                />
              </div>
            )}

            {/* Daily demand */}
            {demandForecast && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Demanda diária prevista
                </span>
                <span className="font-mono">
                  {demandForecast.toFixed(1)} un/dia
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
