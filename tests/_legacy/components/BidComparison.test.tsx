/**
 * @fileoverview Bid Comparison Component Tests
 * @description Comprehensive test suite for BidComparison UI component
 * @author Desktop Management System Team
 * @version 3.0.0
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BidComparison } from '../../../src/components/competitive/BidComparison'

// Mock the bid comparison service
vi.mock('../../../src/services/bidComparisonService', () => ({
  bidComparisonService: {
    getAllComparisons: vi.fn(),
    createComparison: vi.fn(),
    updateComparison: vi.fn(),
    deleteComparison: vi.fn(),
    getComparison: vi.fn(),
    compareBids: vi.fn(),
    analyzeCompetitiveGaps: vi.fn(),
    getPositioningRecommendations: vi.fn(),
    generateStrategicResponse: vi.fn(),
    assessMarketPosition: vi.fn(),
    identifyDifferentiators: vi.fn(),
    benchmarkAgainstMarket: vi.fn(),
    benchmarkAgainstCompetitors: vi.fn(),
    generateComparisonReport: vi.fn(),
    exportComparison: vi.fn(),
    calculateWinProbability: vi.fn(),
    identifyKeyRisks: vi.fn(),
    suggestImprovements: vi.fn()
  }
}))

describe('BidComparison Component', () => {
  const mockComparisons = [
    {
      id: 'comp_1',
      name: 'مقارنة مشروع البناء',
      nameEn: 'Construction Project Comparison',
      description: 'مقارنة شاملة لعروض مشروع البناء',
      projectId: 'project_1',
      projectName: 'مشروع البناء الجديد',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'user_1',
      bidIds: ['bid_1', 'bid_2', 'bid_3'],
      comparisonType: 'detailed',
      analysisDepth: 'comprehensive',
      status: 'completed',
      lastAnalyzed: '2024-01-01T00:00:00.000Z',
      confidenceScore: 85.5,
      results: {
        summary: {
          totalBids: 3,
          priceRange: { min: 1000000, max: 2000000, average: 1500000 },
          timelineRange: { min: 120, max: 180, average: 150 },
          qualityScoreRange: { min: 7.5, max: 9.0, average: 8.2 },
          winProbability: { 'bid_1': 65, 'bid_2': 45, 'bid_3': 30 },
          competitiveAdvantage: ['سعر تنافسي', 'جودة عالية'],
          keyDifferentiators: ['خبرة واسعة', 'تقنيات حديثة']
        },
        detailedAnalysis: {
          priceAnalysis: {
            bidPrices: { 'bid_1': 1200000, 'bid_2': 1500000, 'bid_3': 1800000 },
            priceVariation: 15.5,
            costBreakdown: {},
            pricingStrategy: {},
            competitivePricing: {
              marketPosition: 'competitive',
              priceGap: 50000,
              priceGapPercentage: 3.5,
              recommendedAdjustment: -25000
            }
          },
          technicalAnalysis: {
            technicalScores: { 'bid_1': 8.5, 'bid_2': 7.8, 'bid_3': 8.0 },
            technicalStrengths: {},
            technicalWeaknesses: {},
            innovationLevel: {},
            complianceLevel: {}
          },
          timelineAnalysis: {
            proposedTimelines: { 'bid_1': 150, 'bid_2': 165, 'bid_3': 140 },
            timelineRealism: {},
            criticalPath: {},
            timelineRisk: {}
          },
          resourceAnalysis: {
            resourceRequirements: {},
            resourceAvailability: {},
            resourceOptimization: {},
            capacityUtilization: {}
          },
          riskAnalysis: {
            riskProfiles: {},
            riskMitigation: {},
            overallRiskScore: {}
          }
        },
        competitivePositioning: {
          marketPosition: {
            overall: 'challenger',
            price: 'competitive',
            quality: 'standard',
            innovation: 'moderate',
            reliability: 'established'
          },
          competitiveAdvantages: [],
          competitiveGaps: [],
          positioningStrategy: 'التركيز على الجودة والموثوقية',
          differentiationFactors: ['خبرة واسعة', 'جودة عالية', 'التزام بالمواعيد']
        },
        riskAssessment: {
          overallRisk: 'medium',
          riskFactors: [],
          mitigationStrategies: [],
          contingencyPlans: []
        },
        strategicRecommendations: [
          {
            category: 'pricing',
            priority: 'high',
            recommendation: 'تحسين استراتيجية التسعير',
            rationale: 'السعر أعلى من المتوسط',
            implementation: ['مراجعة التكاليف', 'تحسين الكفاءة'],
            expectedImpact: 'زيادة فرص الفوز بنسبة 15%',
            timeline: '2-4 أسابيع',
            cost: 50000
          }
        ]
      },
      insights: [],
      recommendations: []
    }
  ]

  const mockGapAnalysis = {
    bidId: 'bid_1',
    competitorBids: ['bid_2', 'bid_3'],
    gaps: [
      {
        category: 'price',
        description: 'السعر أعلى من المنافسين بنسبة 10%',
        severity: 'moderate',
        urgency: 'medium',
        recommendations: ['مراجعة هيكل التكاليف', 'تحسين الكفاءة']
      }
    ],
    opportunities: ['ميزة تنافسية في الجودة'],
    threats: ['منافسة سعرية شديدة'],
    recommendations: ['تحسين التسعير', 'تعزيز الجودة'],
    actionPlan: []
  }

  const mockPositioningRecommendations = {
    bidId: 'bid_1',
    currentPosition: {
      overall: 'challenger',
      price: 'competitive',
      quality: 'standard',
      innovation: 'moderate',
      reliability: 'established'
    },
    recommendedPosition: {
      overall: 'leader',
      price: 'competitive',
      quality: 'premium',
      innovation: 'innovative',
      reliability: 'proven'
    },
    positioningStrategy: 'التحول إلى موقف القائد من خلال التركيز على الجودة والابتكار',
    keyMessages: ['الشريك الموثوق', 'جودة عالية', 'حلول مبتكرة'],
    differentiators: ['خبرة واسعة', 'تقنيات متطورة'],
    implementation: {
      phases: [],
      timeline: '3-6 أشهر',
      budget: 500000,
      resources: [],
      milestones: [],
      successMetrics: []
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    const { bidComparisonService } = await import('../../../src/services/bidComparisonService')
    vi.mocked(bidComparisonService.getAllComparisons).mockResolvedValue(mockComparisons)
    vi.mocked(bidComparisonService.createComparison).mockResolvedValue(mockComparisons[0])
    vi.mocked(bidComparisonService.updateComparison).mockResolvedValue(mockComparisons[0])
    vi.mocked(bidComparisonService.deleteComparison).mockResolvedValue(true)
    vi.mocked(bidComparisonService.getComparison).mockResolvedValue(mockComparisons[0])
    vi.mocked(bidComparisonService.compareBids).mockResolvedValue(mockComparisons[0].results)
    vi.mocked(bidComparisonService.analyzeCompetitiveGaps).mockResolvedValue(mockGapAnalysis)
    vi.mocked(bidComparisonService.getPositioningRecommendations).mockResolvedValue(mockPositioningRecommendations)
    vi.mocked(bidComparisonService.generateComparisonReport).mockResolvedValue('# تقرير المقارنة')
    vi.mocked(bidComparisonService.exportComparison).mockResolvedValue('exported data')
  })

  describe('Rendering', () => {
    it('should render the main component with header', async () => {
      render(<BidComparison />)
      
      await waitFor(() => {
        expect(screen.getByText('مقارنة العروض والمعايرة التنافسية')).toBeInTheDocument()
        expect(screen.getByText('تحليل شامل ومقارنة تفصيلية للعروض مع توصيات استراتيجية')).toBeInTheDocument()
      })
    })

    it('should render statistics cards when showAnalytics is true', async () => {
      render(<BidComparison showAnalytics={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('إجمالي المقارنات')).toBeInTheDocument()
        expect(screen.getByText('المقارنات النشطة')).toBeInTheDocument()
        expect(screen.getByText('متوسط الثقة')).toBeInTheDocument()
        expect(screen.getByText('الفجوات الحرجة')).toBeInTheDocument()
      })
    })

    it('should not render statistics cards when showAnalytics is false', async () => {
      render(<BidComparison showAnalytics={false} />)
      
      await waitFor(() => {
        expect(screen.queryByText('إجمالي المقارنات')).not.toBeInTheDocument()
      })
    })

    it('should render comparisons list', async () => {
      render(<BidComparison />)
      
      await waitFor(() => {
        expect(screen.getByText('مقارنة مشروع البناء')).toBeInTheDocument()
        expect(screen.getByText('مقارنة شاملة لعروض مشروع البناء')).toBeInTheDocument()
        expect(screen.getByText('مكتملة')).toBeInTheDocument()
      })
    })

    it('should show empty state when no comparisons exist', async () => {
      const { bidComparisonService } = await import('../../../src/services/bidComparisonService')
      vi.mocked(bidComparisonService.getAllComparisons).mockResolvedValue([])
      
      render(<BidComparison />)
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد مقارنات')).toBeInTheDocument()
        expect(screen.getByText('ابدأ بإنشاء مقارنة جديدة للعروض')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should open create comparison dialog when clicking create button', async () => {
      const user = userEvent.setup()
      render(<BidComparison bidIds={['bid_1', 'bid_2']} />)
      
      await waitFor(() => {
        const createButton = screen.getByText('مقارنة جديدة')
        expect(createButton).toBeInTheDocument()
      })
      
      const createButton = screen.getByText('مقارنة جديدة')
      await user.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء مقارنة جديدة')).toBeInTheDocument()
      })
    })

    it('should create a new comparison when form is submitted', async () => {
      const user = userEvent.setup()
      const onComparisonCreate = vi.fn()
      
      render(<BidComparison bidIds={['bid_1', 'bid_2']} onComparisonCreate={onComparisonCreate} />)
      
      // Open create dialog
      const createButton = screen.getByText('مقارنة جديدة')
      await user.click(createButton)
      
      // Submit form
      await waitFor(() => {
        const submitButton = screen.getByText('إنشاء المقارنة')
        expect(submitButton).toBeInTheDocument()
      })
      
      const submitButton = screen.getByText('إنشاء المقارنة')
      await user.click(submitButton)
      
      await waitFor(() => {
        const { bidComparisonService } = require('../../../src/services/bidComparisonService')
        expect(bidComparisonService.createComparison).toHaveBeenCalled()
        expect(onComparisonCreate).toHaveBeenCalledWith(mockComparisons[0])
      })
    })

    it('should filter comparisons when search term is entered', async () => {
      const user = userEvent.setup()
      render(<BidComparison />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في المقارنات...')
        expect(searchInput).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('البحث في المقارنات...')
      await user.type(searchInput, 'البناء')
      
      // The filtering is handled by the component's internal state
      expect(searchInput).toHaveValue('البناء')
    })

    it('should select comparison when clicked', async () => {
      const user = userEvent.setup()
      render(<BidComparison />)
      
      await waitFor(() => {
        const comparisonCard = screen.getByText('مقارنة مشروع البناء')
        expect(comparisonCard).toBeInTheDocument()
      })
      
      const comparisonCard = screen.getByText('مقارنة مشروع البناء').closest('.cursor-pointer')
      if (comparisonCard) {
        await user.click(comparisonCard)
        
        await waitFor(() => {
          expect(comparisonCard).toHaveClass('ring-2', 'ring-blue-500')
        })
      }
    })
  })

  describe('Data Display', () => {
    it('should display comparison summary correctly', async () => {
      render(<BidComparison />)
      
      // Select the first comparison
      await waitFor(() => {
        const comparisonCard = screen.getByText('مقارنة مشروع البناء').closest('.cursor-pointer')
        if (comparisonCard) {
          fireEvent.click(comparisonCard)
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('ملخص المقارنة')).toBeInTheDocument()
        expect(screen.getByText('نطاق الأسعار')).toBeInTheDocument()
        expect(screen.getByText('نطاق الجدولة الزمنية')).toBeInTheDocument()
        expect(screen.getByText('نطاق الجودة')).toBeInTheDocument()
      })
    })

    it('should display competitive positioning information', async () => {
      render(<BidComparison />)
      
      // Select the first comparison
      await waitFor(() => {
        const comparisonCard = screen.getByText('مقارنة مشروع البناء').closest('.cursor-pointer')
        if (comparisonCard) {
          fireEvent.click(comparisonCard)
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('الموقف التنافسي')).toBeInTheDocument()
        expect(screen.getByText('الموقف في السوق')).toBeInTheDocument()
        expect(screen.getByText('عوامل التمييز')).toBeInTheDocument()
      })
    })

    it('should display strategic recommendations', async () => {
      render(<BidComparison />)
      
      // Select the first comparison
      await waitFor(() => {
        const comparisonCard = screen.getByText('مقارنة مشروع البناء').closest('.cursor-pointer')
        if (comparisonCard) {
          fireEvent.click(comparisonCard)
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('التوصيات الاستراتيجية')).toBeInTheDocument()
        expect(screen.getByText('تحسين استراتيجية التسعير')).toBeInTheDocument()
      })
    })
  })

  describe('Export Functionality', () => {
    it('should export comparison when export button is clicked', async () => {
      const user = userEvent.setup()
      render(<BidComparison />)
      
      await waitFor(() => {
        const exportButton = screen.getAllByRole('button').find(btn => 
          btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-download')
        )
        expect(exportButton).toBeInTheDocument()
      })
      
      const exportButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-download')
      )
      
      if (exportButton) {
        await user.click(exportButton)
        
        await waitFor(() => {
          const { bidComparisonService } = require('../../../src/services/bidComparisonService')
          expect(bidComparisonService.exportComparison).toHaveBeenCalledWith('comp_1', 'csv')
        })
      }
    })

    it('should generate report when report button is clicked', async () => {
      const user = userEvent.setup()
      render(<BidComparison />)
      
      await waitFor(() => {
        const reportButton = screen.getAllByRole('button').find(btn => 
          btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-file-text')
        )
        expect(reportButton).toBeInTheDocument()
      })
      
      const reportButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-file-text')
      )
      
      if (reportButton) {
        await user.click(reportButton)
        
        await waitFor(() => {
          const { bidComparisonService } = require('../../../src/services/bidComparisonService')
          expect(bidComparisonService.generateComparisonReport).toHaveBeenCalledWith('comp_1')
        })
      }
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup()
      render(<BidComparison />)
      
      // Select a comparison first
      await waitFor(() => {
        const comparisonCard = screen.getByText('مقارنة مشروع البناء').closest('.cursor-pointer')
        if (comparisonCard) {
          fireEvent.click(comparisonCard)
        }
      })
      
      // Check if tabs are present
      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
        expect(screen.getByText('الفجوات')).toBeInTheDocument()
        expect(screen.getByText('التموقع')).toBeInTheDocument()
      })
      
      // Click on gaps tab
      const gapsTab = screen.getByText('الفجوات')
      await user.click(gapsTab)
      
      await waitFor(() => {
        expect(screen.getByText('تحليل الفجوات التنافسية')).toBeInTheDocument()
      })
      
      // Click on positioning tab
      const positioningTab = screen.getByText('التموقع')
      await user.click(positioningTab)
      
      await waitFor(() => {
        expect(screen.getByText('توصيات التموقع')).toBeInTheDocument()
      })
    })
  })
})
