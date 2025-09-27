import { cn } from '@/modules/ui'
import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ChartWrapperProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  action?: React.ReactNode
  footer?: React.ReactNode
  contentClassName?: string
}

export function ChartWrapper({
  children,
  className,
  title,
  description,
  action,
  footer,
  contentClassName,
}: ChartWrapperProps) {
  return (
    <Card
      className={cn(
        'border border-gray-100 hover:shadow-md transition-shadow bg-gray-50',
        className,
      )}
    >
      {(title || description || action) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div>{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn('pb-0', contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-2 text-sm">{footer}</CardFooter>
      )}
    </Card>
  )
}
