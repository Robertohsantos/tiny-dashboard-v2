import React, { ReactNode } from 'react'
import { cn } from '@/modules/ui'
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  FileText,
  Terminal,
} from 'lucide-react'

export interface CalloutProps {
  children: ReactNode
  type?: 'info' | 'warning' | 'error' | 'success' | 'tip' | 'note' | 'nerd'
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function Callout({
  children,
  type = 'info',
  title,
  icon: Icon,
  className,
  ...props
}: CalloutProps & React.HTMLAttributes<HTMLDivElement>) {
  const configs = {
    info: {
      icon: Icon || Info,
      className: 'border-border/60 bg-accent/30',
      iconClassName: 'text-primary',
      titleClassName: 'text-foreground',
    },
    warning: {
      icon: Icon || AlertTriangle,
      className: 'border-destructive/40 bg-destructive/10',
      iconClassName: 'text-destructive',
      titleClassName: 'text-foreground',
    },
    error: {
      icon: Icon || XCircle,
      className: 'border-destructive/60 bg-destructive/20',
      iconClassName: 'text-destructive',
      titleClassName: 'text-destructive-foreground',
    },
    success: {
      icon: Icon || CheckCircle,
      className: 'border-border/60 bg-secondary/50',
      iconClassName: 'text-primary',
      titleClassName: 'text-foreground',
    },
    tip: {
      icon: Icon || Lightbulb,
      className: 'border-border/60 bg-muted/50',
      iconClassName: 'text-primary',
      titleClassName: 'text-foreground',
    },
    note: {
      icon: Icon || FileText,
      className: 'border-border/40 bg-muted/30',
      iconClassName: 'text-muted-foreground',
      titleClassName: 'text-foreground',
    },
    nerd: {
      icon: Icon || Terminal,
      className: 'border-border/50 bg-muted/40',
      iconClassName: 'text-muted-foreground',
      titleClassName: 'text-foreground',
    },
  }

  const config = configs[type] || configs.info
  const IconComponent = config.icon

  return (
    <div
      className={cn(
        'my-6 rounded-lg border p-4 backdrop-blur-sm',
        config.className,
        className,
      )}
      {...props}
    >
      <div className="flex gap-3">
        <IconComponent
          className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClassName)}
        />
        <div className="flex-1 space-y-2">
          {title && (
            <div className={cn('font-semibold text-sm', config.titleClassName)}>
              {title}
            </div>
          )}
          <div className="text-sm leading-relaxed text-foreground/80 [&>p:first-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
