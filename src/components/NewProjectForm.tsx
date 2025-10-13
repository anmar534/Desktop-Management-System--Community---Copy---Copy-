'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { StatusBadge, type StatusBadgeProps } from './ui/status-badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
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
import { PageLayout } from './PageLayout'
import { NewClientDialog } from './NewClientDialog'
import { 
  Building2,
  Save,
  Calendar,
  FileText,
  Target,
  ArrowRight,
  Plus,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { useFinancialState } from '@/application/context'
import { saveToStorage, STORAGE_KEYS } from '../utils/storage'
import type { Project } from '../data/centralData'

const CLIENT_TYPE_STATUS: Record<string, StatusBadgeProps['status']> = {
  government: 'info',
  private: 'success',
  individual: 'warning',
  corporate: 'onTrack',
  default: 'default',
}

const CLIENT_TYPE_LABEL: Record<string, string> = {
  government: 'حكومي',
  private: 'خاص',
  individual: 'فرد',
  corporate: 'شركة',
  default: 'غير محدد',
}

interface NewProjectFormProps {
  onBack: () => void
  mode?: 'create' | 'edit' // نوع العملية
}

export function NewProjectForm({ onBack, editProject = null, mode = 'create' }: NewProjectFormProps) {
  const { projects, clients: clientsState } = useFinancialState()
  const { addProject, updateProject } = projects
  const { clients, isLoading: clientsLoading } = clientsState
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const existingContractValue = editProject?.contractValue ?? editProject?.budget ?? null
  const existingEstimatedCost = editProject?.estimatedCost ?? null
  const existingType = editProject?.type ?? editProject?.category ?? ''
  const existingPriority = editProject?.priority ?? 'medium'
  const existingManager = editProject?.manager ?? ''
  
  // دالة العودة
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowExitDialog(true)
    } else {
      onBack()
    }
  }

  // دالة تنسيق العملة
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
    // تحديد البيانات الأولية حسب الوضع
  const initialFormData = editProject ? {
    name: editProject.name ?? '',
    client: editProject.client ?? '',
    type: existingType,
    location: editProject.location ?? '',
    startDate: editProject.startDate ?? '',
    endDate: editProject.endDate ?? '',
    contractValue: existingContractValue !== null ? existingContractValue.toString() : '',
    estimatedCost: existingEstimatedCost !== null ? existingEstimatedCost.toString() : '',
    description: '',
    priority: existingPriority,
    manager: existingManager
  } : {
    name: '',
    client: '',
    type: '',
    location: '',
    startDate: '',
    endDate: '',
    contractValue: '',
    estimatedCost: '',
    description: '',
    priority: 'medium',
    manager: ''
  }
  
  const [formData, setFormData] = useState(initialFormData)

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const resolveClientBadge = (type?: string) => {
    const normalized = type ?? 'default'
    return {
      status: CLIENT_TYPE_STATUS[normalized] ?? CLIENT_TYPE_STATUS.default,
      label: CLIENT_TYPE_LABEL[normalized] ?? CLIENT_TYPE_LABEL.default,
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const parseAmount = (value: string): number => {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  // التحقق من صحة البيانات
  const validateForm = () => {
    const required = ['name', 'client', 'type', 'location', 'startDate', 'contractValue']
    const missing = required.filter(field => !formData[field as keyof typeof formData])
    
    if (missing.length > 0) {
      toast.error(`يرجى ملء الحقول المطلوبة: ${missing.join(', ')}`)
      return false
    }
    return true
  }

  // دالة للتعامل مع إضافة عميل جديد
  const handleClientAdded = (clientName: string) => {
    handleInputChange('client', clientName)
    setShowNewClientDialog(false)
  }

  // حفظ المشروع
  const handleSaveProject = async () => {
    if (!validateForm()) return

    try {
      setIsSaving(true)
      
      if (mode === 'edit' && editProject) {
        // تحديث مشروع موجود
        const contractValue = parseAmount(formData.contractValue)
        const estimatedCost = parseAmount(formData.estimatedCost)
        const expectedProfit = contractValue - estimatedCost
        
        const updatedProject: Project = {
          ...editProject,
          ...formData,
          priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
          contractValue: contractValue,
          estimatedCost: estimatedCost,
          expectedProfit: expectedProfit,
          actualCost: editProject.actualCost ?? 0,
          remaining: contractValue - (editProject.spent ?? 0),
          lastUpdate: new Date().toISOString(),
          category: formData.type,
          // حقول للتوافق مع النظام القديم
          budget: contractValue,
          value: contractValue,
          team: editProject.team ?? ''
        }

        await updateProject(updatedProject)
        toast.success('تم تحديث المشروع بنجاح!')
      } else {
        // إنشاء مشروع جديد
        const contractValue = parseAmount(formData.contractValue)
        const estimatedCost = parseAmount(formData.estimatedCost)
        const expectedProfit = contractValue - estimatedCost
        
        const newProject = {
          ...formData,
          id: `PRJ-${Date.now()}`,
          status: 'planning' as const,
          priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
          progress: 0,
          contractValue: contractValue,
          estimatedCost: estimatedCost,
          expectedProfit: expectedProfit,
          actualCost: 0,
          spent: 0,
          remaining: contractValue,
          health: 'green' as const,
          lastUpdate: new Date().toISOString(),
          category: formData.type,
          efficiency: 100,
          riskLevel: 'low' as const,
          // حقول للتوافق مع النظام القديم
          budget: contractValue,
          value: contractValue,
          phase: 'التخطيط',
          team: ''
        }

        await addProject(newProject)
        toast.success('تم إنشاء المشروع بنجاح!')
      }
      
      onBack() // العودة لصفحة المشاريع
    } catch {
      toast.error(mode === 'edit' ? 'فشل في تحديث المشروع' : 'فشل في إنشاء المشروع')
    } finally {
      setIsSaving(false)
      setShowSaveDialog(false)
    }
  }

  // حفظ كمسودة
  const handleSaveDraft = async () => {
    try {
      await saveToStorage(`${STORAGE_KEYS.PROJECTS}_draft`, formData)
      toast.success('تم حفظ المسودة بنجاح')
    } catch {
      toast.error('فشل في حفظ المسودة')
    }
  }

  // التحقق من وجود تغييرات غير محفوظة
  const hasUnsavedChanges = () => {
    return Object.values(formData).some(value => value !== '')
  }

  // الإجراءات السريعة
  const quickActions = [
    {
      label: mode === 'edit' ? 'حفظ التعديلات' : 'حفظ المشروع',
      icon: Save,
      onClick: () => setShowSaveDialog(true),
      variant: 'default' as const,
      primary: true
    },
    {
      label: 'العودة للقائمة',
      icon: ArrowRight,
      onClick: () => handleBack(),
      variant: 'outline' as const
    },
    {
      label: 'حفظ كمسودة',
      icon: FileText,
      onClick: handleSaveDraft,
      variant: 'outline' as const
    }
  ]

  const getEstimatedDuration = () => {
    const contractValue = parseAmount(formData.contractValue)
    if (contractValue < 500000) return '3-6 أشهر'
    if (contractValue < 2000000) return '6-12 شهر'
    if (contractValue < 5000000) return '12-18 شهر'
    return '18-24 شهر'
  }

  const getProjectComplexity = (): { label: string; status: StatusBadgeProps['status'] } => {
    const contractValue = parseAmount(formData.contractValue)
    if (contractValue < 500000) return { label: 'بسيط', status: 'success' }
    if (contractValue < 2000000) return { label: 'متوسط', status: 'info' }
    if (contractValue < 5000000) return { label: 'معقد', status: 'warning' }
    return { label: 'شديد التعقيد', status: 'error' }
  }

  const complexityInfo = getProjectComplexity()

  return (
    <PageLayout
      tone="primary"
      title={mode === 'edit' ? `تعديل المشروع: ${editProject?.name ?? ''}` : 'مشروع جديد'}
      description={mode === 'edit' ? 'تحديث بيانات ومعلومات المشروع' : 'إضافة مشروع جديد إلى النظام'}
      icon={Building2}
      quickStats={[]}
      quickActions={quickActions}
      onBack={handleBack}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* العمود الأيسر - النموذج الرئيسي */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* المعلومات الأساسية */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* الخانات الإلزامية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                    اسم المشروع
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="أدخل اسم المشروع"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-medium flex items-center gap-1">
                    العميل
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={formData.client} onValueChange={(value: string) => handleInputChange('client', value)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientsLoading ? (
                            <SelectItem value="loading" disabled>جاري التحميل...</SelectItem>
                          ) : clients.length === 0 ? (
                            <SelectItem value="no-clients" disabled>لا يوجد عملاء مسجلين</SelectItem>
                          ) : (
                            clients.map((client) => {
                              const { status, label } = resolveClientBadge(client.type)
                              return (
                                <SelectItem key={client.id} value={client.name}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{client.name}</span>
                                    <StatusBadge
                                      status={status}
                                      label={label}
                                      size="sm"
                                      showIcon={false}
                                      className="shadow-none"
                                    />
                                  </div>
                                </SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewClientDialog(true)}
                      title="إضافة عميل جديد"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium flex items-center gap-1">
                    نوع المشروع
                    <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="type"
                    className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    aria-label="اختيار نوع المشروع"
                  >
                    <option value="">اختر نوع المشروع</option>
                    <option value="residential">سكني</option>
                    <option value="commercial">تجاري</option>
                    <option value="industrial">صناعي</option>
                    <option value="infrastructure">بنية تحتية</option>
                    <option value="renovation">ترميم</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                    الموقع
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="موقع المشروع"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  وصف المشروع
                </Label>
                <Textarea
                  id="description"
                  placeholder="وصف مفصل للمشروع والمتطلبات"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* الجدولة والميزانية */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                الجدولة والميزانية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-1">
                    تاريخ البداية
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">
                    تاريخ الانتهاء المتوقع
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractValue" className="text-sm font-medium flex items-center gap-1">
                    قيمة العقد (الإيرادات)
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contractValue"
                    type="number"
                    placeholder="قيمة العقد بالريال السعودي"
                    value={formData.contractValue}
                    onChange={(e) => handleInputChange('contractValue', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost" className="text-sm font-medium">
                    التكلفة التقديرية (الميزانية المخططة)
                  </Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    placeholder="التكلفة المتوقعة للمشروع بالريال السعودي"
                    value={formData.estimatedCost}
                    onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                    className="bg-background"
                  />
                  <div className="text-xs text-muted-foreground">
                    {formData.contractValue && (
                      <span>
                        الضريبة المقترحة (15%): {formatCurrency(parseInt(formData.contractValue) * 0.15)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    الأولوية
                  </Label>
                  <select
                    id="priority"
                    className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    aria-label="اختيار أولوية المشروع"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
              </div>

              {/* معلومات تقديرية */}
              {formData.contractValue && (
                <div className="mt-4 rounded-lg border border-info/20 bg-info/10 p-4">
                  <h4 className="mb-2 font-medium text-info">التقديرات المالية</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">المدة المتوقعة:</span>
                      <div className="font-medium text-foreground">{getEstimatedDuration()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مستوى التعقيد:</span>
                      <StatusBadge
                        status={complexityInfo.status}
                        label={complexityInfo.label}
                        size="sm"
                        showIcon={false}
                        className="shadow-none"
                      />
                    </div>
                    <div>
                      <span className="text-muted-foreground">قيمة العقد:</span>
                      <div className="font-medium text-success">
                        {formatCurrency(parseAmount(formData.contractValue))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-4 border-t border-info/20 pt-2 text-xs text-muted-foreground md:grid-cols-3">
                    <span>الإيرادات: {formatCurrency(parseAmount(formData.contractValue))}</span>
                    <span>التكلفة التقديرية: {formatCurrency(parseAmount(formData.estimatedCost))}</span>
                    <span className="font-medium text-info">
                      الربح المتوقع: {formatCurrency(parseAmount(formData.contractValue) - parseAmount(formData.estimatedCost))}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن - المعلومات المساعدة */}
        <div className="space-y-6">
          
          {/* قائمة المراجعة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                قائمة المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { item: 'اسم المشروع', completed: !!formData.name },
                { item: 'اختيار العميل', completed: !!formData.client },
                { item: 'تحديد النوع', completed: !!formData.type },
                { item: 'تحديد الموقع', completed: !!formData.location },
                { item: 'قيمة العقد (الإيرادات)', completed: !!formData.contractValue },
                { item: 'التكلفة التقديرية', completed: !!formData.estimatedCost },
                { item: 'تحديد التاريخ', completed: !!formData.startDate },
                { item: 'وصف المشروع', completed: !!formData.description }
              ].map((check, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    check.completed ? 'border-success bg-success text-success-foreground' : 'border-border'
                  }`}>
                    {check.completed && <div className="h-2 w-2 rounded-full bg-success-foreground" />}
                  </div>
                  <span className={`text-sm ${check.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {check.item}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* نصائح وإرشادات */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-info" />
                نصائح مهمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="rounded-lg border border-info/20 bg-info/10 p-3 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">قيمة العقد:</strong> هي الإيرادات المتوقعة - تأكد من دقة القيمة المتفق عليها مع العميل</p>
                </div>
                <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">التكلفة التقديرية:</strong> الميزانية المخططة للمشروع - احسب جميع التكاليف المتوقعة</p>
                </div>
                <div className="rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">الربح المتوقع:</strong> الفرق بين قيمة العقد والتكلفة التقديرية - يجب أن يكون إيجابياً</p>
                </div>
                <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">الجدولة:</strong> ضع هامش زمني إضافي 10-15% للظروف الطارئة</p>
                </div>
                <div className="rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">الموافقات:</strong> تأكد من الحصول على جميع التصاريح قبل البدء</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الخطوات التالية */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">الخطوات التالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 p-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</div>
                  <span>مراجعة البيانات</span>
                </div>
                <div className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 p-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-xs text-warning-foreground">2</div>
                  <span>الموافقة الإدارية</span>
                </div>
                <div className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 p-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-xs text-success-foreground">3</div>
                  <span>الموافقة المالية</span>
                </div>
                <div className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 p-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">4</div>
                  <span>بدء التنفيذ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog تأكيد الحفظ */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mode === 'edit' ? 'تأكيد تحديث المشروع' : 'تأكيد إنشاء المشروع'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mode === 'edit' 
                ? 'هل أنت متأكد من أنك تريد حفظ التعديلات على هذا المشروع؟'
                : 'هل أنت متأكد من أنك تريد إنشاء هذا المشروع بالبيانات المدخلة؟ سيتم إضافة المشروع للنظام وبدء عملية المتابعة.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveProject}
              disabled={isSaving}
            >
              {isSaving 
                ? (mode === 'edit' ? 'جاري التحديث...' : 'جاري الحفظ...') 
                : (mode === 'edit' ? 'حفظ التعديلات' : 'إنشاء المشروع')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog تأكيد الخروج */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الخروج</AlertDialogTitle>
            <AlertDialogDescription>
              لديك تغييرات غير محفوظة. هل تريد حفظها كمسودة قبل الخروج؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
              الاستمرار في التعديل
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                await handleSaveDraft()
                setShowExitDialog(false)
                onBack()
              }}
            >
              حفظ وخروج
            </Button>
            <AlertDialogAction
              onClick={() => {
                setShowExitDialog(false)
                onBack()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              خروج بدون حفظ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog إضافة عميل جديد */}
      <NewClientDialog 
        open={showNewClientDialog} 
        onClose={() => setShowNewClientDialog(false)} 
        onClientAdded={handleClientAdded}
      />
    </PageLayout>
  )
}