/**
 * Number Helpers - Shared Utility Functions for Number Operations
 *
 * This module provides centralized, reusable functions for number validation,
 * conversion, and formatting to avoid code duplication across the codebase.
 *
 * @module utils/numberHelpers
 * @author Desktop Management System Team
 * @version 1.0.0
 */

/**
 * Converts a value to a finite number or returns undefined
 *
 * @param value - The value to convert (number, string, or other)
 * @returns The finite number or undefined if conversion fails
 *
 * @example
 * ```typescript
 * toFiniteNumber(42) // 42
 * toFiniteNumber("123.45") // 123.45
 * toFiniteNumber(Infinity) // undefined
 * toFiniteNumber("abc") // undefined
 * toFiniteNumber(null) // undefined
 * ```
 */
export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return undefined
    }

    const parsed = Number.parseFloat(trimmed)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

/**
 * Converts a value to a positive number or returns a fallback
 *
 * @param value - The value to convert
 * @param fallback - The fallback value to return if conversion fails or result is not positive
 * @returns The positive number or fallback value
 *
 * @example
 * ```typescript
 * toPositiveNumber(42, 0) // 42
 * toPositiveNumber(-10, 0) // 0
 * toPositiveNumber("50", 1) // 50
 * toPositiveNumber("abc", 10) // 10
 * ```
 */
export function toPositiveNumber(value: unknown, fallback: number): number {
  const numeric = toFiniteNumber(value)
  if (numeric === undefined || numeric <= 0) {
    return fallback
  }
  return numeric
}

/**
 * Converts a value to a non-negative number (>= 0) or returns a fallback
 *
 * @param value - The value to convert
 * @param fallback - The fallback value to return if conversion fails or result is negative
 * @returns The non-negative number or fallback value
 *
 * @example
 * ```typescript
 * toNonNegativeNumber(0, 1) // 0
 * toNonNegativeNumber(42, 1) // 42
 * toNonNegativeNumber(-10, 0) // 0
 * ```
 */
export function toNonNegativeNumber(value: unknown, fallback: number): number {
  const numeric = toFiniteNumber(value)
  if (numeric === undefined || numeric < 0) {
    return fallback
  }
  return numeric
}

/**
 * Coerces a value to a finite number with a fallback
 *
 * @param value - The value to coerce
 * @param fallback - The fallback value (default: 0)
 * @returns The finite number or fallback value
 *
 * @example
 * ```typescript
 * coerceNumber(42) // 42
 * coerceNumber("123") // 123
 * coerceNumber(null) // 0
 * coerceNumber(undefined, 10) // 10
 * ```
 */
export function coerceNumber(value: unknown, fallback = 0): number {
  const numeric = toFiniteNumber(value)
  return numeric !== undefined ? numeric : fallback
}

/**
 * Ensures a number is finite, throwing an error if not
 *
 * @param value - The value to check
 * @param fieldName - The name of the field for error messages
 * @returns The finite number
 * @throws Error if the value is not a finite number
 *
 * @example
 * ```typescript
 * ensureFiniteNumber(42, 'price') // 42
 * ensureFiniteNumber(Infinity, 'price') // throws Error
 * ```
 */
export function ensureFiniteNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number`)
  }
  return value
}

/**
 * Clamps a number between a minimum and maximum value
 *
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value
 *
 * @example
 * ```typescript
 * clamp(50, 0, 100) // 50
 * clamp(-10, 0, 100) // 0
 * clamp(150, 0, 100) // 100
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Rounds a number to a specified number of decimal places
 *
 * @param value - The value to round
 * @param decimals - The number of decimal places (default: 2)
 * @returns The rounded value
 *
 * @example
 * ```typescript
 * roundToDecimals(3.14159, 2) // 3.14
 * roundToDecimals(3.14159, 4) // 3.1416
 * roundToDecimals(42.5) // 42.5
 * ```
 */
export function roundToDecimals(value: number, decimals = 2): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Checks if a value is a valid number (finite and not NaN)
 *
 * @param value - The value to check
 * @returns True if the value is a valid number
 *
 * @example
 * ```typescript
 * isValidNumber(42) // true
 * isValidNumber(Infinity) // false
 * isValidNumber(NaN) // false
 * isValidNumber("123") // false
 * ```
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Safely divides two numbers, returning a fallback if division is invalid
 *
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fallback - The fallback value if division is invalid (default: 0)
 * @returns The division result or fallback
 *
 * @example
 * ```typescript
 * safeDivide(10, 2) // 5
 * safeDivide(10, 0) // 0
 * safeDivide(10, 0, -1) // -1
 * ```
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return fallback
  }
  const result = numerator / denominator
  return Number.isFinite(result) ? result : fallback
}

/**
 * Calculates percentage with safe division
 *
 * @param part - The part value
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns The percentage value
 *
 * @example
 * ```typescript
 * calculatePercentage(25, 100) // 25
 * calculatePercentage(1, 3, 2) // 33.33
 * calculatePercentage(10, 0) // 0
 * ```
 */
export function calculatePercentage(part: number, total: number, decimals = 2): number {
  const percentage = safeDivide(part * 100, total, 0)
  return roundToDecimals(percentage, decimals)
}

/**
 * Formats a number with thousand separators
 *
 * @param value - The value to format
 * @param locale - The locale to use (default: 'ar-SA')
 * @returns The formatted string
 *
 * @example
 * ```typescript
 * formatWithSeparators(1000000) // "1,000,000" (in ar-SA)
 * formatWithSeparators(1234.56) // "1,234.56"
 * ```
 */
export function formatWithSeparators(value: number, locale = 'ar-SA'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/**
 * Parses a string with Arabic-Indic digits to a number
 *
 * @param value - The string to parse
 * @returns The parsed number or undefined
 *
 * @example
 * ```typescript
 * parseArabicNumber("١٢٣") // 123
 * parseArabicNumber("123") // 123
 * parseArabicNumber("abc") // undefined
 * ```
 */
export function parseArabicNumber(value: string): number | undefined {
  // Convert Arabic-Indic digits (٠-٩) to Western digits (0-9)
  const normalized = value.replace(/[\u0660-\u0669]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x0660),
  )

  return toFiniteNumber(normalized)
}

/**
 * Checks if two numbers are approximately equal within a tolerance
 *
 * @param a - First number
 * @param b - Second number
 * @param tolerance - The tolerance (default: 0.0001)
 * @returns True if numbers are approximately equal
 *
 * @example
 * ```typescript
 * approximatelyEqual(0.1 + 0.2, 0.3) // true
 * approximatelyEqual(1.0001, 1.0002, 0.001) // true
 * approximatelyEqual(1, 2) // false
 * ```
 */
export function approximatelyEqual(a: number, b: number, tolerance = 0.0001): number {
  return Math.abs(a - b) < tolerance
}
