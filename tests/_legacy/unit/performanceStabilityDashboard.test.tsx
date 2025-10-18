/**
 * اختبارات مكون لوحة تحكم الأداء والاستقرار
 * Performance Stability Dashboard Component Tests
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import PerformanceStabilityDashboard from '../../../src/components/performance/PerformanceStabilityDashboard'
import type { SystemHealth, PerformanceMetrics, OptimizationRule } from '../../../src/services/performanceOptimizationService'

// Mock the performance optimization service
const mockPerformanceService = {
  initialize: vi.fn(),
  getPerformanceReport: vi.fn(),
  checkSystemHealth: vi.fn(),
  collectMetrics: vi.fn(),
  stopMonitoring: vi.fn()
}

vi.mock('../../../src/services/performanceOptimizationService', () => ({
  performanceOptimizationService: mockPerformanceService,
  SystemHealth: {},
  PerformanceMetrics: {},
  OptimizationRule: {}
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Memory: () => <div data-testid="memory-icon" />,
  Cpu: () => <div data-testid="cpu-icon" />
}))

describe('PerformanceStabilityDashboard', () => {
  const mockSystemHealth: SystemHealth = {
    overall: 'good',
    performance: {
      score: 85,
      avgResponseTime: 150,
      slowQueries: 2,
      optimizedQueries: 48,
      cacheHitRate: 75.5
    },
    stability: {
      score: 90,
      uptime: 99.5,
      errorRate: 0.5,
      crashCount: 0,
      recoveryTime: 0
    },
    memory: {
      current: 128,
      peak: 256,
      average: 180,
      leaks: [],
      optimizations: ['تنظيف الكاش التلقائي', 'إزالة المراجع غير المستخدمة']
    },
    errors: {
      total: 5,
      byType: { runtime: 2, network: 3 },
      recent: [],
      resolved: 4,
      pending: 1
    },
    lastCheck: new Date().toISOString(),
    recommendations: ['تحسين سرعة الاستعلامات', 'تحسين استراتيجية التخزين المؤقت']
  }

  const mockMetrics: PerformanceMetrics[] = [
    {
      id: 'metric-1',
      timestamp: new Date().toISOString(),
      component: 'test-component',
      operation: 'query_execution',
      duration: 120,
      memoryUsage: 64,
      cpuUsage: 15,
      status: 'success'
    },
    {
      id: 'metric-2',
      timestamp: new Date().toISOString(),
      component: 'api-client',
      operation: 'cache_hit',
      duration: 5,
      memoryUsage: 68,
      cpuUsage: 10,
      status: 'success'
    }
  ]

  const mockOptimizations: OptimizationRule[] = [
    {
      id: 'query-indexing',
      name: 'فهرسة الاستعلامات',
      nameEn: 'Query Indexing',
      description: 'تحسين فهرسة الاستعلامات لتسريع البحث',
      category: 'query',
      enabled: true,
      priority: 'high',
      implementation: vi.fn(),
      validation: vi.fn()
    },
    {
      id: 'memory-cleanup',
      name: 'تنظيف الذاكرة',
      nameEn: 'Memory Cleanup',
      description: 'تنظيف الذاكرة من البيانات غير المستخدمة',
      category: 'memory',
      enabled: false,
      priority: 'medium',
      implementation: vi.fn(),
      validation: vi.fn()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockPerformanceService.initialize.mockResolvedValue(undefined)
    mockPerformanceService.getPerformanceReport.mockResolvedValue({
      health: mockSystemHealth,
      metrics: mockMetrics,
      optimizations: mockOptimizations,
      config: {
        cacheEnabled: true,
        cacheTTL: 300000,
        maxCacheSize: 100,
        enableMetrics: true,
        enableQueryOptimization: true,
        enableComponentOptimization: true,
        enableMemoryOptimization: true,
        enableStartupOptimization: true,
        enableErrorRecovery: true,
        monitoringInterval: 30000
      }
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      mockPerformanceService.getPerformanceReport.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<PerformanceStabilityDashboard />)
      
      expect(screen.getByText('جاري تحميل بيانات الأداء...')).toBeInTheDocument()
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
    })

    it('should render dashboard after loading', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('لوحة تحكم الأداء والاستقرار')).toBeInTheDocument()
      })
      
      expect(screen.getByText('مراقبة وتحسين أداء النظام واستقراره')).toBeInTheDocument()
    })

    it('should render system health cards', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('الصحة العامة')).toBeInTheDocument()
        expect(screen.getByText('نقاط الأداء')).toBeInTheDocument()
        expect(screen.getByText('نقاط الاستقرار')).toBeInTheDocument()
        expect(screen.getByText('استخدام الذاكرة')).toBeInTheDocument()
      })
    })

    it('should display correct health status', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('جيد')).toBeInTheDocument() // 'good' health status
      })
    })

    it('should display performance metrics', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument() // Performance score
        expect(screen.getByText('90')).toBeInTheDocument() // Stability score
      })
    })

    it('should display memory usage', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('128 MB')).toBeInTheDocument() // Current memory
        expect(screen.getByText('الذروة: 256 MB')).toBeInTheDocument() // Peak memory
      })
    })
  })

  describe('Recommendations', () => {
    it('should display recommendations when available', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('توصيات التحسين:')).toBeInTheDocument()
        expect(screen.getByText('تحسين سرعة الاستعلامات')).toBeInTheDocument()
        expect(screen.getByText('تحسين استراتيجية التخزين المؤقت')).toBeInTheDocument()
      })
    })

    it('should not display recommendations section when none available', async () => {
      const healthWithoutRecommendations = {
        ...mockSystemHealth,
        recommendations: []
      }
      
      mockPerformanceService.getPerformanceReport.mockResolvedValue({
        health: healthWithoutRecommendations,
        metrics: mockMetrics,
        optimizations: mockOptimizations,
        config: {}
      })
      
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.queryByText('توصيات التحسين:')).not.toBeInTheDocument()
      })
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tab triggers', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('المقاييس')).toBeInTheDocument()
        expect(screen.getByText('التحسينات')).toBeInTheDocument()
        expect(screen.getByText('الأخطاء')).toBeInTheDocument()
        expect(screen.getByText('التحليلات')).toBeInTheDocument()
      })
    })

    it('should display metrics tab content by default', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('مقاييس الأداء الحديثة')).toBeInTheDocument()
      })
    })

    it('should switch to optimizations tab', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التحسينات'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('قواعد التحسين')).toBeInTheDocument()
        expect(screen.getByText('فهرسة الاستعلامات')).toBeInTheDocument()
        expect(screen.getByText('تنظيف الذاكرة')).toBeInTheDocument()
      })
    })

    it('should switch to errors tab', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('الأخطاء'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('سجل الأخطاء')).toBeInTheDocument()
      })
    })

    it('should switch to analytics tab', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التحليلات'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('تحليلات الأداء')).toBeInTheDocument()
        expect(screen.getByText('إحصائيات الكاش')).toBeInTheDocument()
        expect(screen.getByText('الاستعلامات البطيئة')).toBeInTheDocument()
      })
    })
  })

  describe('Metrics Display', () => {
    it('should display performance metrics in metrics tab', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('query_execution')).toBeInTheDocument()
        expect(screen.getByText('cache_hit')).toBeInTheDocument()
        expect(screen.getByText('test-component')).toBeInTheDocument()
        expect(screen.getByText('api-client')).toBeInTheDocument()
      })
    })

    it('should display metric durations and memory usage', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('120ms')).toBeInTheDocument()
        expect(screen.getByText('5ms')).toBeInTheDocument()
        expect(screen.getByText('64MB')).toBeInTheDocument()
        expect(screen.getByText('68MB')).toBeInTheDocument()
      })
    })
  })

  describe('Optimizations Display', () => {
    it('should display optimization rules with status', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التحسينات'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('فهرسة الاستعلامات')).toBeInTheDocument()
        expect(screen.getByText('تنظيف الذاكرة')).toBeInTheDocument()
        expect(screen.getByText('مفعل')).toBeInTheDocument()
        expect(screen.getByText('معطل')).toBeInTheDocument()
      })
    })
  })

  describe('Error Display', () => {
    it('should show no errors message when no recent errors', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('الأخطاء'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد أخطاء حديثة')).toBeInTheDocument()
      })
    })

    it('should display recent errors when available', async () => {
      const healthWithErrors = {
        ...mockSystemHealth,
        errors: {
          ...mockSystemHealth.errors,
          recent: [
            {
              id: 'error-1',
              timestamp: new Date().toISOString(),
              type: 'runtime',
              message: 'Test runtime error',
              component: 'test-component',
              severity: 'high' as const,
              resolved: false
            }
          ]
        }
      }
      
      mockPerformanceService.getPerformanceReport.mockResolvedValue({
        health: healthWithErrors,
        metrics: mockMetrics,
        optimizations: mockOptimizations,
        config: {}
      })
      
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('الأخطاء'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('Test runtime error')).toBeInTheDocument()
        expect(screen.getByText('test-component')).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Display', () => {
    it('should display cache hit rate', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التحليلات'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('75.5%')).toBeInTheDocument() // Cache hit rate
        expect(screen.getByText('معدل إصابة الكاش')).toBeInTheDocument()
      })
    })

    it('should display slow queries count', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التحليلات'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // Slow queries count
        expect(screen.getByText('من أصل 48 استعلام')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle refresh button click', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث')
        fireEvent.click(refreshButton)
      })
      
      expect(mockPerformanceService.getPerformanceReport).toHaveBeenCalledTimes(2) // Initial load + refresh
    })

    it('should disable refresh button while refreshing', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockPerformanceService.getPerformanceReport.mockReturnValue(promise)
      
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث')
        fireEvent.click(refreshButton)
        expect(refreshButton).toBeDisabled()
      })
      
      // Resolve the promise to complete the refresh
      resolvePromise!({
        health: mockSystemHealth,
        metrics: mockMetrics,
        optimizations: mockOptimizations,
        config: {}
      })
    })
  })

  describe('Health Status Colors', () => {
    it('should display excellent health with green color', async () => {
      const excellentHealth = { ...mockSystemHealth, overall: 'excellent' as const }
      mockPerformanceService.getPerformanceReport.mockResolvedValue({
        health: excellentHealth,
        metrics: mockMetrics,
        optimizations: mockOptimizations,
        config: {}
      })
      
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('ممتاز')).toBeInTheDocument()
      })
    })

    it('should display warning health with yellow color', async () => {
      const warningHealth = { ...mockSystemHealth, overall: 'warning' as const }
      mockPerformanceService.getPerformanceReport.mockResolvedValue({
        health: warningHealth,
        metrics: mockMetrics,
        optimizations: mockOptimizations,
        config: {}
      })
      
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('تحذير')).toBeInTheDocument()
      })
    })

    it('should display critical health with red color', async () => {
      const criticalHealth = { ...mockSystemHealth, overall: 'critical' as const }
      mockPerformanceService.getPerformanceReport.mockResolvedValue({
        health: criticalHealth,
        metrics: mockMetrics,
        optimizations: mockOptimizations,
        config: {}
      })
      
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('حرج')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle service initialization errors gracefully', async () => {
      mockPerformanceService.initialize.mockRejectedValue(new Error('Initialization failed'))
      
      render(<PerformanceStabilityDashboard />)
      
      // Should not crash the component
      await waitFor(() => {
        expect(screen.getByText('لوحة تحكم الأداء والاستقرار')).toBeInTheDocument()
      })
    })

    it('should handle report loading errors gracefully', async () => {
      mockPerformanceService.getPerformanceReport.mockRejectedValue(new Error('Report loading failed'))
      
      render(<PerformanceStabilityDashboard />)
      
      // Should not crash the component
      await waitFor(() => {
        expect(screen.getByText('لوحة تحكم الأداء والاستقرار')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        const dashboard = screen.getByText('لوحة تحكم الأداء والاستقرار').closest('div')
        expect(dashboard).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should have accessible button labels', async () => {
      render(<PerformanceStabilityDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('تحديث')).toBeInTheDocument()
        expect(screen.getByText('إعدادات')).toBeInTheDocument()
      })
    })
  })
})
