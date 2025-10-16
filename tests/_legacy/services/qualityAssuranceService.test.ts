/**
 * Quality Assurance Service Tests
 * Comprehensive test suite for quality assurance functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import qualityAssuranceService from '../../src/services/qualityAssuranceService'
import type { 
  PricingData, 
  DocumentData, 
  QualityCheckData,
  PricingValidationRule,
  CompletenessTemplate,
  ConsistencyRule,
  BackupConfiguration,
  BackupSchedule,
  QualityReportConfig,
  QualityError,
  CorrectionAction,
  DocumentSet
} from '../../src/types/qualityAssurance'

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('QualityAssuranceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Pricing Validation', () => {
    const mockPricingData: PricingData = {
      id: 'pricing_1',
      projectId: 'project_1',
      items: [
        {
          id: 'item_1',
          name: 'Construction Material',
          nameAr: 'مواد البناء',
          quantity: 100,
          unitPrice: 50,
          totalPrice: 5000,
          unit: 'kg',
          category: 'materials'
        }
      ],
      discounts: [
        {
          id: 'discount_1',
          name: 'Volume Discount',
          nameAr: 'خصم الكمية',
          type: 'percentage',
          value: 10,
          appliedTo: 'total'
        }
      ],
      markups: [
        {
          id: 'markup_1',
          name: 'Profit Margin',
          nameAr: 'هامش الربح',
          type: 'percentage',
          value: 15,
          appliedTo: 'total'
        }
      ],
      taxRate: 15,
      totalAmount: 5175,
      currency: 'SAR',
      lastUpdated: new Date().toISOString()
    }

    const mockPricingRule: Omit<PricingValidationRule, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Price Range Check',
      nameAr: 'فحص نطاق السعر',
      type: 'price_range_check',
      description: 'Validate price ranges',
      descriptionAr: 'التحقق من نطاقات الأسعار',
      isActive: true,
      severity: 'major',
      parameters: {
        minPrice: 10,
        maxPrice: 1000,
        tolerance: 0.05
      },
      conditions: {
        applyToCategories: ['materials'],
        excludeItems: []
      }
    }

    it('should validate pricing data successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await qualityAssuranceService.validatePricing(mockPricingData)

      expect(result).toBeDefined()
      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThan(0)
      expect(result.errors).toBeInstanceOf(Array)
      expect(result.warnings).toBeInstanceOf(Array)
      expect(result.suggestions).toBeInstanceOf(Array)
    })

    it('should create pricing validation rule', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const rule = await qualityAssuranceService.createPricingRule(mockPricingRule)

      expect(rule).toBeDefined()
      expect(rule.id).toBeDefined()
      expect(rule.name).toBe(mockPricingRule.name)
      expect(rule.type).toBe(mockPricingRule.type)
      expect(rule.createdAt).toBeDefined()
      expect(rule.updatedAt).toBeDefined()
    })

    it('should get pricing validation rules', async () => {
      const mockRules = [{ ...mockPricingRule, id: 'rule_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockRules)

      const rules = await qualityAssuranceService.getPricingRules()

      expect(rules).toEqual(mockRules)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('qa_pricing_rules', [])
    })

    it('should update pricing validation rule', async () => {
      const existingRule = { ...mockPricingRule, id: 'rule_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingRule])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const updates = { name: 'Updated Rule Name' }
      const updatedRule = await qualityAssuranceService.updatePricingRule('rule_1', updates)

      expect(updatedRule.name).toBe(updates.name)
      expect(updatedRule.updatedAt).toBeDefined()
    })

    it('should delete pricing validation rule', async () => {
      const existingRule = { ...mockPricingRule, id: 'rule_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingRule])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      await qualityAssuranceService.deletePricingRule('rule_1')

      expect(asyncStorage.setItem).toHaveBeenCalledWith('qa_pricing_rules', [])
    })

    it('should detect calculation errors in pricing', async () => {
      const invalidPricingData = {
        ...mockPricingData,
        items: [
          {
            ...mockPricingData.items[0],
            totalPrice: 4000 // Incorrect calculation (should be 5000)
          }
        ]
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await qualityAssuranceService.validatePricing(invalidPricingData)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].type).toBe('calculation_error')
    })
  })

  describe('Completeness Checking', () => {
    const mockDocumentData: DocumentData = {
      id: 'doc_1',
      name: 'Tender Document',
      nameAr: 'وثيقة العطاء',
      type: 'tender',
      sections: [
        {
          id: 'section_1',
          name: 'Project Details',
          nameAr: 'تفاصيل المشروع',
          type: 'project_info',
          isComplete: false,
          requiredFields: [
            {
              id: 'field_1',
              name: 'Project Name',
              nameAr: 'اسم المشروع',
              type: 'text',
              value: 'Test Project',
              isRequired: true,
              isPresent: true
            },
            {
              id: 'field_2',
              name: 'Project Budget',
              nameAr: 'ميزانية المشروع',
              type: 'number',
              value: '',
              isRequired: true,
              isPresent: false
            }
          ],
          content: {},
          attachments: []
        }
      ],
      lastUpdated: new Date().toISOString()
    }

    const mockCompletenessTemplate: Omit<CompletenessTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Tender Document Template',
      nameAr: 'قالب وثيقة العطاء',
      documentType: 'tender',
      description: 'Template for tender documents',
      descriptionAr: 'قالب لوثائق العطاءات',
      isActive: true,
      requiredSections: [
        {
          id: 'section_1',
          name: 'Project Details',
          nameAr: 'تفاصيل المشروع',
          type: 'project_info',
          isRequired: true,
          requiredFields: [
            {
              id: 'field_1',
              name: 'Project Name',
              nameAr: 'اسم المشروع',
              type: 'text',
              isRequired: true,
              validation: { minLength: 1 }
            },
            {
              id: 'field_2',
              name: 'Project Budget',
              nameAr: 'ميزانية المشروع',
              type: 'number',
              isRequired: true,
              validation: { min: 0 }
            }
          ],
          requiredAttachments: []
        }
      ],
      completionThreshold: 100
    }

    it('should check document completeness', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'qa_completeness_templates') {
          return Promise.resolve([{ ...mockCompletenessTemplate, id: 'template_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
        }
        return Promise.resolve([])
      })

      const result = await qualityAssuranceService.checkCompleteness(mockDocumentData)

      expect(result).toBeDefined()
      expect(result.isComplete).toBe(false)
      expect(result.completionPercentage).toBeLessThan(100)
      expect(result.missingItems.length).toBeGreaterThan(0)
    })

    it('should create completeness template', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const template = await qualityAssuranceService.createCompletenessTemplate(mockCompletenessTemplate)

      expect(template).toBeDefined()
      expect(template.id).toBeDefined()
      expect(template.name).toBe(mockCompletenessTemplate.name)
      expect(template.documentType).toBe(mockCompletenessTemplate.documentType)
    })

    it('should get completeness templates', async () => {
      const mockTemplates = [{ ...mockCompletenessTemplate, id: 'template_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTemplates)

      const templates = await qualityAssuranceService.getCompletenessTemplates()

      expect(templates).toEqual(mockTemplates)
    })

    it('should update completeness template', async () => {
      const existingTemplate = { ...mockCompletenessTemplate, id: 'template_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingTemplate])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const updates = { name: 'Updated Template Name' }
      const updatedTemplate = await qualityAssuranceService.updateCompletenessTemplate('template_1', updates)

      expect(updatedTemplate.name).toBe(updates.name)
      expect(updatedTemplate.updatedAt).toBeDefined()
    })
  })

  describe('Error Detection & Correction', () => {
    const mockQualityCheckData: QualityCheckData = {
      id: 'check_1',
      name: 'Quality Check',
      nameAr: 'فحص الجودة',
      checkTypes: ['data_consistency', 'format_validation', 'business_rules'],
      documents: [
        {
          id: 'doc_1',
          name: 'Test Document',
          nameAr: 'وثيقة اختبار',
          type: 'tender',
          sections: [
            {
              id: 'section_1',
              name: 'Test Section',
              nameAr: 'قسم اختبار',
              type: 'test',
              isComplete: true,
              requiredFields: [
                {
                  id: 'field_1',
                  name: 'Email Field',
                  nameAr: 'حقل البريد الإلكتروني',
                  type: 'email',
                  value: 'invalid-email',
                  isRequired: true,
                  isPresent: true
                }
              ],
              content: {},
              attachments: []
            }
          ],
          lastUpdated: new Date().toISOString()
        }
      ],
      pricingData: {
        id: 'pricing_1',
        projectId: 'project_1',
        items: [],
        discounts: [],
        markups: [],
        taxRate: 15,
        totalAmount: -100, // Invalid negative amount
        currency: 'SAR',
        lastUpdated: new Date().toISOString()
      },
      scope: 'full',
      timestamp: new Date().toISOString()
    }

    it('should detect errors in quality check data', async () => {
      const result = await qualityAssuranceService.detectErrors(mockQualityCheckData)

      expect(result).toBeDefined()
      expect(result.hasErrors).toBe(true)
      expect(result.errorCount).toBeGreaterThan(0)
      expect(result.errors.length).toBeGreaterThan(0)
      
      // Should detect email format error
      const emailError = result.errors.find(e => e.type === 'invalid_format')
      expect(emailError).toBeDefined()
      
      // Should detect business rule violation (negative amount)
      const businessError = result.errors.find(e => e.type === 'business_rule_violation')
      expect(businessError).toBeDefined()
    })

    it('should suggest corrections for errors', async () => {
      const mockErrors: QualityError[] = [
        {
          id: 'error_1',
          type: 'data_type_mismatch',
          severity: 'major',
          category: 'Data Consistency',
          categoryAr: 'اتساق البيانات',
          message: 'Type mismatch error',
          messageAr: 'خطأ عدم تطابق النوع',
          location: {
            document: 'doc_1',
            section: 'section_1',
            field: 'field_1',
            path: 'doc_1.section_1.field_1'
          },
          currentValue: 'text_value',
          expectedValue: 'number',
          autoFixable: true,
          fixComplexity: 'simple',
          impact: 'May cause calculation errors',
          impactAr: 'قد يسبب أخطاء في الحسابات'
        }
      ]

      const suggestions = await qualityAssuranceService.suggestCorrections(mockErrors)

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].errorId).toBe('error_1')
      expect(suggestions[0].type).toBe('auto_fix')
    })

    it('should apply corrections', async () => {
      const mockCorrections: CorrectionAction[] = [
        {
          suggestionId: 'suggestion_1',
          errorId: 'error_1',
          action: 'auto_fix',
          parameters: {
            field: 'field_1',
            newValue: 123
          },
          approved: true,
          appliedBy: 'system',
          appliedAt: new Date().toISOString()
        }
      ]

      const result = await qualityAssuranceService.applyCorrections(mockCorrections)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.correctedErrors.length).toBeGreaterThan(0)
      expect(result.summary.successful).toBeGreaterThan(0)
    })
  })

  describe('Consistency Verification', () => {
    const mockDocumentSet: DocumentSet = {
      id: 'docset_1',
      name: 'Test Document Set',
      nameAr: 'مجموعة وثائق اختبار',
      documents: [
        {
          id: 'doc_1',
          name: 'Document 1',
          nameAr: 'وثيقة 1',
          type: 'tender',
          sections: [
            {
              id: 'section_1',
              name: 'Project Info',
              nameAr: 'معلومات المشروع',
              type: 'project_info',
              isComplete: true,
              requiredFields: [
                {
                  id: 'field_1',
                  name: 'Project Name',
                  nameAr: 'اسم المشروع',
                  type: 'text',
                  value: 'Project A',
                  isRequired: true,
                  isPresent: true
                }
              ],
              content: {},
              attachments: []
            }
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'doc_2',
          name: 'Document 2',
          nameAr: 'وثيقة 2',
          type: 'tender',
          sections: [
            {
              id: 'section_1',
              name: 'Project Info',
              nameAr: 'معلومات المشروع',
              type: 'project_info',
              isComplete: true,
              requiredFields: [
                {
                  id: 'field_1',
                  name: 'Project Name',
                  nameAr: 'اسم المشروع',
                  type: 'text',
                  value: 'Project B', // Different value - inconsistency
                  isRequired: true,
                  isPresent: true
                }
              ],
              content: {},
              attachments: []
            }
          ],
          lastUpdated: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    const mockConsistencyRule: Omit<ConsistencyRule, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Field Consistency Rule',
      nameAr: 'قاعدة اتساق الحقول',
      type: 'field_consistency',
      description: 'Check field consistency across documents',
      descriptionAr: 'فحص اتساق الحقول عبر الوثائق',
      isActive: true,
      severity: 'major',
      scope: 'cross_document',
      conditions: {
        fieldNames: ['Project Name'],
        documentTypes: ['tender']
      },
      autoFix: false
    }

    it('should verify document consistency', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([
        { ...mockConsistencyRule, id: 'rule_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ])

      const result = await qualityAssuranceService.verifyConsistency(mockDocumentSet)

      expect(result).toBeDefined()
      expect(result.isConsistent).toBe(false)
      expect(result.inconsistencies.length).toBeGreaterThan(0)
      expect(result.score).toBeLessThan(100)
    })

    it('should create consistency rule', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const rule = await qualityAssuranceService.createConsistencyRule(mockConsistencyRule)

      expect(rule).toBeDefined()
      expect(rule.id).toBeDefined()
      expect(rule.name).toBe(mockConsistencyRule.name)
      expect(rule.type).toBe(mockConsistencyRule.type)
    })

    it('should get consistency rules', async () => {
      const mockRules = [{ ...mockConsistencyRule, id: 'rule_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockRules)

      const rules = await qualityAssuranceService.getConsistencyRules()

      expect(rules).toEqual(mockRules)
    })
  })

  describe('Backup & Recovery', () => {
    const mockBackupConfig: BackupConfiguration = {
      name: 'Daily Backup',
      nameAr: 'النسخة الاحتياطية اليومية',
      scope: 'full',
      includeData: ['pricing_rules', 'completeness_templates', 'consistency_rules'],
      compression: true,
      encryption: false,
      retentionDays: 30,
      destination: 'local',
      metadata: {
        description: 'Daily full backup',
        descriptionAr: 'نسخة احتياطية كاملة يومية',
        tags: ['daily', 'full']
      }
    }

    const mockBackupSchedule: BackupSchedule = {
      id: 'schedule_1',
      name: 'Daily Backup Schedule',
      nameAr: 'جدولة النسخة الاحتياطية اليومية',
      frequency: 'daily',
      time: '02:00',
      timezone: 'Asia/Riyadh',
      isActive: true,
      backupConfig: mockBackupConfig,
      retryPolicy: {
        maxRetries: 3,
        retryInterval: 300
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        recipients: ['admin@example.com']
      }
    }

    it('should create backup', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await qualityAssuranceService.createBackup(mockBackupConfig)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.backupSize).toBeGreaterThan(0)
      expect(result.itemCount).toBeGreaterThan(0)
    })

    it('should restore from backup', async () => {
      const result = await qualityAssuranceService.restoreFromBackup('backup_123')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.restoredItems).toBeGreaterThan(0)
      expect(result.summary).toBeDefined()
    })

    it('should get backup history', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const history = await qualityAssuranceService.getBackupHistory()

      expect(history).toBeInstanceOf(Array)
    })

    it('should schedule backup', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const scheduledBackup = await qualityAssuranceService.scheduleBackup(mockBackupSchedule)

      expect(scheduledBackup).toBeDefined()
      expect(scheduledBackup.id).toBeDefined()
      expect(scheduledBackup.schedule).toEqual(mockBackupSchedule)
      expect(scheduledBackup.statistics).toBeDefined()
    })
  })

  describe('Analytics & Reporting', () => {
    it('should get quality metrics', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'qa_validation_history') {
          return Promise.resolve([
            {
              id: 'validation_1',
              type: 'pricing',
              entityId: 'pricing_1',
              entityType: 'pricing',
              result: { isValid: true, score: 95, errors: [], warnings: [], suggestions: [] },
              score: 95,
              duration: 100,
              timestamp: new Date().toISOString()
            }
          ])
        }
        return Promise.resolve([])
      })

      const metrics = await qualityAssuranceService.getQualityMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.overall).toBeDefined()
      expect(metrics.pricing).toBeDefined()
      expect(metrics.completeness).toBeDefined()
      expect(metrics.consistency).toBeDefined()
      expect(metrics.errors).toBeDefined()
      expect(metrics.trends).toBeDefined()
      expect(metrics.benchmarks).toBeDefined()
    })

    it('should generate quality report', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'qa_validation_history') {
          return Promise.resolve([])
        }
        if (key === 'qa_quality_metrics') {
          return Promise.resolve({
            overall: { qualityScore: 90, totalChecks: 100, passedChecks: 90, failedChecks: 10, improvementRate: 5.2, lastUpdated: new Date().toISOString() },
            pricing: { validationScore: 95, totalValidations: 50, errorRate: 0.05, autoFixRate: 0.8, averageAccuracy: 95.5, commonErrors: [] },
            completeness: { averageCompleteness: 92.5, totalDocuments: 50, completeDocuments: 46, missingFieldsCount: 12, templateCompliance: 88.5, improvementSuggestions: 8 },
            consistency: { consistencyScore: 89.2, totalRules: 15, passedRules: 13, inconsistencyCount: 2, autoFixedCount: 1, crossDocumentIssues: 1 },
            errors: { totalErrors: 25, criticalErrors: 2, resolvedErrors: 20, autoFixedErrors: 15, averageResolutionTime: 45, errorsByCategory: {} },
            trends: { timeframe: 'last_30_days', dataPoints: [], improvements: [], predictions: [] },
            benchmarks: { industry: [], internal: [], targets: [] }
          })
        }
        return Promise.resolve([])
      })
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const reportConfig: QualityReportConfig = {
        name: 'Monthly Quality Report',
        nameAr: 'تقرير الجودة الشهري',
        timeframe: { type: 'last_months', value: 1 },
        includeCharts: true,
        includeRecommendations: true,
        format: 'pdf',
        sections: ['summary', 'metrics', 'trends', 'recommendations'],
        filters: {
          categories: ['pricing', 'completeness'],
          severity: ['critical', 'major']
        }
      }

      const report = await qualityAssuranceService.generateQualityReport(reportConfig)

      expect(report).toBeDefined()
      expect(report.id).toBeDefined()
      expect(report.config).toEqual(reportConfig)
      expect(report.data).toBeDefined()
      expect(report.charts).toBeInstanceOf(Array)
      expect(report.recommendations).toBeInstanceOf(Array)
      expect(report.generatedAt).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      await expect(qualityAssuranceService.getPricingRules()).rejects.toThrow('فشل في استرجاع قواعد التسعير')
    })

    it('should handle invalid data gracefully', async () => {
      const invalidPricingData = {} as PricingData

      await expect(qualityAssuranceService.validatePricing(invalidPricingData)).rejects.toThrow()
    })

    it('should handle missing templates gracefully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const mockDocumentData: DocumentData = {
        id: 'doc_1',
        name: 'Test Document',
        nameAr: 'وثيقة اختبار',
        type: 'unknown_type',
        sections: [],
        lastUpdated: new Date().toISOString()
      }

      await expect(qualityAssuranceService.checkCompleteness(mockDocumentData)).rejects.toThrow()
    })
  })
})
