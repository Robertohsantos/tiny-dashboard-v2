import ReactMarkdown from 'react-markdown'
import { cn } from '@/modules/ui'
import { reactMarkdownComponents } from '@/modules/content/mdx-components'

export function Markdown({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none markdown-content',
        className,
      )}
    >
      <ReactMarkdown components={reactMarkdownComponents}>
        {children as string}
      </ReactMarkdown>
    </div>
  )
}
