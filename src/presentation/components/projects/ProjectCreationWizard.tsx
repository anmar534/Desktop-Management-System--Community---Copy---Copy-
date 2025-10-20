/**
 * Project Creation Wizard Component
 * مكون معالج إنشاء المشاريع من المناقصات
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  FileText, 
  DollarSign, 
  Calendar, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download
} from 'lucide-react'
import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
import { enhancedProjectService } from '../../services/enhancedProjectService'
import type { CreateProjectRequest } from '../../types/projects'
import { toast } from 'sonner'

// Mock tender data - في التطبيق الحقيقي سيتم جلبها من نظام المناقصات
interface TenderData {
  id: string
  title: string
  titleEn: string
  description: string
  client: string
  value: number
  currency: string
  startDate: string
  endDate: string
  location: string
  category: string
  status: 'won' | 'pending' | 'lost'
  boq: {
    id: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
    category: string
  }[]
  requirements: string[]
  deliverables: string[]
  timeline: {
    phase: string
    duration: number
    dependencies: string[]
  }[]
}

interface ProjectCreationWizardProps {
  tenderId?: string
  onComplete?: (projectId: string) => void
  onCancel?: () => void
  className?: string
}

const wizardSchema = z.object({
  // معلومات أساسية
  name: z.string().min(1, 'اسم المشروع مطلوب'),
  nameEn: z.string().optional(),
  description: z.string().min(1, 'وصف المشروع مطلوب'),
  
  // التواريخ
  startDate: z.date({ required_error: 'تاريخ البداية مطلوب' }),
  endDate: z.date({ required_error: 'تاريخ النهاية مطلوب' }),
  
  // الميزانية
  totalBudget: z.number().min(1, 'الميزانية الإجمالية مطلوبة'),
  contingencyPercentage: z.number().min(0).max(100).default(10),
  
  // الفريق
  projectManager: z.string().min(1, 'مدير المشروع مطلوب'),
  teamMembers: z.array(z.string()).default([]),
  
  // الإعدادات
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.string().min(1, 'فئة المشروع مطلوبة'),
  tags: z.array(z.string()).default([]),
  
  // خيارات التكامل
  importBoq: z.boolean().default(true),
  createTasks: z.boolean().default(true),
  setupMilestones: z.boolean().default(true),
  enableTracking: z.boolean().default(true)
})

type WizardFormData = z.infer<typeof wizardSchema>

export const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({
  tenderId,
  onComplete,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [tenderData, setTenderData] = useState<TenderData | null>(null)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)

  const totalSteps = 5

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      contingencyPercentage: 10,
      priority: 'medium',
      importBoq: true,
      createTasks: true,
      setupMilestones: true,
      enableTracking: true,
      teamMembers: [],
      tags: []
    }
  })

  useEffect(() => {
    if (tenderId) {
      loadTenderData()
    }
  }, [tenderId])

  const loadTenderData = async () => {
    try {
      // Mock data - في التطبيق الحقيقي سيتم جلبها من API المناقصات
      const mockTender: TenderData = {
        id: tenderId!,
        title: 'مشروع إنشاء مجمع سكني',
        titleEn: 'Residential Complex Construction Project',
        description: 'إنشاء مجمع سكني يتكون من 50 وحدة سكنية مع المرافق المساندة',
        client: 'شركة التطوير العقاري المحدودة',
        value: 15000000,
        currency: 'SAR',
        startDate: '2024-11-01',
        endDate: '2025-10-31',
        location: 'الرياض، المملكة العربية السعودية',
        category: 'construction',
        status: 'won',
        boq: [
          {
            id: '1',
            description: 'أعمال الحفر والأساسات',
            quantity: 1000,
            unit: 'م3',
            unitPrice: 150,
            totalPrice: 150000,
            category: 'earthwork'
          },
          {
            id: '2',
            description: 'أعمال الخرسانة المسلحة',
            quantity: 2500,
            unit: 'م3',
            unitPrice: 800,
            totalPrice: 2000000,
            category: 'concrete'
          },
          {
            id: '3',
            description: 'أعمال البناء والمباني',
            quantity: 5000,
            unit: 'م2',
            unitPrice: 400,
            totalPrice: 2000000,
            category: 'masonry'
          }
        ],
        requirements: [
          'الحصول على تراخيص البناء',
          'تطبيق معايير السلامة والأمان',
          'استخدام مواد بناء عالية الجودة',
          'الالتزام بالمواصفات البيئية'
        ],
        deliverables: [
          'المخططات التنفيذية المعتمدة',
          'تقارير الجودة والسلامة',
          'شهادات الإنجاز والتسليم',
          'دليل الصيانة والتشغيل'
        ],
        timeline: [
          {
            phase: 'التخطيط والتصميم',
            duration: 60,
            dependencies: []
          },
          {
            phase: 'أعمال الحفر والأساسات',
            duration: 90,
            dependencies: ['التخطيط والتصميم']
          },
          {
            phase: 'الهيكل الإنشائي',
            duration: 180,
            dependencies: ['أعمال الحفر والأساسات']
          },
          {
            phase: 'التشطيبات والمرافق',
            duration: 120,
            dependencies: ['الهيكل الإنشائي']
          }
        ]
      }

      setTenderData(mockTender)
      
      // تعبئة النموذج ببيانات المناقصة
      form.setValue('name', mockTender.title)
      form.setValue('nameEn', mockTender.titleEn)
      form.setValue('description', mockTender.description)
      form.setValue('startDate', new Date(mockTender.startDate))
      form.setValue('endDate', new Date(mockTender.endDate))
      form.setValue('totalBudget', mockTender.value)
      form.setValue('category', mockTender.category)
      
    } catch (error) {
      console.error('خطأ في تحميل بيانات المناقصة:', error)
      toast.error('فشل في تحميل بيانات المناقصة')
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: WizardFormData) => {
    try {
      setLoading(true)

      // إنشاء طلب إنشاء المشروع
      const projectRequest: CreateProjectRequest = {
        name: data.name,
        nameEn: data.nameEn,
        description: data.description,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        priority: data.priority,
        category: data.category,
        tags: data.tags,
        client: tenderData?.client || '',
        location: tenderData?.location || '',
        budget: {
          total: data.totalBudget,
          spent: 0,
          remaining: data.totalBudget,
          contingency: (data.totalBudget * data.contingencyPercentage) / 100,
          currency: tenderData?.currency || 'SAR'
        },
        team: {
          projectManager: data.projectManager,
          members: data.teamMembers.map(id => ({
            id,
            name: `عضو ${id}`,
            role: 'team_member',
            email: `member${id}@company.com`
          }))
        },
        phases: tenderData?.timeline.map(phase => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2),
          name: phase.phase,
          description: `مرحلة ${phase.phase}`,
          startDate: data.startDate.toISOString(),
          endDate: new Date(data.startDate.getTime() + phase.duration * 24 * 60 * 60 * 1000).toISOString(),
          status: 'planned',
          progress: 0,
          budget: data.totalBudget / (tenderData?.timeline.length || 1),
          deliverables: [],
          dependencies: phase.dependencies
        })) || [],
        milestones: data.setupMilestones ? [
          {
            id: '1',
            title: 'بداية المشروع',
            description: 'نقطة انطلاق المشروع',
            targetDate: data.startDate.toISOString(),
            status: 'pending',
            progress: 0
          },
          {
            id: '2',
            title: 'منتصف المشروع',
            description: 'مراجعة منتصف المشروع',
            targetDate: new Date((data.startDate.getTime() + data.endDate.getTime()) / 2).toISOString(),
            status: 'pending',
            progress: 0
          },
          {
            id: '3',
            title: 'إنهاء المشروع',
            description: 'تسليم المشروع النهائي',
            targetDate: data.endDate.toISOString(),
            status: 'pending',
            progress: 0
          }
        ] : [],
        risks: [
          {
            id: '1',
            title: 'تأخير في التراخيص',
            description: 'احتمالية تأخير الحصول على التراخيص المطلوبة',
            probability: 'medium',
            impact: 'high',
            status: 'active',
            mitigation: 'التقديم المبكر للتراخيص ومتابعة الجهات المختصة'
          }
        ],
        metadata: {
          tenderId: tenderId,
          importedFromTender: true,
          boqImported: data.importBoq,
          tasksCreated: data.createTasks,
          milestonesSetup: data.setupMilestones,
          trackingEnabled: data.enableTracking
        }
      }

      // إنشاء المشروع
      const project = await enhancedProjectService.createProject(projectRequest)
      setCreatedProjectId(project.id)
      
      // الانتقال للخطوة الأخيرة
      setCurrentStep(totalSteps)
      
      toast.success('تم إنشاء المشروع بنجاح!')
      
    } catch (error) {
      console.error('خطأ في إنشاء المشروع:', error)
      toast.error('فشل في إنشاء المشروع')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'معلومات المناقصة'
      case 2: return 'تفاصيل المشروع'
      case 3: return 'الميزانية والجدولة'
      case 4: return 'الفريق والإعدادات'
      case 5: return 'المراجعة والإنشاء'
      default: return ''
    }
  }

  const StepIndicator: React.FC<{ step: number; isActive: boolean; isCompleted: boolean }> = ({
    step,
    isActive,
    isCompleted
  }) => (
    <div className="flex items-center">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${isCompleted ? 'bg-green-500 text-white' : 
          isActive ? 'bg-primary text-primary-foreground' : 
          'bg-muted text-muted-foreground'}
      `}>
        {isCompleted ? <Check className="w-4 h-4" /> : step}
      </div>
      <div className="mr-3">
        <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {getStepTitle(step)}
        </p>
      </div>
    </div>
  )

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`} dir="rtl">
      {/* مؤشر التقدم */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">معالج إنشاء المشروع</h2>
            <Badge variant="outline">
              الخطوة {currentStep} من {totalSteps}
            </Badge>
          </div>
          
          <Progress value={(currentStep / totalSteps) * 100} className="mb-4" />
          
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <StepIndicator
                key={step}
                step={step}
                isActive={step === currentStep}
                isCompleted={step < currentStep}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* محتوى الخطوات */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* الخطوة 1: معلومات المناقصة */}
        {currentStep === 1 && tenderData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                معلومات المناقصة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>عنوان المناقصة</Label>
                  <p className="text-sm font-medium">{tenderData.title}</p>
                </div>
                <div>
                  <Label>العميل</Label>
                  <p className="text-sm font-medium">{tenderData.client}</p>
                </div>
                <div>
                  <Label>قيمة المناقصة</Label>
                  <p className="text-sm font-medium">{formatCurrency(tenderData.value)}</p>
                </div>
                <div>
                  <Label>الموقع</Label>
                  <p className="text-sm font-medium">{tenderData.location}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>وصف المناقصة</Label>
                <p className="text-sm text-muted-foreground">{tenderData.description}</p>
              </div>
              
              {tenderData.boq.length > 0 && (
                <div>
                  <Label>جدول الكميات (BOQ)</Label>
                  <div className="mt-2 space-y-2">
                    {tenderData.boq.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{item.description}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                    {tenderData.boq.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        و {tenderData.boq.length - 3} عنصر آخر...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* الخطوة 2: تفاصيل المشروع */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                تفاصيل المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم المشروع *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="أدخل اسم المشروع"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                  <Input
                    id="nameEn"
                    {...form.register('nameEn')}
                    placeholder="Project name in English"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">وصف المشروع *</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="أدخل وصف تفصيلي للمشروع"
                  rows={4}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select onValueChange={(value) => form.setValue('priority', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="critical">حرجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">فئة المشروع *</Label>
                  <Select onValueChange={(value) => form.setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">إنشاءات</SelectItem>
                      <SelectItem value="infrastructure">بنية تحتية</SelectItem>
                      <SelectItem value="renovation">تجديد</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطوة 3: الميزانية والجدولة */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                الميزانية والجدولة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">تاريخ البداية *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register('startDate', { valueAsDate: true })}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="endDate">تاريخ النهاية *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register('endDate', { valueAsDate: true })}
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalBudget">الميزانية الإجمالية *</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    {...form.register('totalBudget', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {form.formState.errors.totalBudget && (
                    <p className="text-sm text-red-500">{form.formState.errors.totalBudget.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="contingencyPercentage">نسبة الطوارئ (%)</Label>
                  <Input
                    id="contingencyPercentage"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('contingencyPercentage', { valueAsNumber: true })}
                    placeholder="10"
                  />
                </div>
              </div>
              
              {tenderData && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">ملخص الميزانية</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span>قيمة المناقصة:</span>
                      <span className="font-medium mr-2">{formatCurrency(tenderData.value)}</span>
                    </div>
                    <div>
                      <span>ميزانية الطوارئ:</span>
                      <span className="font-medium mr-2">
                        {formatCurrency((form.watch('totalBudget') || 0) * (form.watch('contingencyPercentage') || 0) / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* الخطوة 4: الفريق والإعدادات */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                الفريق والإعدادات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectManager">مدير المشروع *</Label>
                <Select onValueChange={(value) => form.setValue('projectManager', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مدير المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pm1">أحمد محمد</SelectItem>
                    <SelectItem value="pm2">فاطمة علي</SelectItem>
                    <SelectItem value="pm3">محمد سالم</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.projectManager && (
                  <p className="text-sm text-red-500">{form.formState.errors.projectManager.message}</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">خيارات التكامل</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="importBoq"
                      checked={form.watch('importBoq')}
                      onCheckedChange={(checked) => form.setValue('importBoq', !!checked)}
                    />
                    <Label htmlFor="importBoq" className="mr-2">
                      استيراد جدول الكميات من المناقصة
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createTasks"
                      checked={form.watch('createTasks')}
                      onCheckedChange={(checked) => form.setValue('createTasks', !!checked)}
                    />
                    <Label htmlFor="createTasks" className="mr-2">
                      إنشاء المهام تلقائياً من المراحل
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setupMilestones"
                      checked={form.watch('setupMilestones')}
                      onCheckedChange={(checked) => form.setValue('setupMilestones', !!checked)}
                    />
                    <Label htmlFor="setupMilestones" className="mr-2">
                      إعداد المعالم الرئيسية
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableTracking"
                      checked={form.watch('enableTracking')}
                      onCheckedChange={(checked) => form.setValue('enableTracking', !!checked)}
                    />
                    <Label htmlFor="enableTracking" className="mr-2">
                      تفعيل تتبع التقدم والتكاليف
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطوة 5: المراجعة والإنشاء */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {createdProjectId ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {createdProjectId ? 'تم إنشاء المشروع بنجاح' : 'المراجعة النهائية'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {createdProjectId ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-lg font-medium">تم إنشاء المشروع بنجاح!</h3>
                  <p className="text-muted-foreground">
                    تم إنشاء المشروع وربطه بالمناقصة. يمكنك الآن البدء في إدارة المشروع.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => onComplete?.(createdProjectId)}>
                      عرض المشروع
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      إنشاء مشروع آخر
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">ملخص المشروع</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span>اسم المشروع:</span>
                        <span className="font-medium mr-2">{form.watch('name')}</span>
                      </div>
                      <div>
                        <span>الميزانية:</span>
                        <span className="font-medium mr-2">{formatCurrency(form.watch('totalBudget') || 0)}</span>
                      </div>
                      <div>
                        <span>تاريخ البداية:</span>
                        <span className="font-medium mr-2">
                          {form.watch('startDate')?.toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <div>
                        <span>تاريخ النهاية:</span>
                        <span className="font-medium mr-2">
                          {form.watch('endDate')?.toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    تأكد من صحة جميع البيانات قبل إنشاء المشروع
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* أزرار التنقل */}
        {!createdProjectId && (
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'إلغاء' : 'السابق'}
            </Button>
            
            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep} disabled={loading}>
                التالي
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

export default ProjectCreationWizard

