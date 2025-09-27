"use client"

/**
 * LazyLoad Component
 * Wrapper component for lazy loading children components
 */

import { ReactNode, useEffect, useState } from 'react'
import { useIntersectionObserver } from '@/modules/ui/hooks/use-intersection-observer'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/modules/ui'

interface LazyLoadProps {
  /** Children to render when in viewport */
  children: ReactNode
  /** Custom loading component */
  fallback?: ReactNode
  /** Height of the placeholder */
  height?: string | number
  /** Additional className */
  className?: string
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Threshold for intersection observer */
  threshold?: number | number[]
  /** Load component even if not in viewport after delay (ms) */
  forceLoadDelay?: number
  /** Priority of loading */
  priority?: 'high' | 'medium' | 'low'
  /** Animation when component loads */
  animation?: 'fade' | 'slide' | 'scale' | 'none'
  /** Whether to keep the component mounted after first load */
  keepMounted?: boolean
}

/**
 * LazyLoad component for deferred rendering
 */
export function LazyLoad({
  children,
  fallback,
  height = 200,
  className,
  rootMargin,
  threshold = 0,
  forceLoadDelay,
  priority = 'medium',
  animation = 'fade',
  keepMounted = true,
}: LazyLoadProps) {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Adjust root margin based on priority
  const adjustedRootMargin =
    rootMargin ||
    {
      high: '300px',
      medium: '150px',
      low: '50px',
    }[priority]

  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: adjustedRootMargin,
    threshold,
    triggerOnce: true,
  })

  // Handle force load after delay
  useEffect(() => {
    if (!forceLoadDelay || hasLoaded) return

    const timer = setTimeout(() => {
      setHasLoaded(true)
      setShouldRender(true)
    }, forceLoadDelay)

    return () => clearTimeout(timer)
  }, [forceLoadDelay, hasLoaded])

  // Handle intersection
  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true)

      // Add slight delay for smooth animation
      if (animation !== 'none') {
        setTimeout(() => setShouldRender(true), 50)
      } else {
        setShouldRender(true)
      }
    }
  }, [isIntersecting, hasLoaded, animation])

  // Animation classes
  const animationClasses = {
    fade: 'animate-in fade-in duration-500',
    slide: 'animate-in slide-in-from-bottom duration-500',
    scale: 'animate-in zoom-in-95 duration-500',
    none: '',
  }[animation]

  // Render logic
  const renderContent = () => {
    if (!hasLoaded) {
      return (
        fallback || (
          <Skeleton className={cn('w-full', className)} style={{ height }} />
        )
      )
    }

    if (shouldRender || keepMounted) {
      return (
        <div className={cn(shouldRender && animationClasses, className)}>
          {children}
        </div>
      )
    }

    return null
  }

  return (
    <div ref={ref} className={cn('lazy-load-wrapper', className)}>
      {renderContent()}
    </div>
  )
}

/**
 * LazyImage component for lazy loading images
 */
export function LazyImage({
  src,
  alt,
  className,
  fallback,
  onLoad,
  onError,
  priority = 'medium',
  ...props
}: {
  src: string
  alt: string
  className?: string
  fallback?: ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
  priority?: 'high' | 'medium' | 'low'
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const rootMargin = {
    high: '300px',
    medium: '150px',
    low: '50px',
  }[priority]

  const [ref, isIntersecting] = useIntersectionObserver<HTMLImageElement>({
    rootMargin,
    triggerOnce: true,
  })

  useEffect(() => {
    if (!isIntersecting || imageSrc) return

    const img = new Image()
    img.src = src

    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
      onLoad?.()
    }

    img.onerror = () => {
      const error = new Error(`Failed to load image: ${src}`)
      setError(error)
      setIsLoading(false)
      onError?.(error)
    }
  }, [isIntersecting, src, imageSrc, onLoad, onError])

  if (error) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        className={cn(
          'bg-gray-200 flex items-center justify-center',
          className,
        )}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    )
  }

  if (isLoading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Skeleton className={cn('w-full h-full', className)} />
    )
  }

  return (
    <img
      ref={ref}
      src={imageSrc || undefined}
      alt={alt}
      className={cn('animate-in fade-in duration-500', className)}
      {...props}
    />
  )
}

/**
 * LazySection component for lazy loading page sections
 */
export function LazySection({
  children,
  className,
  title,
  priority = 'medium',
  skeleton,
}: {
  children: ReactNode
  className?: string
  title?: string
  priority?: 'high' | 'medium' | 'low'
  skeleton?: ReactNode
}) {
  return (
    <LazyLoad
      priority={priority}
      className={className}
      fallback={
        skeleton || (
          <div className="space-y-4">
            {title && <Skeleton className="h-8 w-48" />}
            <Skeleton className="h-32 w-full" />
          </div>
        )
      }
      animation="fade"
      keepMounted
    >
      <section className={className}>
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        {children}
      </section>
    </LazyLoad>
  )
}

/**
 * LazyCard component for lazy loading cards
 */
export function LazyCard({
  children,
  className,
  priority = 'medium',
  height = 200,
}: {
  children: ReactNode
  className?: string
  priority?: 'high' | 'medium' | 'low'
  height?: string | number
}) {
  return (
    <LazyLoad
      priority={priority}
      className={className}
      height={height}
      fallback={
        <div className={cn('rounded-lg border bg-card', className)}>
          <div className="p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      }
      animation="scale"
      keepMounted
    >
      {children}
    </LazyLoad>
  )
}
