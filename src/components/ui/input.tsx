import * as React from 'react'

import { cn } from '@/modules/ui'

type InputVariant = 'default' | 'outline' | 'invisible'

type InputProps = React.ComponentProps<'input'> & {
  variant?: InputVariant
  leftIcon?: React.ReactNode
}

const variantClasses: Record<InputVariant, string> = {
  default: 'border border-input bg-transparent',
  outline: 'border border-input bg-background',
  invisible:
    'border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', leftIcon, ...props }, ref) => {
    const baseClass =
      'flex h-9 w-full rounded-md px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
    const computedClass = cn(
      baseClass,
      variantClasses[variant],
      leftIcon ? 'pl-10' : null,
      className,
    )

    const inputElement = (
      <input type={type} className={computedClass} ref={ref} {...props} />
    )

    if (!leftIcon) {
      return inputElement
    }

    return (
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-muted-foreground">
          {leftIcon}
        </span>
        {inputElement}
      </span>
    )
  },
)
Input.displayName = 'Input'

export { Input }
export type { InputProps, InputVariant }
