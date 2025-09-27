# Blog Feature Documentation

## Overview

The Blog feature provides a comprehensive blogging system with SEO optimization, content management, and presentation components. It follows the same architectural patterns as the Help Center feature, ensuring consistency and maintainability.

## Architecture

### Core Components

- **Blog Controller**: REST API endpoints for blog operations
- **Blog Procedure**: Business logic and data access middleware
- **Presentation Layer**: UI components optimized for SEO and performance
- **Blog Interface**: Type definitions and schemas

### Directory Structure

```
src/@saas-boilerplate/features/blog/
├── controllers/
│   └── blog.controller.ts          # API endpoints
├── procedures/
│   └── blog.procedure.ts           # Business logic with ContentLayer
├── presentation/
│   ├── components/                 # UI components
│   │   ├── blog-header.tsx         # Header with breadcrumbs/search
│   │   ├── blog-post-card.tsx      # Individual post card
│   │   ├── blog-post-grid.tsx      # Grid layout for posts
│   │   ├── blog-post-list.tsx      # List layout for posts
│   │   ├── blog-post-article.tsx   # Full article component
│   │   ├── blog-sidebar.tsx        # Sidebar with TOC/author
│   │   ├── blog-related-posts.tsx  # Related posts component
│   │   ├── blog-categories.tsx     # Categories listing
│   │   ├── blog-search.tsx         # Search functionality
│   │   ├── blog-featured-posts.tsx # Featured posts
│   │   ├── blog-breadcrumbs.tsx    # Navigation breadcrumbs
│   │   ├── blog-seo.tsx           # SEO optimization
│   │   └── types.ts               # Component type definitions
│   ├── hooks/                      # Custom hooks (future use)
│   ├── contexts/                   # React contexts (future use)
│   └── utils/                      # Utility functions (future use)
├── blog.interface.ts               # Type definitions
├── index.ts                        # Main exports
└── DOCS.md                         # This documentation
```

## API Endpoints

### Get Blog Post

```
GET /blog/posts/:slug
```

Retrieves a single blog post with related posts and metadata.

**Response:**

```json
{
  "data": {
    "post": { ... },
    "related": [ ... ],
    "next": { ... },
    "previous": { ... },
    "meta": { ... }
  }
}
```

### List Blog Posts

```
GET /blog/posts?category=tech&limit=10&offset=0
```

Lists blog posts with optional filtering and pagination.

**Query Parameters:**

- `category` (string): Filter by category
- `tag` (string): Filter by tag
- `search` (string): Search query
- `limit` (number): Number of posts per page (default: 12)
- `offset` (number): Pagination offset (default: 0)
- `featured` (boolean): Return only featured posts

### Search Blog Posts

```
GET /blog/search?q=react&category=tech&limit=10
```

Performs full-text search across blog posts.

**Query Parameters:**

- `q` (string, required): Search query (min 2 characters)
- `category` (string): Filter by category
- `tag` (string): Filter by tag
- `limit` (number): Maximum results (default: 10)

### Get Categories

```
GET /blog/categories
```

Retrieves all blog categories with post counts.

### Get Popular Posts

```
GET /blog/popular?limit=5
```

Retrieves popular blog posts based on engagement metrics.

### Get Related Posts

```
GET /blog/posts/:slug/related?limit=3
```

Gets posts related to a specific post based on tags and category.

### Get Blog Statistics

```
GET /blog/stats
```

Retrieves overall blog statistics and metrics.

## Presentation Components

### BlogHeader

Main header component for blog pages with breadcrumbs and search.

```tsx
<BlogHeader
  title="Latest News"
  showBreadcrumb={true}
  showSearch={true}
  searchPlaceholder="Search articles..."
/>
```

### BlogPostCard

Individual blog post card component.

```tsx
<BlogPostCard
  post={post}
  variant="featured"
  showExcerpt={true}
  showAuthor={true}
  showDate={true}
  showTags={true}
/>
```

### BlogPostGrid

Grid layout for multiple blog posts.

```tsx
<BlogPostGrid
  posts={posts}
  variant="default"
  columns={3}
  showExcerpt={true}
  showAuthor={true}
  showDate={true}
  showTags={true}
/>
```

### BlogPostList

List layout for blog posts.

```tsx
<BlogPostList
  posts={posts}
  showExcerpt={true}
  showAuthor={true}
  showDate={true}
  showTags={true}
  showSeparator={true}
/>
```

### BlogPostArticle

Full blog post article component.

```tsx
<BlogPostArticle
  post={post}
  relatedPosts={related}
  showTableOfContents={true}
  showRelatedPosts={true}
  showNavigation={true}
/>
```

### BlogSidebar

Sidebar component for blog post pages.

```tsx
<BlogSidebar
  post={post}
  categories={categories}
  popularPosts={popularPosts}
  showAuthor={true}
  showTableOfContents={true}
  showCategories={true}
  showPopularPosts={true}
/>
```

### BlogRelatedPosts

Related posts component.

```tsx
<BlogRelatedPosts
  posts={relatedPosts}
  title="You might also like"
  layout="grid"
  showExcerpt={true}
  showDate={true}
/>
```

### BlogCategories

Categories listing component.

```tsx
<BlogCategories
  categories={categories}
  title="Categories"
  layout="list"
  showPostCount={true}
  showDescription={true}
/>
```

### BlogSearch

Search component for blog posts.

```tsx
<BlogSearch
  posts={allPosts}
  placeholder="Search articles..."
  showResults={true}
  maxResults={10}
/>
```

### BlogFeaturedPosts

Featured posts component.

```tsx
<BlogFeaturedPosts
  posts={featuredPosts}
  title="Featured Articles"
  maxPosts={3}
  showExcerpt={true}
  showAuthor={true}
  showDate={true}
  showTags={true}
/>
```

### BlogBreadcrumbs

Breadcrumb navigation component.

```tsx
<BlogBreadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Article', href: '/blog/article', isActive: true },
  ]}
/>
```

## SEO Optimization

### Structured Data

All blog components include proper JSON-LD structured data for search engines.

### Meta Tags

Automatic generation of meta tags for:

- Title optimization
- Description with excerpts
- Open Graph images
- Canonical URLs
- Article metadata

### Performance

- Server-side rendering for initial page loads
- Optimized images with WebP format
- Lazy loading for non-critical content
- Efficient caching strategies

## Usage Examples

### Blog Listing Page

```tsx
import { api } from '@/igniter.client'
import { BlogHeader, BlogPostGrid, BlogCategories } from '@/features/blog'

export default async function BlogPage() {
  const postsResponse = await api.blog.listPosts.query({
    query: { limit: 12 },
  })

  const categoriesResponse = await api.blog.getCategories.query()

  return (
    <div>
      <BlogHeader title="Latest News" showSearch={true} />

      <div className="container mx-auto">
        <BlogPostGrid
          posts={postsResponse.data?.posts || []}
          showExcerpt={true}
          showAuthor={true}
          showDate={true}
        />

        <BlogCategories
          categories={categoriesResponse.data?.categories || []}
          showPostCount={true}
        />
      </div>
    </div>
  )
}
```

### Blog Post Page

```tsx
import { api } from '@/igniter.client'
import { BlogPostArticle, BlogSidebar } from '@/features/blog'

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  const postResponse = await api.blog.getPost.query({
    query: { slug },
  })

  const relatedResponse = await api.blog.getRelatedPosts.query({
    query: { slug, limit: 3 },
  })

  if (!postResponse.data) {
    return notFound()
  }

  return (
    <article className="container mx-auto grid md:grid-cols-[1fr_300px] gap-8">
      <BlogPostArticle
        post={postResponse.data.post}
        relatedPosts={relatedResponse.data?.posts}
        showTableOfContents={true}
      />

      <BlogSidebar
        post={postResponse.data.post}
        showTableOfContents={true}
        showAuthor={true}
      />
    </article>
  )
}
```

## Integration

### Router Registration

Add the blog controller to your main router:

```typescript
// src/igniter.router.ts
import { BlogController } from '@/features/blog'

export const AppRouter = igniter.router({
  controllers: {
    // ... other controllers
    blog: BlogController,
  },
})
```

### Client Integration

The blog feature is automatically available through the Igniter client:

```typescript
import { api } from '@/igniter.client'

// Use blog endpoints
const posts = await api.blog.listPosts.query()
const post = await api.blog.getPost.query({ query: { slug: 'my-post' } })
```

## Customization

### Styling

All components accept a `className` prop for custom styling:

```tsx
<BlogPostCard post={post} className="custom-blog-card" />
```

### Component Extension

Create custom components by extending the base types:

```tsx
interface CustomBlogPostCardProps extends BlogPostCardProps {
  showReadingTime?: boolean
}

export function CustomBlogPostCard({
  showReadingTime,
  ...props
}: CustomBlogPostCardProps) {
  // Custom implementation
}
```

## Performance Considerations

### Caching

- API responses are cached at the server level
- Static blog posts are pre-rendered at build time
- Images are optimized and cached with appropriate headers

### Bundle Optimization

- Components are tree-shaken when not used
- Dynamic imports for non-critical components
- Minimal client-side JavaScript for better performance

## Best Practices

1. **Always use server components** for initial data fetching
2. **Implement proper error boundaries** for blog components
3. **Use the provided SEO components** for consistent metadata
4. **Follow the established patterns** for new blog features
5. **Test components thoroughly** across different viewports
6. **Monitor performance metrics** and optimize as needed

## Troubleshooting

### Common Issues

1. **Posts not loading**: Check ContentLayer configuration and post file formats
2. **Search not working**: Verify search index is built correctly
3. **SEO not working**: Ensure proper metadata generation and structured data
4. **Performance issues**: Check image optimization and caching configuration

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=blog:* npm run dev
```

## Future Enhancements

- [ ] Comment system integration
- [ ] Social sharing functionality
- [ ] Advanced search with filters
- [ ] Newsletter subscription
- [ ] Author profiles and bios
- [ ] Reading progress tracking
- [ ] Related content recommendations
- [ ] Blog post series support
