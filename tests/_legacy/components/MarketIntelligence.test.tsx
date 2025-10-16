/**
 * @fileoverview Market Intelligence Component Tests
 * @description Comprehensive test suite for market intelligence component in Phase 3.
 * Tests UI interactions, data loading, filtering, and export functionality.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MarketIntelligence } from '../../../src/components/competitive/MarketIntelligence'

// Mock the market intelligence service
vi.mock('../../../src/services/marketIntelligenceService', () => ({
  marketIntelligenceService: {
    getMarketAnalysis: vi.fn(),
    getMaterialCosts: vi.fn(),
    getLaborRates: vi.fn(),
    getEconomicIndicators: vi.fn(),
    getIndustryTrends: vi.fn(),
    getMarketOpportunities: vi.fn(),
    exportMarketData: vi.fn(),
    generateMarketReport: vi.fn()
  }
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Users: () => <div data-testid="users-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Search: () => <div data-testid="search-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Building: () => <div data-testid="building-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Activity: () => <div data-testid="activity-icon" />
}))

describe('MarketIntelligence Component', () => {
  // ===== MOCK DATA =====

  const mockMarketAnalysis = {
    summary: {
      totalMaterials: 25,
      avgPriceChange: 3.5,
      totalLaborCategories: 15,
      avgRateChange: 2.1,
      activeOpportunities: 8,
      criticalAlerts: 2
    },
    trends: {
      materialCostTrend: 'increasing' as const,
      laborRateTrend: 'stable' as const,
      marketSentiment: 'positive' as const,
      competitionLevel: 'medium' as const
    },
    recommendations: [
      'فكر في تأمين المواد مسبقاً لتجنب زيادات الأسعار المستقبلية',
      'استكشف فرص التوسع والاستثمار في قطاعات جديدة'
    ],
    alerts: [
      {
        id: '1',
        alertType: 'price_change' as const,
        severity: 'high' as const,
        title: 'ارتفاع أسعار الحديد',
        message: 'ارتفعت أسعار الحديد بنسبة 15% خلال الأسبوع الماضي',
        affectedItems: ['حديد التسليح'],
        actionRequired: true,
        recommendations: ['مراجعة العقود الحالية'],
        createdAt: '2024-12-12T10:00:00Z',
        acknowledged: false
      }
    ],
    lastAnalyzed: '2024-12-12T10:00:00Z'
  }

  const mockMaterialCosts = [
    {
      id: '1',
      materialType: 'concrete',
      materialName: 'خرسانة عادية',
      materialNameEn: 'Regular Concrete',
      unit: 'm3',
      currentPrice: 250,
      previousPrice: 240,
      priceChange: 10,
      priceChangePercent: 4.17,
      region: 'الرياض',
      supplier: 'شركة الخرسانة المتقدمة',
      supplierRating: 4.5,
      priceHistory: [],
      qualityGrade: 'standard' as const,
      availability: 'high' as const,
      leadTime: 3,
      minimumOrder: 10,
      currency: 'SAR',
      lastUpdated: '2024-12-12T10:00:00Z'
    }
  ]

  const mockLaborRates = [
    {
      id: '1',
      skillCategory: 'عامل بناء',
      skillLevel: 'intermediate' as const,
      hourlyRate: 25,
      dailyRate: 200,
      monthlyRate: 5000,
      region: 'الرياض',
      city: 'الرياض',
      currency: 'SAR',
      rateHistory: [],
      demand: 'high' as const,
      availability: 'moderate' as const,
      seasonalVariation: 15,
      certificationRequired: false,
      experienceRequired: 2,
      lastUpdated: '2024-12-12T10:00:00Z'
    }
  ]

  const mockEconomicIndicators = [
    {
      id: '1',
      indicatorType: 'inflation' as const,
      name: 'معدل التضخم',
      nameEn: 'Inflation Rate',
      currentValue: 2.5,
      previousValue: 2.3,
      change: 0.2,
      changePercent: 8.7,
      unit: '%',
      period: '2024-Q4',
      source: 'SAMA',
      trend: 'increasing' as const,
      impact: 'negative' as const,
      confidence: 'high' as const,
      lastUpdated: '2024-12-12T10:00:00Z'
    }
  ]

  const mockIndustryTrends = [
    {
      id: '1',
      trendType: 'technology' as const,
      title: 'تقنيات البناء الذكي',
      titleEn: 'Smart Construction Technologies',
      description: 'انتشار تقنيات البناء الذكي والأتمتة في قطاع التشييد',
      impact: 'high' as const,
      timeframe: 'medium' as const,
      affectedSectors: ['residential', 'commercial'],
      opportunities: ['تحسين الكفاءة', 'تقليل التكاليف'],
      threats: ['الحاجة لمهارات جديدة'],
      recommendations: ['الاستثمار في التدريب'],
      source: 'Construction Technology Report 2024',
      publishedDate: '2024-12-12T10:00:00Z',
      relevanceScore: 9.2,
      tags: ['تقنية', 'أتمتة']
    }
  ]

  const mockMarketOpportunities = [
    {
      id: '1',
      opportunityType: 'project' as const,
      title: 'مشروع الإسكان الجديد',
      titleEn: 'New Housing Project',
      description: 'مشروع إسكان كبير في شمال الرياض',
      estimatedValue: 500000000,
      probability: 75,
      timeframe: '18 months',
      requirements: ['خبرة في الإسكان', 'رأس مال كبير'],
      risks: ['تأخير التراخيص'],
      benefits: ['عوائد عالية'],
      region: 'الرياض',
      sector: 'residential',
      competitionLevel: 'medium' as const,
      entryBarriers: ['رأس المال'],
      successFactors: ['الجودة'],
      source: 'وزارة الإسكان',
      identifiedDate: '2024-12-12T10:00:00Z',
      status: 'active' as const
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    const { marketIntelligenceService } = await import('../../../src/services/marketIntelligenceService')
    
    marketIntelligenceService.getMarketAnalysis.mockResolvedValue(mockMarketAnalysis)
    marketIntelligenceService.getMaterialCosts.mockResolvedValue(mockMaterialCosts)
    marketIntelligenceService.getLaborRates.mockResolvedValue(mockLaborRates)
    marketIntelligenceService.getEconomicIndicators.mockResolvedValue(mockEconomicIndicators)
    marketIntelligenceService.getIndustryTrends.mockResolvedValue(mockIndustryTrends)
    marketIntelligenceService.getMarketOpportunities.mockResolvedValue(mockMarketOpportunities)
    marketIntelligenceService.exportMarketData.mockResolvedValue('mock,csv,data')
    marketIntelligenceService.generateMarketReport.mockResolvedValue('# Mock Report')
  })

  // ===== RENDERING TESTS =====

  describe('Rendering', () => {
    it('should render market intelligence component successfully', async () => {
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('ذكاء السوق')).toBeInTheDocument()
      })

      expect(screen.getByText('تتبع وتحليل اتجاهات السوق والفرص التجارية')).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      render(<MarketIntelligence />)

      expect(screen.getByText('جاري تحميل بيانات السوق...')).toBeInTheDocument()
    })

    it('should render statistics cards when analytics are enabled', async () => {
      render(<MarketIntelligence showAnalytics={true} />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي المواد')).toBeInTheDocument()
      })

      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('متوسط تغيير الأسعار')).toBeInTheDocument()
      expect(screen.getByText('3.5%')).toBeInTheDocument()
    })

    it('should not render statistics cards when analytics are disabled', async () => {
      render(<MarketIntelligence showAnalytics={false} />)

      await waitFor(() => {
        expect(screen.getByText('ذكاء السوق')).toBeInTheDocument()
      })

      expect(screen.queryByText('إجمالي المواد')).not.toBeInTheDocument()
    })
  })

  // ===== INTERACTION TESTS =====

  describe('User Interactions', () => {
    it('should handle search input correctly', async () => {
      const user = userEvent.setup()
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('البحث في بيانات السوق...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('البحث في بيانات السوق...')
      await user.type(searchInput, 'خرسانة')

      expect(searchInput).toHaveValue('خرسانة')
    })

    it('should handle tab switching correctly', async () => {
      const user = userEvent.setup()
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('المواد')).toBeInTheDocument()
      })

      const materialsTab = screen.getByText('المواد')
      await user.click(materialsTab)

      expect(screen.getByText('تكاليف المواد (1)')).toBeInTheDocument()
    })

    it('should handle refresh button click', async () => {
      const user = userEvent.setup()
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('تحديث')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('تحديث')
      await user.click(refreshButton)

      // Verify that the service methods are called again
      const { marketIntelligenceService } = await import('../../../src/services/marketIntelligenceService')
      expect(marketIntelligenceService.getMarketAnalysis).toHaveBeenCalledTimes(2)
    })
  })

  // ===== DATA DISPLAY TESTS =====

  describe('Data Display', () => {
    it('should display material costs correctly', async () => {
      const user = userEvent.setup()
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('المواد')).toBeInTheDocument()
      })

      const materialsTab = screen.getByText('المواد')
      await user.click(materialsTab)

      await waitFor(() => {
        expect(screen.getByText('خرسانة عادية')).toBeInTheDocument()
      })

      expect(screen.getByText('250 SAR')).toBeInTheDocument()
      expect(screen.getByText('شركة الخرسانة المتقدمة')).toBeInTheDocument()
      expect(screen.getByText('+4.17%')).toBeInTheDocument()
    })

    it('should display labor rates correctly', async () => {
      const user = userEvent.setup()
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('العمالة')).toBeInTheDocument()
      })

      const laborTab = screen.getByText('العمالة')
      await user.click(laborTab)

      await waitFor(() => {
        expect(screen.getByText('عامل بناء')).toBeInTheDocument()
      })

      expect(screen.getByText('25 SAR')).toBeInTheDocument()
      expect(screen.getByText('200 SAR')).toBeInTheDocument()
    })

    it('should display market opportunities correctly', async () => {
      const user = userEvent.setup()
      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('الفرص')).toBeInTheDocument()
      })

      const opportunitiesTab = screen.getByText('الفرص')
      await user.click(opportunitiesTab)

      await waitFor(() => {
        expect(screen.getByText('مشروع الإسكان الجديد')).toBeInTheDocument()
      })

      expect(screen.getByText('500,000,000 ريال')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  // ===== EXPORT FUNCTIONALITY TESTS =====

  describe('Export Functionality', () => {
    it('should handle CSV export correctly', async () => {
      const user = userEvent.setup()
      
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any)

      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('المواد')).toBeInTheDocument()
      })

      const materialsTab = screen.getByText('المواد')
      await user.click(materialsTab)

      await waitFor(() => {
        expect(screen.getByText('CSV')).toBeInTheDocument()
      })

      const csvButton = screen.getByText('CSV')
      await user.click(csvButton)

      const { marketIntelligenceService } = await import('../../../src/services/marketIntelligenceService')
      expect(marketIntelligenceService.exportMarketData).toHaveBeenCalledWith('materials', 'csv')
    })

    it('should handle report generation correctly', async () => {
      const user = userEvent.setup()
      
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any)

      render(<MarketIntelligence />)

      await waitFor(() => {
        expect(screen.getByText('تقرير')).toBeInTheDocument()
      })

      const reportButton = screen.getByText('تقرير')
      await user.click(reportButton)

      const { marketIntelligenceService } = await import('../../../src/services/marketIntelligenceService')
      expect(marketIntelligenceService.generateMarketReport).toHaveBeenCalled()
    })
  })

  // ===== COMPACT MODE TESTS =====

  describe('Compact Mode', () => {
    it('should hide industry trends in compact mode', async () => {
      render(<MarketIntelligence compactMode={true} />)

      await waitFor(() => {
        expect(screen.getByText('ذكاء السوق')).toBeInTheDocument()
      })

      expect(screen.queryByText('الاتجاهات الصناعية')).not.toBeInTheDocument()
    })

    it('should show industry trends in normal mode', async () => {
      render(<MarketIntelligence compactMode={false} />)

      await waitFor(() => {
        expect(screen.getByText('الاتجاهات الصناعية')).toBeInTheDocument()
      })

      expect(screen.getByText('تقنيات البناء الذكي')).toBeInTheDocument()
    })
  })
})
