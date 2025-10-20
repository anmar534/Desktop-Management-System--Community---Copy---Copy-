import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle,
  Clock,
  Edit,
  Hammer,
  ListChecks,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageLayout, DetailCard, EmptyState } from './PageLayout'
import { StatusBadge, type StatusBadgeProps } from './ui/status-badge'
import { InlineAlert } from './ui/inline-alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'

import { useFinancialState } from '@/application/context'
import { useExpenses } from '@/application/hooks/useExpenses'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { formatDateValue } from '@/utils/formatters'
import type { Expense, ExpenseCategory } from '@/data/expenseCategories'
import {
  EXPENSE_FREQUENCIES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  getAdministrativeCategories,
  getCategoryById,
  getProjectCategories,
} from '@/data/expenseCategories'

const PROJECTS_FILTER_ALL = 'all'
const DEFAULT_PROJECT_SELECTION = 'none'
const DEFAULT_SUPPLIER_SELECTION = 'none'
const DEFAULT_FREQUENCY_ID = EXPENSE_FREQUENCIES.MONTHLY.id
const DEFAULT_PAYMENT_METHOD_ID = PAYMENT_METHODS.BANK_TRANSFER.id
const DEFAULT_PAYMENT_STATUS_ID = PAYMENT_STATUS.PENDING.id

type ExpenseFormTab = 'administrative' | 'project'
type ProjectFilterId = typeof PROJECTS_FILTER_ALL | string

type ExpenseFrequencyId = (typeof EXPENSE_FREQUENCIES)[keyof typeof EXPENSE_FREQUENCIES]['id']
type PaymentMethodId = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]['id']
type PaymentStatusId = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]['id']

interface ProjectSummary {
  id?: string | null
  name: string
}

interface Supplier {
  id: string
  name: string
}

interface ExpenseFormState {
  title: string
  description: string
  amount: string
  categoryId: string
  subcategoryId: string
  frequency: ExpenseFrequencyId
  paymentMethod: PaymentMethodId
  paymentStatus: PaymentStatusId
  dueDate: string
  projectId: string
  supplierId: string
}

interface ExpenseStats {
  totalExpenses: number
  totalAmount: number
  completedAmount: number
  pendingAmount: number
  overdueAmount: number
  monthlyTotal: number
  annualTotal: number
}

interface AmountBreakdown {
  monthly: number
  annual: number
}

const expenseFrequencyIds = Object.values(EXPENSE_FREQUENCIES).map((frequency) => frequency.id)
const paymentMethodIds = Object.values(PAYMENT_METHODS).map((method) => method.id)
const paymentStatusIds = Object.values(PAYMENT_STATUS).map((status) => status.id)

const isExpenseFrequencyId = (value: string): value is ExpenseFrequencyId =>
  expenseFrequencyIds.includes(value as ExpenseFrequencyId)

const isPaymentMethodId = (value: string): value is PaymentMethodId =>
  paymentMethodIds.includes(value as PaymentMethodId)

const isPaymentStatusId = (value: string): value is PaymentStatusId =>
  paymentStatusIds.includes(value as PaymentStatusId)

const coerceExpenseFrequencyId = (value: string): ExpenseFrequencyId =>
  isExpenseFrequencyId(value) ? value : DEFAULT_FREQUENCY_ID

const coercePaymentMethodId = (value: string): PaymentMethodId =>
  isPaymentMethodId(value) ? value : DEFAULT_PAYMENT_METHOD_ID

const coercePaymentStatusId = (value: string): PaymentStatusId =>
  isPaymentStatusId(value) ? value : DEFAULT_PAYMENT_STATUS_ID

const EXPENSE_FREQUENCY_CONFIG: Record<ExpenseFrequencyId, { label: string }> = Object.values(
  EXPENSE_FREQUENCIES,
).reduce(
  (acc, frequency) => {
    acc[frequency.id as ExpenseFrequencyId] = { label: frequency.nameAr }
    return acc
  },
  {} as Record<ExpenseFrequencyId, { label: string }>,
)

const EXPENSE_FREQUENCY_BADGE_STATUS: Record<ExpenseFrequencyId, StatusBadgeProps['status']> = {
  [EXPENSE_FREQUENCIES.MONTHLY.id]: 'info',
  [EXPENSE_FREQUENCIES.QUARTERLY.id]: 'onTrack',
  [EXPENSE_FREQUENCIES.ANNUALLY.id]: 'success',
  [EXPENSE_FREQUENCIES.SEMI_ANNUALLY.id]: 'success',
  [EXPENSE_FREQUENCIES.WEEKLY.id]: 'warning',
  [EXPENSE_FREQUENCIES.ONE_TIME.id]: 'default',
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatusId, { label: string }> = Object.values(
  PAYMENT_STATUS,
).reduce(
  (acc, status) => {
    acc[status.id as PaymentStatusId] = { label: status.nameAr }
    return acc
  },
  {} as Record<PaymentStatusId, { label: string }>,
)

const PAYMENT_STATUS_BADGE_STATUS: Record<PaymentStatusId, StatusBadgeProps['status']> = {
  [PAYMENT_STATUS.PENDING.id]: 'warning',
  [PAYMENT_STATUS.COMPLETED.id]: 'success',
  [PAYMENT_STATUS.OVERDUE.id]: 'overdue',
  [PAYMENT_STATUS.CANCELLED.id]: 'default',
}

const calculateAmounts = (amount: number, frequencyId: ExpenseFrequencyId): AmountBreakdown => {
  const frequency =
    Object.values(EXPENSE_FREQUENCIES).find((item) => item.id === frequencyId) ??
    EXPENSE_FREQUENCIES.MONTHLY
  const annual = frequency.multiplier > 0 ? amount * frequency.multiplier : amount
  const monthly = frequency.multiplier > 0 ? annual / 12 : amount / 12
  return {
    monthly,
    annual,
  }
}

const parseAmountField = (value: string): number => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return 0
  }
  const numericValue = Number.parseFloat(trimmed)
  return Number.isNaN(numericValue) ? 0 : numericValue
}

const isProjectSelectionValid = (value: string): boolean =>
  value !== DEFAULT_PROJECT_SELECTION && value.trim() !== ''

const createInitialFormState = (overrides?: Partial<ExpenseFormState>): ExpenseFormState => ({
  title: '',
  description: '',
  amount: '',
  categoryId: '',
  subcategoryId: '',
  frequency: DEFAULT_FREQUENCY_ID,
  paymentMethod: DEFAULT_PAYMENT_METHOD_ID,
  paymentStatus: DEFAULT_PAYMENT_STATUS_ID,
  dueDate: '',
  projectId: DEFAULT_PROJECT_SELECTION,
  supplierId: DEFAULT_SUPPLIER_SELECTION,
  ...overrides,
})

const ExpenseManagement: React.FC = () => {
  const { loading, error, addExpense, updateExpense, deleteExpense, getExpensesByType } =
    useExpenses()
  const { projects } = useFinancialState()
  const { projects: realProjects, isLoading: projectsLoading } = projects
  const { formatCurrencyValue } = useCurrencyFormatter()

  const countFormatter = useMemo(
    () =>
      new Intl.NumberFormat('ar-SA', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }),
    [],
  )

  const formatCount = useCallback(
    (value: number | null | undefined) => {
      const numeric = typeof value === 'number' ? value : Number(value ?? 0)
      return countFormatter.format(Number.isFinite(numeric) ? numeric : 0)
    },
    [countFormatter],
  )

  const [activeTab, setActiveTab] = useState<ExpenseFormTab>('administrative')
  const [formTab, setFormTab] = useState<ExpenseFormTab>('administrative')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectFilterId>(PROJECTS_FILTER_ALL)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<ExpenseFormState>(() => createInitialFormState())

  const suppliers: Supplier[] = [
    { id: '1', name: 'شركة الخرسانة المتطورة' },
    { id: '2', name: 'مصنع الحديد المتحد' },
    { id: '3', name: 'شركة السباكة الحديثة' },
    { id: '4', name: 'مؤسسة مواد البناء الحديثة' },
    { id: '5', name: 'شركة الطوب والبلوك' },
    { id: '6', name: 'مصنع الأسمنت السعودي' },
    { id: '7', name: 'شركة الأخشاب والدهانات' },
  ]

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = formData.title.trim()
    const hasAmount = formData.amount.trim() !== ''
    const hasCategory = formData.categoryId.trim() !== ''

    if (!trimmedTitle || !hasAmount || !hasCategory) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const category = getCategoryById(formData.categoryId)
    if (!category) {
      toast.error('الفئة المحددة غير صالحة')
      return
    }

    const currentFormType: ExpenseFormTab = editingExpense
      ? editingExpense.isAdministrative
        ? 'administrative'
        : 'project'
      : formTab

    const normalizedAmount = parseAmountField(formData.amount)
    const normalizedDescription = formData.description.trim()
    const normalizedSubcategory = formData.subcategoryId === '' ? undefined : formData.subcategoryId
    const normalizedDueDate = formData.dueDate === '' ? undefined : formData.dueDate
    const normalizedPaymentStatus = coercePaymentStatusId(formData.paymentStatus)
    const normalizedPaymentMethod = coercePaymentMethodId(formData.paymentMethod)
    const normalizedFrequency = coerceExpenseFrequencyId(formData.frequency)
    const normalizedProjectId =
      currentFormType === 'project' && isProjectSelectionValid(formData.projectId)
        ? formData.projectId
        : undefined

    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      title: trimmedTitle,
      description: normalizedDescription === '' ? undefined : normalizedDescription,
      amount: normalizedAmount,
      categoryId: formData.categoryId,
      subcategoryId: normalizedSubcategory,
      frequency: normalizedFrequency,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: normalizedPaymentStatus,
      dueDate: normalizedDueDate,
      paidDate:
        normalizedPaymentStatus === PAYMENT_STATUS.COMPLETED.id
          ? new Date().toISOString().split('T')[0]
          : undefined,
      projectId: normalizedProjectId,
      isAdministrative: category.isAdministrative,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      if (editingExpense) {
        const success = await updateExpense(editingExpense.id, newExpense)
        if (success) {
          toast.success('تم تحديث المصروف بنجاح')
        } else {
          toast.error('فشل في تحديث المصروف')
          return
        }
      } else {
        const success = await addExpense(newExpense)
        if (success) {
          toast.success('تم إضافة المصروف بنجاح')
        } else {
          toast.error('فشل في إضافة المصروف')
          return
        }
      }
    } catch (submissionError) {
      console.error(submissionError)
      toast.error('حدث خطأ في العملية')
      return
    }

    resetForm()
    setIsAddDialogOpen(false)
  }

  const resetForm = (nextTab: ExpenseFormTab = 'administrative') => {
    setFormData(createInitialFormState())
    setEditingExpense(null)
    setFormTab(nextTab)
  }

  const handleFrequencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      frequency: coerceExpenseFrequencyId(value),
    }))
  }

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: coercePaymentMethodId(value),
    }))
  }

  const handlePaymentStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: coercePaymentStatusId(value),
    }))
  }

  const handleFormTabChange = (value: string) => {
    const nextTab: ExpenseFormTab = value === 'project' ? 'project' : 'administrative'
    setFormTab(nextTab)
    setFormData((prev) => ({
      ...prev,
      categoryId: '',
      subcategoryId: '',
      projectId: DEFAULT_PROJECT_SELECTION,
      supplierId: DEFAULT_SUPPLIER_SELECTION,
    }))
  }

  const handleActiveTabChange = (value: string) => {
    const nextTab: ExpenseFormTab = value === 'project' ? 'project' : 'administrative'
    setActiveTab(nextTab)
  }

  const handleProjectFilterChange = (value: string) => {
    setSelectedProject(value === PROJECTS_FILTER_ALL ? PROJECTS_FILTER_ALL : value)
  }

  const handleCreateExpense = (targetTab: ExpenseFormTab) => {
    resetForm(targetTab)
    setActiveTab(targetTab)
    setIsAddDialogOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormTab(expense.isAdministrative ? 'administrative' : 'project')
    setFormData(
      createInitialFormState({
        title: expense.title,
        description: expense.description ?? '',
        amount: expense.amount.toString(),
        categoryId: expense.categoryId,
        subcategoryId: expense.subcategoryId ?? '',
        frequency: coerceExpenseFrequencyId(expense.frequency),
        paymentMethod: coercePaymentMethodId(expense.paymentMethod),
        paymentStatus: coercePaymentStatusId(expense.paymentStatus),
        dueDate: expense.dueDate ?? '',
        projectId: expense.projectId ?? DEFAULT_PROJECT_SELECTION,
        supplierId: DEFAULT_SUPPLIER_SELECTION,
      }),
    )
    setIsAddDialogOpen(true)
  }

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense)
  }

  const confirmDelete = async () => {
    if (!expenseToDelete) {
      return
    }

    try {
      const success = await deleteExpense(expenseToDelete.id)
      if (success) {
        toast.success('تم حذف المصروف بنجاح')
      } else {
        toast.error('فشل في حذف المصروف')
      }
    } catch (deletionError) {
      console.error(deletionError)
      toast.error('حدث خطأ في حذف المصروف')
    } finally {
      setExpenseToDelete(null)
    }
  }

  const filterExpenses = useCallback(
    (isAdministrative: boolean) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const typeFilteredExpenses = getExpensesByType(isAdministrative)

      return typeFilteredExpenses.filter((expenseItem) => {
        const matchesSearch =
          normalizedSearch === '' ||
          expenseItem.title.toLowerCase().includes(normalizedSearch) ||
          (expenseItem.description?.toLowerCase().includes(normalizedSearch) ?? false)

        const matchesProject =
          selectedProject === PROJECTS_FILTER_ALL || expenseItem.projectId === selectedProject

        return matchesSearch && matchesProject
      })
    },
    [getExpensesByType, searchTerm, selectedProject],
  )

  const getCurrentCategories = (): ExpenseCategory[] => {
    const currentFormType = editingExpense
      ? editingExpense.isAdministrative
        ? 'administrative'
        : 'project'
      : formTab
    return currentFormType === 'administrative'
      ? getAdministrativeCategories()
      : getProjectCategories()
  }

  const calculateStats = useCallback(
    (isAdministrative: boolean): ExpenseStats => {
      const filteredExpenses = filterExpenses(isAdministrative)

      let totalAmount = 0
      let completedAmount = 0
      let pendingAmount = 0
      let overdueAmount = 0
      let monthlyTotal = 0
      let annualTotal = 0

      filteredExpenses.forEach((expenseItem) => {
        totalAmount += expenseItem.amount

        const statusId = coercePaymentStatusId(expenseItem.paymentStatus)
        if (statusId === PAYMENT_STATUS.COMPLETED.id) {
          completedAmount += expenseItem.amount
        } else if (statusId === PAYMENT_STATUS.PENDING.id) {
          pendingAmount += expenseItem.amount
        } else if (statusId === PAYMENT_STATUS.OVERDUE.id) {
          overdueAmount += expenseItem.amount
        }

        const frequencyId = coerceExpenseFrequencyId(expenseItem.frequency)
        const amounts = calculateAmounts(expenseItem.amount, frequencyId)
        monthlyTotal += amounts.monthly
        annualTotal += amounts.annual
      })

      return {
        totalExpenses: filteredExpenses.length,
        totalAmount,
        completedAmount,
        pendingAmount,
        overdueAmount,
        monthlyTotal,
        annualTotal,
      }
    },
    [filterExpenses],
  )

  if (loading || projectsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6" dir="rtl">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-info" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6" dir="rtl">
        <div className="text-center">
          <p className="mb-4 text-error">{error}</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  const administrativeExpenses = filterExpenses(true)
  const projectExpenses = filterExpenses(false)
  const allExpenses = [...administrativeExpenses, ...projectExpenses]

  const adminStats = calculateStats(true)
  const projectStats = calculateStats(false)

  const totalExpensesCount = adminStats.totalExpenses + projectStats.totalExpenses
  const totalAmount = adminStats.totalAmount + projectStats.totalAmount
  const completedAmount = adminStats.completedAmount + projectStats.completedAmount
  const pendingAmount = adminStats.pendingAmount + projectStats.pendingAmount
  const overdueAmount = adminStats.overdueAmount + projectStats.overdueAmount
  const monthlyProjection = adminStats.monthlyTotal + projectStats.monthlyTotal
  const annualProjection = adminStats.annualTotal + projectStats.annualTotal

  const overdueExpensesCount = allExpenses.filter(
    (expenseItem) => coercePaymentStatusId(expenseItem.paymentStatus) === PAYMENT_STATUS.OVERDUE.id,
  ).length

  const pendingExpensesCount = allExpenses.filter(
    (expenseItem) => coercePaymentStatusId(expenseItem.paymentStatus) === PAYMENT_STATUS.PENDING.id,
  ).length

  const dueSoonExpensesCount = allExpenses.filter((expenseItem) => {
    if (!expenseItem.dueDate) {
      return false
    }
    const dueDate = new Date(expenseItem.dueDate)
    if (Number.isNaN(dueDate.getTime())) {
      return false
    }
    const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0 || diffDays > 7) {
      return false
    }
    const statusId = coercePaymentStatusId(expenseItem.paymentStatus)
    return statusId !== PAYMENT_STATUS.COMPLETED.id && statusId !== PAYMENT_STATUS.OVERDUE.id
  }).length

  const averageExpenseValue = totalExpensesCount > 0 ? totalAmount / totalExpensesCount : 0

  const formatCompactCurrency = (value: number) =>
    formatCurrencyValue(value, {
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })

  const headerMetadata = (
    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground sm:text-sm md:gap-3">
      <StatusBadge
        status="default"
        label={`إجمالي البنود ${formatCount(totalExpensesCount)}`}
        icon={ListChecks}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="success"
        label={`مسدد ${formatCompactCurrency(completedAmount)}`}
        icon={CheckCircle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={pendingExpensesCount > 0 ? 'warning' : 'info'}
        label={`قيد المعالجة ${formatCompactCurrency(pendingAmount)}`}
        icon={Clock}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={overdueExpensesCount > 0 ? 'overdue' : 'default'}
        label={`متأخر ${formatCompactCurrency(overdueAmount)}`}
        icon={AlertTriangle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={dueSoonExpensesCount > 0 ? 'dueSoon' : 'default'}
        label={`يستحق خلال أسبوع ${formatCount(dueSoonExpensesCount)}`}
        icon={Clock}
        size="sm"
        className="shadow-none"
      />
    </div>
  )

  const procurementAnalysisCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DetailCard
        title="إجمالي الإنفاق"
        value={formatCurrencyValue(totalAmount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        subtitle={`عدد البنود ${formatCount(totalExpensesCount)}`}
        icon={Wallet}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{ value: `${formatCompactCurrency(monthlyProjection)} شهري`, direction: 'up' }}
      />
      <DetailCard
        title="التزامات قيد المعالجة"
        value={formatCurrencyValue(pendingAmount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        subtitle={`عدد البنود ${formatCount(pendingExpensesCount)}`}
        icon={Calculator}
        color="text-info"
        bgColor="bg-info/10"
        trend={{ value: `${formatCompactCurrency(annualProjection)} سنوي`, direction: 'stable' }}
      />
      <DetailCard
        title="متأخرات الدفع"
        value={formatCurrencyValue(overdueAmount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        subtitle={`عدد البنود ${formatCount(overdueExpensesCount)}`}
        icon={AlertTriangle}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{
          value: overdueExpensesCount > 0 ? 'تحتاج معالجة' : 'لا يوجد متأخرات',
          direction: overdueExpensesCount > 0 ? 'down' : 'stable',
        }}
      />
      <DetailCard
        title="متوسط الطلب"
        value={formatCurrencyValue(averageExpenseValue, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        subtitle="قيمة متوسط المصروف"
        icon={TrendingUp}
        color="text-success"
        bgColor="bg-success/10"
        trend={{
          value: `${formatCount(dueSoonExpensesCount)} مستحق قريباً`,
          direction: dueSoonExpensesCount > 0 ? 'stable' : 'up',
        }}
      />
    </div>
  )

  const headerExtraContent = (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        {headerMetadata}
      </div>
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        {procurementAnalysisCards}
      </div>
    </div>
  )

  const quickActions = [
    {
      label: 'مصروف إداري',
      icon: Plus,
      onClick: () => handleCreateExpense('administrative'),
      primary: true,
    },
    {
      label: 'طلب شراء مشروع',
      icon: Hammer,
      onClick: () => handleCreateExpense('project'),
      variant: 'outline' as const,
      primary: false,
    },
    {
      label: 'توزيع التكاليف',
      icon: Calculator,
      onClick: () => toast.info('سيتم تفعيل توزيع التكاليف قريباً'),
      variant: 'outline' as const,
      primary: false,
    },
    {
      label: 'تقرير المشتريات',
      icon: BarChart3,
      onClick: () => toast.info('سيتم إضافة تقرير المشتريات قريباً'),
      variant: 'outline' as const,
      primary: false,
    },
  ]

  const shouldShowProjectFields = editingExpense
    ? !editingExpense.isAdministrative
    : formTab === 'project'
  const previewAmounts =
    formData.amount.trim() !== ''
      ? calculateAmounts(parseAmountField(formData.amount), formData.frequency)
      : null

  return (
    <PageLayout
      tone="info"
      title="إدارة المشتريات"
      description="متابعة المصروفات التشغيلية ومشتريات المشاريع وربطها بالميزانيات"
      icon={Wallet}
      quickStats={[]}
      quickActions={quickActions}
      headerExtra={headerExtraContent}
      showSearch={false}
      showFilters={false}
      showLastUpdate={false}
      statsGridCols="grid-cols-2 md:grid-cols-4"
    >
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'قم بتعديل بيانات المصروف'
                : 'اختر نوع المصروف واملأ البيانات المطلوبة'}
            </DialogDescription>
          </DialogHeader>

          {!editingExpense && (
            <Tabs value={formTab} onValueChange={handleFormTabChange} dir="rtl">
              <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl bg-muted/40 p-1.5">
                <TabsTrigger value="administrative" className="flex items-center gap-2 rounded-xl">
                  <Building2 className="h-4 w-4" />
                  مصروف إداري
                </TabsTrigger>
                <TabsTrigger value="project" className="flex items-center gap-2 rounded-xl">
                  <Hammer className="h-4 w-4" />
                  طلب شراء مشروع
                </TabsTrigger>
              </TabsList>

              <div className="mb-4 rounded-2xl border border-info/25 bg-info/10 p-3">
                <p className="text-sm text-info">
                  {formTab === 'administrative' ? (
                    <>
                      <strong>التكاليف الإدارية:</strong> للتكاليف التشغيلية مثل الرواتب، الإيجار،
                      الكهرباء، والمصروفات العامة للشركة
                    </>
                  ) : (
                    <>
                      <strong>مشتريات المشاريع:</strong> لشراء مواد ومستلزمات المشاريع - يتم تسجيل
                      المشتريات والتكلفة معاً
                    </>
                  )}
                </p>
              </div>
            </Tabs>
          )}

          <form
            key={editingExpense ? editingExpense.id : 'new'}
            onSubmit={handleSubmit}
            className="space-y-4"
            dir="rtl"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">عنوان المصروف *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder={
                    (
                      editingExpense
                        ? editingExpense.isAdministrative
                        : formTab === 'administrative'
                    )
                      ? 'مثال: راتب المدير التنفيذي'
                      : 'مثال: أسمنت بورتلاندي - مشروع الفيلا'
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">المبلغ (ر.س) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">الفئة الرئيسية *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: value,
                      subcategoryId: '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentCategories().map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.nameAr}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.categoryId && getCategoryById(formData.categoryId)?.subcategories && (
                <div>
                  <Label htmlFor="subcategory">الفئة الفرعية</Label>
                  <Select
                    value={formData.subcategoryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        subcategoryId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة الفرعية" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoryById(formData.categoryId)?.subcategories?.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="frequency">تكرار المصروف</Label>
                <Select value={formData.frequency} onValueChange={handleFrequencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EXPENSE_FREQUENCIES).map((frequency) => (
                      <SelectItem key={frequency.id} value={frequency.id}>
                        {frequency.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <Select value={formData.paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PAYMENT_METHODS).map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus">حالة الدفع</Label>
                <Select value={formData.paymentStatus} onValueChange={handlePaymentStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PAYMENT_STATUS).map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                />
              </div>

              {shouldShowProjectFields && (
                <>
                  <div>
                    <Label htmlFor="project">المشروع *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, projectId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المشروع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_PROJECT_SELECTION}>بدون مشروع محدد</SelectItem>
                        {realProjects
                          .filter((projectItem) => projectItem.id && projectItem.id.trim() !== '')
                          .map((projectItem) => (
                            <SelectItem key={projectItem.id} value={projectItem.id}>
                              {projectItem.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="supplier">المورد</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, supplierId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المورد (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_SUPPLIER_SELECTION}>بدون مورد محدد</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="تفاصيل إضافية حول المصروف"
                rows={4}
              />
            </div>

            {previewAmounts && (
              <div
                className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm"
                dir="rtl"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-info">التكلفة الشهرية المتوقعة: </span>
                    <span className="font-bold">
                      {formatCurrencyValue(previewAmounts.monthly, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-info">المبلغ السنوي المتوقع: </span>
                    <span className="font-bold">
                      {formatCurrencyValue(previewAmounts.annual, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/85">
                {editingExpense ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6" dir="rtl">
        <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground/70" />
                <Input
                  placeholder="البحث في المصروفات..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pr-10 text-right"
                  dir="rtl"
                />
              </div>
              <Select value={selectedProject} onValueChange={handleProjectFilterChange}>
                <SelectTrigger className="w-full rounded-2xl border-border/40 sm:w-48">
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROJECTS_FILTER_ALL}>جميع المشاريع</SelectItem>
                  {realProjects
                    .filter((projectItem) => projectItem.id && projectItem.id.trim() !== '')
                    .map((projectItem) => (
                      <SelectItem key={projectItem.id} value={projectItem.id}>
                        {projectItem.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleActiveTabChange} dir="rtl">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/40 p-1.5">
            <TabsTrigger
              value="administrative"
              className="flex items-center justify-center gap-2 rounded-xl text-sm"
            >
              <Building2 className="h-4 w-4" />
              التكاليف الإدارية
            </TabsTrigger>
            <TabsTrigger
              value="project"
              className="flex items-center justify-center gap-2 rounded-xl text-sm"
            >
              <Hammer className="h-4 w-4" />
              مشتريات المشاريع
            </TabsTrigger>
          </TabsList>

          <TabsContent value="administrative" className="mt-4">
            <ExpenseList
              expenses={administrativeExpenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
              stats={adminStats}
              type="administrative"
              projects={realProjects}
              onCreate={() => handleCreateExpense('administrative')}
            />
          </TabsContent>

          <TabsContent value="project" className="mt-4">
            <ExpenseList
              expenses={projectExpenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
              stats={projectStats}
              type="project"
              projects={realProjects}
              onCreate={() => handleCreateExpense('project')}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              تأكيد حذف المصروف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المصروف &quot;{expenseToDelete?.title}&quot;؟ هذا الإجراء لا يمكن
              التراجع عنه وسيتم حذف جميع البيانات المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  stats: ExpenseStats
  type: ExpenseFormTab
  projects: ProjectSummary[]
  onCreate: () => void
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete,
  stats,
  type,
  projects,
  onCreate,
}) => {
  const { formatCurrencyValue } = useCurrencyFormatter()

  const statusSummaryAlert = useMemo(() => {
    const overdueExpenses = expenses.filter(
      (expenseItem) =>
        coercePaymentStatusId(expenseItem.paymentStatus) === PAYMENT_STATUS.OVERDUE.id,
    )
    const pendingExpenses = expenses.filter(
      (expenseItem) =>
        coercePaymentStatusId(expenseItem.paymentStatus) === PAYMENT_STATUS.PENDING.id,
    )

    if (overdueExpenses.length > 0) {
      return {
        variant: overdueExpenses.length > 2 ? ('destructive' as const) : ('warning' as const),
        title: 'مصروفات متأخرة تحتاج متابعة',
        description: `يوجد ${overdueExpenses.length} مصروف متأخر بإجمالي ${formatCurrencyValue(
          stats.overdueAmount,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          },
        )}. يرجى التنسيق مع المالية لإغلاق هذه البنود.`,
      }
    }

    if (pendingExpenses.length > 0) {
      return {
        variant: 'info' as const,
        title: 'مصروفات قيد المعالجة',
        description: `${pendingExpenses.length} مصروف بانتظار التأكيد، بقيمة ${formatCurrencyValue(
          stats.pendingAmount,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          },
        )}. تأكد من اعتماد الدفعات قبل نهاية الأسبوع.`,
      }
    }

    return null
  }, [expenses, formatCurrencyValue, stats.overdueAmount, stats.pendingAmount])

  const getStatusBadge = (status: string) => {
    const normalizedStatus = coercePaymentStatusId(status)
    const statusConfig = PAYMENT_STATUS_CONFIG[normalizedStatus]
    const badgeStatus = PAYMENT_STATUS_BADGE_STATUS[normalizedStatus] ?? 'default'

    return (
      <StatusBadge
        status={badgeStatus}
        label={statusConfig.label}
        size="sm"
        showIcon={false}
        className="shadow-none"
      />
    )
  }

  const getFrequencyBadge = (frequency: string) => {
    const normalizedFrequency = coerceExpenseFrequencyId(frequency)
    const frequencyConfig = EXPENSE_FREQUENCY_CONFIG[normalizedFrequency]
    const badgeStatus = EXPENSE_FREQUENCY_BADGE_STATUS[normalizedFrequency] ?? 'default'

    return (
      <StatusBadge
        status={badgeStatus}
        label={frequencyConfig.label}
        size="sm"
        showIcon={false}
        className="shadow-none"
      />
    )
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) {
      return '-'
    }
    const project = projects.find((projectItem) => projectItem.id === projectId)
    const projectName = project?.name?.trim()
    return projectName && projectName !== '' ? projectName : 'مشروع غير محدد'
  }

  const emptyIcon = type === 'administrative' ? Building2 : Hammer
  const emptyTitle = type === 'administrative' ? 'لا توجد تكاليف إدارية' : 'لا توجد مشتريات مشاريع'
  const emptyDescription =
    type === 'administrative'
      ? 'ابدأ بإضافة المصروفات الإدارية لتتبع التكاليف التشغيلية.'
      : 'سجل أول طلب شراء لمتابعة مصروفات المشروع وربطها بالميزانية.'

  return (
    <div className="space-y-4">
      {statusSummaryAlert && (
        <InlineAlert
          variant={statusSummaryAlert.variant}
          title={statusSummaryAlert.title}
          description={statusSummaryAlert.description}
        />
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-3xl border-success/30 bg-success/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-success">مدفوع</p>
            <p className="text-lg font-bold text-success/90">
              {formatCurrencyValue(stats.completedAmount, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-warning/30 bg-warning/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-warning">معلق</p>
            <p className="text-lg font-bold text-warning/90">
              {formatCurrencyValue(stats.pendingAmount, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-error/30 bg-error/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-error">متأخر</p>
            <p className="text-lg font-bold text-error/90">
              {formatCurrencyValue(stats.overdueAmount, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-info/30 bg-info/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-info">الإجمالي</p>
            <p className="text-lg font-bold text-info/90">
              {formatCurrencyValue(stats.totalAmount, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="border-b border-border/20">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              {type === 'administrative' ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <Hammer className="h-5 w-5" />
              )}
              {type === 'administrative' ? 'التكاليف الإدارية' : 'مشتريات المشاريع'}
            </span>
            <StatusBadge
              status="info"
              label={`${expenses.length}`}
              size="sm"
              showIcon={false}
              className="shadow-none"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              actionLabel="إضافة مصروف جديد"
              onAction={onCreate}
            />
          ) : (
            <div className="overflow-x-auto" dir="rtl">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="border-b p-3 text-right font-medium">العنوان</th>
                    <th className="border-b p-3 text-right font-medium">الفئة</th>
                    <th className="border-b p-3 text-right font-medium">المبلغ</th>
                    <th className="border-b p-3 text-right font-medium">التكرار</th>
                    <th className="border-b p-3 text-right font-medium">حالة الدفع</th>
                    {type === 'project' && (
                      <th className="border-b p-3 text-right font-medium">المشروع</th>
                    )}
                    <th className="border-b p-3 text-right font-medium">تاريخ الاستحقاق</th>
                    <th className="border-b p-3 text-right font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expenseItem) => {
                    const category = getCategoryById(expenseItem.categoryId)
                    const frequencyId = coerceExpenseFrequencyId(expenseItem.frequency)
                    const amounts = calculateAmounts(expenseItem.amount, frequencyId)

                    return (
                      <tr key={expenseItem.id} className="hover:bg-muted/20">
                        <td className="border-b p-3">
                          <div>
                            <p className="font-medium">{expenseItem.title}</p>
                            {expenseItem.description && (
                              <p className="mt-1 text-xs text-muted-foreground/85">
                                {expenseItem.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="border-b p-3">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs">{category?.nameAr}</span>
                            <span>{category?.icon}</span>
                          </div>
                        </td>
                        <td className="border-b p-3">
                          <div>
                            <p className="font-medium">
                              {formatCurrencyValue(expenseItem.amount, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground/85">
                              شهرياً:{' '}
                              {formatCurrencyValue(amounts.monthly, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                              | سنوياً:{' '}
                              {formatCurrencyValue(amounts.annual, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="border-b p-3">
                          <div className="flex justify-end">
                            {getFrequencyBadge(expenseItem.frequency)}
                          </div>
                        </td>
                        <td className="border-b p-3">
                          <div className="flex justify-end">
                            {getStatusBadge(expenseItem.paymentStatus)}
                          </div>
                        </td>
                        {type === 'project' && (
                          <td className="border-b p-3 text-xs">
                            {getProjectName(expenseItem.projectId)}
                          </td>
                        )}
                        <td className="border-b p-3 text-xs">
                          {formatDateValue(
                            expenseItem.dueDate,
                            {
                              locale: 'ar-SA',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                            '-',
                          )}
                        </td>
                        <td className="border-b p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(expenseItem)}
                              title="تعديل"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(expenseItem)}
                              title="حذف"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ExpenseManagement
