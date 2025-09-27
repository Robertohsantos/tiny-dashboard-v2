import React, { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/modules/ui'
import { ArrowRight } from 'lucide-react'

export interface CardProps {
  children?: ReactNode
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string
  className?: string
}

export function Card({
  children,
  title,
  icon: Icon,
  href,
  className,
  ...props
}: CardProps & React.HTMLAttributes<HTMLDivElement>) {
  const content = (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-card p-6 transition-all duration-200',
        'hover:shadow-md hover:border-border/80',
        href && 'cursor-pointer hover:bg-accent/50',
        className,
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}
      {title && (
        <h3 className="mb-2 font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
          {href && (
            <ArrowRight className="inline ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </h3>
      )}
      {children && (
        <div className="text-sm text-muted-foreground leading-relaxed [&>p:first-child]:mb-0">
          {children}
        </div>
      )}
    </div>
  )

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
