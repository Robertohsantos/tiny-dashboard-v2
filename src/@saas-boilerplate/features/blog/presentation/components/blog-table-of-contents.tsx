'use client'

import * as React from 'react'
import type { BlogTableOfContentsProps } from './types'

/**
 * BlogTableOfContents Component
 *
 * Interactive table of contents for blog articles with smooth scrolling navigation.
 * Automatically highlights the current section based on scroll position.
 *
 * ## Features
 * - **Smooth Scrolling**: Smooth navigation to article sections
 * - **Active Section Highlighting**: Automatically highlights current section
 * - **Nested Structure**: Supports nested heading hierarchy
 * - **Keyboard Navigation**: Arrow key and enter support
 * - **Accessibility**: Proper ARIA labels and focus management
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic table of contents
 * <BlogTableOfContents
 *   headings={post.headings}
 *   title="Table of Contents"
 * />
 *
 * // Custom active heading
 * <BlogTableOfContents
 *   headings={headings}
 *   activeHeading="introduction"
 * />
 *
 * // With click handler
 * <BlogTableOfContents
 *   headings={headings}
 *   onHeadingClick={(headingId) => console.log(headingId)}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the table of contents
 */
export function BlogTableOfContents({
  headings,
  title = 'Table of Contents',
  activeHeading,
  onHeadingClick,
  className = '',
}: BlogTableOfContentsProps) {
  const [currentActiveHeading, setCurrentActiveHeading] =
    React.useState<string>('')
  const [focusedIndex, setFocusedIndex] = React.useState(-1)
  const tocRef = React.useRef<HTMLDivElement>(null)

  // Flatten headings for keyboard navigation
  const flatHeadings = React.useMemo(() => {
    return headings.map((heading) => ({
      ...heading,
      indent: (heading.level - 1) * 12, // 12px indent per level
    }))
  }, [headings])

  // Intersection Observer for active heading detection
  React.useEffect(() => {
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentActiveHeading(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0.1,
      },
    )

    // Observe all headings
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  // Handle heading click
  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }

    if (onHeadingClick) {
      onHeadingClick(headingId)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!flatHeadings.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev < flatHeadings.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && flatHeadings[focusedIndex]) {
          handleHeadingClick(flatHeadings[focusedIndex].id)
        }
        break
    }
  }

  // Handle empty state
  if (!headings || headings.length === 0) {
    return null
  }

  const activeHeadingId = activeHeading || currentActiveHeading

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      )}

      <nav
        ref={tocRef}
        className="space-y-1"
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label="Table of contents"
      >
        {flatHeadings.map((heading, index) => {
          const isActive = activeHeadingId === heading.id
          const isFocused = focusedIndex === index

          return (
            <button
              key={heading.id}
              onClick={() => handleHeadingClick(heading.id)}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              style={{ paddingLeft: `${12 + heading.indent}px` }}
              aria-current={isActive ? 'location' : undefined}
            >
              {heading.text}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
