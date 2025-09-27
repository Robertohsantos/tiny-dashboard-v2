import React, { ReactNode } from 'react'

export interface StepsContainerProps {
  children: ReactNode
  className?: string
}

export function StepsContainer({
  children,
  className,
  ...props
}: StepsContainerProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`my-8 ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

export interface StepItemProps {
  children: ReactNode
  number: number
  isLast?: boolean
  className?: string
}

export function StepItem({
  children,
  number,
  isLast = false,
  className,
  ...props
}: StepItemProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex gap-4 relative ${className || ''}`} {...props}>
      <div className="flex flex-col items-center relative">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold z-10 relative">
          {number}
        </div>
        {!isLast && (
          <div
            className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 bg-border"
            style={{ height: 'calc(100% + 1.5rem)' }}
          />
        )}
      </div>
      <div className="flex-1 pt-1 pb-6">{children}</div>
    </div>
  )
}

export interface StepsProps {
  children: ReactNode
  className?: string
}

export function Steps({
  children,
  className,
  ...props
}: StepsProps & React.HTMLAttributes<HTMLDivElement>) {
  // Filter out text nodes and only keep valid React elements (like h3 headings)
  const validChildren = React.Children.toArray(children).filter(
    (child) =>
      React.isValidElement(child) &&
      (child.type === 'h3' ||
        (typeof child.type === 'string' && child.type === 'h3')),
  )

  return (
    <div className={`my-8 ${className || ''}`} {...props}>
      {validChildren.map((child, index) => {
        const isLast = index === validChildren.length - 1
        return (
          <div key={index} className="flex gap-4 relative">
            <div className="flex flex-col items-center relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold z-10 relative">
                {index + 1}
              </div>
              {!isLast && (
                <div
                  className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 bg-border"
                  style={{ height: 'calc(100% + 1.5rem)' }}
                />
              )}
            </div>
            <div className="flex-1 pt-1 pb-6">{child}</div>
          </div>
        )
      })}
    </div>
  )
}
