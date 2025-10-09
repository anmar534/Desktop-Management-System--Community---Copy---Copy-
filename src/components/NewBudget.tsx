'use client'

import { useState } from 'react'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { formatDateValue } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Target,
  ArrowRight,
  Save,
  Plus,
  Trash2
} from 'lucide-react'

interface NewBudgetProps {
  onSectionChange: (section: string) => void
}

export function NewBudget({ onSectionChange }: NewBudgetProps) {
  interface BudgetCategoryForm {
    id: number;
    name: string;
    allocatedAmount: string;
    description: string;
  }

  interface BudgetFormState {
    name: string;
    description: string;
    totalAmount: string;
    startDate: string;
    endDate: string;
    department: string;
    category: string;
    status: 'draft' | 'active';
    categories: BudgetCategoryForm[];
  }

  const [formData, setFormData] = useState<BudgetFormState>({
    name: '',
    description: '',
    totalAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    department: '',
    category: '',
    status: 'draft',
    categories: [
      {
        id: 1,
        name: '',
        allocatedAmount: '',
        description: ''
      }
    ]
  })

  const parseAmount = (value: string): number => {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const { formatCurrencyValue } = useCurrencyFormatter()

  // الأقسام
  const departments = [
    'الإدارة العامة',
    'المالية والمحاسبة',
    'الهندسة والتصميم',
    'التنفيذ والتشييد',
    'المبيعات والتسويق',
    'الموارد البشرية',
    'تقنية المعلومات'
  ]

  // فئات الموازنة
  const budgetCategories = [
    'موازنة تشغيلية',
    'موازنة رأسمالية',
    'موازنة مشاريع',
    'موازنة طوارئ',
    'موازنة صيانة',
    'موازنة تطوير'
  ]

  // إضافة فئة جديدة
  const addCategory = () => {
    setFormData((prev) => {
      const nextId = prev.categories.reduce((maxId, category) => Math.max(maxId, category.id), 0) + 1
      const newCategory: BudgetCategoryForm = {
        id: nextId,
        name: '',
        allocatedAmount: '',
        description: ''
      }

      return {
        ...prev,
        categories: [...prev.categories, newCategory]
      }
    })
  }

  // حذف فئة
  const removeCategory = (id: number) => {
    if (formData.categories.length > 1) {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat.id !== id)
      }))
    }
  }

  // تحديث فئة
  const updateCategory = <Field extends keyof BudgetCategoryForm>(id: number, field: Field, value: BudgetCategoryForm[Field]) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.id === id ? { ...category, [field]: value } : category
      )
    }))
  }

  // حساب الإجمالي المخصص
  const totalAllocated = formData.categories.reduce((sum, category) => sum + parseAmount(category.allocatedAmount), 0)
  const totalAmountValue = parseAmount(formData.totalAmount)
  const remainingAmount = totalAmountValue - totalAllocated

  // حفظ الموازنة
  const handleSave = () => {
    if (formData.name.trim() === '' || parseAmount(formData.totalAmount) <= 0) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const sanitizedCategories = formData.categories.map((category) => ({
      ...category,
      allocatedAmount: parseAmount(category.allocatedAmount)
    }))

    const sanitizedData = {
      ...formData,
      totalAmount: parseAmount(formData.totalAmount),
      categories: sanitizedCategories
    }

    console.log('حفظ الموازنة الجديدة:', sanitizedData)
    alert('تم إنشاء الموازنة بنجاح!')
    onSectionChange('budgets')
  }

  const quickActions = [
    {
      label: 'العودة للموازنات',
      icon: ArrowRight,
      onClick: () => onSectionChange('budgets'),
      variant: 'outline' as const
    },
    {
      label: 'حفظ الموازنة',
      icon: Save,
      onClick: handleSave,
      primary: true
    }
  ]

  const NOT_SET_LABEL = 'لم يتم تحديده'

  const getDisplayValue = (value: string): string => (value.trim() === '' ? NOT_SET_LABEL : value)

  const budgetNameDisplay = getDisplayValue(formData.name)
  const departmentDisplay = getDisplayValue(formData.department)
  const categoryDisplay = getDisplayValue(formData.category)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      {/* الهيدر */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">موازنة جديدة</h1>
                <p className="text-sm text-muted-foreground">إنشاء موازنة جديدة للمشروع أو القسم</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'default' : action.variant ?? 'outline'}
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">

            {/* المعلومات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetName">اسم الموازنة *</Label>
                    <Input
                      id="budgetName"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="موازنة مشروع برج الأعمال"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalAmount">إجمالي الموازنة (ريال) *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                      placeholder="1000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">القسم المسؤول</Label>
                    <Select value={formData.department} onValueChange={(value: string) => setFormData(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">فئة الموازنة</Label>
                    <Select value={formData.category} onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate">تاريخ البداية</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">تاريخ النهاية</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">وصف الموازنة</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للموازنة وأهدافها..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* فئات الموازنة */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>فئات الموازنة</CardTitle>
                <Button onClick={addCategory} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  إضافة فئة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* رأس الجدول */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div className="col-span-4">اسم الفئة</div>
                    <div className="col-span-3">المبلغ المخصص</div>
                    <div className="col-span-4">الوصف</div>
                    <div className="col-span-1">الإجراء</div>
                  </div>

                  {/* فئات الموازنة */}
                  {formData.categories.map((category) => (
                    <div key={category.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Input
                          value={category.name}
                          onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                          placeholder="مواد البناء"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={category.allocatedAmount}
                          onChange={(e) => updateCategory(category.id, 'allocatedAmount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={category.description}
                          onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                          placeholder="وصف مختصر للفئة"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCategory(category.id)}
                          disabled={formData.categories.length === 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ملخص الموازنة */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span>إجمالي الموازنة:</span>
                        <span className="font-medium">{formatCurrencyValue(totalAmountValue, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>إجمالي المخصص:</span>
                        <span className="font-medium">{formatCurrencyValue(totalAllocated, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>المتبقي:</span>
                        <span className={`font-bold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyValue(remainingAmount, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {totalAllocated > parseAmount(formData.totalAmount) && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          تحذير: إجمالي المبالغ المخصصة يتجاوز إجمالي الموازنة
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* معاينة الموازنة */}
            <Card>
              <CardHeader>
                <CardTitle>معاينة الموازنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم الموازنة:</span>
                    <span className="font-medium">{budgetNameDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">إجمالي الموازنة:</span>
                    <span className="font-medium">{formatCurrencyValue(totalAmountValue, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">القسم المسؤول:</span>
                    <span className="font-medium">{departmentDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">فئة الموازنة:</span>
                    <span className="font-medium">{categoryDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">فترة الموازنة:</span>
                    <span className="font-medium">
                      {formatDateValue(formData.startDate, {
                        locale: 'ar-SA',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }, 'غير محدد')}
                      {formData.endDate
                        ? ` - ${formatDateValue(formData.endDate, {
                            locale: 'ar-SA',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}`
                        : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الفئات:</span>
                    <span className="font-medium">{formData.categories.length} فئة</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
