import type { MDXComponents } from 'mdx/types'
import {
  mdxComponents,
  useMDXComponents as useComponents,
} from '@/modules/content/mdx-components'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return useComponents(components)
}

export default mdxComponents
