/**
 * Help Center Search Component
 *
 * Client component that provides search functionality with real-time filtering
 * of server-provided articles. Based on the original help-search component.
 */

'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { SearchIcon, ChevronDownIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/modules/ui'
import { String } from '@/@saas-boilerplate/utils/string'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Article interface matching the content layer structure
 */
interface HelpArticle {
  slug: string
  data: {
    title: string
    description?: string
    category: string
    category_name?: string
    date: string
    tags?: string[]
  }
}

/**
 * Props for the HelpCenterSearch component
 */
export interface HelpCenterSearchProps {
  /** Articles to search through */
  articles: HelpArticle[]
  /** Placeholder text for the search input */
  placeholder?: string
  /** Optional CSS class name */
  className?: string
}

/**
 * HelpCenterSearch Component
 *
 * Provides real-time search functionality with category filtering.
 * Based on the original help-search component with improved structure.
 *
 * @param props - Component props
 * @returns JSX element representing the search interface
 */
export function HelpCenterSearch({
  articles,
  placeholder = 'Search for articles...',
  className,
}: HelpCenterSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    articles.forEach((article) => {
      if (article.data.category_name) {
        cats.add(article.data.category_name)
      } else {
        cats.add(article.data.category)
      }
    })
    return Array.from(cats).sort()
  }, [articles])

  // Filter articles based on search query and category
  const filteredArticles = useMemo(() => {
    let filtered = articles

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((article) => {
        const articleCategory =
          article.data.category_name || article.data.category
        return articleCategory === selectedCategory
      })
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ')
      filtered = filtered.filter((article) => {
        const title = article.data.title.toLowerCase()
        const description = (article.data.description || '').toLowerCase()
        const tags = (article.data.tags || []).join(' ').toLowerCase()
        const category = (
          article.data.category_name || article.data.category
        ).toLowerCase()

        return searchTerms.every(
          (term) =>
            title.includes(term) ||
            description.includes(term) ||
            tags.includes(term) ||
            category.includes(term),
        )
      })
    }

    return filtered.slice(0, 10) // Limit to 10 results
  }, [articles, query, selectedCategory])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  /**
   * Handles article selection and navigation
   */
  const handleArticleClick = (article: HelpArticle) => {
    setIsOpen(false)
    setQuery('')

    // Navigate to the article using the category and slug
    const articleSlug = article.slug.split('/').pop() || article.slug
    router.push(`/help/${article.data.category}/${articleSlug}`)
  }

  /**
   * Clears all filters and search
   */
  const clearFilters = () => {
    setQuery('')
    setSelectedCategory(null)
    setIsOpen(false)
  }

  const hasFilters = query.trim() || selectedCategory

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          variant="outline"
          className="pr-20"
          leftIcon={<SearchIcon className="size-5 text-muted-foreground" />}
        />

        {/* Category Filter Button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedCategory ? (
            <span className="flex items-center gap-1">
              {String.formatCategoryLabel(selectedCategory)}
              <ChevronDownIcon className="size-3" />
            </span>
          ) : (
            <span className="flex items-center gap-1">
              All Categories
              <ChevronDownIcon className="size-3" />
            </span>
          )}
        </Button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg overflow-hidden shadow-lg z-50 max-h-96"
        >
          {/* Filters */}
          <div className="px-6 py-4 border-b bg-secondary">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                Filters
              </span>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs"
                >
                  <XIcon className="size-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-4">
              <button
                className={cn([
                  'cursor-pointer hover:text-primary text-muted-foreground font-medium text-sm',
                  selectedCategory === null && 'text-primary',
                ])}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={cn([
                    'cursor-pointer hover:text-primary text-muted-foreground font-medium text-sm',
                    selectedCategory === category && 'text-primary',
                  ])}
                  onClick={() => setSelectedCategory(category)}
                >
                  {String.formatCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          <ScrollArea className="max-h-64 overflow-y-auto">
            {filteredArticles.length > 0 ? (
              <div className="px-6 py-4 space-y-2">
                {filteredArticles.map((article, index) => (
                  <div
                    key={`${article.slug}-${index}`}
                    className="p-4 rounded-md border hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleArticleClick(article)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {article.data.title}
                        </h4>
                        {article.data.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {article.data.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {String.formatCategoryLabel(
                              article.data.category_name ||
                                article.data.category,
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.data.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-sm">No articles found</p>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
