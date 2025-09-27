import React from 'react'
import { cn } from '@/modules/ui'
import { Terminal } from 'lucide-react'
import { CopyButton } from './copy-button'

type PreProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
>
type CodeProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>

export function Pre({ children, ...props }: PreProps) {
  const codeContent =
    React.isValidElement(children) &&
    children.props &&
    typeof children.props === 'object' &&
    'children' in children.props &&
    children.props.children
      ? String(children.props.children)
      : String(children)

  return (
    <div className="group relative">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
        {/* Header with copy button */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Code
            </span>
          </div>
          <CopyButton text={codeContent} />
        </div>

        {/* Code content */}
        <pre
          className={cn(
            'overflow-x-auto p-4 text-sm leading-relaxed',
            'bg-background/50 backdrop-blur-sm',
          )}
          {...props}
        >
          {React.Children.map(children, (child, index) =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  key: `code-${index}`,
                  className: cn((child.props as any)?.className, 'font-mono'),
                } as any)
              : child,
          )}
        </pre>
      </div>
    </div>
  )
}

export function InlineCode({ children, className, ...props }: CodeProps) {
  // Don't style code inside pre blocks
  if (className?.includes('hljs')) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <code
      className={cn(
        'relative rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono font-medium',
        'border border-border/50',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  )
}
