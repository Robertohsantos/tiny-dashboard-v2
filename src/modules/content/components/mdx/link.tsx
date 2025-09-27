import React from 'react'
import Link from 'next/link'
import { cn } from '@/modules/ui'
import { ExternalLink } from 'lucide-react'

type AnchorProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  href?: string
}

export function Anchor({ children, href = '', ...props }: AnchorProps) {
  const isExternal = href.startsWith('http')

  const linkClasses = cn(
    'font-medium text-primary underline-offset-4 hover:underline',
    'transition-colors duration-200',
    isExternal && 'inline-flex items-center gap-1',
  )

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClasses}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <Link href={href} className={linkClasses} {...props}>
      {children}
    </Link>
  )
}
