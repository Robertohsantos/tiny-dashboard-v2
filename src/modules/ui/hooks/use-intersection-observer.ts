"use client"

/**
 * Intersection Observer Hook
 * Provides lazy loading capabilities for components
 */

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Trigger only once when element becomes visible */
  triggerOnce?: boolean
  /** Delay before triggering (ms) */
  delay?: number
  /** Whether the observer is enabled */
  enabled?: boolean
}

/**
 * Custom hook for using Intersection Observer API
 * Perfect for lazy loading, infinite scroll, and animations
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {},
): [RefObject<T | null>, boolean, IntersectionObserverEntry | null] {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
    delay = 0,
    enabled = true,
  } = options

  const elementRef = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!enabled || !elementRef.current) return
    if (triggerOnce && hasTriggered) return

    const element = elementRef.current
    let timeoutId: NodeJS.Timeout | null = null

    const observerCallback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries
      setEntry(entry)

      const handleIntersection = () => {
        const isCurrentlyIntersecting = entry.isIntersecting

        if (isCurrentlyIntersecting && triggerOnce && !hasTriggered) {
          setHasTriggered(true)
        }

        setIsIntersecting(isCurrentlyIntersecting)
      }

      if (delay > 0) {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(handleIntersection, delay)
      } else {
        handleIntersection()
      }
    }

    const observer = new IntersectionObserver(observerCallback, {
      threshold,
      root,
      rootMargin,
    })

    observer.observe(element)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [enabled, threshold, root, rootMargin, triggerOnce, delay, hasTriggered])

  return [elementRef, isIntersecting, entry]
}

/**
 * Hook for lazy loading images
 * Automatically loads images when they come into viewport
 */
export function useLazyImage(
  src: string,
  options: UseIntersectionObserverOptions = {},
) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [ref, isIntersecting] = useIntersectionObserver<HTMLImageElement>({
    ...options,
    triggerOnce: true,
  })

  useEffect(() => {
    if (!isIntersecting || imageSrc) return

    setIsLoading(true)
    setError(null)

    // Preload image
    const img = new Image()
    img.src = src

    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
    }

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`))
      setIsLoading(false)
    }
  }, [isIntersecting, src, imageSrc])

  return {
    ref,
    src: imageSrc,
    isLoading,
    error,
    isIntersecting,
  }
}

/**
 * Hook for infinite scroll functionality
 */
export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options: UseIntersectionObserverOptions = {},
) {
  const [isLoading, setIsLoading] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    ...options,
    rootMargin: options.rootMargin || '100px',
  })

  useEffect(() => {
    if (!isIntersecting || isLoading) return

    const handleCallback = async () => {
      setIsLoading(true)
      try {
        await callback()
      } finally {
        setIsLoading(false)
      }
    }

    handleCallback()
  }, [isIntersecting, isLoading, callback])

  return {
    ref,
    isLoading,
    isIntersecting,
  }
}

/**
 * Hook for animating elements when they come into view
 */
export function useScrollAnimation(
  animationClass: string,
  options: UseIntersectionObserverOptions = {},
) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    ...options,
    triggerOnce: true,
    threshold: options.threshold || 0.1,
  })

  useEffect(() => {
    if (isIntersecting) {
      setShouldAnimate(true)
    }
  }, [isIntersecting])

  return {
    ref,
    className: shouldAnimate ? animationClass : '',
    isAnimating: shouldAnimate,
  }
}

/**
 * Hook for tracking element visibility for analytics
 */
export function useVisibilityTracking(
  trackingCallback: (visible: boolean, duration?: number) => void,
  options: UseIntersectionObserverOptions = {},
) {
  const [ref, isIntersecting, entry] =
    useIntersectionObserver<HTMLDivElement>(options)
  const visibilityStartTime = useRef<number | null>(null)

  useEffect(() => {
    if (isIntersecting && !visibilityStartTime.current) {
      // Element became visible
      visibilityStartTime.current = Date.now()
      trackingCallback(true)
    } else if (!isIntersecting && visibilityStartTime.current) {
      // Element became hidden
      const duration = Date.now() - visibilityStartTime.current
      trackingCallback(false, duration)
      visibilityStartTime.current = null
    }
  }, [isIntersecting, trackingCallback])

  useEffect(() => {
    // Cleanup: track when component unmounts
    return () => {
      if (visibilityStartTime.current) {
        const duration = Date.now() - visibilityStartTime.current
        trackingCallback(false, duration)
      }
    }
  }, [trackingCallback])

  return {
    ref,
    isVisible: isIntersecting,
    entry,
  }
}

/**
 * Hook for progressive loading of components
 */
export function useProgressiveLoad<T extends HTMLElement = HTMLDivElement>(
  priority: 'high' | 'medium' | 'low' = 'medium',
) {
  const rootMargin = {
    high: '200px',
    medium: '100px',
    low: '50px',
  }[priority]

  const [ref, shouldLoad] = useIntersectionObserver<T>({
    triggerOnce: true,
    rootMargin,
    threshold: 0,
  })

  return {
    ref,
    shouldLoad,
  }
}
