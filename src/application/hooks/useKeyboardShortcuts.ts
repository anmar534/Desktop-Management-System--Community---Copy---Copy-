/**
 * Keyboard Shortcuts Hook
 */

import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  callback: () => void
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        if (
          event.key === shortcut.key &&
          event.ctrlKey === (shortcut.ctrlKey || false) &&
          event.shiftKey === (shortcut.shiftKey || false) &&
          event.altKey === (shortcut.altKey || false)
        ) {
          event.preventDefault()
          shortcut.callback()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = []
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.altKey) parts.push('Alt')
  parts.push(shortcut.key.toUpperCase())
  return parts.join('+')
}

