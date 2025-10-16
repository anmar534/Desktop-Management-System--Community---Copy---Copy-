/**
 * @fileoverview Market Intelligence Service Tests
 * @description Comprehensive test suite for market intelligence service in Phase 3.
 * Tests material cost tracking, labor rate monitoring, economic indicators,
 * industry trends analysis, and market opportunity identification.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  marketIntelligenceService,
  type MaterialCost,
  type LaborRate,
  type EconomicIndicator,
  type IndustryTrend,
  type MarketOpportunity,
  type MarketAlert
} from '../../src/services/marketIntelligenceService'

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('MarketIntelligenceService', () => {
  // ===== TEST DATA =====

  const mockMaterialCost: Omit<MaterialCost, 'id' | 'lastUpdated'> = {
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
    priceHistory: [
      { date: '2024-11-01', price: 240, supplier: 'شركة الخرسانة المتقدمة', source: 'market_data' },
      { date: '2024-12-01', price: 250, supplier: 'شركة الخرسانة المتقدمة', source: 'market_data' }
    ],
    qualityGrade: 'standard',
    availability: 'high',
    leadTime: 3,
    minimumOrder: 10,
    currency: 'SAR',
    notes: 'متوفر بكميات كبيرة'
  }

  const mockLaborRate: Omit<LaborRate, 'id' | 'lastUpdated'> = {
    skillCategory: 'عامل بناء',
    skillLevel: 'intermediate',
    hourlyRate: 25,
    dailyRate: 200,
    monthlyRate: 5000,
    region: 'الرياض',
    city: 'الرياض',
    currency: 'SAR',
    rateHistory: [
      { date: '2024-11-01', hourlyRate: 23, source: 'labor_survey', marketCondition: 'normal' },
      { date: '2024-12-01', hourlyRate: 25, source: 'labor_survey', marketCondition: 'high_demand' }
    ],
    demand: 'high',
    availability: 'moderate',
    seasonalVariation: 15,
    certificationRequired: false,
    experienceRequired: 2
  }

  const mockEconomicIndicator: Omit<EconomicIndicator, 'id' | 'lastUpdated'> = {
    indicatorType: 'inflation',
    name: 'معدل التضخم',
    nameEn: 'Inflation Rate',
    currentValue: 2.5,
    previousValue: 2.3,
    change: 0.2,
    changePercent: 8.7,
    unit: '%',
    period: '2024-Q4',
    source: 'SAMA',
    trend: 'increasing',
    impact: 'negative',
    confidence: 'high',
    forecast: [
      { period: '2025-Q1', predictedValue: 2.7, confidence: 85, scenario: 'realistic' }
    ]
  }

  const mockIndustryTrend: Omit<IndustryTrend, 'id' | 'publishedDate'> = {
    trendType: 'technology',
    title: 'تقنيات البناء الذكي',
    titleEn: 'Smart Construction Technologies',
    description: 'انتشار تقنيات البناء الذكي والأتمتة في قطاع التشييد',
    impact: 'high',
    timeframe: 'medium',
    affectedSectors: ['residential', 'commercial'],
    opportunities: ['تحسين الكفاءة', 'تقليل التكاليف'],
    threats: ['الحاجة لمهارات جديدة', 'استثمارات أولية عالية'],
    recommendations: ['الاستثمار في التدريب', 'التعاون مع شركات التقنية'],
    source: 'Construction Technology Report 2024',
    relevanceScore: 9.2,
    tags: ['تقنية', 'أتمتة', 'ذكاء اصطناعي']
  }

  const mockMarketOpportunity: Omit<MarketOpportunity, 'id' | 'identifiedDate'> = {
    opportunityType: 'project',
    title: 'مشروع الإسكان الجديد',
    titleEn: 'New Housing Project',
    description: 'مشروع إسكان كبير في شمال الرياض',
    estimatedValue: 500000000,
    probability: 75,
    timeframe: '18 months',
    requirements: ['خبرة في الإسكان', 'رأس مال كبير'],
    risks: ['تأخير التراخيص', 'تقلبات أسعار المواد'],
    benefits: ['عوائد عالية', 'سمعة قوية'],
    region: 'الرياض',
    sector: 'residential',
    competitionLevel: 'medium',
    entryBarriers: ['رأس المال', 'الخبرة المطلوبة'],
    successFactors: ['الجودة', 'الالتزام بالمواعيد'],
    source: 'وزارة الإسكان',
    expiryDate: '2025-06-30',
    status: 'active'
  }

  const mockMarketAlert: Omit<MarketAlert, 'id' | 'createdAt' | 'acknowledged'> = {
    alertType: 'price_change',
    severity: 'high',
    title: 'ارتفاع أسعار الحديد',
    message: 'ارتفعت أسعار الحديد بنسبة 15% خلال الأسبوع الماضي',
    affectedItems: ['حديد التسليح', 'الحديد الإنشائي'],
    actionRequired: true,
    recommendations: ['مراجعة العقود الحالية', 'تأمين المخزون'],
    expiresAt: '2024-12-31'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== MATERIAL COST MANAGEMENT TESTS =====

  describe('Material Cost Management', () => {
    it('should create a new material cost successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await marketIntelligenceService.addMaterialCost(mockMaterialCost)

      expect(result).toBeDefined()
      expect(result.materialName).toBe(mockMaterialCost.materialName)
      expect(result.currentPrice).toBe(mockMaterialCost.currentPrice)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should get all material costs', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockMaterials = [{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockMaterials)

      const result = await marketIntelligenceService.getMaterialCosts()

      expect(result).toEqual(mockMaterials)
      expect(vi.mocked(asyncStorage.getItem)).toHaveBeenCalledWith('market_materials', [])
    })

    it('should filter material costs by region', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockMaterials = [
        { ...mockMaterialCost, id: '1', region: 'الرياض', lastUpdated: '2024-12-12' },
        { ...mockMaterialCost, id: '2', region: 'جدة', lastUpdated: '2024-12-12' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockMaterials)

      const result = await marketIntelligenceService.getMaterialCosts({ regions: ['الرياض'] })

      expect(result).toHaveLength(1)
      expect(result[0].region).toBe('الرياض')
    })

    it('should update material cost successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingMaterial = { ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingMaterial])

      const updateData = { currentPrice: 260, priceChangePercent: 8.33 }
      const result = await marketIntelligenceService.updateMaterialCost('1', updateData)

      expect(result.currentPrice).toBe(260)
      expect(result.priceChangePercent).toBe(8.33)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should delete material cost successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingMaterial = { ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingMaterial])

      const result = await marketIntelligenceService.deleteMaterialCost('1')

      expect(result).toBe(true)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalledWith('market_materials', [])
    })
  })

  // ===== LABOR RATE MANAGEMENT TESTS =====

  describe('Labor Rate Management', () => {
    it('should create a new labor rate successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await marketIntelligenceService.addLaborRate(mockLaborRate)

      expect(result).toBeDefined()
      expect(result.skillCategory).toBe(mockLaborRate.skillCategory)
      expect(result.hourlyRate).toBe(mockLaborRate.hourlyRate)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should filter labor rates by skill category', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockRates = [
        { ...mockLaborRate, id: '1', skillCategory: 'عامل بناء', lastUpdated: '2024-12-12' },
        { ...mockLaborRate, id: '2', skillCategory: 'كهربائي', lastUpdated: '2024-12-12' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockRates)

      const result = await marketIntelligenceService.getLaborRates({ skillCategories: ['عامل بناء'] })

      expect(result).toHaveLength(1)
      expect(result[0].skillCategory).toBe('عامل بناء')
    })

    it('should update labor rate successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingRate = { ...mockLaborRate, id: '1', lastUpdated: '2024-12-12' }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingRate])

      const updateData = { hourlyRate: 28, dailyRate: 224 }
      const result = await marketIntelligenceService.updateLaborRate('1', updateData)

      expect(result.hourlyRate).toBe(28)
      expect(result.dailyRate).toBe(224)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })
  })

  // ===== ECONOMIC INDICATORS TESTS =====

  describe('Economic Indicators', () => {
    it('should get economic indicators with filtering', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockIndicators = [
        { ...mockEconomicIndicator, id: '1', indicatorType: 'inflation', lastUpdated: '2024-12-12' },
        { ...mockEconomicIndicator, id: '2', indicatorType: 'gdp', lastUpdated: '2024-12-12' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockIndicators)

      const result = await marketIntelligenceService.getEconomicIndicators({ indicatorTypes: ['inflation'] })

      expect(result).toHaveLength(1)
      expect(result[0].indicatorType).toBe('inflation')
    })

    it('should update economic indicator successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingIndicator = { ...mockEconomicIndicator, id: '1', lastUpdated: '2024-12-12' }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingIndicator])

      const updateData = { currentValue: 2.8, trend: 'increasing' as const }
      const result = await marketIntelligenceService.updateEconomicIndicator('1', updateData)

      expect(result.currentValue).toBe(2.8)
      expect(result.trend).toBe('increasing')
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })
  })

  // ===== INDUSTRY TRENDS TESTS =====

  describe('Industry Trends', () => {
    it('should add industry trend successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await marketIntelligenceService.addIndustryTrend(mockIndustryTrend)

      expect(result).toBeDefined()
      expect(result.title).toBe(mockIndustryTrend.title)
      expect(result.impact).toBe(mockIndustryTrend.impact)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should filter trends by type', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockTrends = [
        { ...mockIndustryTrend, id: '1', trendType: 'technology', publishedDate: '2024-12-12' },
        { ...mockIndustryTrend, id: '2', trendType: 'regulation', publishedDate: '2024-12-12' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTrends)

      const result = await marketIntelligenceService.getIndustryTrends({ trendTypes: ['technology'] })

      expect(result).toHaveLength(1)
      expect(result[0].trendType).toBe('technology')
    })
  })

  // ===== MARKET OPPORTUNITIES TESTS =====

  describe('Market Opportunities', () => {
    it('should add market opportunity successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await marketIntelligenceService.addMarketOpportunity(mockMarketOpportunity)

      expect(result).toBeDefined()
      expect(result.title).toBe(mockMarketOpportunity.title)
      expect(result.estimatedValue).toBe(mockMarketOpportunity.estimatedValue)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should update opportunity status successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingOpportunity = { ...mockMarketOpportunity, id: '1', identifiedDate: '2024-12-12' }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingOpportunity])

      const result = await marketIntelligenceService.updateOpportunityStatus('1', 'pursuing')

      expect(result.status).toBe('pursuing')
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })
  })

  // ===== MARKET ANALYSIS TESTS =====

  describe('Market Analysis', () => {
    it('should generate market analysis successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')

      // Mock all required data
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce([{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]) // materials
        .mockResolvedValueOnce([{ ...mockLaborRate, id: '1', lastUpdated: '2024-12-12' }]) // labor
        .mockResolvedValueOnce([{ ...mockMarketOpportunity, id: '1', identifiedDate: '2024-12-12' }]) // opportunities
        .mockResolvedValueOnce([]) // alerts

      const result = await marketIntelligenceService.getMarketAnalysis()

      expect(result).toBeDefined()
      expect(result.summary.totalMaterials).toBe(1)
      expect(result.summary.totalLaborCategories).toBe(1)
      expect(result.trends).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })

    it('should create market alert successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await marketIntelligenceService.createAlert(mockMarketAlert)

      expect(result).toBeDefined()
      expect(result.title).toBe(mockMarketAlert.title)
      expect(result.severity).toBe(mockMarketAlert.severity)
      expect(result.acknowledged).toBe(false)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should acknowledge alert successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingAlert = {
        ...mockMarketAlert,
        id: '1',
        createdAt: '2024-12-12',
        acknowledged: false
      }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingAlert])

      const result = await marketIntelligenceService.acknowledgeAlert('1', 'user123')

      expect(result).toBe(true)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })
  })

  // ===== DATA IMPORT/EXPORT TESTS =====

  describe('Data Import/Export', () => {
    it('should import material data successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const importData = [{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]

      const result = await marketIntelligenceService.importMarketData(importData, 'materials')

      expect(result).toBe(true)
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalledWith('market_materials', importData)
    })

    it('should export material data as JSON', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockData = [{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockData)

      const result = await marketIntelligenceService.exportMarketData('materials', 'json')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(JSON.parse(result)).toEqual(mockData)
    })

    it('should export material data as CSV', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockData = [{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockData)

      const result = await marketIntelligenceService.exportMarketData('materials', 'csv')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('materialName')
      expect(result).toContain('currentPrice')
    })
  })

  // ===== UTILITY FUNCTIONS TESTS =====

  describe('Utility Functions', () => {
    it('should calculate price trends successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const materialWithHistory = {
        ...mockMaterialCost,
        id: '1',
        lastUpdated: '2024-12-12',
        priceHistory: [
          { date: '2024-11-01', price: 240, supplier: 'test', source: 'test' },
          { date: '2024-11-15', price: 245, supplier: 'test', source: 'test' },
          { date: '2024-12-01', price: 250, supplier: 'test', source: 'test' }
        ]
      }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([materialWithHistory])

      const result = await marketIntelligenceService.calculatePriceTrends('1', 30)

      expect(result).toBeDefined()
      expect(result.trend).toBeDefined()
      expect(result.change).toBeDefined()
      expect(result.changePercent).toBeDefined()
      expect(result.volatility).toBeDefined()
    })

    it('should calculate rate trends successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const rateWithHistory = {
        ...mockLaborRate,
        id: '1',
        lastUpdated: '2024-12-12',
        rateHistory: [
          { date: '2024-11-01', hourlyRate: 23, source: 'test', marketCondition: 'normal' },
          { date: '2024-11-15', hourlyRate: 24, source: 'test', marketCondition: 'normal' },
          { date: '2024-12-01', hourlyRate: 25, source: 'test', marketCondition: 'high_demand' }
        ]
      }
      vi.mocked(asyncStorage.getItem).mockResolvedValue([rateWithHistory])

      const result = await marketIntelligenceService.calculateRateTrends('1', 30)

      expect(result).toBeDefined()
      expect(result.trend).toBeDefined()
      expect(result.change).toBeDefined()
      expect(result.changePercent).toBeDefined()
      expect(result.volatility).toBeDefined()
    })

    it('should generate market report successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')

      // Mock all required data for report generation
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce([{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]) // materials for analysis
        .mockResolvedValueOnce([{ ...mockLaborRate, id: '1', lastUpdated: '2024-12-12' }]) // labor for analysis
        .mockResolvedValueOnce([{ ...mockMarketOpportunity, id: '1', identifiedDate: '2024-12-12' }]) // opportunities for analysis
        .mockResolvedValueOnce([]) // alerts for analysis
        .mockResolvedValueOnce([{ ...mockMaterialCost, id: '1', lastUpdated: '2024-12-12' }]) // materials for report
        .mockResolvedValueOnce([{ ...mockLaborRate, id: '1', lastUpdated: '2024-12-12' }]) // labor for report
        .mockResolvedValueOnce([{ ...mockMarketOpportunity, id: '1', identifiedDate: '2024-12-12' }]) // opportunities for report
        .mockResolvedValueOnce([{ ...mockIndustryTrend, id: '1', publishedDate: '2024-12-12' }]) // trends for report

      const result = await marketIntelligenceService.generateMarketReport()

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('تقرير ذكاء السوق')
      expect(result).toContain('Market Intelligence Report')
      expect(result).toContain('الملخص التنفيذي')
      expect(result).toContain('اتجاهات السوق')
    })
  })

  // ===== ERROR HANDLING TESTS =====

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const result = await marketIntelligenceService.getMaterialCosts()

      expect(result).toEqual([])
    })

    it('should throw error when updating non-existent material', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      await expect(
        marketIntelligenceService.updateMaterialCost('non-existent', { currentPrice: 100 })
      ).rejects.toThrow('Material cost with id non-existent not found')
    })

    it('should throw error when updating non-existent labor rate', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      await expect(
        marketIntelligenceService.updateLaborRate('non-existent', { hourlyRate: 30 })
      ).rejects.toThrow('Labor rate with id non-existent not found')
    })

    it('should return false when acknowledging non-existent alert', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await marketIntelligenceService.acknowledgeAlert('non-existent', 'user123')

      expect(result).toBe(false)
    })
  })

  // ===== SEARCH AND FILTERING TESTS =====

  describe('Search and Filtering', () => {
    it('should search materials by name', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockMaterials = [
        { ...mockMaterialCost, id: '1', materialName: 'خرسانة عادية', lastUpdated: '2024-12-12' },
        { ...mockMaterialCost, id: '2', materialName: 'حديد تسليح', lastUpdated: '2024-12-12' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockMaterials)

      const result = await marketIntelligenceService.getMaterialCosts({ searchTerm: 'حديد' })

      expect(result).toHaveLength(1)
      expect(result[0].materialName).toContain('حديد')
    })

    it('should filter by date range', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockMaterials = [
        { ...mockMaterialCost, id: '1', lastUpdated: '2024-12-01' },
        { ...mockMaterialCost, id: '2', lastUpdated: '2024-11-01' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockMaterials)

      const result = await marketIntelligenceService.getMaterialCosts({
        dateRange: ['2024-11-15', '2024-12-15']
      })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should filter by price range', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockMaterials = [
        { ...mockMaterialCost, id: '1', currentPrice: 250, lastUpdated: '2024-12-12' },
        { ...mockMaterialCost, id: '2', currentPrice: 150, lastUpdated: '2024-12-12' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockMaterials)

      const result = await marketIntelligenceService.getMaterialCosts({
        priceRange: [200, 300]
      })

      expect(result).toHaveLength(1)
      expect(result[0].currentPrice).toBe(250)
    })
  })
})
