import type { Metadata } from 'next/types'
import {
  generateMetadata,
  getPageMetadata,
  ChangelogTimeline,
  type ChangelogEntry,
  SiteCTA,
} from '@/modules/site'
import { RssIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { XIcon } from '@/components/ui/icons/x-icon'
import { contentLayer } from '@/modules/core/services/content-layer'
import { AppConfig } from '@/config/boilerplate.config.client'
import { Link } from 'next-view-transitions'
import { api } from '@/igniter.client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import React from 'react'

export const metadata: Metadata = generateMetadata(getPageMetadata('updates'))

export default async function Page() {
  const updates = await api.content.updates.query({
    query: {
      limit: 100,
    },
  })

  const defaultBreadcrumbItems = [
    { label: 'Home', href: '/', isActive: false },
    { label: 'Updates', href: '/updates', isActive: true },
  ]

  type UpdatePost = {
    slug: string
    data: {
      date: string
      title: string
      category: string
      image?: string | null
    }
    excerpt: string
  }

  const posts = (updates.data?.posts ?? []) as UpdatePost[]

  const timelineEntries: ChangelogEntry[] = posts.map((item) => ({
    id: item.slug,
    date: item.data.date,
    title: item.data.title,
    description: item.excerpt,
    tag: item.data.category,
    image: item.data.image ?? '',
  }))

  return (
    <div className="space-y-0 divide-y pt-16">
      <div className="space-y-16">
        <header className={`border-b -mb-32 bg-background`}>
          <div className="container mx-auto max-w-screen-lg text-left py-8 h-64">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="mb-8">
              <BreadcrumbList>
                {defaultBreadcrumbItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={item.href}
                        className={
                          item.isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {item.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < defaultBreadcrumbItems.length - 1 && (
                      <BreadcrumbSeparator />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            {/* Main Header Content */}
            <div className="space-y-6">
              {/* Title */}
              <h1 className="text-lg font-bold leading-tight">Updates</h1>

              {/* Custom suffix content */}
              <div className="mt-4">Latest updates and changelog</div>
            </div>
          </div>
        </header>

        {/* Timeline Section */}
        <section className="py-16">
          <div className="container mx-auto max-w-screen-lg">
            <ChangelogTimeline entries={timelineEntries} />
          </div>
        </section>

        <SiteCTA className="py-16" />
      </div>
    </div>
  )
}
