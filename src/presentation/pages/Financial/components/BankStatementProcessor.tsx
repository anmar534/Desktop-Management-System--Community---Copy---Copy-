// معالج متخصص لكشوف الحسابات البنكية وربطها بالمشاريع
import { projectsData } from '@/data/centralData'

export interface BankTransaction {
  id: string
  date: string
  balance: number
  debit: number
  credit: number
  description: string
  category: string
  subcategory: string
  project: string
  transactionType: 'income' | 'expense'
  isReconciled: boolean
  notes?: string
  processedAt: string
  projectId?: string
  categoryCode?: string
  subcategoryCode?: string
}

export interface BankStatementSummary {
  totalTransactions: number
  totalIncome: number
  totalExpenses: number
  netFlow: number
  projectBreakdown: Record<string, {
    projectName: string
    totalIncome: number
    totalExpenses: number
    netFlow: number
    transactionCount: number
  }>
  categoryBreakdown: Record<string, {
    categoryName: string
    totalAmount: number
    transactionCount: number
    subcategories: Record<string, {
      subcategoryName: string
      totalAmount: number
      transactionCount: number
    }>
  }>
  monthlyBreakdown: Record<string, {
    month: string
    totalIncome: number
    totalExpenses: number
    netFlow: number
    transactionCount: number
  }>
  dateRange: {
    startDate: string
    endDate: string
  }
}

type RawBankStatementRow = Record<string, unknown>

interface ClassificationRule {
  keywords: string[]
  category: string
  subcategory: string
  categoryCode: string
  subcategoryCode: string
}

export class BankStatementProcessor {
  
  // معالجة بيانات كشف الحساب البنكي
  static processBankStatement(rawData: RawBankStatementRow[]): BankTransaction[] {
    return rawData.map((row, index) => {
      const rawDate = this.pickFirstValue(row, ['التاريخ', 'Date', 'date'])
      const rawBalance = this.pickFirstValue(row, ['الرصيد', 'Balance', 'balance'])
      const rawDebit = this.pickFirstValue(row, ['مدين', 'Debit', 'debit'])
      const rawCredit = this.pickFirstValue(row, ['دائن', 'Credit', 'credit'])
      const rawDescription = this.pickFirstValue(row, ['تفاصيل العملية', 'Description', 'description'], '')
      const rawCategory = this.pickFirstValue(row, ['التصنيف', 'Category', 'category'], '')
      const rawSubcategory = this.pickFirstValue(row, ['التصنيف الفرعي', 'Subcategory', 'subcategory'], '')
      const rawProject = this.pickFirstValue(row, ['المشروع', 'Project', 'project'], '')

      const debit = this.normalizeNumber(rawDebit)
      const credit = this.normalizeNumber(rawCredit)
      const project = this.normalizeProject(rawProject)
      const category = this.normalizeCategory(rawCategory)
      const subcategory = this.normalizeSubcategory(rawSubcategory)

      const transaction: BankTransaction = {
        id: `TXN-${Date.now()}-${index + 1}`,
        date: this.normalizeDate(rawDate),
        balance: this.normalizeNumber(rawBalance),
        debit,
        credit,
        description: this.cleanDescription(rawDescription),
        category,
        subcategory,
        project,
        transactionType: this.determineTransactionType(debit, credit),
        isReconciled: false,
        processedAt: new Date().toISOString(),
        projectId: this.findProjectId(project),
        categoryCode: this.getCategoryCode(category),
        subcategoryCode: this.getSubcategoryCode(subcategory)
      }

      return transaction
    })
  }

  // تحليل وتلخيص البيانات المصرفية
  static analyzeBankStatement(transactions: BankTransaction[]): BankStatementSummary {
    const summary: BankStatementSummary = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      projectBreakdown: {},
      categoryBreakdown: {},
      monthlyBreakdown: {},
      dateRange: {
        startDate: '',
        endDate: ''
      }
    }

    // تحديد نطاق التواريخ
    const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime())
    if (dates.length > 0) {
      summary.dateRange.startDate = dates[0].toISOString().split('T')[0]
      summary.dateRange.endDate = dates[dates.length - 1].toISOString().split('T')[0]
    }

    transactions.forEach(transaction => {
      const amount = transaction.transactionType === 'income' ? transaction.credit : transaction.debit

      // إجمالي الإيرادات والمصروفات
      if (transaction.transactionType === 'income') {
        summary.totalIncome += amount
      } else {
        summary.totalExpenses += amount
      }

      // تحليل حسب المشروع
      if (transaction.project && transaction.project !== 'غير محدد') {
        if (!summary.projectBreakdown[transaction.project]) {
          summary.projectBreakdown[transaction.project] = {
            projectName: transaction.project,
            totalIncome: 0,
            totalExpenses: 0,
            netFlow: 0,
            transactionCount: 0
          }
        }

        const projectData = summary.projectBreakdown[transaction.project]
        if (transaction.transactionType === 'income') {
          projectData.totalIncome += amount
        } else {
          projectData.totalExpenses += amount
        }
        projectData.netFlow = projectData.totalIncome - projectData.totalExpenses
        projectData.transactionCount++
      }

      // تحليل حسب التصنيف
      if (transaction.category) {
        if (!summary.categoryBreakdown[transaction.category]) {
          summary.categoryBreakdown[transaction.category] = {
            categoryName: transaction.category,
            totalAmount: 0,
            transactionCount: 0,
            subcategories: {}
          }
        }

        const categoryData = summary.categoryBreakdown[transaction.category]
        categoryData.totalAmount += amount
        categoryData.transactionCount++

        // تحليل حسب التصنيف الفرعي
        if (transaction.subcategory) {
          if (!categoryData.subcategories[transaction.subcategory]) {
            categoryData.subcategories[transaction.subcategory] = {
              subcategoryName: transaction.subcategory,
              totalAmount: 0,
              transactionCount: 0
            }
          }

          const subcategoryData = categoryData.subcategories[transaction.subcategory]
          subcategoryData.totalAmount += amount
          subcategoryData.transactionCount++
        }
      }

      // تحليل شهري
      const monthKey = transaction.date.substring(0, 7) // YYYY-MM
      if (!summary.monthlyBreakdown[monthKey]) {
        summary.monthlyBreakdown[monthKey] = {
          month: monthKey,
          totalIncome: 0,
          totalExpenses: 0,
          netFlow: 0,
          transactionCount: 0
        }
      }

      const monthlyData = summary.monthlyBreakdown[monthKey]
      if (transaction.transactionType === 'income') {
        monthlyData.totalIncome += amount
      } else {
        monthlyData.totalExpenses += amount
      }
      monthlyData.netFlow = monthlyData.totalIncome - monthlyData.totalExpenses
      monthlyData.transactionCount++
    })

    summary.netFlow = summary.totalIncome - summary.totalExpenses

    return summary
  }

  // ربط المعاملات بالمشاريع الموجودة
  static reconcileWithProjects(transactions: BankTransaction[]): BankTransaction[] {
    return transactions.map(transaction => {
      if (transaction.project && transaction.project !== 'غير محدد') {
        const project = projectsData.find(p => 
          p.name.toLowerCase().includes(transaction.project.toLowerCase()) ||
          transaction.project.toLowerCase().includes(p.name.toLowerCase()) ||
          p.id === transaction.projectId
        )
        
        if (project) {
          transaction.projectId = project.id
          transaction.isReconciled = true
        }
      }
      return transaction
    })
  }

  // تصنيف المعاملات تلقائياً حسب الوصف
  static autoClassifyTransactions(transactions: BankTransaction[]): BankTransaction[] {
    const classificationRules = this.getClassificationRules()

    return transactions.map(transaction => {
      if (!transaction.category || transaction.category === 'غير محدد') {
        const description = transaction.description.toLowerCase()
        
        for (const rule of classificationRules) {
          if (rule.keywords.some(keyword => description.includes(keyword.toLowerCase()))) {
            transaction.category = rule.category
            transaction.subcategory = rule.subcategory
            transaction.categoryCode = rule.categoryCode
            transaction.subcategoryCode = rule.subcategoryCode
            break
          }
        }
      }
      
      return transaction
    })
  }

  // قواعد التصنيف التلقائي
  private static getClassificationRules(): ClassificationRule[] {
    return [
      // مصروفات المشاريع
      {
        keywords: ['إسمنت', 'حديد', 'رمل', 'بلوك', 'خرسانة'],
        category: 'مواد البناء',
        subcategory: 'مواد أساسية',
        categoryCode: 'MAT',
        subcategoryCode: 'MAT-001'
      },
      {
        keywords: ['راتب', 'مرتب', 'أجور', 'عمالة'],
        category: 'الرواتب والأجور',
        subcategory: 'رواتب الموظفين',
        categoryCode: 'SAL',
        subcategoryCode: 'SAL-001'
      },
      {
        keywords: ['كهرباء', 'ماء', 'اتصالات', 'إنترنت'],
        category: 'المرافق',
        subcategory: 'خدمات أساسية',
        categoryCode: 'UTL',
        subcategoryCode: 'UTL-001'
      },
      {
        keywords: ['معدات', 'آلات', 'أدوات', 'حفارة', 'رافعة'],
        category: 'المعدات',
        subcategory: 'معدات ثقيلة',
        categoryCode: 'EQP',
        subcategoryCode: 'EQP-001'
      },
      {
        keywords: ['وقود', 'بنزين', 'ديزل', 'زيت'],
        category: 'الوقود',
        subcategory: 'وقود المعدات',
        categoryCode: 'FUEL',
        subcategoryCode: 'FUEL-001'
      },
      {
        keywords: ['نقل', 'مواصلات', 'شحن', 'توصيل'],
        category: 'النقل',
        subcategory: 'نقل المواد',
        categoryCode: 'TRANS',
        subcategoryCode: 'TRANS-001'
      },
      {
        keywords: ['إيجار', 'كراء', 'استئجار'],
        category: 'الإيجارات',
        subcategory: 'إيجار المكاتب',
        categoryCode: 'RENT',
        subcategoryCode: 'RENT-001'
      },
      {
        keywords: ['تأمين', 'ضمان'],
        category: 'التأمين',
        subcategory: 'تأمين المشاريع',
        categoryCode: 'INS',
        subcategoryCode: 'INS-001'
      },
      {
        keywords: ['استشارات', 'تصميم', 'هندسة'],
        category: 'الاستشارات',
        subcategory: 'استشارات هندسية',
        categoryCode: 'CONS',
        subcategoryCode: 'CONS-001'
      },
      // الإيرادات
      {
        keywords: ['دفعة', 'سداد', 'مستحقات', 'عميل'],
        category: 'إيرادات المشاريع',
        subcategory: 'دفعات العملاء',
        categoryCode: 'REV',
        subcategoryCode: 'REV-001'
      },
      {
        keywords: ['منافسة', 'عطاء', 'فوز', 'مناقصة'],
        category: 'إيرادات المنافسات',
        subcategory: 'عقود جديدة',
        categoryCode: 'REV',
        subcategoryCode: 'REV-002'
      }
    ]
  }

  // دوال مساعدة
  private static normalizeDate(dateValue: unknown): string {
    if (!dateValue) return new Date().toISOString().split('T')[0]
    
    try {
      // معالجة تنسيقات التاريخ المختلفة
      let date: Date
      
      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === 'string') {
        // تنسيقات شائعة: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/')
          if (parts.length === 3) {
            // افتراض DD/MM/YYYY
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          } else {
            date = new Date(dateValue)
          }
        } else if (dateValue.includes('-')) {
          date = new Date(dateValue)
        } else {
          date = new Date(dateValue)
        }
      } else if (typeof dateValue === 'number') {
        // Excel date serial number
        date = new Date((dateValue - 25569) * 86400 * 1000)
      } else {
        date = new Date(String(dateValue))
      }
      
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0]
      }
      
      return date.toISOString().split('T')[0]
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  }

  private static normalizeNumber(value: unknown): number {
    if (value === undefined || value === null || value === '') return 0
    
    if (typeof value === 'string') {
      // إزالة الفواصل والرموز
      const cleanValue = value.replace(/[^\d.-]/g, '')
      const num = parseFloat(cleanValue)
      return isNaN(num) ? 0 : Math.abs(num) // استخدام القيمة المطلقة
    }

    if (typeof value === 'number') {
      return Math.abs(value)
    }
    
    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }

    const num = Number(value)
    return Number.isNaN(num) ? 0 : Math.abs(num)
  }

  private static cleanDescription(description: unknown): string {
    if (typeof description !== 'string' || description.trim() === '') return 'غير محدد'
    
    return description.trim()
      .replace(/\s+/g, ' ') // إزالة المسافات الزائدة
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s\-.]/g, '') // الاحتفاظ بالعربية والإنجليزية والأرقام
  }

  private static normalizeCategory(category: unknown): string {
    if (typeof category !== 'string') return 'غير مصنف'
    const trimmed = category.trim()
    return trimmed === '' ? 'غير مصنف' : trimmed
  }

  private static normalizeSubcategory(subcategory: unknown): string {
    if (typeof subcategory !== 'string') return 'غير محدد'
    const trimmed = subcategory.trim()
    return trimmed === '' ? 'غير محدد' : trimmed
  }

  private static normalizeProject(project: unknown): string {
    if (typeof project !== 'string') return 'غير محدد'
    const trimmed = project.trim()
    return trimmed === '' ? 'غير محدد' : trimmed
  }

  private static determineTransactionType(debit: number, credit: number): 'income' | 'expense' {
    return credit > debit ? 'income' : 'expense'
  }

  private static findProjectId(projectName: string): string | undefined {
    if (!projectName || projectName === 'غير محدد') return undefined
    
    const project = projectsData.find(p => 
      p.name.toLowerCase().includes(projectName.toLowerCase()) ||
      projectName.toLowerCase().includes(p.name.toLowerCase())
    )
    
    return project?.id
  }

  private static getCategoryCode(category: string): string {
    // يمكن توسيع هذه الوظيفة لتشمل قاموس أكثر تفصيلاً
    const categoryMap: Record<string, string> = {
      'مواد البناء': 'MAT',
      'الرواتب والأجور': 'SAL',
      'المرافق': 'UTL',
      'المعدات': 'EQP',
      'الوقود': 'FUEL',
      'النقل': 'TRANS',
      'الإيجارات': 'RENT',
      'التأمين': 'INS',
      'الاستشارات': 'CONS',
      'إيرادات المشاريع': 'REV',
      'إيرادات المنافسات': 'REV'
    }
    
    return categoryMap[category] || 'MISC'
  }

  private static getSubcategoryCode(subcategory: string): string {
    // رموز فرعية مبسطة
    return subcategory ? subcategory.substring(0, 3).toUpperCase() : 'GEN'
  }

  // تصدير البيانات المحللة لـ Excel
  static exportAnalysisToExcel(summary: BankStatementSummary): string {
  const csvData: (string | number)[][] = []
    
    // هيدر الملخص
    csvData.push(['ملخص كشف الحساب البنكي'])
    csvData.push(['إجمالي المعاملات', summary.totalTransactions])
    csvData.push(['إجمالي الإيرادات', summary.totalIncome])
    csvData.push(['إجمالي المصروفات', summary.totalExpenses])
    csvData.push(['صافي التدفق', summary.netFlow])
    csvData.push(['من تاريخ', summary.dateRange.startDate])
    csvData.push(['إلى تاريخ', summary.dateRange.endDate])
    csvData.push([]) // سطر فارغ
    
    // تفصيل المشاريع
    csvData.push(['تفصيل المشاريع'])
    csvData.push(['المشروع', 'الإيرادات', 'المصروفات', 'صافي التدفق', 'عدد المعاملات'])
    Object.values(summary.projectBreakdown).forEach(project => {
      csvData.push([
        project.projectName,
        project.totalIncome,
        project.totalExpenses,
        project.netFlow,
        project.transactionCount
      ])
    })
    
    return csvData.map(row => row.join(',')).join('\n')
  }

  // التحقق من صحة البيانات المصرفية
  static validateBankStatement(transactions: BankTransaction[]): { 
    isValid: boolean, 
    errors: string[], 
    warnings: string[] 
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!transactions || transactions.length === 0) {
      errors.push('لا توجد معاملات للمعالجة')
      return { isValid: false, errors, warnings }
    }

    transactions.forEach((transaction, index) => {
      // فحص التواريخ
      if (!transaction.date || isNaN(new Date(transaction.date).getTime())) {
        errors.push(`السطر ${index + 1}: تاريخ غير صحيح`)
      }

      // فحص المبالغ
      if (transaction.debit === 0 && transaction.credit === 0) {
        warnings.push(`السطر ${index + 1}: لا يحتوي على مبلغ مدين أو دائن`)
      }

      // فحص الوصف
      if (!transaction.description || transaction.description.trim() === '') {
        warnings.push(`السطر ${index + 1}: وصف العملية فارغ`)
      }

      // فحص ربط المشروع
      if (transaction.project !== 'غير محدد' && !transaction.projectId) {
        warnings.push(`السطر ${index + 1}: لم يتم ربط المشروع "${transaction.project}" بالنظام`)
      }
    })

    // فحص التوازن المحاسبي
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0)
    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0)
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      warnings.push('مجموع المبالغ المدينة لا يتوازن مع مجموع المبالغ الدائنة')
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings 
    }
  }

  private static pickFirstValue(
    row: RawBankStatementRow,
    keys: string[],
    fallback?: unknown
  ): unknown {
    for (const key of keys) {
      const value = row[key]
      if (value !== undefined && value !== null && value !== '') {
        return value
      }
    }
    return fallback
  }
}
