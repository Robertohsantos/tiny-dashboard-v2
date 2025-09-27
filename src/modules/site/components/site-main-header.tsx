'use client'

import { Link } from 'next-view-transitions'
import { Button } from '@/components/ui/button'
import { ArrowUpRightIcon, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'

const NAV_LINKS = [
  {
    href: '/pricing',
    label: 'Pricing',
  },
  {
    href: '/help',
    label: 'Help',
  },
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/updates',
    label: 'Updates',
  },
]

export function SiteMainHeader() {
  const [isOpen, setOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="w-full z-40 bg-background/60 backdrop-blur-xl">
      <div className="container relative mx-auto max-w-screen-lg min-h-12 flex gap-4 flex-row items-center justify-between px-4 sm:px-0">
        <Link
          href="/"
          className={`flex items-center gap-4 hover:opacity-60${pathname === '/' ? ' font-semibold text-primary' : ''}`}
        >
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {NAV_LINKS.map(({ href, label }) => (
            <Button
              key={href}
              variant={isActive(href) ? 'secondary' : 'ghost'}
              size="sm"
              className={`rounded-full font-semibold ${isActive(href) ? ' text-primary' : ''}`}
              asChild
            >
              <Link href={href} className="flex items-center gap-2">
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Desktop Sign In Button */}
        <div className="hidden lg:flex items-center gap-4">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/auth">
              Sign In
              <ArrowUpRightIcon className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex w-12 shrink-0 lg:hidden items-end justify-end mr-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/auth">
              Sign In
              <ArrowUpRightIcon className="w-4 h-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="p-2"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto max-w-screen-lg py-4">
            <div className="flex flex-col space-y-2">
              {NAV_LINKS.map(({ href, label }) => (
                <Button
                  key={href}
                  variant={isActive(href) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`justify-start font-semibold ${isActive(href) ? 'text-primary' : ''}`}
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href={href} className="flex items-center gap-2">
                    {label}
                  </Link>
                </Button>
              ))}
              <div className="pt-2 border-t mt-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-center"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/auth" className="flex items-center gap-2">
                    Sign In
                    <ArrowUpRightIcon className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
