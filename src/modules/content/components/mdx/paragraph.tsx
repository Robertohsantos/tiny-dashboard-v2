import React from 'react'

type ParagraphProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLParagraphElement>,
  HTMLParagraphElement
>

export function Paragraph({ children, ...props }: ParagraphProps) {
  return (
    <p
      className="leading-7 text-foreground/80 mb-6 [&:not(:first-child)]:mt-6"
      {...props}
    >
      {children}
    </p>
  )
}
