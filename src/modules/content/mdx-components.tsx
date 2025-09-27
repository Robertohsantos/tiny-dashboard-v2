import type { Components } from 'react-markdown'
import type { MDXComponents } from 'mdx/types'
import {
  // HTML Elements
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Paragraph,
  Blockquote,
  UnorderedList,
  OrderedList,
  ListItem,
  Anchor,
  Pre,
  InlineCode,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  HorizontalRule,
  // Custom MDX Components
  Accordion,
  Expandable,
  Panel,
  Frame,
  CodeGroup,
  Code,
  Tooltip,
  Update,
  Field,
  Example,
  Columns,
  Column,
  Snippet,
  Mermaid,
  CopyButton,
  Callout,
  Card,
  Steps,
  StepsContainer,
  StepItem,
  Tabs,
  Tab,
} from '@/modules/content/components/mdx'

// Components configuration for react-markdown
export const reactMarkdownComponents: Components = {
  // HTML Elements
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: Paragraph,
  blockquote: Blockquote,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  a: Anchor,
  pre: Pre,
  code: InlineCode,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
  hr: HorizontalRule,
}

// Components configuration for MDX
export const mdxComponents: MDXComponents = {
  // HTML Elements
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: Paragraph,
  blockquote: Blockquote,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  a: Anchor,
  pre: Pre,
  code: InlineCode,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
  hr: HorizontalRule,

  // Custom MDX Components
  Callout,
  Card,
  Accordion,
  Expandable,
  Panel,
  Frame,
  CodeGroup,
  Code,
  Tooltip,
  Update,
  Field,
  Example,
  Columns,
  Column,
  Snippet,
  Mermaid,
  CopyButton,
  Steps,
  StepsContainer,
  StepItem,
  Tabs,
  Tab,
}

// Default export for backward compatibility
export const components = reactMarkdownComponents

// MDX Components function for Next.js convention
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  }
}
