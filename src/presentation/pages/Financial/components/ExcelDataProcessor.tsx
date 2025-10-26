// معالج لمصادر Excel وتحويلها إلى عقود النظام الموحدة
import type { BankTransaction } from './BankStatementProcessor'
import { BankStatementProcessor } from './BankStatementProcessor'
import type {
  ClientType,
  Health,
  PaymentRating,
  Priority,
  RelationshipType,
  Status,
  TenderStatus,
} from '../types/contracts'

type ExcelCell = string | number | boolean | null | undefined | Date
type ExcelRow = Record<string, ExcelCell>

export type ExcelDataType = 'projects' | 'clients' | 'tenders' | 'inventory' | 'bank-statement'

type RiskLevel = 'low' | 'medium' | 'high'
type InventoryStatus = 'good' | 'warning' | 'critical'

export interface ImportedProject {
  id: string
  name: string
  client: string
  status: Status
  priority: Priority
  progress: number
  budget: number
  spent: number
  startDate: string
  endDate: string
  manager: string
  team: string
  location: string
  category: string
  type: string
  health: Health
  lastUpdate: string
  value: number
  efficiency: number
  riskLevel: RiskLevel
}

export interface ImportedClient {
  id: string
  name: string
  type: ClientType
  category: string
  projects: number
  totalValue: number
  status: string
  lastProject: string
  relationship: RelationshipType
  paymentRating: PaymentRating
  location: string
  contact: string
  phone: string
  email: string
  establishedDate: string
  completedProjects: number
}

export interface ImportedTender {
  id: string
  name: string
  title: string
  client: string
  value: number
  status: TenderStatus
  phase: string
  deadline: string
  daysLeft: number
  progress: number
  priority: Priority
  team: string
  manager: string
  winChance: number
  competition: string
  submissionDate: string
  lastAction: string
  lastUpdate: string
  category: string
  location: string
  type: string
}

export interface ImportedInventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  location: string
  supplier: string
  price: number
  totalValue: number
  lastUpdated: string
  status: InventoryStatus
}

interface ProcessedDataMap {
  projects: ImportedProject[]
  clients: ImportedClient[]
  tenders: ImportedTender[]
  inventory: ImportedInventoryItem[]
  'bank-statement': BankTransaction[]
}

const DEFAULT_DAYS_LEFT = 30

export class ExcelDataProcessor {
  // =====================================
  // 🗂️ بيانات المشاريع
  // =====================================
  static processProjectsData(rawData: ExcelRow[]): ImportedProject[] {
    return rawData.map((row, index) => {
      const budget = this.normalizeNumber(
        this.pickFirstValue(row, ['budget', 'الميزانية', 'Budget']),
        0,
      )
      const spent = this.normalizeNumber(this.pickFirstValue(row, ['spent', 'المصروف', 'Spent']), 0)

      return {
        id: `PRJ-IMP-${String(index + 1).padStart(3, '0')}`,
        name: this.ensureString(
          this.pickFirstValue(row, ['name', 'اسم المشروع', 'Project Name']),
          `مشروع مستورد ${index + 1}`,
        ),
        client: this.ensureString(
          this.pickFirstValue(row, ['client', 'العميل', 'Client']),
          'عميل غير محدد',
        ),
        status: this.normalizeStatus(this.pickFirstValue(row, ['status', 'الحالة', 'Status'])),
        priority: this.normalizePriority(
          this.pickFirstValue(row, ['priority', 'الأولوية', 'Priority']),
        ),
        progress: this.normalizeNumber(
          this.pickFirstValue(row, ['progress', 'التقدم', 'Progress']),
          0,
          100,
        ),
        budget,
        spent,
        startDate: this.normalizeDate(
          this.pickFirstValue(row, ['startDate', 'تاريخ البداية', 'Start Date']),
        ),
        endDate: this.normalizeDate(
          this.pickFirstValue(row, ['endDate', 'تاريخ النهاية', 'End Date']),
        ),
        manager: this.ensureString(
          this.pickFirstValue(row, ['manager', 'المدير', 'Manager']),
          'غير محدد',
        ),
        team: this.ensureString(this.pickFirstValue(row, ['team', 'الفريق', 'Team']), 'غير محدد'),
        location: this.ensureString(
          this.pickFirstValue(row, ['location', 'الموقع', 'Location']),
          'غير محدد',
        ),
        category: this.ensureString(
          this.pickFirstValue(row, ['category', 'التصنيف', 'Category']),
          'عام',
        ),
        type: this.ensureString(this.pickFirstValue(row, ['type', 'النوع', 'Type']), 'مشروع'),
        health: this.normalizeHealth(this.pickFirstValue(row, ['health', 'الصحة', 'Health'])),
        lastUpdate: this.currentDateString(),
        value: budget,
        efficiency: this.normalizeNumber(
          this.pickFirstValue(row, ['efficiency', 'الكفاءة', 'Efficiency']),
          70,
          100,
        ),
        riskLevel: this.normalizeRisk(
          this.pickFirstValue(row, ['riskLevel', 'مستوى المخاطر', 'Risk Level']),
        ),
      }
    })
  }

  // =====================================
  // 👥 بيانات العملاء
  // =====================================
  static processClientsData(rawData: ExcelRow[]): ImportedClient[] {
    return rawData.map((row, index) => {
      const typeSource = this.pickFirstValue(row, ['type', 'النوع', 'Type'])
      const clientType = this.normalizeClientType(typeSource)

      return {
        id: `CLI-IMP-${String(index + 1).padStart(3, '0')}`,
        name: this.ensureString(
          this.pickFirstValue(row, ['name', 'اسم العميل', 'Client Name']),
          `عميل مستورد ${index + 1}`,
        ),
        type: clientType,
        category: this.getClientCategory(typeSource),
        projects: this.normalizeNumber(
          this.pickFirstValue(row, ['projects', 'المشاريع', 'Projects']),
          0,
          1000,
        ),
        totalValue: this.normalizeNumber(
          this.pickFirstValue(row, ['totalValue', 'القيمة الإجمالية', 'Total Value']),
          0,
        ),
        status: this.ensureString(
          this.pickFirstValue(row, ['status', 'الحالة', 'Status']),
          'active',
        ),
        lastProject: this.ensureString(
          this.pickFirstValue(row, ['lastProject', 'آخر مشروع', 'Last Project']),
          'غير محدد',
        ),
        relationship: this.normalizeRelationship(
          this.pickFirstValue(row, ['relationship', 'العلاقة', 'Relationship']),
        ),
        paymentRating: this.normalizePaymentRating(
          this.pickFirstValue(row, ['paymentRating', 'تقييم الدفع', 'Payment Rating']),
        ),
        location: this.ensureString(
          this.pickFirstValue(row, ['location', 'الموقع', 'Location']),
          'غير محدد',
        ),
        contact: this.ensureString(
          this.pickFirstValue(row, ['contact', 'جهة الاتصال', 'Contact']),
          'غير محدد',
        ),
        phone: this.ensureString(this.pickFirstValue(row, ['phone', 'الهاتف', 'Phone']), ''),
        email: this.ensureString(
          this.pickFirstValue(row, ['email', 'البريد الإلكتروني', 'Email']),
          '',
        ),
        establishedDate: this.normalizeDate(
          this.pickFirstValue(row, ['establishedDate', 'تاريخ التأسيس', 'Established Date']),
          '2020-01-01',
        ),
        completedProjects: this.normalizeNumber(
          this.pickFirstValue(row, [
            'completedProjects',
            'المشاريع المكتملة',
            'Completed Projects',
          ]),
          0,
          100,
        ),
      }
    })
  }

  // =====================================
  // 📑 بيانات المنافسات
  // =====================================
  static processTendersData(rawData: ExcelRow[]): ImportedTender[] {
    const currentYear = new Date().getFullYear()

    return rawData.map((row, index) => {
      const statusSource = this.pickFirstValue(row, ['status', 'الحالة', 'Status'])
      const deadlineSource = this.pickFirstValue(row, ['deadline', 'الموعد النهائي', 'Deadline'])

      return {
        id: `TND-IMP-${currentYear}-${String(index + 1).padStart(3, '0')}`,
        name: this.ensureString(
          this.pickFirstValue(row, ['name', 'اسم المنافسة', 'Tender Name']),
          `منافسة مستوردة ${index + 1}`,
        ),
        title: this.ensureString(
          this.pickFirstValue(row, ['title', 'اسم المنافسة', 'Tender Name']),
          `منافسة مستوردة ${index + 1}`,
        ),
        client: this.ensureString(
          this.pickFirstValue(row, ['client', 'العميل', 'Client']),
          'عميل غير محدد',
        ),
        value: this.normalizeNumber(
          this.pickFirstValue(row, ['value', 'القيمة', 'Value']),
          1_000_000,
        ),
        status: this.normalizeTenderStatus(statusSource),
        phase: this.getTenderPhase(statusSource),
        deadline: this.normalizeDate(deadlineSource),
        daysLeft: this.calculateDaysLeft(deadlineSource),
        progress: this.normalizeNumber(
          this.pickFirstValue(row, ['progress', 'التقدم', 'Progress']),
          0,
          100,
        ),
        priority: this.normalizePriority(
          this.pickFirstValue(row, ['priority', 'الأولوية', 'Priority']),
        ),
        team: this.ensureString(
          this.pickFirstValue(row, ['team', 'الفريق', 'Team']),
          'فريق المنافسات',
        ),
        manager: this.ensureString(
          this.pickFirstValue(row, ['manager', 'المدير', 'Manager']),
          'غير محدد',
        ),
        winChance: this.normalizeNumber(
          this.pickFirstValue(row, ['winChance', 'فرصة الفوز', 'Win Chance']),
          50,
          100,
        ),
        competition: this.normalizeCompetition(
          this.pickFirstValue(row, ['competition', 'المنافسة', 'Competition']),
        ),
        submissionDate: this.normalizeDate(
          this.pickFirstValue(row, ['submissionDate', 'تاريخ التسليم', 'Submission Date']),
        ),
        lastAction: this.ensureString(
          this.pickFirstValue(row, ['lastAction', 'آخر إجراء', 'Last Action']),
          'قيد المراجعة',
        ),
        lastUpdate: this.currentDateString(),
        category: this.ensureString(
          this.pickFirstValue(row, ['category', 'التصنيف', 'Category']),
          'عام',
        ),
        location: this.ensureString(
          this.pickFirstValue(row, ['location', 'الموقع', 'Location']),
          'غير محدد',
        ),
        type: this.ensureString(this.pickFirstValue(row, ['type', 'النوع', 'Type']), 'منافسة'),
      }
    })
  }

  // =====================================
  // 📦 بيانات المخزون
  // =====================================
  static processInventoryData(rawData: ExcelRow[]): ImportedInventoryItem[] {
    return rawData.map((row, index) => {
      const currentStock = this.normalizeNumber(
        this.pickFirstValue(row, ['currentStock', 'stock', 'المخزون الحالي', 'Current Stock']),
        0,
      )
      const minStock = this.normalizeNumber(
        this.pickFirstValue(row, ['minStock', 'الحد الأدنى', 'Min Stock']),
        10,
      )
      const maxStock = this.normalizeNumber(
        this.pickFirstValue(row, ['maxStock', 'الحد الأقصى', 'Max Stock']),
        1_000,
      )
      const price = this.normalizeNumber(this.pickFirstValue(row, ['price', 'السعر', 'Price']), 1)
      const totalValue = Number.isFinite(currentStock * price) ? currentStock * price : 0

      const status: InventoryStatus =
        currentStock <= minStock ? 'warning' : currentStock >= maxStock ? 'critical' : 'good'

      return {
        id: `MAT-IMP-${String(index + 1).padStart(3, '0')}`,
        name: this.ensureString(
          this.pickFirstValue(row, ['name', 'اسم المادة', 'Item Name']),
          `مادة مستوردة ${index + 1}`,
        ),
        category: this.ensureString(
          this.pickFirstValue(row, ['category', 'التصنيف', 'Category']),
          'مواد عامة',
        ),
        currentStock,
        minStock,
        maxStock,
        unit: this.ensureString(this.pickFirstValue(row, ['unit', 'الوحدة', 'Unit']), 'قطعة'),
        location: this.ensureString(
          this.pickFirstValue(row, ['location', 'الموقع', 'Location']),
          'المخزن الرئيسي',
        ),
        supplier: this.ensureString(
          this.pickFirstValue(row, ['supplier', 'المورد', 'Supplier']),
          'مورد غير محدد',
        ),
        price,
        totalValue,
        lastUpdated: this.currentDateString(),
        status,
      }
    })
  }

  // =====================================
  // 🏦 كشوف الحساب البنكي
  // =====================================
  static processBankStatementData(rawData: ExcelRow[]): BankTransaction[] {
    return BankStatementProcessor.processBankStatement(rawData as Record<string, unknown>[])
  }

  // =====================================
  // ⚙️ عمليات عامة
  // =====================================
  static processData<T extends ExcelDataType>(type: T, rawData: ExcelRow[]): ProcessedDataMap[T] {
    switch (type) {
      case 'projects':
        return this.processProjectsData(rawData) as ProcessedDataMap[T]
      case 'clients':
        return this.processClientsData(rawData) as ProcessedDataMap[T]
      case 'tenders':
        return this.processTendersData(rawData) as ProcessedDataMap[T]
      case 'inventory':
        return this.processInventoryData(rawData) as ProcessedDataMap[T]
      case 'bank-statement':
        return this.processBankStatementData(rawData) as ProcessedDataMap[T]
      default:
        return [] as ProcessedDataMap[T]
    }
  }

  static validateData<T extends ExcelDataType>(
    type: T,
    data: ProcessedDataMap[T],
  ): { isValid: boolean; errors: string[]; warnings?: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!Array.isArray(data) || data.length === 0) {
      errors.push('لا توجد بيانات للمعالجة')
      return { isValid: false, errors, warnings }
    }

    switch (type) {
      case 'projects': {
        const projects = data as ProcessedDataMap['projects']
        projects.forEach((project, index) => {
          if (project.name.trim() === '') {
            errors.push(`السطر ${index + 1}: اسم المشروع مطلوب`)
          }
          if (project.client.trim() === '') {
            errors.push(`السطر ${index + 1}: اسم العميل مطلوب`)
          }
          if (project.budget < 0) {
            errors.push(`السطر ${index + 1}: الميزانية لا يمكن أن تكون سالبة`)
          }
        })
        break
      }

      case 'clients': {
        const clients = data as ProcessedDataMap['clients']
        clients.forEach((client, index) => {
          if (client.name.trim() === '') {
            errors.push(`السطر ${index + 1}: اسم العميل مطلوب`)
          }
        })
        break
      }

      case 'tenders': {
        const tenders = data as ProcessedDataMap['tenders']
        tenders.forEach((tender, index) => {
          if (tender.name.trim() === '') {
            errors.push(`السطر ${index + 1}: اسم المنافسة مطلوب`)
          }
          if (tender.client.trim() === '') {
            errors.push(`السطر ${index + 1}: اسم العميل مطلوب`)
          }
          if (tender.value < 0) {
            errors.push(`السطر ${index + 1}: قيمة المنافسة لا يمكن أن تكون سالبة`)
          }
        })
        break
      }

      case 'inventory': {
        const items = data as ProcessedDataMap['inventory']
        items.forEach((item, index) => {
          if (item.name.trim() === '') {
            errors.push(`السطر ${index + 1}: اسم المادة مطلوب`)
          }
          if (item.currentStock < 0) {
            errors.push(`السطر ${index + 1}: المخزون الحالي لا يمكن أن يكون سالب`)
          }
          if (item.price <= 0) {
            errors.push(`السطر ${index + 1}: السعر يجب أن يكون أكبر من صفر`)
          }
        })
        break
      }

      case 'bank-statement': {
        const validationResult = BankStatementProcessor.validateBankStatement(
          data as ProcessedDataMap['bank-statement'],
        )
        return {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  // =====================================
  // 🛠️ الدوال المساعدة
  // =====================================
  private static pickFirstValue(row: ExcelRow, keys: string[]): ExcelCell | undefined {
    for (const key of keys) {
      const value = row[key]
      if (value === undefined || value === null) {
        continue
      }
      if (typeof value === 'string' && value.trim() === '') {
        continue
      }
      return value
    }
    return undefined
  }

  private static ensureString(value: ExcelCell | undefined, fallback: string): string {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }
    if (typeof value === 'number') {
      return value.toString()
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }
    return fallback
  }

  private static currentDateString(): string {
    return new Date().toISOString().split('T')[0]
  }

  private static normalizeStatus(status: ExcelCell | undefined): Status {
    if (typeof status !== 'string') {
      return 'planning'
    }
    const statusMap: Record<string, Status> = {
      نشط: 'active',
      active: 'active',
      مكتمل: 'completed',
      completed: 'completed',
      متأخر: 'delayed',
      delayed: 'delayed',
      متوقف: 'paused',
      paused: 'paused',
      تخطيط: 'planning',
      planning: 'planning',
    }
    return statusMap[status.toLowerCase()] ?? 'planning'
  }

  private static normalizeTenderStatus(status: ExcelCell | undefined): TenderStatus {
    if (typeof status !== 'string') {
      return 'preparing'
    }
    const statusMap: Record<string, TenderStatus> = {
      نشط: 'active',
      active: 'active',
      إعداد: 'preparing',
      preparing: 'preparing',
      مراجعة: 'under_review',
      under_review: 'under_review',
      مسلم: 'submitted',
      submitted: 'submitted',
      فائز: 'won',
      won: 'won',
      خاسر: 'lost',
      lost: 'lost',
    }
    return statusMap[status.toLowerCase()] ?? 'preparing'
  }

  private static normalizePriority(priority: ExcelCell | undefined): Priority {
    if (typeof priority !== 'string') {
      return 'medium'
    }
    const priorityMap: Record<string, Priority> = {
      عالية: 'high',
      high: 'high',
      متوسطة: 'medium',
      medium: 'medium',
      منخفضة: 'low',
      low: 'low',
      حرجة: 'critical',
      critical: 'critical',
    }
    return priorityMap[priority.toLowerCase()] ?? 'medium'
  }

  private static normalizeClientType(type: ExcelCell | undefined): ClientType {
    if (typeof type !== 'string') {
      return 'private'
    }
    const typeMap: Record<string, ClientType> = {
      حكومي: 'government',
      government: 'government',
      خاص: 'private',
      private: 'private',
      فرد: 'individual',
      individual: 'individual',
    }
    return typeMap[type.toLowerCase()] ?? 'private'
  }

  private static getClientCategory(type: ExcelCell | undefined): string {
    const categoryMap: Record<ClientType, string> = {
      government: 'جهة حكومية',
      private: 'شركة خاصة',
      individual: 'فرد',
    }
    const normalizedType = this.normalizeClientType(type)
    return categoryMap[normalizedType] ?? 'شركة خاصة'
  }

  private static normalizeRelationship(relationship: ExcelCell | undefined): RelationshipType {
    if (typeof relationship !== 'string') {
      return 'regular'
    }
    const relationshipMap: Record<string, RelationshipType> = {
      استراتيجي: 'strategic',
      strategic: 'strategic',
      حكومي: 'government',
      government: 'government',
      عادي: 'regular',
      regular: 'regular',
    }
    return relationshipMap[relationship.toLowerCase()] ?? 'regular'
  }

  private static normalizePaymentRating(rating: ExcelCell | undefined): PaymentRating {
    if (typeof rating !== 'string') {
      return 'good'
    }
    const ratingMap: Record<string, PaymentRating> = {
      ممتاز: 'excellent',
      excellent: 'excellent',
      جيد: 'good',
      good: 'good',
      متوسط: 'average',
      average: 'average',
      ضعيف: 'poor',
      poor: 'poor',
    }
    return ratingMap[rating.toLowerCase()] ?? 'good'
  }

  private static normalizeHealth(health: ExcelCell | undefined): Health {
    if (typeof health !== 'string') {
      return 'green'
    }
    const healthMap: Record<string, Health> = {
      أخضر: 'green',
      green: 'green',
      أصفر: 'yellow',
      yellow: 'yellow',
      أحمر: 'red',
      red: 'red',
    }
    return healthMap[health.toLowerCase()] ?? 'green'
  }

  private static normalizeRisk(risk: ExcelCell | undefined): RiskLevel {
    if (typeof risk !== 'string') {
      return 'low'
    }
    const riskMap: Record<string, RiskLevel> = {
      منخفض: 'low',
      low: 'low',
      متوسط: 'medium',
      medium: 'medium',
      عالي: 'high',
      high: 'high',
    }
    return riskMap[risk.toLowerCase()] ?? 'low'
  }

  private static normalizeCompetition(competition: ExcelCell | undefined): string {
    if (typeof competition !== 'string') {
      return 'متوسطة'
    }
    const competitionMap: Record<string, string> = {
      منخفضة: 'low',
      low: 'منخفضة',
      متوسطة: 'medium',
      medium: 'متوسطة',
      عالية: 'high',
      high: 'عالية',
      'عالية جداً': 'very high',
      'very high': 'عالية جداً',
    }
    return competitionMap[competition.toLowerCase()] ?? 'متوسطة'
  }

  private static normalizeNumber(value: ExcelCell | undefined, min = 0, max?: number): number {
    if (value === undefined || value === null || value === '') {
      return min
    }

    let numeric: number

    if (typeof value === 'number') {
      numeric = value
    } else if (typeof value === 'string') {
      const sanitized = value.replace(/[^\d.-]/g, '')
      numeric = Number.parseFloat(sanitized)
    } else if (typeof value === 'boolean') {
      numeric = value ? 1 : 0
    } else if (value instanceof Date) {
      numeric = value.getTime()
    } else {
      numeric = Number(value)
    }

    if (Number.isNaN(numeric)) {
      return min
    }

    if (max !== undefined) {
      return Math.min(Math.max(numeric, min), max)
    }

    return Math.max(numeric, min)
  }

  private static normalizeDate(dateValue: ExcelCell | undefined, defaultDate?: string): string {
    const fallback = defaultDate ?? this.currentDateString()

    if (dateValue === undefined || dateValue === null || dateValue === '') {
      return fallback
    }

    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]
    }

    if (typeof dateValue === 'boolean') {
      return fallback
    }

    if (typeof dateValue !== 'string' && typeof dateValue !== 'number') {
      return fallback
    }

    const parsed = new Date(dateValue)
    if (Number.isNaN(parsed.getTime())) {
      return fallback
    }

    return parsed.toISOString().split('T')[0]
  }

  private static calculateDaysLeft(deadline: ExcelCell | undefined): number {
    if (deadline === undefined || deadline === null || deadline === '') {
      return DEFAULT_DAYS_LEFT
    }

    const normalized = this.normalizeDate(deadline)
    const deadlineDate = new Date(normalized)
    if (Number.isNaN(deadlineDate.getTime())) {
      return DEFAULT_DAYS_LEFT
    }

    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private static getTenderPhase(status: ExcelCell | undefined): string {
    const phaseMap: Record<TenderStatus, string> = {
      active: 'قيد التنفيذ',
      preparing: 'إعداد العرض',
      under_review: 'تحت المراجعة',
      submitted: 'منتظر النتائج',
      won: 'فائز',
      lost: 'غير فائز',
      new: 'قيد الإعداد',
      under_action: 'قيد التنفيذ',
      cancelled: 'ملغي',
    }

    const normalizedStatus = this.normalizeTenderStatus(status)
    return phaseMap[normalizedStatus] ?? 'قيد الإعداد'
  }
}
