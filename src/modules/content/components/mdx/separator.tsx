import React from 'react'

type HrProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLHRElement>,
  HTMLHRElement
>

export function HorizontalRule({ ...props }: HrProps) {
  return <hr className="my-8 border-border" {...props} />
}
