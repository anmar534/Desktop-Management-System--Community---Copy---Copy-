/**
 * useCommandPalette Hook - خطاف لوحة الأوامر
 * Sprint 5.4.3: إضافة Command Palette
 */

import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface UseCommandPaletteOptions {
  /** Keyboard shortcut to open / اختصار لوحة المفاتيح للفتح */
  shortcut?: string[]

  /** Enable/disable the hook / تفعيل/تعطيل الخطاف */
  enabled?: boolean
}

export interface UseCommandPaletteReturn {
  /** Is command palette open / هل لوحة الأوامر مفتوحة */
  isOpen: boolean

  /** Open command palette / فتح لوحة الأوامر */
  open: () => void

  /** Close command palette / إغلاق لوحة الأوامر */
  close: () => void

  /** Toggle command palette / تبديل لوحة الأوامر */
  toggle: () => void
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if keyboard event matches shortcut
 * التحقق من تطابق حدث لوحة المفاتيح مع الاختصار
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string[]): boolean {
  const modifiers = {
    ctrl: event.ctrlKey || event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  }

  return shortcut.every((key) => {
    const lowerKey = key.toLowerCase()

    if (lowerKey === 'ctrl' || lowerKey === 'cmd' || lowerKey === 'meta') {
      return modifiers.ctrl
    }

    if (lowerKey === 'alt' || lowerKey === 'option') {
      return modifiers.alt
    }

    if (lowerKey === 'shift') {
      return modifiers.shift
    }

    return event.key.toLowerCase() === lowerKey
  })
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing command palette state and keyboard shortcuts
 * خطاف لإدارة حالة لوحة الأوامر واختصارات لوحة المفاتيح
 */
export function useCommandPalette(options: UseCommandPaletteOptions = {}): UseCommandPaletteReturn {
  const {
    shortcut = ['Ctrl', 'K'], // Default: Ctrl+K or Cmd+K
    enabled = true,
  } = options

  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // Handle keyboard shortcut
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+K even in input fields
        if (!matchesShortcut(event, shortcut)) {
          return
        }
      }

      if (matchesShortcut(event, shortcut)) {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, shortcut, toggle])

  // Prevent body scroll when command palette is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}

export default useCommandPalette
