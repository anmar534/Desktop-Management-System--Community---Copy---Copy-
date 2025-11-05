import { useEffect } from 'react'

/**
 * Hook to automatically scroll to top when component mounts or dependencies change
 * 
 * @example
 * // Scroll to top on mount
 * useScrollToTop()
 * 
 * @example
 * // Scroll to top when ID changes
 * useScrollToTop([itemId])
 * 
 * @example
 * // Scroll to top when view or tab changes
 * useScrollToTop([currentView, activeTab])
 * 
 * @param deps - Optional dependency array. If provided, scroll triggers when dependencies change.
 *               If not provided, scroll happens once on mount.
 */
export function useScrollToTop(deps?: React.DependencyList) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || [])
}
