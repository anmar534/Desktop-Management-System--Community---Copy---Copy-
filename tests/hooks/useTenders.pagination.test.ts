/**
 * Unit Tests for useTenders Pagination
 * Testing pagination functionality added in Phase 1.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTenders } from '@/application/hooks/useTenders'
import type { Tender } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import { registerTenderRepository } from '@/application/services/serviceRegistry'
import { tenderRepository as defaultTenderRepository } from '@/repository/providers/tender.local'

// Helper to create test tenders
const makeTender = (id: number, overrides: Partial<Tender> = {}): Tender => ({
  id: `tender-${id}`,
  name: `منافسة رقم ${id}`,
  title: `منافسة تجريبية رقم ${id}`,
  client: `جهة ${id}`,
  value: 1000 + id * 150,
  status: 'new',
  phase: 'مرحلة التقييم',
  deadline: new Date('2025-12-31').toISOString(),
  daysLeft: 90,
  progress: 0,
  priority: 'medium',
  team: 'فريق التطوير',
  manager: 'مدير المشروع',
  winChance: 50,
  competition: `${id + 2} متنافس`,
  submissionDate: new Date('2024-12-15').toISOString(),
  lastAction: 'تم تحديث التسعير',
  lastUpdate: new Date().toISOString(),
  category: 'أعمال عامة',
  location: 'الرياض',
  type: 'construction',
  ...overrides,
})

// Generate multiple tenders for pagination testing
const generateTenders = (count: number): Tender[] => {
  return Array.from({ length: count }, (_, i) => makeTender(i + 1))
}

describe('useTenders - Pagination Tests', () => {
  let currentTenders: Tender[]

  const registerStubRepository = (tenders: Tender[]) => {
    currentTenders = tenders
    const stub: ITenderRepository = {
      getAll: async () => currentTenders,
      getById: async (id: string) => currentTenders.find((t) => t.id === id) ?? null,
      create: async (data: Omit<Tender, 'id'>) => {
        const newTender: Tender = { ...data, id: `generated-${Date.now()}` }
        currentTenders = [...currentTenders, newTender]
        return newTender
      },
      update: async (id: string, updates: Partial<Tender>) => {
        const existing = currentTenders.find((t) => t.id === id)
        if (!existing) return null
        const updated = { ...existing, ...updates }
        currentTenders = currentTenders.map((t) => (t.id === id ? updated : t))
        return updated
      },
      delete: async (id: string) => {
        const exists = currentTenders.some((t) => t.id === id)
        currentTenders = currentTenders.filter((t) => t.id !== id)
        return exists
      },
      search: async (query: string) => {
        const needle = query.toLowerCase()
        return currentTenders.filter(
          (t) =>
            t.name.toLowerCase().includes(needle) ||
            t.title.toLowerCase().includes(needle) ||
            t.client.toLowerCase().includes(needle),
        )
      },
      // Pagination support
      getPage: async (options) => {
        const { page = 1, pageSize = 20 } = options
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const items = currentTenders.slice(startIndex, endIndex)

        return {
          items,
          total: currentTenders.length,
          page,
          pageSize,
          hasMore: endIndex < currentTenders.length,
        }
      },
    }

    registerTenderRepository(stub)
  }

  beforeEach(() => {
    // Start with empty tenders
    registerStubRepository([])
  })

  afterEach(() => {
    registerTenderRepository(defaultTenderRepository)
    vi.restoreAllMocks()
  })

  describe('Pagination State', () => {
    it('should initialize with default pagination state', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.pagination).toBeDefined()
        expect(result.current.pagination.page).toBe(1)
        expect(result.current.pagination.pageSize).toBe(10) // Changed from 20 to 10
        expect(result.current.pagination.total).toBeGreaterThan(0)
      })
    })

    it('should have correct hasMore flag for multiple pages', async () => {
      registerStubRepository(generateTenders(50))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.pagination.hasMore).toBe(true)
        expect(result.current.pagination.total).toBe(50)
      })
    })

    it('should have hasMore as false when all items fit in one page', async () => {
      registerStubRepository(generateTenders(5))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.pagination.hasMore).toBe(false)
        expect(result.current.pagination.total).toBe(5)
      })
    })
  })

  describe('Navigation Functions', () => {
    it('should navigate to next page', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2)
      })
    })

    it('should navigate to previous page', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      // Go to page 2
      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2)
      })

      // Go back to page 1
      act(() => {
        result.current.prevPage()
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(1)
      })
    })

    it('should not go to previous page when on page 1', async () => {
      registerStubRepository(generateTenders(50))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(1)
      })

      act(() => {
        result.current.prevPage()
      })

      // Should still be on page 1
      await waitFor(() => {
        expect(result.current.pagination.page).toBe(1)
      })
    })

    it('should load specific page', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      act(() => {
        result.current.loadPage({ page: 3, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(3)
      })
    })
  })

  describe('Page Size Changes', () => {
    it('should change page size', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.pagination.pageSize).toBe(10)
      })

      act(() => {
        result.current.setPageSize(20)
      })

      await waitFor(() => {
        expect(result.current.pagination.pageSize).toBe(20)
      })
    })

    it('should reset to page 1 when changing page size', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      // Go to page 3
      act(() => {
        result.current.loadPage({ page: 3, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(3)
      })

      // Change page size - should reset to page 1
      act(() => {
        result.current.setPageSize(50)
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(1)
        expect(result.current.pagination.pageSize).toBe(50)
      })
    })

    it('should handle page size options correctly', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      const pageSizes = [10, 20, 50, 100]

      for (const size of pageSizes) {
        act(() => {
          result.current.setPageSize(size)
        })

        await waitFor(() => {
          expect(result.current.pagination.pageSize).toBe(size)
        })
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty tender list', async () => {
      registerStubRepository([])
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(0)
        expect(result.current.pagination.total).toBe(0)
        expect(result.current.pagination.hasMore).toBe(false)
      })
    })

    it('should handle single page of tenders', async () => {
      registerStubRepository(generateTenders(5))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(5)
        expect(result.current.pagination.page).toBe(1)
        expect(result.current.pagination.hasMore).toBe(false)
      })

      // Try to go to next page - should stay on page 1
      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(1)
      })
    })

    it('should handle exact multiple of page size', async () => {
      registerStubRepository(generateTenders(20)) // Exactly 2 pages with pageSize=10
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(20)
        expect(result.current.pagination.total).toBe(20)
      })

      // Go to page 2
      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2)
        expect(result.current.pagination.hasMore).toBe(false)
      })
    })

    it('should handle very large datasets', async () => {
      registerStubRepository(generateTenders(1000))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(1000)
        expect(result.current.pagination.total).toBe(1000)
        expect(result.current.pagination.hasMore).toBe(true)
      })

      // Should be able to navigate through all pages
      const totalPages = Math.ceil(1000 / 10) // 100 pages

      act(() => {
        result.current.loadPage({ page: totalPages, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(totalPages)
        expect(result.current.pagination.hasMore).toBe(false)
      })
    })
  })

  describe('Pagination with Filtering', () => {
    it('should maintain pagination when filtering reduces results', async () => {
      const tenders = generateTenders(100)
      // Make half of them have a specific client
      const modifiedTenders = tenders.map((t, i) =>
        i % 2 === 0 ? { ...t, client: 'Special Client' } : t,
      )
      registerStubRepository(modifiedTenders)

      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      // Filtering would be done in the component, but pagination should still work
      expect(result.current.pagination.total).toBe(100)
    })
  })

  describe('Performance', () => {
    it('should handle rapid page changes', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      // Rapidly change pages
      for (let i = 1; i <= 5; i++) {
        act(() => {
          result.current.nextPage()
        })
      }

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(6)
      })
    })

    it('should handle rapid page size changes', async () => {
      registerStubRepository(generateTenders(100))
      const { result } = renderHook(() => useTenders())

      await waitFor(() => {
        expect(result.current.tenders).toHaveLength(100)
      })

      // Rapidly change page sizes
      const sizes = [20, 50, 10, 100, 10]
      for (const size of sizes) {
        act(() => {
          result.current.setPageSize(size)
        })
      }

      await waitFor(() => {
        expect(result.current.pagination.pageSize).toBe(10)
        expect(result.current.pagination.page).toBe(1)
      })
    })
  })
})
