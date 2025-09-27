/**
 * StockStatusBadge Component
 * Displays a badge indicating the stock status of a product
 * Follows single responsibility principle - only handles stock status display
 */

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/modules/ui'

export interface StockStatusBadgeProps {
  /** Current stock quantity */
  currentStock: number
  /** Minimum stock threshold */
  minimumStock: number
  /** Product status (active, inactive, discontinued) */
  productStatus?: 'ativo' | 'inativo' | 'descontinuado'
  /** Optional unit label (default: 'un') */
  unit?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Determines the badge variant and text color based on stock levels
 */
function getStockStatusConfig(
  currentStock: number,
  minimumStock: number,
  productStatus?: 'ativo' | 'inativo' | 'descontinuado',
) {
  // Inactive or discontinued products
  if (productStatus === 'inativo' || productStatus === 'descontinuado') {
    return {
      variant: 'outline' as const,
      textColor: 'text-muted-foreground',
    }
  }

  // Out of stock
  if (currentStock === 0) {
    return {
      variant: 'destructive' as const,
      textColor: '',
    }
  }

  // Below minimum threshold
  if (currentStock < minimumStock) {
    return {
      variant: 'secondary' as const,
      textColor: 'text-orange-600',
    }
  }

  // Normal stock levels
  return {
    variant: 'default' as const,
    textColor: '',
  }
}

/**
 * A reusable badge component for displaying product stock status
 * Automatically determines styling based on stock levels and product status
 */
export const StockStatusBadge = React.memo(function StockStatusBadge({
  currentStock,
  minimumStock,
  productStatus,
  unit = 'un',
  className,
}: StockStatusBadgeProps) {
  const { variant, textColor } = getStockStatusConfig(
    currentStock,
    minimumStock,
    productStatus,
  )

  return (
    <Badge
      variant={variant}
      className={cn('font-mono text-xs', textColor, className)}
    >
      {currentStock} {unit}
    </Badge>
  )
})

StockStatusBadge.displayName = 'StockStatusBadge'
