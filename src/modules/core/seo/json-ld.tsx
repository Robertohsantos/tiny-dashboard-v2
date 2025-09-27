import React from 'react'

/**
 * Base component for rendering JSON-LD structured data
 */
interface JsonLdProps<T extends object> {
  data: T
  id?: string
}

export function JsonLd<T extends object>({ data, id }: JsonLdProps<T>) {
  // Add @context if not present
  const payload = data as Record<string, unknown>
  const structuredData = {
    '@context': 'https://schema.org',
    ...payload,
  }

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 0), // Minified JSON
      }}
    />
  )
}

/**
 * Higher-order component for creating type-safe JSON-LD components
 */
export function createJsonLdComponent<T extends object>(
  componentName: string,
) {
  const Component = React.forwardRef<
    HTMLScriptElement,
    { data: T; id?: string }
  >(({ data, id }, ref) => (
    <script
      ref={ref}
      id={id || componentName.toLowerCase()}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          {
            '@context': 'https://schema.org',
            ...(data as Record<string, unknown>),
          },
          null,
          0,
        ),
      }}
    />
  ))

  Component.displayName = componentName

  return Component
}
