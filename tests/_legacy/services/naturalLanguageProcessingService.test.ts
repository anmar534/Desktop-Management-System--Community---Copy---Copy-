/**
 * Natural Language Processing Service Tests
 * Comprehensive test suite for NLP service functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { naturalLanguageProcessingService } from '../../src/services/naturalLanguageProcessingService'
import type {
  DocumentInput,
  ExtractionType,
  ComplianceStatus
} from '../../src/types/naturalLanguageProcessing'

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('NaturalLanguageProcessingService', () => {
  let mockStorage: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get the mocked storage
    const { asyncStorage } = await import('../../src/utils/storage')
    mockStorage = asyncStorage

    // Setup default mock implementations
    mockStorage.getItem.mockImplementation((key: string, defaultValue: any) => {
      return Promise.resolve(defaultValue)
    })
    mockStorage.setItem.mockResolvedValue(undefined)
    mockStorage.removeItem.mockResolvedValue(undefined)
    mockStorage.hasItem.mockResolvedValue(false)
  })

  describe('Document Processing', () => {
    it('should process document and create processing job', async () => {
      const document: DocumentInput = {
        id: 'doc_001',
        name: 'Test Document',
        nameAr: 'مستند تجريبي',
        type: 'tender_document',
        content: 'Sample document content',
        language: 'ar',
        metadata: {
          source: 'test',
          tags: [],
          customFields: {}
        },
        uploadedAt: '2024-01-01T00:00:00Z',
        size: 1024,
        format: 'pdf'
      }

      const extractionTypes: ExtractionType[] = ['boq_extraction', 'specification_analysis']

      const job = await naturalLanguageProcessingService.processDocument(document, extractionTypes)

      expect(job).toBeDefined()
      expect(job.documentId).toBe(document.id)
      expect(job.type).toBe(extractionTypes[0])
      expect(job.status).toBe('pending')
      expect(job.progress).toBe(0)
      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_processing_jobs', [job])
    })

    it('should get processing job by id', async () => {
      const jobId = 'job_001'
      const mockJob = {
        id: jobId,
        type: 'boq_extraction' as ExtractionType,
        documentId: 'doc_001',
        status: 'completed' as const,
        progress: 100,
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:05:00Z'
      }

      mockStorage.getItem.mockResolvedValue([mockJob])

      const result = await naturalLanguageProcessingService.getProcessingJob(jobId)

      expect(result).toEqual(mockJob)
      expect(mockStorage.getItem).toHaveBeenCalledWith('nlp_processing_jobs', [])
    })

    it('should return null for non-existent processing job', async () => {
      mockStorage.getItem.mockResolvedValue([])

      const result = await naturalLanguageProcessingService.getProcessingJob('non_existent')

      expect(result).toBeNull()
    })

    it('should get processing jobs by document id', async () => {
      const documentId = 'doc_001'
      const mockJobs = [
        { id: 'job_001', documentId, type: 'boq_extraction' as ExtractionType, status: 'completed' as const, progress: 100, startedAt: '2024-01-01T00:00:00Z' },
        { id: 'job_002', documentId: 'doc_002', type: 'specification_analysis' as ExtractionType, status: 'processing' as const, progress: 50, startedAt: '2024-01-01T00:01:00Z' }
      ]

      mockStorage.getItem.mockResolvedValue(mockJobs)

      const result = await naturalLanguageProcessingService.getProcessingJobs(documentId)

      expect(result).toHaveLength(1)
      expect(result[0].documentId).toBe(documentId)
    })

    it('should cancel processing job', async () => {
      const jobId = 'job_001'
      const mockJob = {
        id: jobId,
        type: 'boq_extraction' as ExtractionType,
        documentId: 'doc_001',
        status: 'processing' as const,
        progress: 50,
        startedAt: '2024-01-01T00:00:00Z'
      }

      mockStorage.getItem.mockResolvedValue([mockJob])

      await naturalLanguageProcessingService.cancelProcessingJob(jobId)

      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_processing_jobs', [
        { ...mockJob, status: 'cancelled', completedAt: expect.any(String) }
      ])
    })

    it('should handle storage errors gracefully', async () => {
      const document: DocumentInput = {
        id: 'doc_001',
        name: 'Test Document',
        nameAr: 'مستند تجريبي',
        type: 'tender_document',
        content: 'Sample content',
        language: 'ar',
        metadata: { source: 'test', tags: [], customFields: {} },
        uploadedAt: '2024-01-01T00:00:00Z',
        size: 1024,
        format: 'pdf'
      }

      mockStorage.getItem.mockRejectedValue(new Error('Storage error'))

      await expect(naturalLanguageProcessingService.processDocument(document, ['boq_extraction']))
        .rejects.toThrow('فشل في معالجة المستند')
    })
  })

  describe('BOQ Extraction', () => {
    it('should extract BOQ from document', async () => {
      const documentId = 'doc_001'

      const extraction = await naturalLanguageProcessingService.extractBOQ(documentId)

      expect(extraction).toBeDefined()
      expect(extraction.documentId).toBe(documentId)
      expect(extraction.items).toBeInstanceOf(Array)
      expect(extraction.totalItems).toBeGreaterThan(0)
      expect(extraction.confidence).toBeGreaterThan(0)
      expect(extraction.confidence).toBeLessThanOrEqual(1)
      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_boq_extractions', [extraction])
    })

    it('should get BOQ extraction by id', async () => {
      const extractionId = 'boq_001'
      const mockExtraction = {
        id: extractionId,
        documentId: 'doc_001',
        items: [],
        totalItems: 0,
        currency: 'SAR',
        extractionDate: '2024-01-01T00:00:00Z',
        confidence: 0.9,
        processingTime: 1000,
        errors: [],
        metadata: {
          extractionMethod: 'AI-NLP-v2.1',
          qualityScore: 0.9,
          completeness: 0.85,
          accuracy: 0.9
        }
      }

      mockStorage.getItem.mockResolvedValue([mockExtraction])

      const result = await naturalLanguageProcessingService.getBOQExtraction(extractionId)

      expect(result).toEqual(mockExtraction)
    })

    it('should update BOQ item', async () => {
      const extractionId = 'boq_001'
      const itemId = 'item_001'
      const mockExtraction = {
        id: extractionId,
        documentId: 'doc_001',
        items: [
          {
            id: itemId,
            itemNumber: '01.01.001',
            description: 'Original description',
            descriptionAr: 'وصف أصلي',
            unit: 'M3',
            unitAr: 'متر مكعب',
            quantity: 100,
            category: 'Earthworks',
            categoryAr: 'أعمال ترابية',
            specifications: [],
            confidence: 0.9,
            extractedFrom: 'Table 1'
          }
        ],
        totalItems: 1,
        currency: 'SAR',
        extractionDate: '2024-01-01T00:00:00Z',
        confidence: 0.9,
        processingTime: 1000,
        errors: [],
        metadata: {
          extractionMethod: 'AI-NLP-v2.1',
          qualityScore: 0.9,
          completeness: 0.85,
          accuracy: 0.9
        }
      }

      mockStorage.getItem.mockResolvedValue([mockExtraction])

      const updates = { quantity: 150, unitPrice: 50 }
      const updatedItem = await naturalLanguageProcessingService.updateBOQItem(extractionId, itemId, updates)

      expect(updatedItem.quantity).toBe(150)
      expect(updatedItem.unitPrice).toBe(50)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should throw error when updating non-existent BOQ extraction', async () => {
      mockStorage.getItem.mockResolvedValue([])

      await expect(naturalLanguageProcessingService.updateBOQItem('non_existent', 'item_001', {}))
        .rejects.toThrow('استخراج جدول الكميات غير موجود')
    })

    it('should export BOQ in specified format', async () => {
      const extractionId = 'boq_001'
      const mockExtraction = {
        id: extractionId,
        documentId: 'doc_001',
        items: [],
        totalItems: 0,
        currency: 'SAR',
        extractionDate: '2024-01-01T00:00:00Z',
        confidence: 0.9,
        processingTime: 1000,
        errors: [],
        metadata: {
          extractionMethod: 'AI-NLP-v2.1',
          qualityScore: 0.9,
          completeness: 0.85,
          accuracy: 0.9
        }
      }

      mockStorage.getItem.mockResolvedValue([mockExtraction])

      const exportData = await naturalLanguageProcessingService.exportBOQ(extractionId, 'excel')

      expect(exportData).toBeDefined()
      expect(typeof exportData).toBe('string')
      
      const parsed = JSON.parse(exportData)
      expect(parsed.extraction).toEqual(mockExtraction)
      expect(parsed.format).toBe('excel')
    })

    it('should throw error when exporting non-existent BOQ', async () => {
      mockStorage.getItem.mockResolvedValue([])

      await expect(naturalLanguageProcessingService.exportBOQ('non_existent', 'excel'))
        .rejects.toThrow('استخراج جدول الكميات غير موجود')
    })
  })

  describe('Specification Analysis', () => {
    it('should analyze specifications', async () => {
      const documentId = 'doc_001'

      const analysis = await naturalLanguageProcessingService.analyzeSpecifications(documentId)

      expect(analysis).toBeDefined()
      expect(analysis.documentId).toBe(documentId)
      expect(analysis.requirements).toBeInstanceOf(Array)
      expect(analysis.totalRequirements).toBeGreaterThan(0)
      expect(analysis.complianceScore).toBeGreaterThan(0)
      expect(analysis.complianceScore).toBeLessThanOrEqual(1)
      expect(analysis.summary).toBeDefined()
      expect(analysis.recommendations).toBeInstanceOf(Array)
      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_spec_analyses', [analysis])
    })

    it('should get specification analysis by id', async () => {
      const analysisId = 'spec_001'
      const mockAnalysis = {
        id: analysisId,
        documentId: 'doc_001',
        requirements: [],
        totalRequirements: 0,
        complianceScore: 0.85,
        analysisDate: '2024-01-01T00:00:00Z',
        processingTime: 2000,
        summary: {
          criticalRequirements: 0,
          complianceRate: 0.85,
          riskLevel: 'medium' as const,
          keyFindings: [],
          keyFindingsAr: [],
          actionItems: [],
          actionItemsAr: []
        },
        recommendations: [],
        recommendationsAr: []
      }

      mockStorage.getItem.mockResolvedValue([mockAnalysis])

      const result = await naturalLanguageProcessingService.getSpecificationAnalysis(analysisId)

      expect(result).toEqual(mockAnalysis)
    })

    it('should update compliance status', async () => {
      const analysisId = 'spec_001'
      const requirementId = 'req_001'
      const mockAnalysis = {
        id: analysisId,
        documentId: 'doc_001',
        requirements: [
          {
            id: requirementId,
            section: 'Safety',
            sectionAr: 'السلامة',
            requirement: 'Safety requirement',
            requirementAr: 'متطلب السلامة',
            type: 'safety' as const,
            priority: 'critical' as const,
            compliance: 'partial' as ComplianceStatus,
            references: [],
            confidence: 0.9
          }
        ],
        totalRequirements: 1,
        complianceScore: 0.85,
        analysisDate: '2024-01-01T00:00:00Z',
        processingTime: 2000,
        summary: {
          criticalRequirements: 1,
          complianceRate: 0.85,
          riskLevel: 'medium' as const,
          keyFindings: [],
          keyFindingsAr: [],
          actionItems: [],
          actionItemsAr: []
        },
        recommendations: [],
        recommendationsAr: []
      }

      mockStorage.getItem.mockResolvedValue([mockAnalysis])

      await naturalLanguageProcessingService.updateComplianceStatus(analysisId, requirementId, 'compliant')

      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedData = mockStorage.setItem.mock.calls[0][1]
      expect(savedData[0].requirements[0].compliance).toBe('compliant')
    })

    it('should throw error when updating non-existent analysis', async () => {
      mockStorage.getItem.mockResolvedValue([])

      await expect(naturalLanguageProcessingService.updateComplianceStatus('non_existent', 'req_001', 'compliant'))
        .rejects.toThrow('تحليل المواصفات غير موجود')
    })
  })

  describe('Risk Identification', () => {
    it('should identify risks in document', async () => {
      const documentId = 'doc_001'

      const analysis = await naturalLanguageProcessingService.identifyRisks(documentId)

      expect(analysis).toBeDefined()
      expect(analysis.documentId).toBe(documentId)
      expect(analysis.risks).toBeInstanceOf(Array)
      expect(analysis.totalRisks).toBeGreaterThan(0)
      expect(analysis.riskScore).toBeGreaterThan(0)
      expect(analysis.riskScore).toBeLessThanOrEqual(1)
      expect(analysis.summary).toBeDefined()
      expect(analysis.recommendations).toBeInstanceOf(Array)
      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_risk_analyses', [analysis])
    })

    it('should get risk analysis by id', async () => {
      const analysisId = 'risk_001'
      const mockAnalysis = {
        id: analysisId,
        documentId: 'doc_001',
        risks: [],
        totalRisks: 0,
        riskScore: 0.7,
        analysisDate: '2024-01-01T00:00:00Z',
        processingTime: 3000,
        summary: {
          criticalRisks: 0,
          highRisks: 0,
          mediumRisks: 0,
          lowRisks: 0,
          overallRiskLevel: 'medium' as const,
          topRiskCategories: [],
          riskTrends: []
        },
        recommendations: []
      }

      mockStorage.getItem.mockResolvedValue([mockAnalysis])

      const result = await naturalLanguageProcessingService.getRiskAnalysis(analysisId)

      expect(result).toEqual(mockAnalysis)
    })

    it('should update risk assessment', async () => {
      const analysisId = 'risk_001'
      const riskId = 'risk_001'
      const mockAnalysis = {
        id: analysisId,
        documentId: 'doc_001',
        risks: [
          {
            id: riskId,
            type: 'technical' as const,
            category: 'construction' as const,
            description: 'Technical risk',
            descriptionAr: 'مخاطر فنية',
            severity: 'medium' as const,
            probability: 'medium' as const,
            impact: 'moderate' as const,
            source: 'Analysis',
            context: 'Context',
            mitigation: [],
            mitigationAr: [],
            confidence: 0.8
          }
        ],
        totalRisks: 1,
        riskScore: 0.7,
        analysisDate: '2024-01-01T00:00:00Z',
        processingTime: 3000,
        summary: {
          criticalRisks: 0,
          highRisks: 0,
          mediumRisks: 1,
          lowRisks: 0,
          overallRiskLevel: 'medium' as const,
          topRiskCategories: ['technical'],
          riskTrends: []
        },
        recommendations: []
      }

      mockStorage.getItem.mockResolvedValue([mockAnalysis])

      const updates = { severity: 'high' as const, probability: 'high' as const }
      const updatedRisk = await naturalLanguageProcessingService.updateRiskAssessment(analysisId, riskId, updates)

      expect(updatedRisk.severity).toBe('high')
      expect(updatedRisk.probability).toBe('high')
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should throw error when updating non-existent risk analysis', async () => {
      mockStorage.getItem.mockResolvedValue([])

      await expect(naturalLanguageProcessingService.updateRiskAssessment('non_existent', 'risk_001', {}))
        .rejects.toThrow('تحليل المخاطر غير موجود')
    })
  })

  describe('Document Categorization', () => {
    it('should categorize document', async () => {
      const documentId = 'doc_001'

      // Mock categories
      mockStorage.getItem.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'nlp_document_categories') {
          return Promise.resolve([
            {
              id: 'cat_001',
              name: 'Tender Document',
              nameAr: 'وثيقة مناقصة',
              description: 'Tender documents',
              descriptionAr: 'وثائق المناقصات',
              keywords: ['tender'],
              keywordsAr: ['مناقصة'],
              rules: [],
              confidence: 0.9
            }
          ])
        }
        return Promise.resolve(defaultValue)
      })

      const categorization = await naturalLanguageProcessingService.categorizeDocument(documentId)

      expect(categorization).toBeDefined()
      expect(categorization.documentId).toBe(documentId)
      expect(categorization.categories).toBeInstanceOf(Array)
      expect(categorization.primaryCategory).toBeDefined()
      expect(categorization.confidence).toBeGreaterThan(0)
      expect(categorization.confidence).toBeLessThanOrEqual(1)
      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_categorizations', [categorization])
    })

    it('should get categorization by id', async () => {
      const categorizationId = 'cat_001'
      const mockCategorization = {
        id: categorizationId,
        documentId: 'doc_001',
        categories: [],
        primaryCategory: {
          id: 'cat_001',
          name: 'Test Category',
          nameAr: 'تصنيف تجريبي',
          description: 'Test',
          descriptionAr: 'تجريبي',
          keywords: [],
          keywordsAr: [],
          rules: [],
          confidence: 0.8
        },
        confidence: 0.8,
        processingTime: 1000,
        metadata: {
          method: 'AI-Classification',
          modelVersion: '1.0',
          features: [],
          accuracy: 0.8,
          alternatives: []
        }
      }

      mockStorage.getItem.mockResolvedValue([mockCategorization])

      const result = await naturalLanguageProcessingService.getCategorization(categorizationId)

      expect(result).toEqual(mockCategorization)
    })

    it('should get document categories', async () => {
      const mockCategories = [
        {
          id: 'cat_001',
          name: 'Category 1',
          nameAr: 'تصنيف 1',
          description: 'Description 1',
          descriptionAr: 'وصف 1',
          keywords: [],
          keywordsAr: [],
          rules: [],
          confidence: 0.9
        }
      ]

      mockStorage.getItem.mockResolvedValue(mockCategories)

      const result = await naturalLanguageProcessingService.getCategories()

      expect(result).toEqual(mockCategories)
    })

    it('should create new category', async () => {
      const categoryData = {
        name: 'New Category',
        nameAr: 'تصنيف جديد',
        description: 'New category description',
        descriptionAr: 'وصف التصنيف الجديد',
        keywords: ['new'],
        keywordsAr: ['جديد'],
        rules: [],
        confidence: 0.8
      }

      mockStorage.getItem.mockResolvedValue([])

      const newCategory = await naturalLanguageProcessingService.createCategory(categoryData)

      expect(newCategory).toBeDefined()
      expect(newCategory.id).toBeDefined()
      expect(newCategory.name).toBe(categoryData.name)
      expect(newCategory.nameAr).toBe(categoryData.nameAr)
      expect(mockStorage.setItem).toHaveBeenCalledWith('nlp_document_categories', [newCategory])
    })
  })

  describe('Analytics', () => {
    it('should get processing statistics', async () => {
      const mockJobs = [
        { id: 'job_001', documentId: 'doc_001', type: 'boq_extraction' as ExtractionType, status: 'completed' as const, progress: 100, startedAt: '2024-01-01T00:00:00Z', completedAt: '2024-01-01T00:05:00Z' },
        { id: 'job_002', documentId: 'doc_002', type: 'specification_analysis' as ExtractionType, status: 'failed' as const, progress: 0, startedAt: '2024-01-01T00:01:00Z' }
      ]

      mockStorage.getItem.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'nlp_processing_jobs') {
          return Promise.resolve(mockJobs)
        }
        return Promise.resolve(defaultValue)
      })

      const statistics = await naturalLanguageProcessingService.getProcessingStatistics()

      expect(statistics).toBeDefined()
      expect(statistics.totalDocuments).toBe(2)
      expect(statistics.totalExtractions).toBe(2)
      expect(statistics.successRate).toBe(0.5)
      expect(statistics.errorRate).toBe(0.5)
      expect(statistics.byType).toBeDefined()
      expect(statistics.trends).toBeInstanceOf(Array)
    })

    it('should get accuracy metrics', async () => {
      const metrics = await naturalLanguageProcessingService.getAccuracyMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.overallAccuracy).toBeGreaterThan(0)
      expect(metrics.overallAccuracy).toBeLessThanOrEqual(1)
      expect(metrics.boqAccuracy).toBeGreaterThan(0)
      expect(metrics.specificationAccuracy).toBeGreaterThan(0)
      expect(metrics.riskAccuracy).toBeGreaterThan(0)
      expect(metrics.categorizationAccuracy).toBeGreaterThan(0)
      expect(metrics.byDocumentType).toBeDefined()
      expect(metrics.confidenceDistribution).toBeDefined()
    })

    it('should export processing data', async () => {
      const dateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z'
      }

      const mockJobs = [
        { id: 'job_001', documentId: 'doc_001', type: 'boq_extraction' as ExtractionType, status: 'completed' as const, progress: 100, startedAt: '2024-01-15T00:00:00Z' }
      ]

      mockStorage.getItem.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'nlp_processing_jobs') {
          return Promise.resolve(mockJobs)
        }
        return Promise.resolve(defaultValue)
      })

      const exportData = await naturalLanguageProcessingService.exportProcessingData(dateRange)

      expect(exportData).toBeDefined()
      expect(typeof exportData).toBe('string')
      
      const parsed = JSON.parse(exportData)
      expect(parsed.dateRange).toEqual(dateRange)
      expect(parsed.totalJobs).toBe(1)
      expect(parsed.jobs).toHaveLength(1)
      expect(parsed.statistics).toBeDefined()
      expect(parsed.metrics).toBeDefined()
    })
  })
})
