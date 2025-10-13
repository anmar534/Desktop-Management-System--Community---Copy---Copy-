/**
 * Machine Learning Service Tests
 * Comprehensive test suite for AI-driven pricing optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { machineLearningService } from '../../src/services/machineLearningService'
import type {
  MLModel,
  TrainingConfig,
  PricingContext,
  LearningFeedback,
  PatternType
} from '../../src/types/machineLearning'

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('MachineLearningService', () => {
  let mockAsyncStorage: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked storage
    const { asyncStorage } = await import('../../src/utils/storage')
    mockAsyncStorage = vi.mocked(asyncStorage)
    
    // Setup default mock implementations
    mockAsyncStorage.getItem.mockResolvedValue([])
    mockAsyncStorage.setItem.mockResolvedValue(undefined)
    mockAsyncStorage.removeItem.mockResolvedValue(undefined)
    mockAsyncStorage.hasItem.mockResolvedValue(false)
  })

  describe('Model Management', () => {
    it('should get all models', async () => {
      const mockModels: MLModel[] = [
        {
          id: 'model_1',
          name: 'Test Model',
          nameAr: 'نموذج تجريبي',
          type: 'pricing_optimization',
          version: '1.0.0',
          status: 'ready',
          accuracy: 0.85,
          confidence: 0.9,
          trainingData: {
            id: 'dataset_1',
            name: 'Test Dataset',
            nameAr: 'مجموعة بيانات تجريبية',
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
      ]

      mockAsyncStorage.getItem.mockResolvedValue(mockModels)

      const result = await machineLearningService.getModels()

      expect(result).toEqual(mockModels)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('ml_models', [])
    })

    it('should get a specific model by id', async () => {
      const mockModels: MLModel[] = [
        {
          id: 'model_1',
          name: 'Test Model',
          nameAr: 'نموذج تجريبي',
          type: 'pricing_optimization',
          version: '1.0.0',
          status: 'ready',
          accuracy: 0.85,
          confidence: 0.9,
          trainingData: {
            id: 'dataset_1',
            name: 'Test Dataset',
            nameAr: 'مجموعة بيانات تجريبية',
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
      ]

      mockAsyncStorage.getItem.mockResolvedValue(mockModels)

      const result = await machineLearningService.getModel('model_1')

      expect(result).toEqual(mockModels[0])
    })

    it('should return null for non-existent model', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await machineLearningService.getModel('non_existent')

      expect(result).toBeNull()
    })

    it('should train a new model', async () => {
      const trainingConfig: TrainingConfig = {
        name: 'New Model',
        nameAr: 'نموذج جديد',
        type: 'pricing_optimization',
        dataset: {
          id: 'dataset_1',
          name: 'Training Dataset',
          nameAr: 'مجموعة بيانات التدريب',
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
        parameters: {
          algorithm: 'random_forest',
          hyperparameters: {},
          featureSelection: { method: 'importance', threshold: 0.01 },
          validation: { method: 'cross_validation', folds: 5, testSize: 0.2 },
          optimization: { objective: 'mse', maxIterations: 1000, tolerance: 0.001 }
        },
        validation: {
          method: 'cross_validation',
          folds: 5,
          testSize: 0.2
        }
      }

      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await machineLearningService.trainModel(trainingConfig)

      expect(result.name).toBe(trainingConfig.name)
      expect(result.nameAr).toBe(trainingConfig.nameAr)
      expect(result.type).toBe(trainingConfig.type)
      expect(result.status).toBe('ready')
      expect(result.isActive).toBe(true)
      expect(result.accuracy).toBeGreaterThan(0)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should update an existing model', async () => {
      const existingModel: MLModel = {
        id: 'model_1',
        name: 'Test Model',
        nameAr: 'نموذج تجريبي',
        type: 'pricing_optimization',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        confidence: 0.9,
        trainingData: {
          id: 'dataset_1',
          name: 'Test Dataset',
          nameAr: 'مجموعة بيانات تجريبية',
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

      mockAsyncStorage.getItem.mockResolvedValue([existingModel])

      const updates = { accuracy: 0.9, confidence: 0.95 }
      const result = await machineLearningService.updateModel('model_1', updates)

      expect(result.accuracy).toBe(0.9)
      expect(result.confidence).toBe(0.95)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should delete a model', async () => {
      const existingModel: MLModel = {
        id: 'model_1',
        name: 'Test Model',
        nameAr: 'نموذج تجريبي',
        type: 'pricing_optimization',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        confidence: 0.9,
        trainingData: {
          id: 'dataset_1',
          name: 'Test Dataset',
          nameAr: 'مجموعة بيانات تجريبية',
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

      mockAsyncStorage.getItem.mockResolvedValue([existingModel])

      await machineLearningService.deleteModel('model_1')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('ml_models', [])
    })
  })

  describe('Pricing Predictions', () => {
    it('should generate pricing prediction', async () => {
      const activeModel: MLModel = {
        id: 'model_1',
        name: 'Pricing Model',
        nameAr: 'نموذج التسعير',
        type: 'pricing_optimization',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        confidence: 0.9,
        trainingData: {
          id: 'dataset_1',
          name: 'Test Dataset',
          nameAr: 'مجموعة بيانات تجريبية',
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

      const context: PricingContext = {
        tender: { id: 'tender_1', estimatedValue: 1000000 },
        market: {
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
        competitors: [],
        historical: [],
        constraints: []
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([activeModel]) // getModels call
        .mockResolvedValueOnce([]) // getPredictions call

      const result = await machineLearningService.getPricingPrediction('tender_1', context)

      expect(result.tenderId).toBe('tender_1')
      expect(result.modelId).toBe('model_1')
      expect(result.prediction.recommendedPrice).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.factors).toBeInstanceOf(Array)
      expect(result.alternatives).toBeInstanceOf(Array)
      expect(result.risks).toBeInstanceOf(Array)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should handle missing active pricing model', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const context: PricingContext = {
        tender: { id: 'tender_1', estimatedValue: 1000000 },
        market: {
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
        competitors: [],
        historical: [],
        constraints: []
      }

      await expect(
        machineLearningService.getPricingPrediction('tender_1', context)
      ).rejects.toThrow('لا يوجد نموذج تسعير نشط')
    })

    it('should generate batch predictions', async () => {
      const activeModel: MLModel = {
        id: 'model_1',
        name: 'Pricing Model',
        nameAr: 'نموذج التسعير',
        type: 'pricing_optimization',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        confidence: 0.9,
        trainingData: {
          id: 'dataset_1',
          name: 'Test Dataset',
          nameAr: 'مجموعة بيانات تجريبية',
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

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([activeModel]) // First getModels call
        .mockResolvedValueOnce([]) // First getPredictions call
        .mockResolvedValueOnce([activeModel]) // Second getModels call
        .mockResolvedValueOnce([]) // Second getPredictions call

      const tenderIds = ['tender_1', 'tender_2']
      const result = await machineLearningService.getBatchPredictions(tenderIds)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(2)
      expect(result[0].tenderId).toBe('tender_1')
      expect(result[1].tenderId).toBe('tender_2')
    })
  })

  describe('Pattern Recognition', () => {
    it('should identify patterns in data', async () => {
      const testData = [
        { season: 'winter', price: 1000000, won: true },
        { season: 'winter', price: 950000, won: true },
        { season: 'summer', price: 1100000, won: false }
      ]

      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await machineLearningService.identifyPatterns(testData, 'seasonal_pricing')

      expect(result.type).toBe('seasonal_pricing')
      expect(result.nameAr).toBe('أنماط التسعير الموسمية')
      expect(result.patterns).toBeInstanceOf(Array)
      expect(result.confidence).toBeGreaterThan(0)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should get patterns by type', async () => {
      const mockPatterns = [
        {
          id: 'pattern_1',
          name: 'Seasonal Patterns',
          nameAr: 'الأنماط الموسمية',
          type: 'seasonal_pricing' as PatternType,
          patterns: [],
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

      mockAsyncStorage.getItem.mockResolvedValue(mockPatterns)

      const result = await machineLearningService.getPatterns('seasonal_pricing')

      expect(result).toEqual(mockPatterns)
      expect(result[0].type).toBe('seasonal_pricing')
    })

    it('should apply pattern to context', async () => {
      const mockPattern = {
        id: 'pattern_1',
        name: 'Seasonal Patterns',
        nameAr: 'الأنماط الموسمية',
        type: 'seasonal_pricing' as PatternType,
        patterns: [],
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

      mockAsyncStorage.getItem.mockResolvedValue([mockPattern])

      const context = { season: 'winter', projectType: 'residential' }
      const result = await machineLearningService.applyPattern('pattern_1', context)

      expect(result.applicable).toBe(true)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.adjustments).toBeInstanceOf(Array)
    })
  })

  describe('Learning and Feedback', () => {
    it('should submit learning feedback', async () => {
      const feedback: LearningFeedback = {
        id: 'feedback_1',
        predictionId: 'pred_1',
        actualOutcome: {
          won: true,
          finalPrice: 950000,
          actualMargin: 0.12
        },
        feedback: {
          predictionAccuracy: 0.9,
          factorAccuracy: {},
          unexpectedFactors: [],
          userRating: 4,
          comments: 'Good prediction',
          commentsAr: 'توقع جيد'
        },
        accuracy: 0.9,
        learningPoints: [],
        modelUpdates: [],
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      mockAsyncStorage.getItem.mockResolvedValue([])

      await machineLearningService.submitFeedback(feedback)

      // Check that feedback was stored
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'ml_feedback',
        expect.arrayContaining([feedback])
      )

      // Check that insights were generated
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'ml_insights',
        expect.arrayContaining([
          expect.objectContaining({
            category: 'prediction_accuracy',
            impact: 0.9
          })
        ])
      )
    })

    it('should get learning insights', async () => {
      const mockInsights = [
        {
          category: 'accuracy',
          insight: 'Model accuracy improved',
          insightAr: 'تحسنت دقة النموذج',
          impact: 0.1,
          actionable: false,
          recommendations: []
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(mockInsights)

      const result = await machineLearningService.getLearningInsights()

      expect(result).toEqual(mockInsights)
    })

    it('should schedule model update', async () => {
      const mockModel = {
        id: 'model_1',
        name: 'Test Model',
        nameAr: 'نموذج تجريبي'
      }

      mockAsyncStorage.getItem.mockResolvedValue([mockModel])

      // Should not throw error
      await expect(
        machineLearningService.scheduleModelUpdate('model_1', 'retrain')
      ).resolves.toBeUndefined()
    })
  })

  describe('Analytics', () => {
    it('should get model performance', async () => {
      const mockModel: MLModel = {
        id: 'model_1',
        name: 'Test Model',
        nameAr: 'نموذج تجريبي',
        type: 'pricing_optimization',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        confidence: 0.9,
        trainingData: {
          id: 'dataset_1',
          name: 'Test Dataset',
          nameAr: 'مجموعة بيانات تجريبية',
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

      mockAsyncStorage.getItem.mockResolvedValue([mockModel])

      const result = await machineLearningService.getModelPerformance('model_1')

      expect(result).toEqual(mockModel.performance)
    })

    it('should get performance trends', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await machineLearningService.getPerformanceTrends('model_1', '30d')

      expect(result.accuracy).toBeInstanceOf(Array)
      expect(result.predictions).toBeInstanceOf(Array)
      expect(result.errors).toBeInstanceOf(Array)
    })

    it('should export model data', async () => {
      const mockModel: MLModel = {
        id: 'model_1',
        name: 'Test Model',
        nameAr: 'نموذج تجريبي',
        type: 'pricing_optimization',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        confidence: 0.9,
        trainingData: {
          id: 'dataset_1',
          name: 'Test Dataset',
          nameAr: 'مجموعة بيانات تجريبية',
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

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockModel]) // getModel call
        .mockResolvedValueOnce([]) // getPatterns call

      const result = await machineLearningService.exportModelData('model_1')

      expect(result.model).toEqual(mockModel)
      expect(result.format).toBe('json')
      expect(result.data).toEqual(mockModel.trainingData)
      expect(result.performance).toEqual(mockModel.performance)
      expect(result.patterns).toBeInstanceOf(Array)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

      await expect(machineLearningService.getModels()).rejects.toThrow('فشل في تحميل نماذج التعلم الآلي')
    })

    it('should handle update of non-existent model', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      await expect(
        machineLearningService.updateModel('non_existent', { accuracy: 0.9 })
      ).rejects.toThrow('النموذج غير موجود: non_existent')
    })

    it('should handle export of non-existent model', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      await expect(
        machineLearningService.exportModelData('non_existent')
      ).rejects.toThrow('النموذج غير موجود')
    })
  })
})
