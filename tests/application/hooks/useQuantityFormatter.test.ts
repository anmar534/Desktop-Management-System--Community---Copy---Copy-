import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuantityFormatter } from '../../../src/application/hooks/useQuantityFormatter'

describe('useQuantityFormatter', () => {
  describe('formatNumber', () => {
    it('should format basic numbers with defaults', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(1234.56)).toBe('1,234.56')
      expect(result.current.formatNumber(1000000)).toBe('1,000,000.00')
      expect(result.current.formatNumber(0)).toBe('0.00')
    })

    it('should handle null and undefined', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(null)).toBe('-')
      expect(result.current.formatNumber(undefined)).toBe('-')
    })

    it('should respect custom decimals', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(1234.5678, { decimals: 0 })).toBe('1,235')
      expect(result.current.formatNumber(1234.5678, { decimals: 3 })).toBe('1,234.568')
      expect(result.current.formatNumber(1234.5678, { decimals: 4 })).toBe('1,234.5678')
    })

    it('should respect custom separators', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(
        result.current.formatNumber(1234.56, {
          thousandsSeparator: ' ',
          decimalSeparator: ',',
        }),
      ).toBe('1 234,56')
    })

    it('should respect showZero option', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(0, { showZero: false })).toBe('-')
      expect(result.current.formatNumber(0, { showZero: true })).toBe('0.00')
    })

    it('should respect custom emptyPlaceholder', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(null, { emptyPlaceholder: 'N/A' })).toBe('N/A')
      expect(result.current.formatNumber(undefined, { emptyPlaceholder: '—' })).toBe('—')
    })

    it('should handle negative numbers', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(-1234.56)).toBe('-1,234.56')
      expect(result.current.formatNumber(-1000000)).toBe('-1,000,000.00')
    })

    it('should handle very large numbers', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(1234567890.12)).toBe('1,234,567,890.12')
    })

    it('should handle very small numbers', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatNumber(0.001)).toBe('0.00')
      expect(result.current.formatNumber(0.001, { decimals: 3 })).toBe('0.001')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with SAR symbol', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatCurrency(1234.56)).toBe('ر.س 1,234.56')
      expect(result.current.formatCurrency(1000000)).toBe('ر.س 1,000,000.00')
    })

    it('should handle null and undefined', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatCurrency(null)).toBe('-')
      expect(result.current.formatCurrency(undefined)).toBe('-')
    })

    it('should respect custom options', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatCurrency(1234.5678, { decimals: 3 })).toBe('ر.س 1,234.568')
    })

    it('should handle zero', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatCurrency(0)).toBe('ر.س 0.00')
      expect(result.current.formatCurrency(0, { showZero: false })).toBe('-')
    })

    it('should handle negative amounts', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatCurrency(-1234.56)).toBe('ر.س -1,234.56')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with % symbol', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatPercentage(15.5)).toBe('15.50%')
      expect(result.current.formatPercentage(100)).toBe('100.00%')
    })

    it('should handle null and undefined', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatPercentage(null)).toBe('-')
      expect(result.current.formatPercentage(undefined)).toBe('-')
    })

    it('should respect custom decimals', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatPercentage(15.567, { decimals: 1 })).toBe('15.6%')
      expect(result.current.formatPercentage(15.567, { decimals: 3 })).toBe('15.567%')
    })

    it('should handle zero', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatPercentage(0)).toBe('0.00%')
      expect(result.current.formatPercentage(0, { showZero: false })).toBe('-')
    })

    it('should handle negative percentages', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatPercentage(-5.5)).toBe('-5.50%')
    })
  })

  describe('formatQuantity', () => {
    it('should format quantity same as formatNumber', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatQuantity(1234.56)).toBe('1,234.56')
      expect(result.current.formatQuantity(1000)).toBe('1,000.00')
    })

    it('should handle null and undefined', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatQuantity(null)).toBe('-')
      expect(result.current.formatQuantity(undefined)).toBe('-')
    })

    it('should respect custom options', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.formatQuantity(1234, { decimals: 0 })).toBe('1,234')
    })
  })

  describe('parseNumber', () => {
    it('should parse formatted numbers', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('1,234.56')).toBe(1234.56)
      expect(result.current.parseNumber('1,000,000.00')).toBe(1000000)
    })

    it('should parse currency strings', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('ر.س 1,234.56')).toBe(1234.56)
      expect(result.current.parseNumber('ر.س 1,000,000.00')).toBe(1000000)
    })

    it('should parse percentage strings', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('15.50%')).toBe(15.5)
      expect(result.current.parseNumber('100.00%')).toBe(100)
    })

    it('should handle empty and placeholder strings', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('')).toBeNull()
      expect(result.current.parseNumber('-')).toBeNull()
    })

    it('should handle negative numbers', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('-1,234.56')).toBe(-1234.56)
      expect(result.current.parseNumber('ر.س -1,234.56')).toBe(-1234.56)
    })

    it('should handle plain numbers', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('1234.56')).toBe(1234.56)
      expect(result.current.parseNumber('0')).toBe(0)
    })

    it('should return null for invalid strings', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      expect(result.current.parseNumber('invalid')).toBeNull()
      expect(result.current.parseNumber('abc123')).toBeNull()
    })
  })

  describe('memoization', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useQuantityFormatter())

      const firstRender = result.current
      rerender()
      const secondRender = result.current

      expect(firstRender.formatNumber).toBe(secondRender.formatNumber)
      expect(firstRender.formatCurrency).toBe(secondRender.formatCurrency)
      expect(firstRender.formatPercentage).toBe(secondRender.formatPercentage)
      expect(firstRender.formatQuantity).toBe(secondRender.formatQuantity)
      expect(firstRender.parseNumber).toBe(secondRender.parseNumber)
    })
  })

  describe('integration scenarios', () => {
    it('should format and parse round-trip correctly', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      const original = 1234.56
      const formatted = result.current.formatNumber(original)
      const parsed = result.current.parseNumber(formatted)

      expect(parsed).toBe(original)
    })

    it('should format and parse currency round-trip', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      const original = 1000000.5
      const formatted = result.current.formatCurrency(original)
      const parsed = result.current.parseNumber(formatted)

      expect(parsed).toBe(original)
    })

    it('should format and parse percentage round-trip', () => {
      const { result } = renderHook(() => useQuantityFormatter())

      const original = 15.5
      const formatted = result.current.formatPercentage(original)
      const parsed = result.current.parseNumber(formatted)

      expect(parsed).toBe(original)
    })
  })
})
