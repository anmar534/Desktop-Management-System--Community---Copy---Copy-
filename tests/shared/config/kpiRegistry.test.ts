/**
 * Tests for KPI Registry
 */

import { describe, it, expect } from 'vitest'
import {
  KPI_CATEGORY_METADATA,
  getCategoryMetadata,
  DEFAULT_CATEGORY_METADATA,
  determineKPIStatus,
  calculateKPIProgress,
  KPI_STATUS_LABELS,
} from '@/shared/config/kpiRegistry'

describe('KPI Registry', () => {
  describe('getCategoryMetadata', () => {
    it('returns metadata for known category', () => {
      const metadata = getCategoryMetadata('tenders')
      expect(metadata.category).toBe('tenders')
      expect(metadata.defaultTarget).toBeGreaterThan(0)
    })

    it('falls back to default metadata for unknown category', () => {
      const metadata = getCategoryMetadata('unknown-category')
      expect(metadata.category).toBe(DEFAULT_CATEGORY_METADATA.category)
      expect(metadata.defaultUnit).toBe(DEFAULT_CATEGORY_METADATA.defaultUnit)
    })
  })

  describe('determineKPIStatus', () => {
    it('should return "exceeded" for progress >= 100', () => {
      expect(determineKPIStatus(100)).toBe('exceeded')
      expect(determineKPIStatus(120)).toBe('exceeded')
    })

    it('should return "on-track" for progress >= 80', () => {
      expect(determineKPIStatus(80)).toBe('on-track')
      expect(determineKPIStatus(95)).toBe('on-track')
    })

    it('should return "warning" for progress >= 50', () => {
      expect(determineKPIStatus(50)).toBe('warning')
      expect(determineKPIStatus(70)).toBe('warning')
    })

    it('should return "behind" for progress < 50', () => {
      expect(determineKPIStatus(30)).toBe('behind')
      expect(determineKPIStatus(0)).toBe('behind')
    })
  })

  describe('calculateKPIProgress', () => {
    it('should calculate progress correctly', () => {
      expect(calculateKPIProgress(50, 100)).toBe(50)
      expect(calculateKPIProgress(75, 100)).toBe(75)
      expect(calculateKPIProgress(100, 100)).toBe(100)
    })

    it('should cap progress at 100', () => {
      expect(calculateKPIProgress(150, 100)).toBe(100)
    })

    it('should return 100 for positive current with zero target', () => {
      expect(calculateKPIProgress(10, 0)).toBe(100)
    })

    it('should return 0 for zero current with zero target', () => {
      expect(calculateKPIProgress(0, 0)).toBe(0)
    })
  })

  describe('KPI_STATUS_LABELS', () => {
    it('should have labels for all statuses', () => {
      expect(KPI_STATUS_LABELS.exceeded).toBe('ممتاز')
      expect(KPI_STATUS_LABELS['on-track']).toBe('على المسار')
      expect(KPI_STATUS_LABELS.warning).toBe('يحتاج متابعة')
      expect(KPI_STATUS_LABELS.behind).toBe('متأخر')
    })
  })

  it('exports metadata map for predefined categories', () => {
    expect(Object.keys(KPI_CATEGORY_METADATA)).toEqual(
      expect.arrayContaining(['tenders', 'projects', 'revenue']),
    )
  })
})
