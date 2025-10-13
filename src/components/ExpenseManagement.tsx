/**
 * 🏗️ إدارة التكاليف والمشتريات
 * Integrated Cost and Procurement Management System
 */

import type React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { StatusBadge, type StatusBadgeProps } from './ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Plus, Building2, Hammer, Edit, Trash2, TrendingUp, BarChart3, Search, Loader2 } from 'lucide-react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatDateValue } from '@/utils/formatters';
import { EmptyState } from './PageLayout';
import { InlineAlert } from './ui/inline-alert';

import type {
  Expense,
  ExpenseCategory
} from '../data/expenseCategories';
import {
  EXPENSE_FREQUENCIES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  getCategoryById,
  getAdministrativeCategories,
  getProjectCategories,
  calculateAmounts
} from '../data/expenseCategories';

import { useExpenses } from '@/application/hooks/useExpenses';
import { useFinancialState } from '@/application/context';
import type { Project } from '@/data/centralData';

type ExpenseFrequencyId = (typeof EXPENSE_FREQUENCIES)[keyof typeof EXPENSE_FREQUENCIES]['id'];
type PaymentMethodId = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]['id'];
type PaymentStatusId = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]['id'];
type ExpenseFormTab = 'administrative' | 'project';
type ProjectFilterId = 'all_projects' | string;

interface ExpenseFormState {
  title: string;
  description: string;
  amount: string;
  categoryId: string;
  subcategoryId: string;
  frequency: ExpenseFrequencyId;
  paymentMethod: PaymentMethodId;
  paymentStatus: PaymentStatusId;
  dueDate: string;
  projectId: string;
  supplierId: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyTotal: number;
  annualTotal: number;
}

const DEFAULT_FREQUENCY_ID: ExpenseFrequencyId = EXPENSE_FREQUENCIES.MONTHLY.id;
const DEFAULT_PAYMENT_METHOD_ID: PaymentMethodId = PAYMENT_METHODS.CASH.id;
const DEFAULT_PAYMENT_STATUS_ID: PaymentStatusId = PAYMENT_STATUS.PENDING.id;
const DEFAULT_PROJECT_SELECTION = 'no_project' as const;
const DEFAULT_SUPPLIER_SELECTION = 'no_supplier' as const;
const PROJECTS_FILTER_ALL = 'all_projects' as const;

const EXPENSE_FREQUENCY_IDS = Object.values(EXPENSE_FREQUENCIES).map((freq) => freq.id) as ExpenseFrequencyId[];
const PAYMENT_METHOD_IDS = Object.values(PAYMENT_METHODS).map((method) => method.id) as PaymentMethodId[];
const PAYMENT_STATUS_IDS = Object.values(PAYMENT_STATUS).map((status) => status.id) as PaymentStatusId[];

const PAYMENT_STATUS_CONFIG: Record<PaymentStatusId, { label: string; color: string }> = Object.values(PAYMENT_STATUS).reduce(
  (acc, status) => {
    acc[status.id] = { label: status.nameAr, color: status.color };
    return acc;
  },
  {} as Record<PaymentStatusId, { label: string; color: string }>
);

const EXPENSE_FREQUENCY_CONFIG: Record<ExpenseFrequencyId, { label: string; color: string }> = Object.values(EXPENSE_FREQUENCIES).reduce(
  (acc, frequency) => {
    acc[frequency.id] = { label: frequency.nameAr, color: frequency.color };
    return acc;
  },
  {} as Record<ExpenseFrequencyId, { label: string; color: string }>
);

type ExpenseBadgeStatus = StatusBadgeProps['status'];

const PAYMENT_STATUS_BADGE_STATUS: Record<PaymentStatusId, ExpenseBadgeStatus> = {
  [PAYMENT_STATUS.PENDING.id]: 'warning',
  [PAYMENT_STATUS.COMPLETED.id]: 'success',
  [PAYMENT_STATUS.OVERDUE.id]: 'overdue',
  [PAYMENT_STATUS.CANCELLED.id]: 'default',
};

const EXPENSE_FREQUENCY_BADGE_STATUS: Record<ExpenseFrequencyId, ExpenseBadgeStatus> = {
  [EXPENSE_FREQUENCIES.MONTHLY.id]: 'info',
  [EXPENSE_FREQUENCIES.QUARTERLY.id]: 'onTrack',
  [EXPENSE_FREQUENCIES.ANNUALLY.id]: 'success',
  [EXPENSE_FREQUENCIES.SEMI_ANNUALLY.id]: 'dueSoon',
  [EXPENSE_FREQUENCIES.WEEKLY.id]: 'warning',
  [EXPENSE_FREQUENCIES.ONE_TIME.id]: 'default',
};

const isExpenseFrequencyId = (value: string): value is ExpenseFrequencyId => EXPENSE_FREQUENCY_IDS.includes(value as ExpenseFrequencyId);
const isPaymentMethodId = (value: string): value is PaymentMethodId => PAYMENT_METHOD_IDS.includes(value as PaymentMethodId);
const isPaymentStatusId = (value: string): value is PaymentStatusId => PAYMENT_STATUS_IDS.includes(value as PaymentStatusId);

const coerceExpenseFrequencyId = (value: string): ExpenseFrequencyId => (isExpenseFrequencyId(value) ? value : DEFAULT_FREQUENCY_ID);
const coercePaymentMethodId = (value: string): PaymentMethodId => (isPaymentMethodId(value) ? value : DEFAULT_PAYMENT_METHOD_ID);
const coercePaymentStatusId = (value: string): PaymentStatusId => (isPaymentStatusId(value) ? value : DEFAULT_PAYMENT_STATUS_ID);

const parseAmountField = (value: string): number => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return 0;
  }
  const numericValue = Number.parseFloat(trimmed);
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

const isProjectSelectionValid = (value: string): boolean => value !== DEFAULT_PROJECT_SELECTION && value.trim() !== '';

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
  ...overrides
});

const ExpenseManagement: React.FC = () => {
  // استخدام Hook إدارة المصروفات
  const {
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByType
  } = useExpenses();

  // استخدام Hook إدارة المشاريع
  const { projects } = useFinancialState();
  const { projects: realProjects, isLoading: projectsLoading } = projects;
  const { formatCurrencyValue } = useCurrencyFormatter();
  const countFormatter = useMemo(() => new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }), []);
  const formatCount = useCallback((value: number | null | undefined) => {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    return countFormatter.format(Number.isFinite(numeric) ? numeric : 0);
  }, [countFormatter]);

  // States
  const [activeTab, setActiveTab] = useState<ExpenseFormTab>('administrative');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectFilterId>(PROJECTS_FILTER_ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [formTab, setFormTab] = useState<ExpenseFormTab>('administrative');

  // قائمة الموردين - يمكن تحديثها لاحقاً من قاعدة البيانات
  const suppliers: Supplier[] = [
    { id: '1', name: 'شركة الخرسانة المتطورة' },
    { id: '2', name: 'مصنع الحديد المتحد' },
    { id: '3', name: 'شركة السباكة الحديثة' },
    { id: '4', name: 'مؤسسة مواد البناء الحديثة' },
    { id: '5', name: 'شركة الطوب والبلوك' },
    { id: '6', name: 'مصنع الأسمنت السعودي' },
    { id: '7', name: 'شركة الأخشاب والدهانات' }
  ];
  // Form states with proper types
  const [formData, setFormData] = useState<ExpenseFormState>(() => createInitialFormState());

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = formData.title.trim();
    const hasAmount = formData.amount.trim() !== '';
    const hasCategory = formData.categoryId.trim() !== '';

    if (!trimmedTitle || !hasAmount || !hasCategory) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const category = getCategoryById(formData.categoryId);
    if (!category) {
      toast.error('الفئة المحددة غير صالحة');
      return;
    }

    const currentFormType: ExpenseFormTab = editingExpense 
      ? (editingExpense.isAdministrative ? 'administrative' : 'project')
      : formTab;

  const normalizedAmount = parseAmountField(formData.amount);
  const normalizedDescription = formData.description.trim();
    const normalizedSubcategory = formData.subcategoryId === '' ? undefined : formData.subcategoryId;
    const normalizedDueDate = formData.dueDate === '' ? undefined : formData.dueDate;
    const normalizedPaymentStatus = coercePaymentStatusId(formData.paymentStatus);
    const normalizedPaymentMethod = coercePaymentMethodId(formData.paymentMethod);
    const normalizedFrequency = coerceExpenseFrequencyId(formData.frequency);
    const normalizedProjectId = currentFormType === 'project' && isProjectSelectionValid(formData.projectId)
      ? formData.projectId
      : undefined;

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
      paidDate: normalizedPaymentStatus === PAYMENT_STATUS.COMPLETED.id
        ? new Date().toISOString().split('T')[0]
        : undefined,
      projectId: normalizedProjectId,
      isAdministrative: category.isAdministrative,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingExpense) {
        const success = await updateExpense(editingExpense.id, newExpense);
        if (success) {
          toast.success('تم تحديث المصروف بنجاح');
        } else {
          toast.error('فشل في تحديث المصروف');
          return;
        }
      } else {
        const success = await addExpense(newExpense);
        if (success) {
          toast.success('تم إضافة المصروف بنجاح');
        } else {
          toast.error('فشل في إضافة المصروف');
          return;
        }
      }
    } catch (err) {
      toast.error('حدث خطأ في العملية');
      console.error(err);
      return;
    }
    
    resetForm();
    setIsAddDialogOpen(false);
  };

  // Reset form with proper types
  const resetForm = (nextTab: ExpenseFormTab = 'administrative') => {
    setFormData(createInitialFormState());
    setEditingExpense(null);
    setFormTab(nextTab);
  };

  const handleFrequencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      frequency: coerceExpenseFrequencyId(value)
    }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: coercePaymentMethodId(value)
    }));
  };

  const handlePaymentStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: coercePaymentStatusId(value)
    }));
  };

  const handleFormTabChange = (value: string) => {
    const nextTab: ExpenseFormTab = value === 'project' ? 'project' : 'administrative';
    setFormTab(nextTab);
    setFormData((prev) => ({
      ...prev,
      categoryId: '',
      subcategoryId: '',
      projectId: DEFAULT_PROJECT_SELECTION,
      supplierId: DEFAULT_SUPPLIER_SELECTION
    }));
  };

  const handleActiveTabChange = (value: string) => {
    const nextTab: ExpenseFormTab = value === 'project' ? 'project' : 'administrative';
    setActiveTab(nextTab);
  };

  const handleProjectFilterChange = (value: string) => {
    setSelectedProject(value === PROJECTS_FILTER_ALL ? PROJECTS_FILTER_ALL : value);
  };

  const handleCreateExpense = (targetTab: ExpenseFormTab) => {
    resetForm(targetTab);
    setActiveTab(targetTab);
    setIsAddDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormTab(expense.isAdministrative ? 'administrative' : 'project');
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
        supplierId: DEFAULT_SUPPLIER_SELECTION
      })
    );
    setIsAddDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      const success = await deleteExpense(expenseToDelete.id);
      if (success) {
        toast.success('تم حذف المصروف بنجاح');
      } else {
        toast.error('فشل في حذف المصروف');
      }
    } catch (err) {
      toast.error('حدث خطأ في حذف المصروف');
      console.error(err);
    } finally {
      setExpenseToDelete(null);
    }
  };

  // Filter expenses
  const filterExpenses = (isAdministrative: boolean) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const typeFilteredExpenses = getExpensesByType(isAdministrative);

    return typeFilteredExpenses.filter((expense) => {
      const matchesSearch =
        normalizedSearch === '' ||
        expense.title.toLowerCase().includes(normalizedSearch) ||
        (expense.description?.toLowerCase().includes(normalizedSearch) ?? false);

      const matchesProject =
        selectedProject === PROJECTS_FILTER_ALL || expense.projectId === selectedProject;

      return matchesSearch && matchesProject;
    });
  };

  // Get categories for current tab
  const getCurrentCategories = (): ExpenseCategory[] => {
    const currentFormType = editingExpense 
      ? (editingExpense.isAdministrative ? 'administrative' : 'project')
      : formTab;
    return currentFormType === 'administrative' ? getAdministrativeCategories() : getProjectCategories();
  };

  // Calculate statistics
  const calculateStats = (isAdministrative: boolean): ExpenseStats => {
    const filteredExpenses = filterExpenses(isAdministrative);

    let totalAmount = 0;
    let completedAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let monthlyTotal = 0;
    let annualTotal = 0;

    filteredExpenses.forEach((expense) => {
      totalAmount += expense.amount;

      const statusId = coercePaymentStatusId(expense.paymentStatus);
      if (statusId === PAYMENT_STATUS.COMPLETED.id) {
        completedAmount += expense.amount;
      } else if (statusId === PAYMENT_STATUS.PENDING.id) {
        pendingAmount += expense.amount;
      } else if (statusId === PAYMENT_STATUS.OVERDUE.id) {
        overdueAmount += expense.amount;
      }

      const frequencyId = coerceExpenseFrequencyId(expense.frequency);
      const amounts = calculateAmounts(expense.amount, frequencyId);
      monthlyTotal += amounts.monthly;
      annualTotal += amounts.annual;
    });

    return {
      totalExpenses: filteredExpenses.length,
      totalAmount,
      completedAmount,
      pendingAmount,
      overdueAmount,
      monthlyTotal,
      annualTotal
    };
  };

  const adminStats = calculateStats(true);
  const projectStats = calculateStats(false);
  const shouldShowProjectFields = editingExpense ? !editingExpense.isAdministrative : formTab === 'project';
  const previewAmounts = formData.amount.trim() !== ''
    ? calculateAmounts(parseAmountField(formData.amount), formData.frequency)
    : null;

  // عرض حالة التحميل للمشاريع والمصروفات
  if (loading || projectsLoading) {
    return (
      <div className="p-6 bg-muted/20 min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-info" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="p-6 bg-muted/20 min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-muted/20 scroll-smooth" dir="rtl">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4" dir="rtl">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" dir="rtl">
              <Building2 className="w-8 h-8 text-info" />
              <span>إدارة التكاليف والمشتريات</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-right">إدارة شاملة للتكاليف التشغيلية ومشتريات المشاريع</p>
          </div>
          <Dialog 
            open={isAddDialogOpen} 
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }} 
                className="bg-primary hover:bg-primary/85 flex items-center gap-2"
                dir="rtl"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مصروف جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense ? 'قم بتعديل بيانات المصروف' : 'اختر نوع المصروف واملأ البيانات المطلوبة'}
                </DialogDescription>
              </DialogHeader>
              
              {/* Tabs for Form Type */}
              {!editingExpense && (
                <Tabs value={formTab} onValueChange={handleFormTabChange}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="administrative" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      مصروف إداري
                    </TabsTrigger>
                    <TabsTrigger value="project" className="flex items-center gap-2">
                      <Hammer className="w-4 h-4" />
                      طلب شراء مشروع
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* توضيح نوع التبويب */}
                  <div className="mb-4 p-3 rounded-lg bg-info/10 border-l-4 border-info/60">
                    <p className="text-sm text-info">
                      {formTab === 'administrative' ? (
                        <>
                          <strong>التكاليف الإدارية:</strong> للتكاليف التشغيلية مثل الرواتب، الإيجار، الكهرباء، والمصروفات العامة للشركة
                        </>
                      ) : (
                        <>
                          <strong>مشتريات المشاريع:</strong> لشراء مواد ومستلزمات المشاريع - يتم تسجيل المشتريات والتكلفة معاً
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
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">عنوان المصروف *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder={
                        (editingExpense ? (editingExpense.isAdministrative ? 'administrative' : 'project') : formTab) === 'administrative' 
                          ? "مثال: راتب المدير التنفيذي" 
                          : "مثال: أسمنت بورتلاندي - مشروع الفيلا"
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">الفئة الرئيسية *</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value: string) => setFormData((prev) => ({
                        ...prev,
                        categoryId: value,
                        subcategoryId: ''
                      }))}
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
                        onValueChange={(value: string) => setFormData((prev) => ({
                          ...prev,
                          subcategoryId: value
                        }))}
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
                    <Select 
                      value={formData.frequency} 
                      onValueChange={handleFrequencyChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EXPENSE_FREQUENCIES).map((freq) => (
                          <SelectItem key={freq.id} value={freq.id}>
                            {freq.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={handlePaymentMethodChange}
                    >
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
                    <Select 
                      value={formData.paymentStatus} 
                      onValueChange={handlePaymentStatusChange}
                    >
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>

                  {shouldShowProjectFields && (
                    <>
                      <div>
                        <Label htmlFor="project">المشروع *</Label>
                        <Select 
                          value={formData.projectId} 
                          onValueChange={(value: string) => setFormData((prev) => ({ ...prev, projectId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DEFAULT_PROJECT_SELECTION}>بدون مشروع محدد</SelectItem>
                            {realProjects.filter(project => project.id && project.id.trim() !== '').map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="supplier">المورد</Label>
                        <Select 
                          value={formData.supplierId} 
                          onValueChange={(value: string) => setFormData((prev) => ({ ...prev, supplierId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المورد (اختياري)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DEFAULT_SUPPLIER_SELECTION}>بدون مورد محدد</SelectItem>
                            {suppliers.filter(supplier => supplier.id && supplier.id.trim() !== '').map((supplier) => (
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للمصروف..."
                    rows={3}
                  />
                </div>

                {/* Preview calculations */}
                {previewAmounts && (
                  <div className="bg-info/10 p-4 rounded-lg">
                    <h4 className="font-semibold text-info mb-2">معاينة الحسابات:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-info">المبلغ الشهري المتوقع: </span>
                        <span className="font-bold">{formatCurrencyValue(previewAmounts.monthly, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-info">المبلغ السنوي المتوقع: </span>
                        <span className="font-bold">{formatCurrencyValue(previewAmounts.annual, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-r-4 border-info">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground text-right">إجمالي التكاليف الإدارية</p>
                  <p className="text-2xl font-bold text-info text-right">{formatCount(adminStats.totalExpenses)}</p>
                  <p className="text-sm text-muted-foreground/85 text-right">{formatCurrencyValue(adminStats.totalAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
                <Building2 className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-warning">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground text-right">إجمالي مشتريات المشاريع</p>
                  <p className="text-2xl font-bold text-warning text-right">{formatCount(projectStats.totalExpenses)}</p>
                  <p className="text-sm text-muted-foreground/85 text-right">{formatCurrencyValue(projectStats.totalAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
                <Hammer className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-success">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground text-right">الإسقاطات الشهرية</p>
                  <p className="text-2xl font-bold text-success text-right">{formatCurrencyValue(adminStats.monthlyTotal + projectStats.monthlyTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-muted-foreground/85 text-right">شهرياً</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground text-right">الإسقاطات السنوية</p>
                  <p className="text-2xl font-bold text-accent text-right">{formatCurrencyValue(adminStats.annualTotal + projectStats.annualTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-muted-foreground/85 text-right">سنوياً</p>
                </div>
                <BarChart3 className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4" dir="rtl">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
              <Input
                placeholder="البحث في المصروفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
                dir="rtl"
              />
            </div>
            <Select value={selectedProject} onValueChange={handleProjectFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="اختر المشروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROJECTS_FILTER_ALL}>جميع المشاريع</SelectItem>
                {realProjects.filter(project => project.id && project.id.trim() !== '').map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
  <Tabs value={activeTab} onValueChange={handleActiveTabChange} dir="rtl">
        <TabsList className="grid w-full grid-cols-2" dir="rtl">
          <TabsTrigger value="administrative" className="flex items-center gap-2 text-right" dir="rtl">
            <span>التكاليف الإدارية</span>
            <Building2 className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2 text-right" dir="rtl">
            <span>مشتريات المشاريع</span>
            <Hammer className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="administrative">
          <ExpenseList
            expenses={filterExpenses(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            stats={adminStats}
            type="administrative"
            projects={realProjects}
            onCreate={() => handleCreateExpense('administrative')}
          />
        </TabsContent>

        <TabsContent value="project">
          <ExpenseList
            expenses={filterExpenses(false)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            stats={projectStats}
            type="project"
            projects={realProjects}
            onCreate={() => handleCreateExpense('project')}
          />
        </TabsContent>
      </Tabs>

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              تأكيد حذف المصروف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المصروف &quot;{expenseToDelete?.title}&quot;؟ 
              هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة به.
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
    </div>
  );
};

// Expense List Component
interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  stats: ExpenseStats;
  type: ExpenseFormTab;
  projects: Project[];
  onCreate: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete, stats, type, projects, onCreate }) => {
  const { formatCurrencyValue } = useCurrencyFormatter();
  const statusSummaryAlert = useMemo(() => {
    const overdueExpenses = expenses.filter((expense) => coercePaymentStatusId(expense.paymentStatus) === PAYMENT_STATUS.OVERDUE.id);
    const pendingExpenses = expenses.filter((expense) => coercePaymentStatusId(expense.paymentStatus) === PAYMENT_STATUS.PENDING.id);

    if (overdueExpenses.length > 0) {
      return {
        variant: overdueExpenses.length > 2 ? 'destructive' : 'warning' as const,
        title: 'مصروفات متأخرة تحتاج متابعة',
        description: `يوجد ${overdueExpenses.length} مصروف متأخر بإجمالي ${formatCurrencyValue(stats.overdueAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}. يرجى التنسيق مع المالية لإغلاق هذه البنود.`,
      };
    }

    if (pendingExpenses.length > 0) {
      return {
        variant: 'info' as const,
        title: 'مصروفات قيد المعالجة',
        description: `${pendingExpenses.length} مصروف بانتظار التأكيد، بقيمة ${formatCurrencyValue(stats.pendingAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}. تأكد من اعتماد الدفعات قبل نهاية الأسبوع.`,
      };
    }

    return null;
  }, [expenses, formatCurrencyValue, stats.overdueAmount, stats.pendingAmount]);
  const getStatusBadge = (status: string) => {
    const normalizedStatus = coercePaymentStatusId(status);
    const statusConfig = PAYMENT_STATUS_CONFIG[normalizedStatus];
    const badgeStatus = PAYMENT_STATUS_BADGE_STATUS[normalizedStatus] ?? 'default';

    return <StatusBadge status={badgeStatus} label={statusConfig.label} size="sm" showIcon={false} className="shadow-none" />;
  };

  const getFrequencyBadge = (frequency: string) => {
    const normalizedFrequency = coerceExpenseFrequencyId(frequency);
    const frequencyConfig = EXPENSE_FREQUENCY_CONFIG[normalizedFrequency];
    const badgeStatus = EXPENSE_FREQUENCY_BADGE_STATUS[normalizedFrequency] ?? 'default';

    return <StatusBadge status={badgeStatus} label={frequencyConfig.label} size="sm" showIcon={false} className="shadow-none" />;
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'مشروع غير محدد';
  };

  const emptyIcon = type === 'administrative' ? Building2 : Hammer;
  const emptyTitle = type === 'administrative' ? 'لا توجد تكاليف إدارية' : 'لا توجد مشتريات مشاريع';
  const emptyDescription = type === 'administrative'
    ? 'ابدأ بإضافة المصروفات الإدارية لتتبع التكاليف التشغيلية.'
    : 'سجل أول طلب شراء لمتابعة مصروفات المشروع وربطها بالميزانية.';

  return (
    <div className="space-y-4">
      {statusSummaryAlert && (
        <InlineAlert variant={statusSummaryAlert.variant} title={statusSummaryAlert.title} description={statusSummaryAlert.description} />
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-success">مدفوع</p>
              <p className="text-lg font-bold text-success/90">{formatCurrencyValue(stats.completedAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-warning">معلق</p>
              <p className="text-lg font-bold text-warning/90">{formatCurrencyValue(stats.pendingAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-error/10 border-error/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-error">متأخر</p>
              <p className="text-lg font-bold text-error/90">{formatCurrencyValue(stats.overdueAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-info/10 border-info/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-info">الإجمالي</p>
              <p className="text-lg font-bold text-info/90">{formatCurrencyValue(stats.totalAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {type === 'administrative' ? <Building2 className="w-5 h-5" /> : <Hammer className="w-5 h-5" />}
            {type === 'administrative' ? 'التكاليف الإدارية' : 'مشتريات المشاريع'}
            <StatusBadge status="info" label={`${expenses.length}`} size="sm" showIcon={false} className="shadow-none" />
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
                    <th className="text-right p-3 border-b font-medium">العنوان</th>
                    <th className="text-right p-3 border-b font-medium">الفئة</th>
                    <th className="text-right p-3 border-b font-medium">المبلغ</th>
                    <th className="text-right p-3 border-b font-medium">التكرار</th>
                    <th className="text-right p-3 border-b font-medium">حالة الدفع</th>
                    {type === 'project' && <th className="text-right p-3 border-b font-medium">المشروع</th>}
                    <th className="text-right p-3 border-b font-medium">تاريخ الاستحقاق</th>
                    <th className="text-right p-3 border-b font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const category = getCategoryById(expense.categoryId);
                    const frequencyId = coerceExpenseFrequencyId(expense.frequency);
                    const amounts = calculateAmounts(expense.amount, frequencyId);
                    
                    return (
                      <tr key={expense.id} className="hover:bg-muted/20">
                        <td className="p-3 border-b text-right">
                          <div className="text-right">
                            <p className="font-medium text-right">{expense.title}</p>
                            {expense.description && (
                              <p className="text-xs text-muted-foreground/85 mt-1 text-right">{expense.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 border-b text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs">{category?.nameAr}</span>
                            <span>{category?.icon}</span>
                          </div>
                        </td>
                        <td className="p-3 border-b text-right">
                          <div className="text-right">
                            <p className="font-medium text-right">{formatCurrencyValue(expense.amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-muted-foreground/85 text-right">
                              شهرياً: {formatCurrencyValue(amounts.monthly, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} | سنوياً: {formatCurrencyValue(amounts.annual, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 border-b text-right">
                          <div className="flex justify-end">
                            {getFrequencyBadge(expense.frequency)}
                          </div>
                        </td>
                        <td className="p-3 border-b text-right">
                          <div className="flex justify-end">
                            {getStatusBadge(expense.paymentStatus)}
                          </div>
                        </td>
                        {type === 'project' && (
                          <td className="p-3 border-b text-right">
                            <span className="text-xs">{getProjectName(expense.projectId)}</span>
                          </td>
                        )}
                        <td className="p-3 border-b text-right">
                          <span className="text-xs">
                            {formatDateValue(expense.dueDate, {
                              locale: 'ar-SA',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }, '-')}
                          </span>
                        </td>
                        <td className="p-3 border-b text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(expense)}
                              title="تعديل"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(expense)}
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseManagement;
