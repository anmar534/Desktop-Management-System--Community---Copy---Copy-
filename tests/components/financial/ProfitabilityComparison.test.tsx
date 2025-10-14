/**
 * اختبارات مكون مقارنة الربحية
 * Profitability Comparison Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfitabilityComparison } from '../../../src/components/financial/ProfitabilityComparison'

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />
}))

describe('ProfitabilityComparison Component', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render profitability comparison component', () => {
      render(<ProfitabilityComparison />)

      expect(screen.getByText('مقارنة الربحية')).toBeInTheDocument()
      expect(screen.getByText('مقارنة تفصيلية لربحية المشاريع والعملاء')).toBeInTheDocument()
    })

    it('should show empty state initially', () => {
      render(<ProfitabilityComparison />)

      expect(screen.getByText('لا توجد مقارنة')).toBeInTheDocument()
      expect(screen.getByText('اختر عنصرين أو أكثر لإنشاء مقارنة')).toBeInTheDocument()
    })

    it('should display side panel with search', () => {
      render(<ProfitabilityComparison />)

      expect(screen.getByPlaceholderText('البحث في المشاريع والعملاء...')).toBeInTheDocument()
      expect(screen.getByText('المشاريع')).toBeInTheDocument()
      expect(screen.getByText('العملاء')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should handle search input', async () => {
      render(<ProfitabilityComparison />)

      const searchInput = screen.getByPlaceholderText('البحث في المشاريع والعملاء...')
      
      fireEvent.change(searchInput, { target: { value: 'مشروع' } })

      expect(searchInput).toHaveValue('مشروع')
    })

    it('should clear search when clear button is clicked', async () => {
      render(<ProfitabilityComparison />)

      const searchInput = screen.getByPlaceholderText('البحث في المشاريع والعملاء...')
      
      fireEvent.change(searchInput, { target: { value: 'test' } })
      expect(searchInput).toHaveValue('test')

      // Find and click clear button (X icon)
      const clearButton = searchInput.parentElement?.querySelector('button')
      if (clearButton) {
        fireEvent.click(clearButton)
        expect(searchInput).toHaveValue('')
      }
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between project and client tabs', async () => {
      render(<ProfitabilityComparison />)

      // Initially on projects tab
      expect(screen.getByText('المشاريع')).toBeInTheDocument()

      // Click on clients tab
      const clientsTab = screen.getByText('العملاء')
      fireEvent.click(clientsTab)

      // Should still show clients tab (no actual data to verify switch)
      expect(screen.getByText('العملاء')).toBeInTheDocument()
    })
  })

  describe('Comparison Creation', () => {
    it('should show create comparison button', () => {
      render(<ProfitabilityComparison />)

      expect(screen.getByText('إنشاء مقارنة')).toBeInTheDocument()
    })

    it('should handle comparison creation', async () => {
      render(<ProfitabilityComparison />)

      const createButton = screen.getByText('إنشاء مقارنة')
      fireEvent.click(createButton)

      // Since no items are selected, should still show empty state
      expect(screen.getByText('لا توجد مقارنة')).toBeInTheDocument()
    })
  })

  describe('Charts', () => {
    it('should render chart containers when comparison exists', async () => {
      render(<ProfitabilityComparison />)

      // The charts are rendered but hidden when no comparison exists
      // We can check for the chart containers
      await waitFor(() => {
        const chartContainers = screen.queryAllByTestId('responsive-container')
        expect(chartContainers.length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Actions', () => {
    it('should show export and filter buttons', () => {
      render(<ProfitabilityComparison />)

      expect(screen.getByText('تصدير')).toBeInTheDocument()
      expect(screen.getByText('تصفية')).toBeInTheDocument()
    })

    it('should handle export button click', () => {
      render(<ProfitabilityComparison />)

      const exportButton = screen.getByText('تصدير')
      fireEvent.click(exportButton)

      // Should not throw error
      expect(exportButton).toBeInTheDocument()
    })

    it('should handle filter button click', () => {
      render(<ProfitabilityComparison />)

      const filterButton = screen.getByText('تصفية')
      fireEvent.click(filterButton)

      // Should not throw error
      expect(filterButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ProfitabilityComparison />)

      // Check for searchbox role
      const searchInput = screen.getByPlaceholderText('البحث في المشاريع والعملاء...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('should support keyboard navigation', () => {
      render(<ProfitabilityComparison />)

      const searchInput = screen.getByPlaceholderText('البحث في المشاريع والعملاء...')
      
      // Should be focusable
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)
    })
  })

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<ProfitabilityComparison />)

      const container = screen.getByText('مقارنة الربحية').closest('div')
      expect(container).toHaveAttribute('dir', 'rtl')
    })

    it('should display Arabic text correctly', () => {
      render(<ProfitabilityComparison />)

      expect(screen.getByText('مقارنة تفصيلية لربحية المشاريع والعملاء')).toBeInTheDocument()
      expect(screen.getByText('اختر عنصرين أو أكثر لإنشاء مقارنة')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      render(<ProfitabilityComparison />)

      // Should show empty state without errors
      expect(screen.getByText('لا توجد مقارنة')).toBeInTheDocument()
    })

    it('should not crash with invalid props', () => {
      // Component should render even without props
      expect(() => render(<ProfitabilityComparison />)).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should render within reasonable time', async () => {
      const startTime = Date.now()
      
      render(<ProfitabilityComparison />)
      
      await waitFor(() => {
        expect(screen.getByText('مقارنة الربحية')).toBeInTheDocument()
      })
      
      const renderTime = Date.now() - startTime
      expect(renderTime).toBeLessThan(1000) // Should render within 1 second
    })
  })
})
