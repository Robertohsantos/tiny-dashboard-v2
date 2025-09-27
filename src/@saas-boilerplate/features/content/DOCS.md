# Content Feature Documentation

## Overview

The Content feature provides a comprehensive content management system for the SaaS Boilerplate, leveraging the ContentLayer provider to handle markdown-based content including blog posts, documentation, help articles, and product updates.

## Architecture

### Components

1. **ContentController** (`controllers/content.controller.ts`)

   - Handles HTTP requests and responses
   - Implements all API endpoints defined in the schema
   - Uses ContentProcedure for business logic

2. **ContentProcedure** (`procedures/content.procedure.ts`)

   - Server-only access to content layer
   - Provides safe access to content without bundle contamination
   - Implements content operations using ContentLayer provider

3. **ContentInterface** (`content.interface.ts`)
   - Defines TypeScript types and Zod schemas
   - Ensures type safety across the content system

### Content Types

- **Help**: Help center articles and guides
- **Blog**: Blog posts and articles
- **Docs**: Technical documentation
- **Update**: Product updates and changelog

## API Endpoints

### 1. List Content (`GET /content/list`)

Lists content posts with filtering options.

**Query Parameters:**

- `type` (optional): Content type filter (`help`, `blog`, `docs`, `update`)
- `limit` (optional): Maximum number of posts to return
- `offset` (optional): Number of posts to skip for pagination
- `category` (optional): Filter by category
- `search` (optional): Search term for content filtering
- `tags` (optional): Array of tags to filter by

**Response:**

```typescript
{
  posts: BaseContent[];
  total: number;
  hasMore: boolean;
  categories: string[];
}
```

### 2. Get Content (`GET /content/get`)

Retrieves a specific content post by type and slug.

**Query Parameters:**

- `type` (required): Content type (`help`, `blog`, `docs`, `update`)
- `slug` (required): Post slug/identifier
- `category` (optional): Category for nested content

**Response:**

```typescript
BaseContent | null
```

### 3. Get Categories (`GET /content/categories`)

Retrieves available categories for a specific content type.

**Query Parameters:**

- `type` (required): Content type (`help`, `blog`, `docs`, `update`)

**Response:**

```typescript
string[]
```

### 4. Search Content (`GET /content/search`)

Searches content posts with advanced filtering.

**Query Parameters:**

- `type` (optional): Content type filter
- `query` (required): Search term
- `category` (optional): Category filter
- `limit` (optional): Maximum results
- `offset` (optional): Pagination offset

**Response:**

```typescript
{
  posts: BaseContent[];
  total: number;
  hasMore: boolean;
  categories: string[];
}
```

### 5. Get Related Content (`GET /content/related`)

Retrieves related content posts for a specific post.

**Query Parameters:**

- `type` (required): Content type
- `slug` (required): Current post slug
- `category` (optional): Category filter
- `limit` (optional): Maximum related posts (default: 3)

**Response:**

```typescript
BaseContent[]
```

### 6. Type-Specific Endpoints

#### Blog Posts (`GET /content/blog`)

Lists blog posts with filtering options.

#### Help Articles (`GET /content/help`)

Lists help center articles with filtering.

#### Documentation (`GET /content/docs`)

Lists technical documentation with filtering.

#### Updates (`GET /content/updates`)

Lists product updates and changelog.

## Content Structure

### BaseContent Type

```typescript
type BaseContent = {
  id: string // Unique identifier
  slug: string // URL-friendly identifier
  excerpt: string // Content summary
  content: string // Full markdown content
  data: Content // Frontmatter data
  headings: ContentHeading[] // Table of contents
}
```

### Content Schema

All content types share a common schema structure:

```typescript
{
  title: string;        // Post title
  date: string;         // Publication date
  category: string;     // Content category
  tags?: string[];      // Optional tags
  author?: string;      // Author name
  authorImage?: string; // Author avatar
  excerpt?: string;     // Content excerpt
  image?: string;       // Featured image
  cover?: string;       // Cover image
}
```

## ContentLayer Integration

### Provider Configuration

The ContentLayer provider is configured in `src/providers/content-layer.ts` with:

- **Help**: `src/content/help/`
- **Docs**: `src/content/docs/`
- **Blog**: `src/content/posts/`
- **Updates**: `src/content/updates/`

### File Structure

Content files should be organized as follows:

```
src/content/
├── help/
│   ├── getting-started/
│   │   └── index.md
│   └── account-management/
│       └── profile.md
├── docs/
│   ├── api/
│   │   └── authentication.md
│   └── setup/
│       └── installation.md
├── posts/
│   ├── welcome-post.md
│   └── feature-announcement.md
└── updates/
    ├── v1.0.0.md
    └── v1.1.0.md
```

### Markdown Format

Content files should use the following frontmatter format:

```markdown
---
title: 'Post Title'
date: '2025-01-01'
category: 'Getting Started'
tags: ['guide', 'tutorial']
author: 'Author Name'
authorImage: '/images/author.jpg'
excerpt: 'Brief description of the post'
image: '/images/featured.jpg'
---

# Post Content

Your markdown content here...
```

## Usage Examples

### Server-Side Usage (RSC)

```typescript
import { api } from '@/igniter.client'

// List blog posts
const posts = await api.content.blog.query({
  limit: 10,
  category: 'tutorials',
})

// Get specific post
const post = await api.content.get.query({
  type: 'blog',
  slug: 'getting-started',
})
```

### Client-Side Usage

```typescript
'use client';
import { api } from '@/igniter.client';

function BlogList() {
  const { data, isLoading } = api.content.blog.useQuery({
    limit: 10,
    category: "tutorials"
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.posts.map(post => (
        <article key={post.id}>
          <h2>{post.data.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

## Error Handling

The content feature implements comprehensive error handling:

- **Validation Errors**: Invalid content types or parameters return 400 Bad Request
- **Not Found**: Missing content returns 404 Not Found
- **Server Errors**: Internal errors return 500 Internal Server Error

All errors are logged using the Igniter.js logger for debugging and monitoring.

## Performance Considerations

- **Caching**: ContentLayer provider implements in-memory caching
- **Pagination**: Supports offset-based pagination for large content sets
- **Search**: Implements efficient text-based search across content
- **Filtering**: Category and tag filtering for targeted content retrieval

## Security

- **Content Validation**: All content is validated against Zod schemas
- **Type Safety**: Full TypeScript support prevents runtime errors
- **Input Sanitization**: Query parameters are validated and sanitized
- **Access Control**: Content access is controlled through Igniter.js procedures

## Future Enhancements

- **Full-Text Search**: Integration with search engines like Elasticsearch
- **Content Versioning**: Support for content drafts and versioning
- **Rich Media**: Enhanced support for images, videos, and interactive content
- **Content Analytics**: Usage tracking and performance metrics
- **Multi-language**: Internationalization support for global content
