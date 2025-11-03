/**
 * Integration Tests for TendersPage Pagination UI
 * Testing frontend pagination controls added in Phase 1.1.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { Tenders } from '@/presentation/pages/Tenders/TendersPage'
import type { Tender } from '@/data/centralData'

// Mock the hooks and dependencies
const mockUseFinancialState = vi.fn()
vi.mock('@/application/context/FinancialStateContext', () => ({
  useFinancialState: () => mockUseFinancialState(),
}))

vi.mock('@/application/hooks/useSystemData', () => ({
  useSystemData: () => ({
    isInitializing: false,
    initializationError: null,
  }),
}))

// Helper to generate mock tenders
const generateMockTenders = (count: number): Tender[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `tender-${i + 1}`,
    name: `منافسة ${i + 1}`,
    title: `منافسة تجريبية رقم ${i + 1}`,
    client: `جهة ${i + 1}`,
    value: 10000 + i * 1000,
    status: 'new',
    phase: 'مرحلة التقييم',
    deadline: new Date('2025-12-31').toISOString(),
    daysLeft: 90,
    progress: 0,
    priority: 'medium',
    team: 'فريق التطوير',
    manager: 'مدير المشروع',
    winChance: 50,
    competition: '3 متنافسين',
    submissionDate: new Date('2024-12-15').toISOString(),
    lastAction: 'تم الإنشاء',
    lastUpdate: new Date().toISOString(),
    category: 'أعمال عامة',
    location: 'الرياض',
    type: 'construction',
  }))
}

describe('TendersPage - Pagination UI Tests', () => {
  const mockOnSectionChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Set default mock return value
    mockUseFinancialState.mockReturnValue({
      tenders: {
        tenders: generateMockTenders(100),
        deleteTender: vi.fn(),
        refreshTenders: vi.fn(),
        updateTender: vi.fn(),
      },
      metrics: {
        activeTendersCount: 10,
        totalTendersValue: 1000000,
        wonTendersCount: 5,
        lostTendersCount: 2,
      },
    })
  })

  describe('Pagination Controls Visibility', () => {
    it('should show pagination controls when tenders exceed page size', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Should show pagination controls
      expect(screen.queryByText(/الصفحة/)).toBeInTheDocument()
      expect(screen.queryByText(/منافسة/)).toBeInTheDocument()
    })

    it('should hide pagination controls when tenders fit in one page', () => {
      // Mock with only 5 tenders
      mockUseFinancialState.mockReturnValueOnce({
        tenders: {
          tenders: generateMockTenders(5),
          deleteTender: vi.fn(),
          refreshTenders: vi.fn(),
          updateTender: vi.fn(),
        },
        metrics: {
          activeTendersCount: 5,
          totalTendersValue: 50000,
          wonTendersCount: 0,
          lostTendersCount: 0,
        },
      })

      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Should not show pagination controls
      expect(screen.queryByText(/الصفحة/)).not.toBeInTheDocument()
    })
  })

  describe('Page Navigation Buttons', () => {
    it('should disable previous button on first page', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const prevButton = screen.getByText('السابق')
      expect(prevButton).toBeDisabled()
    })

    it('should enable next button when there are more pages', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const nextButton = screen.getByText('التالي')
      expect(nextButton).not.toBeDisabled()
    })

    it('should navigate to next page when clicking next button', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })
    })

    it('should navigate to previous page when clicking previous button', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // First go to page 2
      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })

      // Then go back to page 1
      const prevButton = screen.getByText('السابق')
      fireEvent.click(prevButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 1/)).toBeInTheDocument()
      })
    })

    it('should disable next button on last page', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Navigate to last page (100 tenders / 10 per page = 10 pages)
      const nextButton = screen.getByText('التالي')

      // Click 9 times to reach page 10
      for (let i = 0; i < 9; i++) {
        fireEvent.click(nextButton)
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`الصفحة ${i + 2}`))).toBeInTheDocument()
        })
      }

      // Next button should be disabled on page 10
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Page Size Selector', () => {
    it('should show page size selector with correct options', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const selector = screen.getByLabelText('عدد العناصر:')
      expect(selector).toBeInTheDocument()

      // Check options
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(4) // 10, 20, 50, 100
      expect(options[0]).toHaveTextContent('10')
      expect(options[1]).toHaveTextContent('20')
      expect(options[2]).toHaveTextContent('50')
      expect(options[3]).toHaveTextContent('100')
    })

    it('should have default page size of 10', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const selector = screen.getByLabelText('عدد العناصر:') as HTMLSelectElement
      expect(selector.value).toBe('10')
    })

    it('should change page size when selecting different option', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const selector = screen.getByLabelText('عدد العناصر:') as HTMLSelectElement

      fireEvent.change(selector, { target: { value: '20' } })

      await waitFor(() => {
        expect(selector.value).toBe('20')
      })
    })

    it('should reset to page 1 when changing page size', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Go to page 2
      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })

      // Change page size
      const selector = screen.getByLabelText('عدد العناصر:')
      fireEvent.change(selector, { target: { value: '20' } })

      // Should be back to page 1
      await waitFor(() => {
        expect(screen.getByText(/الصفحة 1/)).toBeInTheDocument()
      })
    })
  })

  describe('Page Information Display', () => {
    it('should display current page and total pages', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // 100 tenders / 10 per page = 10 pages
      expect(screen.getByText(/الصفحة 1 من 10/)).toBeInTheDocument()
    })

    it('should display total number of tenders', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      expect(screen.getByText(/100 منافسة/)).toBeInTheDocument()
    })

    it('should update page display when navigating', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2 من 10/)).toBeInTheDocument()
      })
    })

    it('should update total pages when changing page size', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Initially: 100 tenders / 10 per page = 10 pages
      expect(screen.getByText(/من 10/)).toBeInTheDocument()

      // Change to 20 per page
      const selector = screen.getByLabelText('عدد العناصر:')
      fireEvent.change(selector, { target: { value: '20' } })

      // Now: 100 tenders / 20 per page = 5 pages
      await waitFor(() => {
        expect(screen.getByText(/من 5/)).toBeInTheDocument()
      })
    })
  })

  describe('Filter Integration', () => {
    it('should reset to page 1 when changing filters', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Go to page 2
      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })

      // Change tab/filter (e.g., click on "جديدة" tab)
      const newTab = screen.getByText('جديدة')
      fireEvent.click(newTab)

      // Should reset to page 1
      await waitFor(() => {
        expect(screen.getByText(/الصفحة 1/)).toBeInTheDocument()
      })
    })

    it('should reset to page 1 when searching', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Go to page 2
      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })

      // Search
      const searchInput = screen.getByPlaceholderText(/بحث/)
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Should reset to page 1
      await waitFor(() => {
        expect(screen.getByText(/الصفحة 1/)).toBeInTheDocument()
      })
    })
  })

  describe('Tender Cards Display', () => {
    it('should display correct number of tenders per page', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Should show 10 tenders on page 1 (default page size)
      const cards = screen.getAllByTestId('tender-card')
      expect(cards).toHaveLength(10)
    })

    it('should display different tenders on different pages', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Get first tender on page 1
      const firstTender = screen.getByText('منافسة 1')
      expect(firstTender).toBeInTheDocument()

      // Go to page 2
      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        // First tender should not be visible on page 2
        expect(screen.queryByText('منافسة 1')).not.toBeInTheDocument()
        // Tender 11 should be visible (first on page 2)
        expect(screen.getByText('منافسة 11')).toBeInTheDocument()
      })
    })

    it('should display correct tenders when changing page size', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      // Initially 10 tenders
      let cards = screen.getAllByTestId('tender-card')
      expect(cards).toHaveLength(10)

      // Change to 20 per page
      const selector = screen.getByLabelText('عدد العناصر:')
      fireEvent.change(selector, { target: { value: '20' } })

      await waitFor(() => {
        cards = screen.getAllByTestId('tender-card')
        expect(cards).toHaveLength(20)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const prevButton = screen.getByText('السابق')
      const nextButton = screen.getByText('التالي')

      expect(prevButton).toHaveAttribute('aria-disabled', 'true')
      expect(nextButton).not.toHaveAttribute('aria-disabled', 'true')
    })

    it('should be keyboard navigable', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const nextButton = screen.getByText('التالي')

      // Focus the button
      nextButton.focus()
      expect(nextButton).toHaveFocus()

      // Press Enter
      fireEvent.keyDown(nextButton, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not re-render entire page when changing pages', async () => {
      render(<Tenders onSectionChange={mockOnSectionChange} />)

      const renderCount = vi.fn()
      vi.spyOn(React, 'useEffect').mockImplementation(renderCount)

      const nextButton = screen.getByText('التالي')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/الصفحة 2/)).toBeInTheDocument()
      })

      // Should have minimal re-renders
      expect(renderCount).toHaveBeenCalledTimes(1)
    })
  })
})
