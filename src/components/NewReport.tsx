'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { 
  FileBarChart,
  ArrowRight,
  Save,
  Play
} from 'lucide-react'
import { formatDateValue } from '../utils/formatters'

interface NewReportProps {
  onSectionChange: (section: string) => void
}

export function NewReport({ onSectionChange }: NewReportProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    frequency: '',
    dataSource: [] as string[],
    dateRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    format: 'pdf',
    includeCharts: true,
    includeSummary: true,
    autoGenerate: false,
    recipients: ''
  })

  // أنواع التقارير
  const reportTypes = [
    { value: 'financial', label: 'تقرير مالي شامل' },
    { value: 'project', label: 'تقرير المشاريع' },
    { value: 'budget', label: 'تقرير الموازنة' },
    { value: 'expense', label: 'تقرير المصروفات' },
    { value: 'revenue', label: 'تقرير الإيرادات' },
    { value: 'invoice', label: 'تقرير الفواتير' },
    { value: 'bank', label: 'تقرير الحسابات البنكية' },
    { value: 'tax', label: 'تقرير ضريبي' }
  ]

  // تكرار التقرير
  const frequencies = [
    { value: 'once', label: 'مرة واحدة' },
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'quarterly', label: 'ربع سنوي' },
    { value: 'yearly', label: 'سنوي' }
  ]

  // مصادر البيانات
  const dataSources = [
    { id: 'invoices', label: 'الفواتير' },
    { id: 'expenses', label: 'المصروفات' },
    { id: 'projects', label: 'المشاريع' },
    { id: 'bank_accounts', label: 'الحسابات البنكية' },
    { id: 'budgets', label: 'الموازنات' },
    { id: 'contracts', label: 'العقود' },
    { id: 'clients', label: 'العملاء' },
    { id: 'suppliers', label: 'الموردين' }
  ]

  // تنسيقات التقرير
  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'word', label: 'Word' },
    { value: 'html', label: 'HTML' }
  ]

  // تحديث مصادر البيانات
  const updateDataSource = (sourceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dataSource: checked 
        ? [...prev.dataSource, sourceId]
        : prev.dataSource.filter(id => id !== sourceId)
    }))
  }

  // إنشاء التقرير
  const handleGenerate = () => {
    if (!formData.name || !formData.type || formData.dataSource.length === 0) {
      alert('يرجى ملء جميع الحقول المطلوبة واختيار مصدر بيانات واحد على الأقل')
      return
    }

    console.log('إنشاء التقرير:', formData)
    alert('تم بدء إنشاء التقرير! سيتم إشعارك عند اكتمال التقرير.')
    onSectionChange('financial-reports')
  }

  // حفظ كقالب
  const handleSaveTemplate = () => {
    if (!formData.name || !formData.type) {
      alert('يرجى ملء اسم التقرير ونوعه على الأقل')
      return
    }

    console.log('حفظ قالب التقرير:', formData)
    alert('تم حفظ التقرير كقالب بنجاح!')
    onSectionChange('financial-reports')
  }

  const quickActions = [
    {
      label: 'العودة للتقارير',
      icon: ArrowRight,
      onClick: () => onSectionChange('financial-reports'),
      variant: 'outline' as const
    },
    {
      label: 'حفظ كقالب',
      icon: Save,
      onClick: handleSaveTemplate,
      variant: 'outline' as const
    },
    {
      label: 'إنشاء التقرير',
      icon: Play,
      onClick: handleGenerate,
      primary: true
    }
  ]

  const NOT_SET_LABEL = 'لم يتم تحديده'

  const getDisplayValue = (value: string): string => (value.trim() === '' ? NOT_SET_LABEL : value)

  const formatDate = (value: string): string => {
    if (value.trim() === '') {
      return NOT_SET_LABEL
    }

    return formatDateValue(value, { locale: 'ar-EG' }, NOT_SET_LABEL)
  }

  const reportNameDisplay = getDisplayValue(formData.name)
  const reportTypeLabel = reportTypes.find(type => type.value === formData.type)?.label ?? NOT_SET_LABEL
  const frequencyLabel = frequencies.find(freq => freq.value === formData.frequency)?.label ?? 'مرة واحدة'
  const formattedDateRange = `${formatDate(formData.dateRange.startDate)} - ${formatDate(formData.dateRange.endDate)}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5">
      
      {/* الهيدر */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileBarChart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">تقرير جديد</h1>
                <p className="text-sm text-muted-foreground">إنشاء تقرير مالي مخصص</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">

            {/* معلومات التقرير */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات التقرير</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportName">اسم التقرير *</Label>
                    <Input
                      id="reportName"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="التقرير المالي الشهري - يناير 2024"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportType">نوع التقرير *</Label>
                    <Select value={formData.type} onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التقرير" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frequency">تكرار التقرير</Label>
                    <Select value={formData.frequency} onValueChange={(value: string) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التكرار" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="format">تنسيق التقرير</Label>
                    <Select value={formData.format} onValueChange={(value: string) => setFormData(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">وصف التقرير</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف موجز لمحتوى التقرير وأهدافه..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* نطاق البيانات */}
            <Card>
              <CardHeader>
                <CardTitle>نطاق البيانات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">من تاريخ</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.dateRange.startDate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, startDate: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">إلى تاريخ</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.dateRange.endDate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, endDate: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>مصادر البيانات *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                          id={source.id}
                          checked={formData.dataSource.includes(source.id)}
                          onCheckedChange={(checked: boolean) => updateDataSource(source.id, checked)}
                        />
                        <Label 
                          htmlFor={source.id} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {source.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إعدادات التقرير */}
            <Card>
              <CardHeader>
                <CardTitle>إعدادات التقرير</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="includeCharts"
                      checked={formData.includeCharts}
                      onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, includeCharts: checked }))}
                    />
                    <Label htmlFor="includeCharts">تضمين الرسوم البيانية</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="includeSummary"
                      checked={formData.includeSummary}
                      onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, includeSummary: checked }))}
                    />
                    <Label htmlFor="includeSummary">تضمين الملخص التنفيذي</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="autoGenerate"
                      checked={formData.autoGenerate}
                      onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, autoGenerate: checked }))}
                    />
                    <Label htmlFor="autoGenerate">إنشاء تلقائي حسب التكرار المحدد</Label>
                  </div>
                </div>

                {formData.autoGenerate && (
                  <div>
                    <Label htmlFor="recipients">المستلمين (بريد إلكتروني)</Label>
                    <Input
                      id="recipients"
                      value={formData.recipients}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value }))}
                      placeholder="admin@company.com, finance@company.com"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      فصل عدة عناوين بريد إلكتروني بفاصلة
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معاينة التقرير */}
            <Card>
              <CardHeader>
                <CardTitle>معاينة إعدادات التقرير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم التقرير:</span>
                    <span className="font-medium">{reportNameDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع التقرير:</span>
                    <span className="font-medium">
                      {reportTypeLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفترة الزمنية:</span>
                    <span className="font-medium">{formattedDateRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مصادر البيانات:</span>
                    <span className="font-medium">
                      {formData.dataSource.length > 0 
                        ? `${formData.dataSource.length} مصدر محدد`
                        : 'لم يتم اختيار أي مصدر'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التنسيق:</span>
                    <span className="font-medium">{formData.format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التكرار:</span>
                    <span className="font-medium">
                      {frequencyLabel}
                    </span>
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
