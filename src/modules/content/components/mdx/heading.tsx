import React from 'react'
import { cn } from '@/modules/ui'

type HeadingProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLHeadingElement>,
  HTMLHeadingElement
>

export function H1({ children, ...props }: HeadingProps) {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-2xl font-bold tracking-tight mb-8 mt-2',
        'bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent',
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function H2({ children, ...props }: HeadingProps) {
  return (
    <h2
      className={cn(
        'scroll-m-20 text-xl font-semibold tracking-tight',
        'mt-16 mb-6 first:mt-0',
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function H3({ children, ...props }: HeadingProps) {
  return (
    <h3
      className="scroll-m-20 text-lg font-semibold tracking-tight mt-12 mb-2 first:mt-0"
      {...props}
    >
      {children}
    </h3>
  )
}

export function H4({ children, ...props }: HeadingProps) {
  return (
    <h4
      className="scroll-m-20 text-md font-semibold tracking-tight mt-8 mb-3"
      {...props}
    >
      {children}
    </h4>
  )
}

export function H5({ children, ...props }: HeadingProps) {
  return (
    <h5
      className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2"
      {...props}
    >
      {children}
    </h5>
  )
}

export function H6({ children, ...props }: HeadingProps) {
  return (
    <h6
      className="scroll-m-20 text-base font-semibold tracking-tight mt-4 mb-2"
      {...props}
    >
      {children}
    </h6>
  )
}
