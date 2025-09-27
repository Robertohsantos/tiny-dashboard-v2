import React from 'react'

type UListProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLUListElement>,
  HTMLUListElement
>
type OListProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLOListElement>,
  HTMLOListElement
>
type ListItemProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLLIElement>,
  HTMLLIElement
>

export function UnorderedList({ children, ...props }: UListProps) {
  // Check if this is a card grid (special case)
  const isCardGrid = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      child.props &&
      typeof child.props === 'object' &&
      'className' in child.props &&
      typeof child.props.className === 'string' &&
      child.props.className.includes('card-item'),
  )

  if (isCardGrid) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {React.Children.map(children, (child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { key: index })
            : child,
        )}
      </div>
    )
  }

  return (
    <ul className="my-6 ml-6 list-disc space-y-2 [&>li]:mt-2" {...props}>
      {children}
    </ul>
  )
}

export function OrderedList({ children, ...props }: OListProps) {
  return (
    <ol className="my-6 ml-6 list-decimal space-y-2 [&>li]:mt-2" {...props}>
      {children}
    </ol>
  )
}

export function ListItem({ children, ...props }: ListItemProps) {
  // Handle task list items
  if (props.className?.includes('task-list-item')) {
    return (
      <li className="flex items-center gap-2 list-none ml-0" {...props}>
        {children}
      </li>
    )
  }

  // Handle card items
  if (props.className?.includes('card-item')) {
    return <div className="list-none">{children}</div>
  }

  // Check for feature list items (strong + description pattern)
  const childArray = React.Children.toArray(children)
  const hasStrongWithColon =
    React.isValidElement(childArray[0]) &&
    childArray[0].type === 'strong' &&
    String(childArray[1]).startsWith(': ')

  if (hasStrongWithColon) {
    const [strongElement, ...restContent] = childArray
    const textContent = restContent.join('').replace(/^:\s*/, '')

    return (
      <li className="list-none ml-0 mb-4" {...props}>
        <div className="rounded-md flex items-center border border-border text-sm p-4 space-x-2 transition-colors">
          <div className="font-semibold text-foreground">{strongElement}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {textContent}
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="text-foreground/80" {...props}>
      {children}
    </li>
  )
}
