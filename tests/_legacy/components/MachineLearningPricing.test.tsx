/**
 * Machine Learning Pricing Component Tests
 * Comprehensive test suite for AI-driven pricing optimization interface
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import MachineLearningPricing from '../../../src/components/ai/MachineLearningPricing'
import type { MLModel, PricingPrediction } from '../../../src/types/machineLearning'

// Mock the machine learning service
vi.mock('../../../src/services/machineLearningService', () => ({
  machineLearningService: {
    getModels: vi.fn(),
    getPatterns: vi.fn(),
    getLearningInsights: vi.fn(),
    getPricingPrediction: vi.fn(),
    trainModel: vi.fn()
  }
}))

describe('MachineLearningPricing', () => {
  let mockMachineLearningService: any
  const user = userEvent.setup()

  const mockModel: MLModel = {
    id: 'model_1',
    name: 'Pricing Optimization Model',
    nameAr: 'نموذج تحسين التسعير',
    type: 'pricing_optimization',
    version: '1.0.0',
    status: 'ready',
    accuracy: 0.85,
    confidence: 0.9,
    trainingData: {
      id: 'dataset_1',
      name: 'Historical Pricing Data',
      nameAr: 'بيانات التسعير التاريخية',
      size: 1000,
      features: [],
      target: 'price',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      quality: {
        completeness: 0.95,
        accuracy: 0.9,
        consistency: 0.88,
        timeliness: 0.92,
        validity: 0.94,
        overall: 0.92
      },
      source: ['historical_bids']
    },
    lastTrained: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    parameters: {
      algorithm: 'random_forest',
      hyperparameters: {},
      featureSelection: { method: 'importance', threshold: 0.01 },
      validation: { method: 'cross_validation', folds: 5, testSize: 0.2 },
      optimization: { objective: 'mse', maxIterations: 1000, tolerance: 0.001 }
    },
    performance: {
      metrics: {
        accuracy: 0.85,
        precision: 0.8,
        recall: 0.75,
        f1Score: 0.77,
        mse: 0.05,
        mae: 0.03,
        r2Score: 0.82
      },
      validation: {
        crossValidationScore: 0.83,
        testScore: 0.85,
        trainingScore: 0.87,
        overfitting: false,
        underfitting: false,
        stability: 0.9
      },
      predictions: {
        overall: 0.85,
        byCategory: {},
        byTimeRange: {},
        confidenceDistribution: { high: 0.6, medium: 0.3, low: 0.1 }
      },
      trends: { accuracy: [], predictions: [], errors: [] },
      lastEvaluation: '2024-01-01T00:00:00.000Z'
    },
    isActive: true
  }

  const mockPrediction: PricingPrediction = {
    id: 'pred_1',
    tenderId: 'tender_1',
    modelId: 'model_1',
    prediction: {
      recommendedPrice: 950000,
      priceRange: {
        min: 855000,
        max: 1092500,
        optimal: 950000,
        conservative: 1045000,
        aggressive: 902500
      },
      margin: 0.12,
      marginRange: {
        min: 0.096,
        max: 0.156,
        optimal: 0.12,
        safe: 0.144,
        competitive: 0.108
      },
      winProbability: 0.75,
      profitability: 0.8,
      competitiveness: 0.7,
      reasoning: 'Based on market analysis and historical data patterns',
      reasoningAr: 'بناءً على تحليل السوق وأنماط البيانات التاريخية'
    },
    confidence: 0.85,
    factors: [],
    alternatives: [],
    risks: [],
    marketContext: {
      competitorCount: 3,
      marketTrend: 'stable',
      demandLevel: 'medium',
      priceVolatility: 0.1,
      seasonality: {
        season: 'spring',
        impact: 0.02,
        historicalPattern: [1.0, 1.02, 1.05, 1.03],
        confidence: 0.8
      },
      economicIndicators: {
        inflationRate: 0.03,
        interestRate: 0.05,
        currencyStrength: 1.0,
        constructionIndex: 105,
        materialCostTrend: 0.02
      }
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    expiresAt: '2024-01-08T00:00:00.000Z'
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked service
    const { machineLearningService } = await import('../../../src/services/machineLearningService')
    mockMachineLearningService = vi.mocked(machineLearningService)
    
    // Setup default mock implementations
    mockMachineLearningService.getModels.mockResolvedValue([mockModel])
    mockMachineLearningService.getPatterns.mockResolvedValue([])
    mockMachineLearningService.getLearningInsights.mockResolvedValue([])
    mockMachineLearningService.getPricingPrediction.mockResolvedValue(mockPrediction)
    mockMachineLearningService.trainModel.mockResolvedValue(mockModel)
  })

  describe('Component Rendering', () => {
    it('should render the component with all tabs', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('نماذج التسعير الذكية')).toBeInTheDocument()
      })

      expect(screen.getByText('التوقعات')).toBeInTheDocument()
      expect(screen.getByText('النماذج')).toBeInTheDocument()
      expect(screen.getByText('الأنماط')).toBeInTheDocument()
      expect(screen.getByText('الرؤى')).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      mockMachineLearningService.getModels.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 1000))
      )

      render(<MachineLearningPricing tenderId="tender_1" />)

      expect(screen.getByText('جاري تحميل نماذج التعلم الآلي...')).toBeInTheDocument()
    })

    it('should display error message when loading fails', async () => {
      mockMachineLearningService.getModels.mockRejectedValue(new Error('Network error'))

      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('فشل في تحميل بيانات التعلم الآلي')).toBeInTheDocument()
      })
    })
  })

  describe('Predictions Tab', () => {
    it('should render prediction form with all fields', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('توليد توقع تسعير جديد')).toBeInTheDocument()
      })

      expect(screen.getByLabelText('النموذج المستخدم')).toBeInTheDocument()
      expect(screen.getByLabelText('القيمة المقدرة')).toBeInTheDocument()
      expect(screen.getByLabelText('عدد المنافسين')).toBeInTheDocument()
      expect(screen.getByLabelText('اتجاه السوق')).toBeInTheDocument()
    })

    it('should generate pricing prediction when form is submitted', async () => {
      const onPredictionGenerated = vi.fn()
      
      render(
        <MachineLearningPricing 
          tenderId="tender_1" 
          onPredictionGenerated={onPredictionGenerated}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('توليد توقع التسعير')).toBeInTheDocument()
      })

      // Fill form fields
      const estimatedValueInput = screen.getByLabelText('القيمة المقدرة')
      await user.clear(estimatedValueInput)
      await user.type(estimatedValueInput, '1000000')

      const competitorCountInput = screen.getByLabelText('عدد المنافسين')
      await user.clear(competitorCountInput)
      await user.type(competitorCountInput, '3')

      // Submit form
      const generateButton = screen.getByText('توليد توقع التسعير')
      await user.click(generateButton)

      await waitFor(() => {
        expect(mockMachineLearningService.getPricingPrediction).toHaveBeenCalledWith(
          'tender_1',
          expect.objectContaining({
            tender: expect.objectContaining({ id: 'tender_1' }),
            market: expect.objectContaining({ competitorCount: 3 })
          })
        )
      })

      expect(onPredictionGenerated).toHaveBeenCalledWith(mockPrediction)
    })

    it('should display recent predictions', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('توليد توقع التسعير')).toBeInTheDocument()
      })

      // Generate a prediction first
      const generateButton = screen.getByText('توليد توقع التسعير')
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('التوقعات الحديثة')).toBeInTheDocument()
        expect(screen.getByText('950,000 ريال')).toBeInTheDocument()
        expect(screen.getByText('ثقة: 85.0%')).toBeInTheDocument()
      })
    })

    it('should show error when no model is selected', async () => {
      mockMachineLearningService.getModels.mockResolvedValue([])

      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('توليد توقع التسعير')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('توليد توقع التسعير')
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('يرجى تحديد النموذج ومعرف المناقصة')).toBeInTheDocument()
      })
    })
  })

  describe('Models Tab', () => {
    it('should display models list', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('النماذج')).toBeInTheDocument()
      })

      // Switch to models tab
      await user.click(screen.getByText('النماذج'))

      await waitFor(() => {
        expect(screen.getByText('نماذج التعلم الآلي')).toBeInTheDocument()
        expect(screen.getByText('نموذج تحسين التسعير')).toBeInTheDocument()
        expect(screen.getByText('الإصدار: 1.0.0')).toBeInTheDocument()
        expect(screen.getByText('نشط')).toBeInTheDocument()
        expect(screen.getByText('جاهز')).toBeInTheDocument()
      })
    })

    it('should display performance statistics', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('النماذج')).toBeInTheDocument()
      })

      // Switch to models tab
      await user.click(screen.getByText('النماذج'))

      await waitFor(() => {
        expect(screen.getByText('إحصائيات الأداء العامة')).toBeInTheDocument()
        expect(screen.getByText('متوسط الدقة')).toBeInTheDocument()
        expect(screen.getByText('متوسط الثقة')).toBeInTheDocument()
      })
    })

    it('should train new model when button is clicked', async () => {
      const onModelTrained = vi.fn()
      
      render(
        <MachineLearningPricing 
          tenderId="tender_1" 
          onModelTrained={onModelTrained}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('النماذج')).toBeInTheDocument()
      })

      // Switch to models tab
      await user.click(screen.getByText('النماذج'))

      const trainButton = screen.getByText('تدريب نموذج جديد')
      await user.click(trainButton)

      await waitFor(() => {
        expect(mockMachineLearningService.trainModel).toHaveBeenCalled()
      })

      expect(onModelTrained).toHaveBeenCalledWith(mockModel)
    })
  })

  describe('Patterns Tab', () => {
    it('should display empty state when no patterns exist', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('الأنماط')).toBeInTheDocument()
      })

      // Switch to patterns tab
      await user.click(screen.getByText('الأنماط'))

      await waitFor(() => {
        expect(screen.getByText('الأنماط المكتشفة')).toBeInTheDocument()
        expect(screen.getByText('لم يتم اكتشاف أنماط بعد')).toBeInTheDocument()
      })
    })

    it('should display patterns when available', async () => {
      const mockPatterns = [
        {
          id: 'pattern_1',
          name: 'Seasonal Patterns',
          nameAr: 'الأنماط الموسمية',
          type: 'seasonal_pricing' as const,
          patterns: [
            {
              id: 'p1',
              description: 'Winter pricing pattern',
              descriptionAr: 'نمط التسعير الشتوي',
              strength: 0.8,
              frequency: 0.6,
              conditions: [],
              outcomes: [],
              examples: []
            }
          ],
          confidence: 0.8,
          applicability: {
            projectTypes: ['residential'],
            regions: ['riyadh'],
            clientTypes: ['government'],
            valueRanges: [],
            timeframes: ['Q1']
          },
          lastUpdated: '2024-01-01T00:00:00.000Z'
        }
      ]

      mockMachineLearningService.getPatterns.mockResolvedValue(mockPatterns)

      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('الأنماط')).toBeInTheDocument()
      })

      // Switch to patterns tab
      await user.click(screen.getByText('الأنماط'))

      await waitFor(() => {
        expect(screen.getByText('الأنماط الموسمية')).toBeInTheDocument()
        expect(screen.getByText('ثقة: 80.0%')).toBeInTheDocument()
        expect(screen.getByText('نمط التسعير الشتوي')).toBeInTheDocument()
      })
    })
  })

  describe('Insights Tab', () => {
    it('should display empty state when no insights exist', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('الرؤى')).toBeInTheDocument()
      })

      // Switch to insights tab
      await user.click(screen.getByText('الرؤى'))

      await waitFor(() => {
        expect(screen.getByText('رؤى التعلم')).toBeInTheDocument()
        expect(screen.getByText('لا توجد رؤى متاحة حالياً')).toBeInTheDocument()
      })
    })

    it('should display insights when available', async () => {
      const mockInsights = [
        {
          category: 'prediction_accuracy',
          insight: 'Model accuracy improved by 5%',
          insightAr: 'تحسنت دقة النموذج بنسبة 5%',
          impact: 0.05,
          actionable: true,
          recommendations: ['Retrain with recent data', 'Adjust parameters']
        }
      ]

      mockMachineLearningService.getLearningInsights.mockResolvedValue(mockInsights)

      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('الرؤى')).toBeInTheDocument()
      })

      // Switch to insights tab
      await user.click(screen.getByText('الرؤى'))

      await waitFor(() => {
        expect(screen.getByText('تحسنت دقة النموذج بنسبة 5%')).toBeInTheDocument()
        expect(screen.getByText('يتطلب إجراء')).toBeInTheDocument()
        expect(screen.getByText('التوصيات:')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should update form fields correctly', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByLabelText('القيمة المقدرة')).toBeInTheDocument()
      })

      const estimatedValueInput = screen.getByLabelText('القيمة المقدرة') as HTMLInputElement
      await user.clear(estimatedValueInput)
      await user.type(estimatedValueInput, '2000000')

      expect(estimatedValueInput.value).toBe('2000000')

      const competitorCountInput = screen.getByLabelText('عدد المنافسين') as HTMLInputElement
      await user.clear(competitorCountInput)
      await user.type(competitorCountInput, '5')

      expect(competitorCountInput.value).toBe('5')
    })

    it('should switch between tabs correctly', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('توليد توقع تسعير جديد')).toBeInTheDocument()
      })

      // Switch to models tab
      await user.click(screen.getByText('النماذج'))
      expect(screen.getByText('نماذج التعلم الآلي')).toBeInTheDocument()

      // Switch to patterns tab
      await user.click(screen.getByText('الأنماط'))
      expect(screen.getByText('الأنماط المكتشفة')).toBeInTheDocument()

      // Switch to insights tab
      await user.click(screen.getByText('الرؤى'))
      expect(screen.getByText('رؤى التعلم')).toBeInTheDocument()

      // Switch back to predictions tab
      await user.click(screen.getByText('التوقعات'))
      expect(screen.getByText('توليد توقع تسعير جديد')).toBeInTheDocument()
    })

    it('should handle service errors gracefully', async () => {
      mockMachineLearningService.getPricingPrediction.mockRejectedValue(
        new Error('Prediction failed')
      )

      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('توليد توقع التسعير')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('توليد توقع التسعير')
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('فشل في توليد توقع التسعير')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByLabelText('النموذج المستخدم')).toBeInTheDocument()
        expect(screen.getByLabelText('القيمة المقدرة')).toBeInTheDocument()
        expect(screen.getByLabelText('عدد المنافسين')).toBeInTheDocument()
        expect(screen.getByLabelText('اتجاه السوق')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(<MachineLearningPricing tenderId="tender_1" />)

      await waitFor(() => {
        expect(screen.getByText('التوقعات')).toBeInTheDocument()
      })

      // Tab navigation should work
      const firstTab = screen.getByText('التوقعات')
      firstTab.focus()
      expect(document.activeElement).toBe(firstTab)
    })
  })
})
