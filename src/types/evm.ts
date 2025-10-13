/**
 * Earned Value Management (EVM) Types
 * أنواع البيانات لإدارة القيمة المكتسبة
 */

export interface EVMMetrics {
  // القيم الأساسية
  plannedValue: number        // PV - القيمة المخططة
  earnedValue: number         // EV - القيمة المكتسبة
  actualCost: number          // AC - التكلفة الفعلية
  budgetAtCompletion: number  // BAC - الميزانية عند الإكمال

  // مؤشرات الأداء
  costVariance: number        // CV = EV - AC
  scheduleVariance: number    // SV = EV - PV
  costPerformanceIndex: number    // CPI = EV / AC
  schedulePerformanceIndex: number // SPI = EV / PV

  // التوقعات
  estimateAtCompletion: number    // EAC - التقدير عند الإكمال
  estimateToComplete: number      // ETC - التقدير للإكمال
  varianceAtCompletion: number    // VAC = BAC - EAC
  toCompletePerformanceIndex: number // TCPI = (BAC - EV) / (BAC - AC)

  // النسب المئوية
  percentComplete: number         // نسبة الإنجاز الفعلية
  percentPlanned: number          // نسبة الإنجاز المخططة

  // التواريخ
  statusDate: string              // تاريخ الحالة
  plannedCompletionDate: string   // تاريخ الإكمال المخطط
  forecastCompletionDate: string  // تاريخ الإكمال المتوقع
}

export interface EVMCalculationInput {
  projectId: string
  statusDate: string
  tasks: EVMTaskData[]
  totalBudget: number
  plannedStartDate: string
  plannedEndDate: string
}

export interface EVMTaskData {
  id: string
  title: string
  plannedValue: number
  earnedValue: number
  actualCost: number
  percentComplete: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  weight: number // وزن المهمة في المشروع
}

export interface EVMTrend {
  date: string
  plannedValue: number
  earnedValue: number
  actualCost: number
  cpi: number
  spi: number
}

export interface EVMForecast {
  method: 'current_performance' | 'planned_performance' | 'weighted_average'
  estimateAtCompletion: number
  estimateToComplete: number
  forecastCompletionDate: string
  confidence: number // مستوى الثقة (0-100)
  assumptions: string[]
}

export interface EVMAlert {
  id: string
  projectId: string
  type: 'cost_overrun' | 'schedule_delay' | 'performance_decline' | 'budget_exhaustion'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  threshold: number
  currentValue: number
  createdAt: string
  isRead: boolean
  isActive: boolean
}

export interface EVMThresholds {
  cpiWarning: number      // تحذير CPI (مثل 0.9)
  cpiCritical: number     // حرج CPI (مثل 0.8)
  spiWarning: number      // تحذير SPI (مثل 0.9)
  spiCritical: number     // حرج SPI (مثل 0.8)
  cvWarning: number       // تحذير CV (مثل -10000)
  cvCritical: number      // حرج CV (مثل -50000)
  svWarning: number       // تحذير SV (مثل -5)
  svCritical: number      // حرج SV (مثل -15)
}

export interface EVMReport {
  projectId: string
  projectName: string
  reportDate: string
  period: {
    startDate: string
    endDate: string
  }
  
  // الملخص التنفيذي
  executiveSummary: {
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical'
    keyFindings: string[]
    recommendations: string[]
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }

  // المقاييس الحالية
  currentMetrics: EVMMetrics

  // الاتجاهات
  trends: EVMTrend[]

  // التوقعات
  forecasts: EVMForecast[]

  // التحليل التفصيلي
  analysis: {
    costAnalysis: {
      status: 'under_budget' | 'on_budget' | 'over_budget'
      variance: number
      variantPercentage: number
      majorCostDrivers: string[]
    }
    scheduleAnalysis: {
      status: 'ahead_of_schedule' | 'on_schedule' | 'behind_schedule'
      variance: number
      varianceDays: number
      criticalPath: string[]
    }
    performanceAnalysis: {
      efficiency: number
      productivity: number
      qualityMetrics: any[]
    }
  }

  // المخاطر والقضايا
  risks: {
    id: string
    title: string
    impact: 'low' | 'medium' | 'high'
    probability: 'low' | 'medium' | 'high'
    mitigation: string
  }[]

  // التوصيات
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: 'cost' | 'schedule' | 'scope' | 'quality' | 'risk'
    description: string
    expectedImpact: string
    timeline: string
  }[]
}

export interface EVMDashboardData {
  projectId: string
  lastUpdated: string
  
  // المقاييس الرئيسية
  keyMetrics: EVMMetrics

  // الرسوم البيانية
  charts: {
    performanceTrend: EVMTrend[]
    costBreakdown: {
      category: string
      planned: number
      actual: number
    }[]
    scheduleProgress: {
      phase: string
      planned: number
      actual: number
    }[]
    varianceAnalysis: {
      period: string
      costVariance: number
      scheduleVariance: number
    }[]
  }

  // التنبيهات النشطة
  activeAlerts: EVMAlert[]

  // الإنجازات الرئيسية
  milestones: {
    id: string
    title: string
    plannedDate: string
    actualDate?: string
    status: 'completed' | 'in_progress' | 'delayed' | 'at_risk'
  }[]

  // مؤشرات الأداء
  kpis: {
    name: string
    value: number
    target: number
    trend: 'up' | 'down' | 'stable'
    status: 'good' | 'warning' | 'critical'
  }[]
}

export interface EVMConfiguration {
  projectId: string
  
  // إعدادات الحساب
  calculationMethod: 'weighted_milestone' | 'percent_complete' | 'units_complete'
  updateFrequency: 'daily' | 'weekly' | 'monthly'
  
  // العتبات والتنبيهات
  thresholds: EVMThresholds
  alertsEnabled: boolean
  
  // إعدادات التقارير
  reportingCurrency: 'SAR' | 'USD' | 'EUR'
  reportingPeriod: 'weekly' | 'monthly' | 'quarterly'
  
  // إعدادات التوقعات
  forecastMethods: ('current_performance' | 'planned_performance' | 'weighted_average')[]
  confidenceLevel: number
  
  // إعدادات أخرى
  includeIndirectCosts: boolean
  includeContingency: boolean
  baselineDate: string
  
  createdAt: string
  updatedAt: string
}

export interface EVMBaselineData {
  projectId: string
  version: number
  createdAt: string
  createdBy: string
  
  // بيانات الأساس
  totalBudget: number
  plannedDuration: number
  plannedStartDate: string
  plannedEndDate: string
  
  // تفصيل المهام
  tasks: {
    id: string
    title: string
    plannedValue: number
    plannedDuration: number
    dependencies: string[]
    weight: number
  }[]
  
  // المعالم
  milestones: {
    id: string
    title: string
    plannedDate: string
    plannedValue: number
  }[]
  
  // الافتراضات
  assumptions: string[]
  
  // المخاطر المحددة
  identifiedRisks: {
    id: string
    description: string
    impact: number
    probability: number
    contingency: number
  }[]
  
  // الموافقات
  approvals: {
    role: string
    name: string
    date: string
    signature?: string
  }[]
  
  isActive: boolean
  notes?: string
}

export interface CostTrackingEntry {
  id: string
  projectId: string
  taskId?: string
  
  // معلومات التكلفة
  category: 'labor' | 'material' | 'equipment' | 'subcontractor' | 'overhead' | 'other'
  description: string
  amount: number
  currency: string
  
  // التواريخ
  incurredDate: string
  recordedDate: string
  
  // التصنيف
  budgetCode?: string
  costCenter?: string
  workPackage?: string
  
  // الموافقات
  approvedBy?: string
  approvedDate?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  
  // المرفقات
  attachments: string[]
  
  // البيانات الوصفية
  createdBy: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface VarianceAnalysis {
  projectId: string
  analysisDate: string
  
  // تحليل انحراف التكلفة
  costVarianceAnalysis: {
    totalVariance: number
    variancePercentage: number
    majorVariances: {
      category: string
      planned: number
      actual: number
      variance: number
      reason: string
      impact: string
      correctionAction: string
    }[]
    trends: {
      period: string
      variance: number
    }[]
  }
  
  // تحليل انحراف الجدولة
  scheduleVarianceAnalysis: {
    totalVariance: number
    varianceDays: number
    criticalPathImpact: number
    delayedTasks: {
      taskId: string
      taskName: string
      plannedEnd: string
      forecastEnd: string
      delayDays: number
      impact: string
      reason: string
    }[]
    mitigationActions: string[]
  }
  
  // تحليل الأداء
  performanceAnalysis: {
    efficiencyTrend: number
    productivityIndex: number
    qualityMetrics: {
      defectRate: number
      reworkPercentage: number
      customerSatisfaction: number
    }
    resourceUtilization: {
      planned: number
      actual: number
      efficiency: number
    }
  }
  
  // التوصيات
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  
  // خطة العمل
  actionPlan: {
    action: string
    responsible: string
    dueDate: string
    status: 'planned' | 'in_progress' | 'completed'
    priority: 'high' | 'medium' | 'low'
  }[]
}
