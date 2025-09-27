'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIcon, ArrowRightIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { BlogSearchProps } from './types'
import type { BlogPost } from '../../blog.interface'

/**
 * BlogSearch Component
 *
 * Interactive search component for blog posts with instant results.
 * Provides real-time search with keyboard navigation and result preview.
 *
 * ## Features
 * - **Real-time Search**: Instant search results as you type
 * - **Keyboard Navigation**: Arrow keys and enter support
 * - **Result Preview**: Quick preview of search results
 * - **Responsive Design**: Works on all screen sizes
 * - **Accessibility**: Screen reader friendly
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic search with results
 * <BlogSearch
 *   posts={allPosts}
 *   placeholder="Search articles..."
 *   showResults={true}
 *   maxResults={5}
 * />
 *
 * // Search without results display
 * <BlogSearch
 *   posts={allPosts}
 *   showResults={false}
 *   onSearch={(query, results) => console.log(results)}
 * />
 *
 * // Custom result limit
 * <BlogSearch
 *   posts={allPosts}
 *   maxResults={10}
 *   placeholder="Find articles..."
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the blog search component
 */
export function BlogSearch({
  posts,
  placeholder = 'Search articles...',
  showResults = true,
  maxResults = 5,
  onSearch,
  className = '',
}: BlogSearchProps) {
  const [query, setQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter posts based on search query
  const filteredPosts = React.useMemo(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase().trim()
    return posts
      .filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.excerpt?.toLowerCase().includes(searchTerm) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          post.author?.toLowerCase().includes(searchTerm),
      )
      .slice(0, maxResults)
  }, [posts, query, maxResults])

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    setIsOpen(value.trim().length > 0 && showResults)

    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(value, filteredPosts)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredPosts.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredPosts.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredPosts[selectedIndex]) {
          router.push(`/blog/${filteredPosts[selectedIndex].slug}`)
          setIsOpen(false)
          setQuery('')
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle result click
  const handleResultClick = (post: BlogPost) => {
    router.push(`/blog/${post.slug}`)
    setIsOpen(false)
    setQuery('')
  }

  // Close results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && showResults && setIsOpen(true)}
          className="pl-10 pr-4"
          aria-label="Search blog posts"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
      </div>

      {/* Search Results */}
      {isOpen && filteredPosts.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
        >
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => handleResultClick(post)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate">{post.title}</h4>
                  <ArrowRightIcon className="size-4 text-muted-foreground flex-shrink-0" />
                </div>

                {post.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-1 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {post.author}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Show all results link */}
          {filteredPosts.length >= maxResults && (
            <div className="px-4 py-2 border-t bg-muted/50">
              <Link
                href={`/blog?search=${encodeURIComponent(query)}`}
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setIsOpen(false)
                  setQuery('')
                }}
              >
                View all results for "{query}"
              </Link>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && filteredPosts.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-md shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No articles found for "{query}"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try different keywords or browse all articles
          </p>
        </div>
      )}
    </div>
  )
}
