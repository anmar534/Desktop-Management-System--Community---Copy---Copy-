import type {
  QualityDashboard,
  QualityMetrics,
  QualityAlert
} from '../types/quality'
import type {
  PricingData,
  PricingValidationResult,
  PricingValidationIssue,
  DocumentData,
  CompletenessCheckResult,
  QualityCheckData,
  ErrorDetectionResult,
  ConsistencyVerificationResult,
  DocumentSet,
  BackupRecord,
  QualityReport,
  BackupCreateOptions,
  QualityReportOptions,
  QualityMetricsFilters
} from '../types/qualityAssurance'

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms))
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

const buildBaseQualityMetrics = (): QualityMetrics => ({
  overallQualityScore: 87.4,
  pricingValidationMetrics: {
    validationScore: 92.3,
    totalValidations: 128,
    automatedRate: 0.78
  },
  completenessMetrics: {
    averageCompleteness: 88.6,
    totalChecks: 96,
    documentsPending: 4
  },
  errorMetrics: {
    errorRate: 2.4,
    totalErrors: 12,
    criticalErrors: 2
  },
  trends: [
    { period: 'الأسبوع الماضي', score: 86.5 },
    { period: 'هذا الأسبوع', score: 87.4 },
    { period: 'التوقع للأسبوع القادم', score: 88.1 }
  ]
})

const buildQualityTrends = () => {
  const today = new Date()
  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (5 - index) * 5)
    return {
      date: date.toISOString(),
      qualityScore: 82 + index * 1.8,
      checksCompleted: 32 + index * 3,
      nonConformitiesRaised: Math.max(1, 6 - index)
    }
  })
}

const buildNonConformityTrends = () => {
  const base = new Date()
  return Array.from({ length: 6 }).map((_, index) => {
    const monthDate = new Date(base.getFullYear(), base.getMonth() - (5 - index), 1)
    return {
      month: monthDate.toISOString(),
      majorCount: Math.max(1, 5 - index),
      minorCount: 4 + index,
      criticalCount: Math.max(0, 2 - index)
    }
  })
}

const createDashboardSnapshot = (projectId: string): QualityDashboard => ({
  projectId,
  lastUpdated: new Date().toISOString(),
  kpis: {
    overallQualityScore: 87,
    passRate: 89,
    activeNonConformities: 6,
    correctiveActionsCompleted: 18,
    correctiveActionsTotal: 24,
    checksCompleted: 42,
    checksInProgress: 7,
    checksPlanned: 12
  },
  qualityTrends: buildQualityTrends(),
  nonConformityTrends: buildNonConformityTrends(),
  standardsCompliance: [
    {
      standardId: 'iso-9001',
      standardNameAr: 'ISO 9001 إدارة الجودة',
      complianceRate: 93
    },
    {
      standardId: 'iso-14001',
      standardNameAr: 'ISO 14001 الإدارة البيئية',
      complianceRate: 88
    },
    {
      standardId: 'corp-policy-qa',
      standardNameAr: 'سياسة الشركة لضمان الجودة',
      complianceRate: 96
    }
  ],
  recentActivities: [
    {
      id: generateId('activity'),
      descriptionAr: 'إكمال مراجعة الجودة للمناقصة الرئيسية',
      performedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: generateId('activity'),
      descriptionAr: 'تحديث خطة الفحص الأسبوعية',
      performedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: generateId('activity'),
      descriptionAr: 'إغلاق عدم مطابقة حرجة بعد الإجراءات التصحيحية',
      performedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: generateId('activity'),
      descriptionAr: 'تنفيذ تدريب ضمان الجودة للفريق',
      performedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
})

let cachedAlerts: QualityAlert[] = [
  {
    id: 'qa-alert-1',
    titleAr: 'عدم مطابقة حرجة في المستندات الفنية',
    descriptionAr: 'تم رصد نقص في وثائق الاعتماد لمورد رئيسي ضمن المناقصة الحالية.',
    severity: 'high',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'documentation'
  },
  {
    id: 'qa-alert-2',
    titleAr: 'مستوى الأخطاء في بيانات التسعير',
    descriptionAr: 'معدل الأخطاء تجاوز الحد المسموح به في آخر جولة تحقق.',
    severity: 'medium',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'pricing'
  },
  {
    id: 'qa-alert-3',
    titleAr: 'تنبيه اكتمال المستندات',
    descriptionAr: 'بعض المستندات الداعمة لا تزال قيد المتابعة وتحتاج إلى تحديث.',
    severity: 'low',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'completeness'
  }
]

let backupHistory: BackupRecord[] = [
  {
    id: 'backup-1',
    scope: 'full',
    projectId: 'default-project',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    includeMetadata: true,
    sizeInMb: 1250
  },
  {
    id: 'backup-2',
    scope: 'incremental',
    projectId: 'default-project',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    includeMetadata: true,
    sizeInMb: 420
  }
]

let qualityReports: QualityReport[] = [
  {
    id: 'report-1',
    title: 'تقرير ضمان الجودة الشهري',
    generatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    summary: 'يسلط التقرير الضوء على اتجاهات الجودة والمخاطر الرئيسية وخطة التحسين.',
    format: 'comprehensive',
    language: 'ar'
  }
]

const applyMetricsFilters = (metrics: QualityMetrics, filters?: QualityMetricsFilters): QualityMetrics => {
  if (!filters?.start || !filters?.end) {
    return { ...metrics }
  }

  const start = Date.parse(filters.start)
  const end = Date.parse(filters.end)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return { ...metrics }
  }

  const rangeInDays = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)))
  const modifier = Math.min(1.05, Math.max(0.9, 30 / rangeInDays))

  return {
    ...metrics,
    overallQualityScore: Number((metrics.overallQualityScore * modifier).toFixed(1)),
    pricingValidationMetrics: {
      ...metrics.pricingValidationMetrics,
      validationScore: Number((metrics.pricingValidationMetrics.validationScore * modifier).toFixed(1))
    },
    completenessMetrics: {
      ...metrics.completenessMetrics,
      averageCompleteness: Number((metrics.completenessMetrics.averageCompleteness * modifier).toFixed(1))
    },
    errorMetrics: {
      ...metrics.errorMetrics,
      errorRate: Number((metrics.errorMetrics.errorRate / modifier).toFixed(2))
    }
  }
}

const validatePricingData = (pricingData: PricingData): PricingValidationIssue[] => {
  const issues: PricingValidationIssue[] = []
  const items = pricingData.items ?? []

  if (items.length === 0) {
    issues.push({
      id: generateId('pricing-issue'),
      field: 'items',
      message: 'لا توجد عناصر تسعير محددة.',
      type: 'error',
      severity: 'high'
    })
    return issues
  }

  items.forEach(item => {
    if (item.quantity <= 0) {
      issues.push({
        id: generateId('pricing-issue'),
        field: `quantity:${item.id}`,
        message: 'الكمية يجب أن تكون أكبر من صفر.',
        type: 'error',
        severity: 'high'
      })
    }

    if (item.unitPrice <= 0) {
      issues.push({
        id: generateId('pricing-issue'),
        field: `unitPrice:${item.id}`,
        message: 'سعر الوحدة يجب أن يكون موجباً.',
        type: 'error',
        severity: 'high'
      })
    }

    if (!item.description.trim()) {
      issues.push({
        id: generateId('pricing-issue'),
        field: `description:${item.id}`,
        message: 'الوصف مفقود لعناصر التسعير.',
        type: 'warning',
        severity: 'medium'
      })
    }
  })

  return issues
}

export const qualityAssuranceService = {
  async getQualityDashboard(projectId: string): Promise<QualityDashboard> {
    await delay()
    return createDashboardSnapshot(projectId)
  },

  async getQualityMetrics(projectId?: string, filters?: QualityMetricsFilters): Promise<QualityMetrics> {
    await delay()
    const baseMetrics = buildBaseQualityMetrics()
    return applyMetricsFilters(baseMetrics, filters)
  },

  async getQualityAlerts(projectId?: string): Promise<QualityAlert[]> {
    await delay()
    if (!projectId) {
      return cachedAlerts.map(alert => ({ ...alert }))
    }

    return cachedAlerts.map(alert => ({ ...alert, id: `${alert.id}-${projectId}` }))
  },

  async getBackupHistory(): Promise<BackupRecord[]> {
    await delay()
    return backupHistory.map(history => ({ ...history }))
  },

  async validatePricing(pricingData: PricingData): Promise<PricingValidationResult> {
    await delay()
    const issues = validatePricingData(pricingData)
    const totalChecks = Math.max(1, pricingData.items.length * 3)
    const failed = issues.filter(issue => issue.type === 'error').length
    const warnings = issues.filter(issue => issue.type === 'warning').length
    const passed = Math.max(0, totalChecks - failed - warnings)
    const validationScore = Number(((passed + warnings * 0.5) / totalChecks * 100).toFixed(1))

    return {
      isValid: failed === 0,
      validationScore,
      issues,
      summary: {
        totalChecks,
        passed,
        failed,
        warnings
      }
    }
  },

  async checkCompleteness(documentData: DocumentData): Promise<CompletenessCheckResult> {
    await delay()
    const documents = documentData.documents ?? []
    const allFields = documents.flatMap(doc => doc.fields)
    const completed = allFields.filter(field => field.status === 'complete').length
    const partial = allFields.filter(field => field.status === 'partial').length
    const missing = allFields.filter(field => field.status === 'missing').length
    const totalFields = allFields.length || 1

    const overallCompleteness = Number(((completed + partial * 0.5) / totalFields * 100).toFixed(1))
    const completedDocuments = documents.filter(doc => doc.fields.every(field => field.status === 'complete')).length
    const missingDocuments = documents.filter(doc => doc.fields.some(field => field.status === 'missing')).length

    return {
      overallCompleteness,
      totalDocuments: documents.length,
      completedDocuments,
      missingDocuments,
      fields: allFields.map(field => ({ ...field }))
    }
  },

  async detectErrors(data: QualityCheckData): Promise<ErrorDetectionResult> {
    await delay()
    const failedChecks = data.checks.filter(check => check.status === 'failed')
    const errors = failedChecks.flatMap(check => {
      if (!check.issues || check.issues.length === 0) {
        return [
          {
            id: generateId('error'),
            category: check.name,
            severity: 'high',
            message: 'تم رصد فشل في التحقق من الجودة.',
            recommendedAction: 'راجع تفاصيل الفحص وقم بإعادة التحقق بعد التصحيح.'
          }
        ]
      }

      return check.issues.map(issue => ({
        id: generateId('error'),
        category: check.name,
        severity: issue.includes('حرج') ? 'high' : 'medium',
        message: issue,
        recommendedAction: 'تحقق من البيانات المرتبطة وطبق الإجراءات التصحيحية.'
      }))
    })

    const totalChecks = data.checks.length || 1
    const errorRate = Number(((errors.length / totalChecks) * 100).toFixed(2))

    return {
      errorRate,
      totalErrors: errors.length,
      errors
    }
  },

  async verifyConsistency(documents: DocumentSet): Promise<ConsistencyVerificationResult> {
    await delay()
    const seenCategories = new Map<string, string>()
    const issues = documents.documents.flatMap(doc => {
      if (!doc.category) {
        return []
      }

      const existing = seenCategories.get(doc.category)
      if (existing && existing !== doc.name) {
        return [
          {
            id: generateId('consistency'),
            description: `عدم تناسق بين المستند "${existing}" والمستند "${doc.name}" ضمن الفئة ${doc.category}.`,
            severity: 'medium',
            suggestedFix: 'قم بمراجعة تسميات المستندات وتأكد من توحيدها.'
          }
        ]
      }

      seenCategories.set(doc.category, doc.name)
      return []
    })

    return {
      isConsistent: issues.length === 0,
      checksPerformed: documents.documents.length,
      issues
    }
  },

  async createBackup(options: BackupCreateOptions): Promise<BackupRecord> {
    await delay()
    const newBackup: BackupRecord = {
      id: generateId('backup'),
      scope: options.scope,
      projectId: 'default-project',
      createdAt: new Date().toISOString(),
      status: 'completed',
      includeMetadata: options.includeMetadata,
      sizeInMb: Number((300 + Math.random() * 700).toFixed(0))
    }

    backupHistory = [newBackup, ...backupHistory].slice(0, 12)
    return { ...newBackup }
  },

  async generateQualityReport(options: QualityReportOptions): Promise<QualityReport> {
    await delay()
    const format = options.format ?? 'comprehensive'
    const language = options.language ?? 'ar'

    const newReport: QualityReport = {
      id: generateId('report'),
      title: format === 'summary' ? 'ملخص ضمان الجودة' : 'تقرير شامل لضمان الجودة',
      generatedAt: new Date().toISOString(),
      summary: options.includeRecommendations
        ? 'يتضمن التقرير أبرز مؤشرات الأداء وخطة الإجراءات التصحيحية المقترحة.'
        : 'يتضمن التقرير ملخص الأداء ومراقبة الجودة خلال الفترة المحددة.',
      format,
      language
    }

    qualityReports = [newReport, ...qualityReports].slice(0, 20)
    return { ...newReport }
  }
}
