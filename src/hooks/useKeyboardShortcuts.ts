/**
 * useKeyboardShortcuts Hook - خطاف اختصارات لوحة المفاتيح
 * Sprint 5.4.4: اختصارات لوحة المفاتيح
 */

import { useEffect, useCallback, useRef } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcut {
  /** Unique identifier / معرف فريد */
  id: string
  
  /** Keys combination / مجموعة المفاتيح */
  keys: string[]
  
  /** Description / الوصف */
  description: string
  
  /** Arabic description / الوصف بالعربية */
  descriptionAr?: string
  
  /** Category / الفئة */
  category?: string
  
  /** Callback function / دالة الاستدعاء */
  callback: (event: KeyboardEvent) => void
  
  /** Enabled state / حالة التفعيل */
  enabled?: boolean
  
  /** Prevent default behavior / منع السلوك الافتراضي */
  preventDefault?: boolean
  
  /** Allow in input fields / السماح في حقول الإدخال */
  allowInInput?: boolean
}

export interface UseKeyboardShortcutsOptions {
  /** Enable/disable all shortcuts / تفعيل/تعطيل جميع الاختصارات */
  enabled?: boolean
  
  /** Ignore shortcuts when typing / تجاهل الاختصارات عند الكتابة */
  ignoreInInput?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize key name
 * تطبيع اسم المفتاح
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'ctrl': 'Control',
    'cmd': 'Meta',
    'meta': 'Meta',
    'alt': 'Alt',
    'option': 'Alt',
    'shift': 'Shift',
    'enter': 'Enter',
    'return': 'Enter',
    'esc': 'Escape',
    'escape': 'Escape',
    'space': ' ',
    'up': 'ArrowUp',
    'down': 'ArrowDown',
    'left': 'ArrowLeft',
    'right': 'ArrowRight',
    'del': 'Delete',
    'delete': 'Delete',
    'backspace': 'Backspace',
    'tab': 'Tab',
  }

  const normalized = keyMap[key.toLowerCase()] || key
  return normalized.length === 1 ? normalized.toUpperCase() : normalized
}

/**
 * Check if keyboard event matches shortcut
 * التحقق من تطابق حدث لوحة المفاتيح مع الاختصار
 */
function matchesShortcut(event: KeyboardEvent, keys: string[]): boolean {
  const normalizedKeys = keys.map(normalizeKey)
  
  const modifiers = {
    Control: event.ctrlKey || event.metaKey,
    Meta: event.metaKey,
    Alt: event.altKey,
    Shift: event.shiftKey,
  }

  // Check if all required modifiers are pressed
  const requiredModifiers = normalizedKeys.filter(key => 
    key === 'Control' || key === 'Meta' || key === 'Alt' || key === 'Shift'
  )
  
  for (const modifier of requiredModifiers) {
    if (!modifiers[modifier as keyof typeof modifiers]) {
      return false
    }
  }

  // Check if the main key matches
  const mainKey = normalizedKeys.find(key => 
    key !== 'Control' && key !== 'Meta' && key !== 'Alt' && key !== 'Shift'
  )

  if (mainKey) {
    const eventKey = event.key.length === 1 ? event.key.toUpperCase() : event.key
    if (eventKey !== mainKey) {
      return false
    }
  }

  // Check if any extra modifiers are pressed
  const hasExtraModifiers = 
    (event.ctrlKey && !requiredModifiers.includes('Control') && !requiredModifiers.includes('Meta')) ||
    (event.altKey && !requiredModifiers.includes('Alt')) ||
    (event.shiftKey && !requiredModifiers.includes('Shift'))

  return !hasExtraModifiers
}

/**
 * Check if element is an input field
 * التحقق من أن العنصر حقل إدخال
 */
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false
  }

  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  )
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing keyboard shortcuts
 * خطاف لإدارة اختصارات لوحة المفاتيح
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const {
    enabled = true,
    ignoreInInput = true,
  } = options

  const shortcutsRef = useRef(shortcuts)

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we should ignore this event
      if (ignoreInInput && isInputElement(event.target)) {
        // Check if any shortcut allows input
        const allowedShortcut = shortcutsRef.current.find(
          shortcut => shortcut.allowInInput && matchesShortcut(event, shortcut.keys)
        )
        if (!allowedShortcut) {
          return
        }
      }

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue

        if (matchesShortcut(event, shortcut.keys)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          
          shortcut.callback(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, ignoreInInput])
}

// ============================================================================
// Shortcut Builder
// ============================================================================

/**
 * Create a keyboard shortcut
 * إنشاء اختصار لوحة مفاتيح
 */
export function createShortcut(
  id: string,
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options: Partial<Omit<KeyboardShortcut, 'id' | 'keys' | 'callback'>> = {}
): KeyboardShortcut {
  return {
    id,
    keys,
    callback,
    description: options.description || '',
    descriptionAr: options.descriptionAr,
    category: options.category,
    enabled: options.enabled !== false,
    preventDefault: options.preventDefault !== false,
    allowInInput: options.allowInInput || false,
  }
}

// ============================================================================
// Format Shortcut for Display
// ============================================================================

/**
 * Format shortcut keys for display
 * تنسيق مفاتيح الاختصار للعرض
 */
export function formatShortcut(keys: string[]): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')

  return keys
    .map(key => {
      const normalized = normalizeKey(key)
      
      if (isMac) {
        if (normalized === 'Control' || normalized === 'Meta') return '⌘'
        if (normalized === 'Alt') return '⌥'
        if (normalized === 'Shift') return '⇧'
      } else {
        if (normalized === 'Control') return 'Ctrl'
        if (normalized === 'Meta') return 'Win'
        if (normalized === 'Alt') return 'Alt'
        if (normalized === 'Shift') return 'Shift'
      }
      
      return normalized
    })
    .join(isMac ? '' : '+')
}

export default useKeyboardShortcuts

