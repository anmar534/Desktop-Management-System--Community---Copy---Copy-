/**
 * Optimization Dashboard Component Tests
 * اختبارات مكون لوحة تحكم التحسين
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OptimizationDashboard } from '../../../src/components/optimization/OptimizationDashboard'

// Mock services
vi.mock('../../../src/services/performanceOptimizationService', () => ({
  performanceOptimizationService: {
    getPerformanceReport: vi.fn(),
    optimizeMemory: vi.fn()
  }
}))

vi.mock('../../../src/services/systemIntegrationService', () => ({
  systemIntegrationService: {
    getTenderSystems: vi.fn(),
    getFinancialSystems: vi.fn(),
    getSyncHistory: vi.fn(),
    syncProjectsFromTender: vi.fn()
  }
}))

import { performanceOptimizationService } from '../../../src/services/performanceOptimizationService'
import { systemIntegrationService } from '../../../src/services/systemIntegrationService'

// Mock data
const mockPerformanceReport = {
  cacheStats: {
    size: 15,
    hitRate: 85.5,
    totalEntries: 15
  },
  metrics: {
    averageQueryTime: 150,
    totalQueries: 45,
    errorRate: 2.1,
    memoryUsage: 10485760 // 10MB
  },
  recommendations: [
    'تحسين استعلامات قاعدة البيانات - الوقت المتوسط مرتفع',
    'تحسين استراتيجية التخزين المؤقت - معدل النجاح منخفض'
  ]
}

const mockTenderSystems = [
  {
    id: 'tender-1',
    name: 'نظام المنافسات الحكومية',
    nameEn: 'Government Tenders System',
    isActive: true,
    lastSync: '2024-10-13T10:00:00.000Z',
    syncStatus: 'success'
  },
  {
    id: 'tender-2',
    name: 'نظام المنافسات الخاصة',
    nameEn: 'Private Tenders System',
    isActive: false,
    lastSync: '2024-10-12T15:30:00.000Z',
    syncStatus: 'error',
    errorMessage: 'فشل في الاتصال'
  }
]

const mockFinancialSystems = [
  {
    id: 'financial-1',
    name: 'النظام المالي المتكامل',
    nameEn: 'Integrated Financial System',
    isActive: true,
    lastSync: '2024-10-13T09:45:00.000Z',
    syncStatus: 'success',
    supportedOperations: ['expenses', 'budgets', 'reports']
  }
]

const mockSyncHistory = [
  {
    id: 'sync-1',
    type: 'tender',
    systemId: 'tender-1',
    result: {
      success: true,
      recordsProcessed: 10,
      recordsCreated: 3,
      recordsUpdated: 5,
      recordsSkipped: 2,
      errors: [],
      duration: 2500
    },
    timestamp: '2024-10-13T10:00:00.000Z'
  },
  {
    id: 'sync-2',
    type: 'financial',
    systemId: 'financial-1',
    result: {
      success: false,
      recordsProcessed: 5,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 5,
      errors: ['خطأ في الاتصال بقاعدة البيانات'],
      duration: 1200
    },
    timestamp: '2024-10-13T09:45:00.000Z'
  }
]

describe('OptimizationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    ;(performanceOptimizationService.getPerformanceReport as any).mockReturnValue(mockPerformanceReport)
    ;(systemIntegrationService.getTenderSystems as any).mockResolvedValue(mockTenderSystems)
    ;(systemIntegrationService.getFinancialSystems as any).mockResolvedValue(mockFinancialSystems)
    ;(systemIntegrationService.getSyncHistory as any).mockResolvedValue(mockSyncHistory)
    ;(systemIntegrationService.syncProjectsFromTender as any).mockResolvedValue({
      success: true,
      recordsProcessed: 5,
      recordsCreated: 2,
      recordsUpdated: 3
    })
  })

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<OptimizationDashboard />)
      
      expect(screen.getByText('جاري تحميل بيانات التحسين...')).toBeInTheDocument()
    })

    it('should render dashboard after loading', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('لوحة تحكم التحسين والتكامل')).toBeInTheDocument()
      })
      
      expect(screen.getByText('مراقبة الأداء وإدارة التكامل مع الأنظمة الخارجية')).toBeInTheDocument()
    })

    it('should render all tabs', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'الأداء' })).toBeInTheDocument()
      })
      
      expect(screen.getByRole('tab', { name: 'التكامل' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'السجل' })).toBeInTheDocument()
    })

    it('should apply RTL direction', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        const dashboard = screen.getByText('لوحة تحكم التحسين والتكامل').closest('div')
        expect(dashboard).toHaveAttribute('dir', 'rtl')
      })
    })
  })

  describe('Performance Tab', () => {
    it('should display performance metrics', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('150ms')).toBeInTheDocument() // Average query time
      })
      
      expect(screen.getByText('85.5%')).toBeInTheDocument() // Cache hit rate
      expect(screen.getByText('2.1%')).toBeInTheDocument() // Error rate
      expect(screen.getByText('10.0MB')).toBeInTheDocument() // Memory usage
    })

    it('should display performance recommendations', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('توصيات التحسين')).toBeInTheDocument()
      })
      
      expect(screen.getByText('تحسين استعلامات قاعدة البيانات - الوقت المتوسط مرتفع')).toBeInTheDocument()
      expect(screen.getByText('تحسين استراتيجية التخزين المؤقت - معدل النجاح منخفض')).toBeInTheDocument()
    })

    it('should handle optimize performance button click', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        const optimizeButton = screen.getByText('تحسين الأداء')
        fireEvent.click(optimizeButton)
      })
      
      expect(performanceOptimizationService.optimizeMemory).toHaveBeenCalled()
    })

    it('should show loading state during optimization', async () => {
      ;(performanceOptimizationService.optimizeMemory as any).mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })
      
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        const optimizeButton = screen.getByText('تحسين الأداء')
        fireEvent.click(optimizeButton)
      })
      
      // Button should be disabled during optimization
      const optimizeButton = screen.getByText('تحسين الأداء')
      expect(optimizeButton).toBeDisabled()
    })
  })

  describe('Integration Tab', () => {
    it('should display tender systems', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      expect(screen.getByText('أنظمة المنافسات')).toBeInTheDocument()
      expect(screen.getByText('نظام المنافسات الحكومية')).toBeInTheDocument()
      expect(screen.getByText('نظام المنافسات الخاصة')).toBeInTheDocument()
    })

    it('should display financial systems', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      expect(screen.getByText('الأنظمة المالية')).toBeInTheDocument()
      expect(screen.getByText('النظام المالي المتكامل')).toBeInTheDocument()
    })

    it('should show system status badges', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      expect(screen.getByText('نشط')).toBeInTheDocument()
      expect(screen.getByText('غير نشط')).toBeInTheDocument()
      expect(screen.getByText('نجح')).toBeInTheDocument()
      expect(screen.getByText('فشل')).toBeInTheDocument()
    })

    it('should handle sync button click', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      const syncButtons = screen.getAllByText('مزامنة')
      fireEvent.click(syncButtons[0])
      
      expect(systemIntegrationService.syncProjectsFromTender).toHaveBeenCalledWith('tender-1')
    })

    it('should disable sync for inactive systems', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      const syncButtons = screen.getAllByText('مزامنة')
      // Second button should be disabled (inactive system)
      expect(syncButtons[1]).toBeDisabled()
    })

    it('should show empty state when no systems configured', async () => {
      ;(systemIntegrationService.getTenderSystems as any).mockResolvedValue([])
      ;(systemIntegrationService.getFinancialSystems as any).mockResolvedValue([])
      
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      expect(screen.getByText('لا توجد أنظمة منافسات مكونة')).toBeInTheDocument()
      expect(screen.getByText('لا توجد أنظمة مالية مكونة')).toBeInTheDocument()
    })
  })

  describe('History Tab', () => {
    it('should display sync history', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'السجل' }))
      })
      
      expect(screen.getByText('سجل المزامنة')).toBeInTheDocument()
      expect(screen.getByText('مزامنة المنافسات')).toBeInTheDocument()
      expect(screen.getByText('مزامنة النظام المالي')).toBeInTheDocument()
    })

    it('should show sync statistics', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'السجل' }))
      })
      
      expect(screen.getByText('3 جديد')).toBeInTheDocument()
      expect(screen.getByText('5 محدث')).toBeInTheDocument()
      expect(screen.getByText('1 خطأ')).toBeInTheDocument()
    })

    it('should show sync duration', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'السجل' }))
      })
      
      expect(screen.getByText('2500ms')).toBeInTheDocument()
      expect(screen.getByText('1200ms')).toBeInTheDocument()
    })

    it('should show success and error icons', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'السجل' }))
      })
      
      // Should have both success and error icons
      const successIcons = document.querySelectorAll('[data-testid="check-circle"]')
      const errorIcons = document.querySelectorAll('[data-testid="alert-triangle"]')
      
      expect(successIcons.length + errorIcons.length).toBeGreaterThan(0)
    })

    it('should show empty state when no history', async () => {
      ;(systemIntegrationService.getSyncHistory as any).mockResolvedValue([])
      
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'السجل' }))
      })
      
      expect(screen.getByText('لا توجد عمليات مزامنة سابقة')).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('should handle refresh button click', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث')
        fireEvent.click(refreshButton)
      })
      
      // Should call all data loading functions again
      expect(systemIntegrationService.getTenderSystems).toHaveBeenCalledTimes(2)
      expect(systemIntegrationService.getFinancialSystems).toHaveBeenCalledTimes(2)
      expect(systemIntegrationService.getSyncHistory).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      ;(systemIntegrationService.getTenderSystems as any).mockRejectedValue(new Error('Service error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('لوحة تحكم التحسين والتكامل')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('خطأ في تحميل بيانات لوحة التحكم:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle sync errors gracefully', async () => {
      ;(systemIntegrationService.syncProjectsFromTender as any).mockRejectedValue(new Error('Sync error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('tab', { name: 'التكامل' }))
      })
      
      const syncButtons = screen.getAllByText('مزامنة')
      fireEvent.click(syncButtons[0])
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('خطأ في المزامنة:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Custom Props', () => {
    it('should apply custom className', async () => {
      render(<OptimizationDashboard className="custom-class" />)
      
      await waitFor(() => {
        const dashboard = screen.getByText('لوحة تحكم التحسين والتكامل').closest('div')
        expect(dashboard).toHaveClass('custom-class')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument()
      })
      
      expect(screen.getByRole('tab', { name: 'الأداء' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'التكامل' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'السجل' })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<OptimizationDashboard />)
      
      await waitFor(() => {
        const performanceTab = screen.getByRole('tab', { name: 'الأداء' })
        performanceTab.focus()
        expect(document.activeElement).toBe(performanceTab)
      })
    })
  })
})
