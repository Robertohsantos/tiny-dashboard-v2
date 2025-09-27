import React from 'react'
import { cn } from '@/modules/ui'

type BlockquoteProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLQuoteElement>,
  HTMLQuoteElement
>

export function Blockquote({ children, ...props }: BlockquoteProps) {
  return (
    <blockquote
      className={cn(
        'mt-6 border-l-4 border-primary/30 pl-6 italic text-foreground/80',
        'bg-muted/30 py-4 pr-4 rounded-r-lg',
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
}
