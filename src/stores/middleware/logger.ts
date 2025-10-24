/**
 * Logger Middleware for Zustand
 *
 * Logs all state changes to console for debugging purposes.
 * Only enabled in development mode.
 */

import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

export interface LoggerOptions {
  /**
   * Enable/disable logging (default: process.env.NODE_ENV === 'development')
   */
  enabled?: boolean

  /**
   * Prefix for log messages
   */
  prefix?: string

  /**
   * Log level: 'log' | 'info' | 'debug'
   */
  level?: 'log' | 'info' | 'debug'

  /**
   * Whether to collapse groups (default: false)
   */
  collapsed?: boolean
}

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, Mps, Mcs>,
  options?: LoggerOptions,
) => StateCreator<T, Mps, Mcs>

/**
 * Creates logger middleware
 */
export const logger: Logger = (initializer, options = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    prefix = 'Zustand',
    level = 'log',
    collapsed = false,
  } = options

  if (!enabled) {
    return initializer
  }

  return (set, get, api) => {
    const loggedSet: typeof set = (...args: Parameters<typeof set>) => {
      const prevState = get()
      set(...args)
      const nextState = get()

      const timestamp = new Date().toLocaleTimeString()
      const groupMethod = collapsed ? console.groupCollapsed : console.group

      groupMethod(`${prefix} @ ${timestamp}`)
      console[level]('%c prev state', 'color: #9E9E9E; font-weight: bold', prevState)
      console[level]('%c action', 'color: #03A9F4; font-weight: bold', args)
      console[level]('%c next state', 'color: #4CAF50; font-weight: bold', nextState)
      console.groupEnd()
    }

    return initializer(loggedSet, get, api)
  }
}

/**
 * Conditional logger - only logs specific actions
 */
export const conditionalLogger = <T>(
  condition: (prevState: T, nextState: T) => boolean,
  options?: LoggerOptions,
) => {
  return logger((set, get, api) => {
    const loggedSet: typeof set = (...args: Parameters<typeof set>) => {
      const prevState = get()
      set(...args)
      const nextState = get()

      if (condition(prevState, nextState)) {
        const timestamp = new Date().toLocaleTimeString()
        const groupMethod = options?.collapsed ? console.groupCollapsed : console.group

        groupMethod(`${options?.prefix || 'Zustand'} @ ${timestamp}`)
        console[options?.level || 'log'](
          '%c prev state',
          'color: #9E9E9E; font-weight: bold',
          prevState,
        )
        console[options?.level || 'log'](
          '%c next state',
          'color: #4CAF50; font-weight: bold',
          nextState,
        )
        console.groupEnd()
      }
    }

    return api as any
  }, options)
}
