import React, { ReactNode } from 'react'

export interface TabsProps {
  children: ReactNode
  className?: string
}

export function Tabs({
  children,
  className,
  ...props
}: TabsProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`my-6 rounded-lg border border-border overflow-hidden ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabProps {
  children: ReactNode
  title?: string
  className?: string
}

export function Tab({
  children,
  title,
  className,
  ...props
}: TabProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-b border-border last:border-b-0 ${className || ''}`}
      {...props}
    >
      {title && (
        <div className="bg-muted/30 px-4 py-2 font-medium text-sm border-b border-border">
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
