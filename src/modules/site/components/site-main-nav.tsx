'use client'

import Link from 'next/link'

const SITE_MAIN_NAV_LINKS = [
  {
    title: 'Features',
    href: '/features',
    description: 'Discover our powerful features',
  },
  {
    title: 'Pricing',
    href: '/pricing',
    description: 'Choose the right plan for you',
  },
  {
    title: 'Resources',
    href: '/resources',
    description: 'Learn and get inspired',
  },
  {
    title: 'About',
    href: '/about',
    description: 'Learn more about GetFeed',
  },
] as const

const SITE_MAIN_NAV_DROPDOWN_LINKS = [
  {
    title: 'AI Assistant',
    href: '/features/ai-assistant',
    description: 'Your AI-powered social media assistant',
  },
  {
    title: 'Automation',
    href: '/features/automation',
    description: 'Smart scheduling and automation rules',
  },
  {
    title: 'Analytics',
    href: '/features/analytics',
    description: 'Track and optimize your performance',
  },
  {
    title: 'Integrations',
    href: '/features/integrations',
    description: 'Connect with your favorite platforms',
  },
] as const

export function SiteMainNav() {
  return (
    <nav className="flex items-center justify-between p-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold">
          GetFeed
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {SITE_MAIN_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-primary block duration-150"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}
