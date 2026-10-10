'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Reduced motion context
interface ReducedMotionContextType {
  prefersReducedMotion: boolean
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false
})

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  )
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext)
}

// Announcer context for screen readers
interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AnnouncerContext = createContext<AnnouncerContextType>({
  announce: () => {}
})

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [liveRegion, setLiveRegion] = useState<{ message: string; priority: 'polite' | 'assertive' } | null>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setLiveRegion({ message, priority })
    // Clear after announcement
    setTimeout(() => setLiveRegion(null), 1000)
  }

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {liveRegion && (
        <div
          role={liveRegion.priority === 'assertive' ? 'alert' : 'status'}
          aria-live={liveRegion.priority}
          aria-atomic="true"
          className="sr-only"
        >
          {liveRegion.message}
        </div>
      )}
    </AnnouncerContext.Provider>
  )
}

export function useAnnouncer() {
  return useContext(AnnouncerContext)
}

// Combined provider
export function GameProviders({ children }: { children: ReactNode }) {
  return (
    <ReducedMotionProvider>
      <AnnouncerProvider>
        {children}
      </AnnouncerProvider>
    </ReducedMotionProvider>
  )
}
