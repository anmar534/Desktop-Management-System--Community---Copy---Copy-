/**
 * البيانات المركزية لنظام إدارة المقاولات
 *
 * ⚠️  تنبيه مهم: ⚠️
 * هذه البيانات هي بيانات افتراضية تجريبية للاختبار والتطوير فقط
 * سيتم استبدالها تلقائياً ببيانات المستخدم الفعلية المحفوظة في التخزين المحلي
 *
 * النظام يعمل بأولويات التحميل التالية:
 * 1. البيانات المحفوظة محلياً (electron-store) - أولوية عالية
 * 2. البيانات الافتراضية أدناه - فقط في حالة عدم وجود بيانات محفوظة
 *
 * جميع البيانات محفوظة محلياً باستخدام electron-store في التطبيق
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { BASE_CURRENCY } from '@/shared/config/currency'
import {
  formatCurrency as formatUnifiedCurrency,
  type CurrencyOptions,
  formatDateValue,
} from '@/shared/utils/formatters/formatters'

// تعريف أنواع البيانات
export interface Project {
  id: string
  name: string
  client: string
  status: 'active' | 'completed' | 'delayed' | 'paused' | 'planning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progress: number
  contractValue: number // قيمة العقد = الإيرادات
  estimatedCost: number // التكلفة التقديرية = الميزانية المخططة
  actualCost: number // التكلفة الفعلية
  spent: number // المصروف حتى الآن (للمشاريع النشطة)
  remaining: number // المتبقي من قيمة العقد
  expectedProfit: number // الربح المتوقع = قيمة العقد - التكلفة التقديرية
  actualProfit?: number // الربح الفعلي (للمشاريع المكتملة)
  startDate: string
  endDate: string
  manager: string
  team: string
  location: string
  phase: string
  health: 'green' | 'yellow' | 'red'
  lastUpdate: string
  nextMilestone?: string
  milestoneDate?: string
  category: string
  efficiency: number
  riskLevel: 'low' | 'medium' | 'high'
  // حقول للتوافق مع النظام القديم
  budget: number // مرادف لـ contractValue للتوافق
  value: number // مرادف لـ contractValue للتوافق
  type: string
}

export interface Tender {
  id: string
  name: string
  title: string
  client: string
  value: number
  totalValue?: number // القيمة المحسوبة من التسعير
  documentPrice?: number | string | null // سعر كراسة المنافسة (قد يُحفظ كنص في النماذج القديمة)
  bookletPrice?: number | string | null // حقل إضافي للكراسة للتوافق مع البيانات القديمة
  projectDuration?: string // مدة المشروع المتوقعة
  description?: string // وصف المشروع
  status:
    | 'new' // جديدة - تم إدخال المنافسة ولم يتم القيام بأي إجراء عليها
    | 'under_action' // تحت الإجراء - بدأ اتخاذ إجراءات ولكن لم يتم الانتهاء منها
    | 'ready_to_submit' // جاهزة للتقديم - تم الانتهاء من جميع الإجراءات
    | 'submitted' // بانتظار النتائج - تم تقديمها وبانتظار ظهور النتائج
    | 'won' // فائزة - تم الفوز بالمنافسة
    | 'lost' // خاسرة - لم يتم الفوز بها
    | 'expired' // منتهية الصلاحية - انتهت المدة
    | 'cancelled' // ملغاة

  // حقول خاصة بحساب التقدم
  totalItems?: number // إجمالي عدد البنود في الكراسة
  pricedItems?: number // عدد البنود المُسعَّرة
  itemsPriced?: number // عدد البنود المُسعَّرة (للتوافق مع الواجهات القديمة)
  technicalFilesUploaded?: boolean // هل تم رفع ملفات العرض الفني

  phase: string
  deadline: string
  daysLeft: number
  progress: number
  completionPercentage?: number // نسبة إكمال المحسوبة تلقائياً
  priority: 'low' | 'medium' | 'high' | 'critical'
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

  // حقول إضافية للنتائج والتوافق مع شاشات إدارة الحالة
  resultNotes?: string // ملاحظات نتيجة المنافسة
  winningBidValue?: number // قيمة العرض الفائز (عند الخسارة لتعلم السوق)
  ourBidValue?: number // قيمة عرضنا (عند الخسارة للمقارنة)
  winDate?: string // تاريخ الفوز
  lostDate?: string // تاريخ الخسارة
  resultDate?: string // تاريخ ظهور النتيجة
  cancelledDate?: string // تاريخ الإلغاء

  // حقول إضافية للتوثيق والمتابعة
  notes?: string // ملاحظات عامة حول المنافسة
  documents?: {
    id: string
    name: string
    originalName: string
    mimeType: string
    size: number
    url: string
    uploadedAt: string
  }[] // المستندات المرفقة
  proposals?: {
    id: string
    title: string
    value: number
    status: 'draft' | 'submitted' | 'accepted' | 'rejected'
    submissionDate?: string
    validUntil?: string
    notes?: string
  }[] // العروض المقدمة
  evaluationCriteria?: {
    id: string
    name: string
    weight: number
    score?: number
    notes?: string
  }[] // معايير التقييم
  competitors?: string[] // المنافسون
  requirements?: string[] // متطلبات المنافسة
  createdAt?: string // تاريخ الإنشاء
  updatedAt?: string // تاريخ آخر تحديث
}

export interface Client {
  id: string
  name: string
  type: 'government' | 'private' | 'individual'
  category: string
  projects: number
  totalValue: number
  status: 'active' | 'inactive'
  lastProject: string
  relationship: 'strategic' | 'government' | 'regular'
  paymentRating: 'excellent' | 'good' | 'average' | 'poor'
  location: string
  contact: string
  phone: string
  email: string
  establishedDate: string
  completedProjects: number
  outstandingPayments?: number
}

// واجهات الإدارة المالية
export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddress?: string
  projectName: string
  issueDate: string
  dueDate: string
  paymentTerms?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  tax: number
  total: number
  items: InvoiceItem[]
  notes: string
  createdAt: string
  paidAt?: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface BankAccount {
  id: string
  accountName: string
  bankName: string
  accountNumber: string
  iban: string
  accountType: 'current' | 'savings' | 'investment' | 'project'
  currentBalance: number
  currency: string
  isActive: boolean
  lastTransactionDate: string
  monthlyInflow: number
  monthlyOutflow: number
}

export interface Budget {
  id: string
  name: string
  description: string
  totalAmount: number
  spentAmount: number
  startDate: string
  endDate: string
  department: string
  category: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  utilizationPercentage: number
  categories: BudgetCategory[]
}

export interface BudgetCategory {
  id: string
  name: string
  allocatedAmount: number
  spentAmount: number
  description: string
}

export interface FinancialReport {
  id: string
  name: string
  type: string
  description: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  format: string
  size?: number
  url?: string
  frequency?: string
  dataSources?: string[]
  recipients?: string
  autoGenerate?: boolean
}

// الواجهات التالية محذوفة - لا توجد صفحات مرتبطة بها في النظام
/*
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  supplier: string;
  price: number;
  totalValue: number;
  lastUpdated: string;
  status: "good" | "low" | "critical" | "out";
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance" | "broken" | "idle";
  location: string;
  assignedProject: string;
  efficiency: number;
  lastMaintenance: string;
  nextMaintenance: string;
  maintenanceDue: boolean;
  hoursUsed: number;
  totalHours: number;
  operator: string;
  dailyCost: number;
  monthlyCost: number;
}

export interface Purchase {
  id: string;
  supplier: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "ordered" | "delivered" | "overdue";
  project: string;
  requestedBy: string;
  notes: string;
}
*/

export interface RecentActivity {
  id: string
  type: 'project' | 'tender' | 'client' | 'financial' | 'inventory' | 'equipment'
  action: string
  description: string
  timestamp: string
  user: string
  relatedItem: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface UrgentItem {
  id: string
  type: 'project' | 'tender' | 'maintenance' | 'inventory' | 'payment'
  title: string
  description: string
  daysLeft: number
  priority: 'high' | 'critical'
  status: string
  relatedTo: string
}

// البيانات الافتراضية للمشاريع - فارغة (سيتم تحميلها من التخزين المحلي)
export const projectsData: Project[] = []

// البيانات الافتراضية للمنافسات - فارغة (سيتم تحميلها من التخزين المحلي)
export const tendersData: Tender[] = []

// البيانات الافتراضية للعملاء - فارغة (سيتم تحميلها من التخزين المحلي)
export const clientsData: Client[] = []

// هذه البيانات محذوفة - لا توجد صفحات مرتبطة بالمخزون في النظام
// export const inventoryData: InventoryItem[] = [];

// هذه البيانات محذوفة - لا توجد صفحات مرتبطة بالمعدات في النظام
// export const equipmentData: Equipment[] = [];

// هذه البيانات محذوفة - لا توجد صفحات مرتبطة بالمشتريات في النظام
// export const purchasesData: Purchase[] = [];

// دوال مساعدة للتنسيق
export const formatCurrency = (
  amount: number | undefined | null,
  options?: CurrencyOptions,
): string => {
  if (amount === undefined || amount === null) {
    return '0'
  }

  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount)) {
    return '0'
  }

  const defaultFractionDigits = Math.abs(numericAmount) < 1 ? 2 : 0

  const resolvedOptions: CurrencyOptions = {
    currency: options?.currency ?? BASE_CURRENCY,
    locale: options?.locale ?? 'ar-SA',
    minimumFractionDigits: options?.minimumFractionDigits ?? defaultFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits ?? defaultFractionDigits,
    notation: options?.notation ?? 'compact',
  }

  return formatUnifiedCurrency(numericAmount, resolvedOptions)
}

export const formatDate = (dateString: string): string => {
  return formatDateValue(
    dateString,
    {
      locale: 'ar-SA',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    dateString,
  )
}

export const calculateDaysLeft = (deadline: string): number => {
  try {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

// تمت إزالة المنطق المحلي للّون الصحي لصالح المصدر الموحد statusColors
// @deprecated استبدل كل الاستدعاءات بـ getHealthColor من utils/statusColors مباشرة
export { getHealthColor } from '@/shared/utils/ui/statusColors'

// دالة للحصول على العناصر العاجلة (محدودة للبيانات المتوفرة فقط)
export const getUrgentItems = (): UrgentItem[] => {
  const urgentItems: UrgentItem[] = []

  // المنافسات العاجلة (أقل من 7 أيام)
  tendersData
    .filter(
      (tender) =>
        tender.daysLeft <= 7 &&
        (tender.status === 'new' ||
          tender.status === 'under_action' ||
          tender.status === 'ready_to_submit'),
    )
    .forEach((tender) => {
      urgentItems.push({
        id: tender.id,
        type: 'tender',
        title: tender.name,
        description: `موعد التسليم: ${formatDate(tender.deadline)}`,
        daysLeft: tender.daysLeft,
        priority: tender.daysLeft <= 3 ? 'critical' : 'high',
        status: tender.status,
        relatedTo: tender.client,
      })
    })

  // المشاريع المتأخرة أو في حالة خطر
  projectsData
    .filter((project) => project.health === 'red' || project.status === 'delayed')
    .forEach((project) => {
      urgentItems.push({
        id: project.id,
        type: 'project',
        title: project.name,
        description: project.status === 'delayed' ? 'مشروع متأخر' : 'مشروع في حالة خطر',
        daysLeft: calculateDaysLeft(project.endDate),
        priority: project.priority === 'critical' ? 'critical' : 'high',
        status: project.status,
        relatedTo: project.client,
      })
    })

  // البيانات الأخرى محذوفة لأنها غير مستخدمة في النظام
  // (المعدات، المخزون، المشتريات)

  return urgentItems.sort((a, b) => {
    if (a.priority === 'critical' && b.priority !== 'critical') return -1
    if (b.priority === 'critical' && a.priority !== 'critical') return 1
    return a.daysLeft - b.daysLeft
  })
}

// دالة للحصول على الأنشطة الحديثة
export const getRecentActivities = (): RecentActivity[] => {
  const activities: RecentActivity[] = []

  // أنشطة المشاريع الحديثة
  projectsData
    .filter((project) => project.lastUpdate)
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 5)
    .forEach((project) => {
      activities.push({
        id: `act-prj-${project.id}`,
        type: 'project',
        action: 'تحديث المشروع',
        description: `تم تحديث مشروع "${project.name}" - ${project.phase}`,
        timestamp: project.lastUpdate,
        user: project.manager,
        relatedItem: project.name,
        priority: project.priority,
      })
    })

  // أنشطة المنافسات الحديثة
  tendersData
    .filter((tender) => tender.lastUpdate)
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 3)
    .forEach((tender) => {
      activities.push({
        id: `act-tnd-${tender.id}`,
        type: 'tender',
        action: tender.lastAction,
        description: `منافسة "${tender.name}" - ${tender.lastAction}`,
        timestamp: tender.lastUpdate,
        user: tender.manager,
        relatedItem: tender.name,
        priority: tender.priority,
      })
    })

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
}

// إدارة بيانات الفواتير
export const getInvoices = (): Invoice[] => {
  const stored = safeLocalStorage.getItem('financial_invoices', null)
  return stored ? JSON.parse(stored) : []
}

export const saveInvoices = (invoices: Invoice[]) => {
  safeLocalStorage.setItem('financial_invoices', JSON.stringify(invoices))
}

export const addInvoice = (invoice: Invoice) => {
  const invoices = getInvoices()
  invoices.push(invoice)
  saveInvoices(invoices)
}

export const updateInvoice = (updatedInvoice: Invoice) => {
  const invoices = getInvoices()
  const index = invoices.findIndex((inv) => inv.id === updatedInvoice.id)
  if (index !== -1) {
    invoices[index] = updatedInvoice
    saveInvoices(invoices)
  }
}

export const deleteInvoice = (invoiceId: string) => {
  const invoices = getInvoices().filter((inv) => inv.id !== invoiceId)
  saveInvoices(invoices)
}

// إدارة بيانات الحسابات البنكية
export const getBankAccounts = (): BankAccount[] => {
  const stored = safeLocalStorage.getItem('financial_bank_accounts', null)
  return stored ? JSON.parse(stored) : []
}

export const saveBankAccounts = (accounts: BankAccount[]) => {
  safeLocalStorage.setItem('financial_bank_accounts', JSON.stringify(accounts))
}

export const addBankAccount = (account: BankAccount) => {
  const accounts = getBankAccounts()
  accounts.push(account)
  saveBankAccounts(accounts)
}

export const updateBankAccount = (updatedAccount: BankAccount) => {
  const accounts = getBankAccounts()
  const index = accounts.findIndex((acc) => acc.id === updatedAccount.id)
  if (index !== -1) {
    accounts[index] = updatedAccount
    saveBankAccounts(accounts)
  }
}

export const deleteBankAccount = (accountId: string) => {
  const accounts = getBankAccounts().filter((acc) => acc.id !== accountId)
  saveBankAccounts(accounts)
}

// إدارة بيانات الموازنات
export const getBudgets = (): Budget[] => {
  const stored = safeLocalStorage.getItem('financial_budgets', null)
  return stored ? JSON.parse(stored) : []
}

export const saveBudgets = (budgets: Budget[]) => {
  safeLocalStorage.setItem('financial_budgets', JSON.stringify(budgets))
}

export const addBudget = (budget: Budget) => {
  const budgets = getBudgets()
  budgets.push(budget)
  saveBudgets(budgets)
}

export const updateBudget = (updatedBudget: Budget) => {
  const budgets = getBudgets()
  const index = budgets.findIndex((b) => b.id === updatedBudget.id)
  if (index !== -1) {
    budgets[index] = updatedBudget
    saveBudgets(budgets)
  }
}

export const deleteBudget = (budgetId: string) => {
  const budgets = getBudgets().filter((b) => b.id !== budgetId)
  saveBudgets(budgets)
}

// إدارة بيانات التقارير المالية
export const getFinancialReports = (): FinancialReport[] => {
  const stored = safeLocalStorage.getItem('financial_reports', null)
  return stored ? JSON.parse(stored) : []
}

export const saveFinancialReports = (reports: FinancialReport[]) => {
  safeLocalStorage.setItem('financial_reports', JSON.stringify(reports))
}

export const addFinancialReport = (report: FinancialReport) => {
  const reports = getFinancialReports()
  reports.push(report)
  saveFinancialReports(reports)
}

export const updateFinancialReport = (updatedReport: FinancialReport) => {
  const reports = getFinancialReports()
  const index = reports.findIndex((r) => r.id === updatedReport.id)
  if (index !== -1) {
    reports[index] = updatedReport
    saveFinancialReports(reports)
  }
}

export const deleteFinancialReport = (reportId: string) => {
  const reports = getFinancialReports().filter((r) => r.id !== reportId)
  saveFinancialReports(reports)
}

// تصدير جميع البيانات (البيانات المحذوفة غير مُصدّرة)
export const allData = {
  projects: projectsData,
  tenders: tendersData,
  clients: clientsData,
  // البيانات التالية محذوفة - لا توجد صفحات مرتبطة بها
  // inventory: inventoryData,
  // equipment: equipmentData,
  // purchases: purchasesData,
}
