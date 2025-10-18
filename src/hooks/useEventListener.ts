/**
 * useEventListener Hook
 *
 * A custom React hook for managing event listeners with automatic cleanup.
 * This hook ensures that event listeners are properly removed when the component unmounts
 * or when dependencies change, preventing memory leaks.
 *
 * @module hooks/useEventListener
 * @author Desktop Management System Team
 * @version 1.0.0
 */

import { useEffect, useRef } from 'react'

/**
 * Type for event listener callback
 */
type EventListenerCallback<T extends Event = Event> = (event: T) => void

/**
 * Options for addEventListener
 */
interface EventListenerOptions {
  capture?: boolean
  once?: boolean
  passive?: boolean
}

/**
 * Hook to add an event listener to a target element with automatic cleanup
 *
 * @param eventName - The name of the event to listen for
 * @param handler - The callback function to handle the event
 * @param element - The target element (default: window)
 * @param options - Options for addEventListener
 *
 * @example
 * ```typescript
 * // Listen to window resize
 * useEventListener('resize', () => {
 *   console.log('Window resized')
 * })
 *
 * // Listen to custom event
 * useEventListener('custom-event', (event) => {
 *   console.log('Custom event fired:', event.detail)
 * })
 *
 * // Listen to element event
 * const ref = useRef<HTMLDivElement>(null)
 * useEventListener('click', handleClick, ref.current)
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: null | Window | Document | HTMLElement,
  options?: EventListenerOptions,
): void

export function useEventListener<T extends Event = Event>(
  eventName: string,
  handler: EventListenerCallback<T>,
  element?: null | Window | Document | HTMLElement,
  options?: EventListenerOptions,
): void

export function useEventListener<T extends Event = Event>(
  eventName: string,
  handler: EventListenerCallback<T>,
  element: null | Window | Document | HTMLElement = typeof window !== 'undefined' ? window : null,
  options?: EventListenerOptions,
): void {
  // Create a ref that stores handler
  const savedHandler = useRef<EventListenerCallback<T>>()

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    // Make sure element supports addEventListener
    const targetElement = element

    if (!targetElement?.addEventListener) {
      return
    }

    // Create event listener that calls handler function stored in ref
    const eventListener: EventListenerCallback<T> = (event) => {
      savedHandler.current?.(event)
    }

    // Add event listener
    targetElement.addEventListener(eventName, eventListener as EventListener, options)

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener as EventListener, options)
    }
  }, [eventName, element, options])
}

/**
 * Hook to add multiple event listeners with the same handler
 *
 * @param eventNames - Array of event names to listen for
 * @param handler - The callback function to handle the events
 * @param element - The target element (default: window)
 * @param options - Options for addEventListener
 *
 * @example
 * ```typescript
 * // Listen to multiple events
 * useMultipleEventListeners(
 *   ['EXPENSES_UPDATED', 'SYSTEM_PURCHASE_UPDATED'],
 *   () => {
 *     void loadExpenses()
 *   }
 * )
 * ```
 */
export function useMultipleEventListeners<T extends Event = Event>(
  eventNames: string[],
  handler: EventListenerCallback<T>,
  element: null | Window | Document | HTMLElement = typeof window !== 'undefined' ? window : null,
  options?: EventListenerOptions,
): void {
  // Create a ref that stores handler
  const savedHandler = useRef<EventListenerCallback<T>>()

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    // Make sure element supports addEventListener
    const targetElement = element

    if (!targetElement?.addEventListener) {
      return
    }

    // Create event listener that calls handler function stored in ref
    const eventListener: EventListenerCallback<T> = (event) => {
      savedHandler.current?.(event)
    }

    // Add event listeners for all event names
    eventNames.forEach((eventName) => {
      targetElement.addEventListener(eventName, eventListener as EventListener, options)
    })

    // Remove event listeners on cleanup
    return () => {
      eventNames.forEach((eventName) => {
        targetElement.removeEventListener(eventName, eventListener as EventListener, options)
      })
    }
  }, [eventNames, element, options])
}

/**
 * Hook to add a custom event listener (for CustomEvent)
 *
 * @param eventName - The name of the custom event
 * @param handler - The callback function to handle the event
 * @param element - The target element (default: window)
 * @param options - Options for addEventListener
 *
 * @example
 * ```typescript
 * interface MyEventDetail {
 *   message: string
 *   data: number
 * }
 *
 * useCustomEventListener<MyEventDetail>('my-event', (event) => {
 *   console.log(event.detail.message)
 * })
 * ```
 */
export function useCustomEventListener<T = unknown>(
  eventName: string,
  handler: (event: CustomEvent<T>) => void,
  element: null | Window | Document | HTMLElement = typeof window !== 'undefined' ? window : null,
  options?: EventListenerOptions,
): void {
  useEventListener(eventName, handler as EventListenerCallback, element, options)
}

/**
 * Hook to dispatch a custom event
 *
 * @returns A function to dispatch custom events
 *
 * @example
 * ```typescript
 * const dispatchEvent = useEventDispatcher()
 *
 * // Dispatch a custom event
 * dispatchEvent('my-event', { message: 'Hello', data: 42 })
 * ```
 */
export function useEventDispatcher() {
  return <T = unknown>(
    eventName: string,
    detail?: T,
    element: Window | Document | HTMLElement = typeof window !== 'undefined' ? window : document,
  ): boolean => {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
      composed: true,
    })
    return element.dispatchEvent(event)
  }
}

/**
 * Hook to listen to window events with automatic cleanup
 *
 * @param eventName - The name of the window event
 * @param handler - The callback function to handle the event
 * @param options - Options for addEventListener
 *
 * @example
 * ```typescript
 * useWindowEvent('resize', () => {
 *   console.log('Window resized')
 * })
 *
 * useWindowEvent('beforeunload', (event) => {
 *   event.preventDefault()
 *   event.returnValue = ''
 * })
 * ```
 */
export function useWindowEvent<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: EventListenerOptions,
): void {
  useEventListener(eventName, handler, typeof window !== 'undefined' ? window : null, options)
}

/**
 * Hook to listen to document events with automatic cleanup
 *
 * @param eventName - The name of the document event
 * @param handler - The callback function to handle the event
 * @param options - Options for addEventListener
 *
 * @example
 * ```typescript
 * useDocumentEvent('click', (event) => {
 *   console.log('Document clicked')
 * })
 *
 * useDocumentEvent('keydown', (event) => {
 *   if (event.key === 'Escape') {
 *     closeModal()
 *   }
 * })
 * ```
 */
export function useDocumentEvent<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: EventListenerOptions,
): void {
  useEventListener(
    eventName,
    handler as EventListenerCallback,
    typeof document !== 'undefined' ? document : null,
    options,
  )
}
