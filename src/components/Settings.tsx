'use client'

import { useState, useCallback, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { PageLayout, DetailCard } from './PageLayout'
import { ExcelDataProcessor } from './ExcelDataProcessor'
import type { ExcelDataType } from './ExcelDataProcessor'
import { BankStatementAnalyzer } from './BankStatementAnalyzer'
import type { BankTransaction } from './BankStatementProcessor'
import { BankStatementProcessor } from './BankStatementProcessor'
import { authorizeExport } from '@/utils/desktopSecurity'
import { 
  Settings as SettingsIcon,
  Building2,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Lock,
  Save,
  Activity,
  BarChart3,
  PieChart,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  X,
  Check,
  DollarSign
} from 'lucide-react'
import { formatCurrency } from '../data/centralData'
import { useFinancialState } from '@/application/context'
import { ThemeSelector, useTheme } from '@/application/providers/ThemeProvider'

type PreviewValue = string | number | boolean | null | undefined
type PreviewRow = Record<string, PreviewValue>

interface NotificationSettings {
  projects: boolean
  deadlines: boolean
  payments: boolean
  urgentTenders: boolean
  weeklyReports: boolean
}

interface NotificationOption {
  key: keyof NotificationSettings
  label: string
  desc: string
}

const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    key: 'projects',
    label: 'إشعارات المشاريع الجديدة',
    desc: 'تنبيه عند إضافة مشروع جديد'
  },
  {
    key: 'deadlines',
    label: 'تذكير المواعيد النهائية',
    desc: 'تنبيه قبل انتهاء مواعيد المشاريع'
  },
  {
    key: 'payments',
    label: 'إشعارات الدفعات المالية',
    desc: 'تذكير بمواعيد الدفعات المستحقة'
  },
  {
    key: 'urgentTenders',
    label: 'إشعارات المنافسات العاجلة',
    desc: 'تنبيه للمنافسات التي تحتاج إجراء عاجل'
  },
  {
    key: 'weeklyReports',
    label: 'تقارير الأداء الأسبوعية',
    desc: 'إرسال تقرير أداء كل أسبوع'
  }
]

const UPLOAD_TYPE_OPTIONS: ExcelDataType[] = ['projects', 'clients', 'tenders', 'inventory', 'bank-statement']

const isUploadType = (value: string): value is ExcelDataType =>
  (UPLOAD_TYPE_OPTIONS as readonly string[]).includes(value)

const toPreviewRow = (item: unknown): PreviewRow | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const row: PreviewRow = {}

  Object.entries(record).forEach(([key, value]) => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      typeof value === 'undefined'
    ) {
      row[key] = value
      return
    }

    if (value instanceof Date) {
      row[key] = value.toISOString()
      return
    }

    row[key] = String(value)
  })

  return row
}

const normalizeUploadedData = (data: unknown): PreviewRow[] => {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map(toPreviewRow)
    .filter((row): row is PreviewRow => row !== null)
}

const isBankTransactionRecord = (value: unknown): value is BankTransaction => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Partial<BankTransaction>

  return (
    typeof record.id === 'string' &&
    typeof record.date === 'string' &&
    typeof record.balance === 'number' &&
    typeof record.debit === 'number' &&
    typeof record.credit === 'number' &&
    typeof record.description === 'string' &&
    typeof record.category === 'string' &&
    typeof record.subcategory === 'string' &&
    typeof record.project === 'string' &&
    (record.transactionType === 'income' || record.transactionType === 'expense') &&
    typeof record.isReconciled === 'boolean' &&
    typeof record.processedAt === 'string'
  )
}

const normalizeBankTransactions = (data: unknown): BankTransaction[] => {
  if (!Array.isArray(data)) {
    return []
  }

  return data.filter(isBankTransactionRecord)
}

const formatPreviewValue = (value: PreviewValue): string => {
  if (value === null || typeof value === 'undefined') {
    return '—'
  }

  if (typeof value === 'number') {
    return Math.abs(value) >= 1000 ? formatCurrency(value) : value.toString()
  }

  if (typeof value === 'boolean') {
    return value ? 'نعم' : 'لا'
  }

  const text = value
  return text.length > 30 ? `${text.slice(0, 30)}...` : text
}

export function Settings() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedData, setUploadedData] = useState<PreviewRow[]>([])
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [uploadType, setUploadType] = useState<ExcelDataType>('projects')
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const [showBankAnalysis, setShowBankAnalysis] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    projects: true,
    deadlines: true,
    payments: true,
    urgentTenders: true,
    weeklyReports: false
  })

  const { projects: projectsState, tenders: tendersState } = useFinancialState()
  const { projects } = projectsState
  const { tenders } = tendersState
  const { setTheme, isDark, isHighContrast } = useTheme()

  const handleDarkModeToggle = useCallback((checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
  }, [setTheme])

  const handleHighContrastToggle = useCallback((checked: boolean) => {
    setTheme(checked ? 'high-contrast' : 'light')
  }, [setTheme])

  const projectCapacity = 20
  const tenderCapacity = 15

  const activeProjects = useMemo(
    () => projects.filter(project => project.status === 'active').length,
    [projects]
  )

  const activeTenders = useMemo(
    () => tenders.filter(tender => ['new', 'under_action', 'ready_to_submit'].includes(tender.status)).length,
    [tenders]
  )

  // إحصائيات النظام للإدارة
  const settingsStats = {
    systemVersion: '3.0.0',
    lastUpdate: '2024-02-15',
    activeModules: 7,
    activeUsers: 12,
    storageUsed: 3.2,
    storageTotal: 10,
    dataBackups: 15,
    lastBackup: '2024-02-14'
  }

  // الإحصائيات السريعة للمدير
  const quickStats = [
    {
      label: 'الوحدات النشطة',
      value: settingsStats.activeModules,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'المستخدمون النشطون',
      value: `${settingsStats.activeUsers}/25`,
      trend: 'up' as const,
      trendValue: '+2',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'مساحة التخزين',
      value: `${settingsStats.storageUsed}GB`,
      trend: 'up' as const,
      trendValue: '+0.3GB',
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary/20'
    },
    {
      label: 'النسخ الاحتياطية',
      value: settingsStats.dataBackups,
      trend: 'up' as const,
      trendValue: '+1',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'إصدار النظام',
      value: settingsStats.systemVersion,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      label: 'معدل الأداء',
      value: '98.5%',
      trend: 'up' as const,
      trendValue: '+0.8%',
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ]

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'نسخة احتياطية',
      icon: Database,
      onClick: () => handleBackup(),
      variant: 'outline' as const
    },
    {
      label: 'تصدير البيانات',
      icon: Download,
      onClick: () => void handleExport(),
      variant: 'outline' as const
    },
    {
      label: 'حفظ الإعدادات',
      icon: Save,
      onClick: () => handleSaveSettings(),
      primary: true
    }
  ]

  // بطاقات حالة النظام
  const SystemStatusCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="أداء النظام"
        value="98.5%"
        subtitle="معدل التشغيل الشهري"
        icon={Activity}
        color="text-success"
        bgColor="bg-success/10"
        trend={{ value: '+0.8%', direction: 'up' }}
      />
      <DetailCard
        title="استخدام التخزين"
        value={`${Math.round((settingsStats.storageUsed / settingsStats.storageTotal) * 100)}%`}
        subtitle="من المساحة الكلية"
        icon={Database}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{ value: `${settingsStats.storageUsed}/${settingsStats.storageTotal}GB`, direction: 'stable' }}
      />
      <DetailCard
        title="المعاملات اليومية"
        value="1,245"
        subtitle="عملية اليوم"
        icon={BarChart3}
        color="text-secondary-foreground"
        bgColor="bg-secondary/20"
        trend={{ value: '+12%', direction: 'up' }}
      />
      <DetailCard
        title="أمان البيانات"
        value="100%"
        subtitle="النسخ الاحتياطية"
        icon={Shield}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{ value: 'آمنة', direction: 'up' }}
      />
    </div>
  )

  // معالجة الملف المرفوع
  const processUploadedFile = useCallback(async (_file: File) => {
    try {
      // محاكاة قراءة ملف Excel وتحويله لبيانات
      const mockRawData = generateMockRawDataFromType(uploadType)
      
      // معالجة البيانات باستخدام ExcelDataProcessor
      const processedData = ExcelDataProcessor.processData(uploadType, mockRawData)
      
      // التحقق من صحة البيانات
      const validation = ExcelDataProcessor.validateData(uploadType, processedData)
      
      if (!validation.isValid) {
        console.warn('تحذيرات في البيانات:', validation.errors)
        if (validation.warnings) {
          console.warn('تحذيرات إضافية:', validation.warnings)
        }
      }

      const normalizedData = normalizeUploadedData(processedData)
      setUploadedData(normalizedData)
      setPreviewData(normalizedData.slice(0, 5)) // عرض أول 5 سجلات فقط
      setUploadStatus('success')
      setShowPreview(true)

      // معالجة خاصة للكشف البنكي
      if (uploadType === 'bank-statement') {
        const transactions = normalizeBankTransactions(processedData)
        setBankTransactions(transactions)
      } else {
        setBankTransactions([])
      }
    } catch (error) {
      console.error('خطأ في معالجة الملف:', error)
      setUploadStatus('error')
    }
  }, [uploadType])

  // محاكاة رفع الملف
  const simulateFileUpload = useCallback((file: File) => {
    setUploadStatus('uploading')
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadStatus('processing')
          setTimeout(() => processUploadedFile(file), 1000)
          return 100
        }
        return prev + 10
      })
    }, 100)
  }, [processUploadedFile])

  // توليد بيانات خام تجريبية حسب النوع (تحاكي بيانات Excel)
  const generateMockRawDataFromType = (type: ExcelDataType) => {
    switch (type) {
      case 'projects':
        return [
          { 'اسم المشروع': 'مشروع المول الجديد', 'العميل': 'شركة التطوير', 'الميزانية': '15000000', 'الحالة': 'نشط', 'التقدم': '75', 'الأولوية': 'عالية' },
          { 'اسم المشروع': 'مجمع سكني الواحة', 'العميل': 'وزارة الإسكان', 'الميزانية': '45000000', 'الحالة': 'تخطيط', 'التقدم': '25', 'الأولوية': 'متوسطة' },
          { 'اسم المشروع': 'مدرسة المستقبل', 'العميل': 'وزارة التعليم', 'الميزانية': '8500000', 'الحالة': 'نشط', 'التقدم': '60', 'الأولوية': 'عالية' },
          { 'اسم المشروع': 'مستشفى الرحمة', 'العميل': 'وزارة الصحة', 'الميزانية': '35000000', 'الحالة': 'نشط', 'التقدم': '40', 'الأولوية': 'حرجة' },
          { 'اسم المشروع': 'جسر الملك فهد', 'العميل': 'وزارة النقل', 'الميزانية': '28000000', 'الحالة': 'متأخر', 'التقدم': '85', 'الأولوية': 'عالية' }
        ]
      case 'clients':
        return [
          { 'اسم العميل': 'شركة البناء الحديث', 'النوع': 'خاص', 'القيمة الإجمالية': '25000000', 'عدد المشاريع': '5', 'العلاقة': 'استراتيجي' },
          { 'اسم العميل': 'وزارة الشؤون البلدية', 'النوع': 'حكومي', 'القيمة الإجمالية': '85000000', 'عدد المشاريع': '12', 'العلاقة': 'حكومي' },
          { 'اسم العميل': 'شركة الاستثمار العقاري', 'النوع': 'خاص', 'القيمة الإجمالية': '15000000', 'عدد المشاريع': '3', 'العلاقة': 'عادي' },
          { 'اسم العميل': 'مؤسسة الحرمين', 'النوع': 'خاص', 'القيمة الإجمالية': '42000000', 'عدد المشاريع': '8', 'العلاقة': 'استراتيجي' }
        ]
      case 'tenders':
        return [
          { 'اسم المنافسة': 'مناقصة مستشفى الشرق', 'العميل': 'وزارة الصحة', 'القيمة': '125000000', 'الموعد النهائي': '2024-03-15', 'الحالة': 'نشط', 'فرصة الفوز': '75' },
          { 'اسم المنافسة': 'تطوير الكورنيش', 'العميل': 'أمانة جدة', 'القيمة': '85000000', 'الموعد النهائي': '2024-02-25', 'الحالة': 'إعداد', 'فرصة الفوز': '60' },
          { 'اسم المنافسة': 'مجمع رياضي', 'العميل': 'وزارة الرياضة', 'القيمة': '65000000', 'الموعد النهائي': '2024-04-10', 'الحالة': 'مراجعة', 'فرصة الفوز': '80' },
          { 'اسم المنافسة': 'شبكة طرق الجنوب', 'العميل': 'وزارة النقل', 'القيمة': '95000000', 'الموعد النهائي': '2024-05-20', 'الحالة': 'إعداد', 'فرصة الفوز': '45' }
        ]
      case 'inventory':
        return [
          { 'اسم المادة': 'إسمنت بورتلاندي', 'التصنيف': 'مواد أساسية', 'المخزون الحالي': '500', 'الوحدة': 'كيس', 'السعر': '18.50', 'المورد': 'شركة الإسمنت السعودية' },
          { 'اسم المادة': 'حديد تسليح 16مم', 'التصنيف': 'حديد', 'المخزون الحالي': '25', 'الوحدة': 'طن', 'السعر': '3200', 'المورد': 'مصنع الحديد الوطني' },
          { 'اسم المادة': 'بلوك إسمنتي', 'التصنيف': 'مواد بناء', 'المخزون الحالي': '2000', 'الوحدة': 'قطعة', 'السعر': '2.85', 'المورد': 'مصنع البلوك الحديث' },
          { 'اسم المادة': 'رمل مغسول', 'التصنيف': 'خامات', 'المخزون الحالي': '150', 'الوحدة': 'متر مكعب', 'السعر': '95', 'المورد': 'مقالع الشرق' }
        ]
      case 'bank-statement':
        return [
          { 'التاريخ': '2024-02-01', 'الرصيد': '2500000', 'مدين': '0', 'دائن': '500000', 'تفاصيل العملية': 'دفعة من شركة التطوير العقاري', 'التصنيف': 'إيرادات المشاريع', 'التصنيف الفرعي': 'دفعات العملاء', 'المشروع': 'مجمع الرياض التجاري' },
          { 'التاريخ': '2024-02-02', 'الرصيد': '2350000', 'مدين': '150000', 'دائن': '0', 'تفاصيل العملية': 'شراء إسمنت وحديد تسليح', 'التصنيف': 'مواد البناء', 'التصنيف الفرعي': 'مواد أساسية', 'المشروع': 'مجمع الرياض التجاري' },
          { 'التاريخ': '2024-02-03', 'الرصيد': '2300000', 'مدين': '50000', 'دائن': '0', 'تفاصيل العملية': 'رواتب الموظفين', 'التصنيف': 'الرواتب والأجور', 'التصنيف الفرعي': 'رواتب الموظفين', 'المشروع': 'غير محدد' },
          { 'التاريخ': '2024-02-04', 'الرصيد': '2280000', 'مدين': '20000', 'دائن': '0', 'تفاصيل العملية': 'وقود المعدات', 'التصنيف': 'الوقود', 'التصنيف الفرعي': 'وقود المعدات', 'المشروع': 'توسعة طريق الملك فهد' },
          { 'التاريخ': '2024-02-05', 'الرصيد': '2560000', 'مدين': '0', 'دائن': '280000', 'تفاصيل العملية': 'دفعة من وزارة التعليم', 'التصنيف': 'إيرادات المشاريع', 'التصنيف الفرعي': 'دفعات العملاء', 'المشروع': 'مدرسة الأمل الابتدائية' },
          { 'التاريخ': '2024-02-06', 'الرصيد': '2510000', 'مدين': '50000', 'دائن': '0', 'تفاصيل العملية': 'إيجار المعدات الثقيلة', 'التصنيف': 'المعدات', 'التصنيف الفرعي': 'إيجار معدات', 'المشروع': 'مستشفى الملك فهد - التوسعة' },
          { 'التاريخ': '2024-02-07', 'الرصيد': '2485000', 'مدين': '25000', 'دائن': '0', 'تفاصيل العملية': 'مصاريف نقل ومواصلات', 'التصنيف': 'النقل', 'التصنيف الفرعي': 'نقل المواد', 'المشروع': 'مجمع الخدمات الطبية' },
          { 'التاريخ': '2024-02-08', 'الرصيد': '2470000', 'مدين': '15000', 'دائن': '0', 'تفاصيل العملية': 'فواتير كهرباء وماء', 'التصنيف': 'المرافق', 'التصنيف الفرعي': 'خدمات أساسية', 'المشروع': 'غير محدد' }
        ]
      default:
        return []
    }
  }

  // التعامل مع رفع الملف
  const handleUploadTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target

    if (isUploadType(value)) {
      setUploadType(value)
    } else {
      console.warn('نوع بيانات غير مدعوم:', value)
    }
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.endsWith('.xlsx') || 
                 file.name.endsWith('.xls'))) {
      simulateFileUpload(file)
    } else {
      alert('يرجى اختيار ملف Excel صحيح (.xlsx أو .xls)')
    }
  }

  // تأكيد استيراد البيانات
  const confirmImport = () => {
    // هنا يتم دمج البيانات مع النظام الحقيقي
    if (uploadType === 'bank-statement') {
      setShowBankAnalysis(true)
    }
    
    setUploadStatus('idle')
    setShowPreview(false)
    setUploadedData([])
    setPreviewData([])
    alert(`تم استيراد ${uploadedData.length} سجل بنجاح إلى ${getTypeLabel(uploadType)}`)
  }

  // إلغاء الاستيراد
  const cancelImport = () => {
    setUploadStatus('idle')
    setShowPreview(false)
    setUploadedData([])
    setPreviewData([])
    setBankTransactions([])
  }

  // الحصول على تسمية النوع
  const getTypeLabel = (type: ExcelDataType) => {
    switch (type) {
      case 'projects': return 'المشاريع'
      case 'clients': return 'العملاء'
      case 'tenders': return 'المنافسات'
      case 'inventory': return 'المخزون'
      case 'bank-statement': return 'كشف الحساب البنكي'
      default: return 'البيانات'
    }
  }

  // إدارة الإعدادات
  const handleSaveSettings = () => {
    alert('تم حفظ الإعدادات بنجاح')
  }

  const handleBackup = () => {
    alert('جاري إنشاء نسخة احتياطية...')
  }

  const handleExport = useCallback(async () => {
    if (uploadType === 'bank-statement' && bankTransactions.length > 0) {
      try {
        const analysis = BankStatementProcessor.analyzeBankStatement(bankTransactions)
        const csvData = BankStatementProcessor.exportAnalysisToExcel(analysis)
        const encoder = new TextEncoder()
        const bytes = encoder.encode(csvData).length
        const exportLabel = `bank_analysis_${analysis.dateRange.startDate}_${analysis.dateRange.endDate}`

        const authorization = await authorizeExport({
          format: 'csv',
          filename: exportLabel,
          bytes,
          origin: 'Settings.handleBankStatementExport',
          metadata: {
            transactions: analysis.totalTransactions,
            projects: Object.keys(analysis.projectBreakdown).length,
            categories: Object.keys(analysis.categoryBreakdown).length
          }
        })

        if (!authorization.allowed) {
          alert('تم إلغاء تصدير التحليل البنكي بواسطة سياسات الأمان.')
          return
        }

        const sanitizedFilename = authorization.payload?.filename ?? exportLabel
        const finalFilename = sanitizedFilename.endsWith('.csv') ? sanitizedFilename : `${sanitizedFilename}.csv`

        const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', finalFilename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        requestAnimationFrame(() => URL.revokeObjectURL(url))
      } catch (error) {
        console.error('Error exporting bank analysis:', error)
        alert('حدث خطأ أثناء تصدير التحليل البنكي. يرجى المحاولة لاحقًا.')
      }
      return
    }

    alert('لا توجد بيانات قابلة للتصدير حاليًا.')
  }, [uploadType, bankTransactions])

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }

  // إذا كان يتم عرض تحليل الكشف البنكي
  if (showBankAnalysis && bankTransactions.length > 0) {
    return (
      <BankStatementAnalyzer
        transactions={bankTransactions}
        onClose={() => {
          setShowBankAnalysis(false)
          setBankTransactions([])
        }}
  onExport={() => void handleExport()}
      />
    )
  }

  return (
    <PageLayout
      title="إعدادات النظام"
      description="إعدادات الشركة والنظام والتفضيلات المتقدمة"
      icon={SettingsIcon}
  gradientFrom="from-primary"
  gradientTo="to-secondary"
      quickStats={quickStats}
      quickActions={quickActions}
      headerExtra={SystemStatusCards}
      showSearch={false}
    >
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الأيسر - أدوات وإحصائيات */}
        <div className="space-y-6">
          {/* استيراد البيانات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                استيراد ملفات Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="uploadType">نوع البيانات</Label>
                <select
                  id="uploadType"
                  title="نوع البيانات"
                  className="w-full p-2 border rounded-md mt-1 bg-input text-foreground"
                  value={uploadType}
                  onChange={handleUploadTypeChange}
                >
                  <option value="projects">المشاريع</option>
                  <option value="clients">العملاء</option>
                  <option value="tenders">المنافسات</option>
                  <option value="inventory">المخزون</option>
                  <option value="bank-statement">كشف الحساب البنكي</option>
                </select>
              </div>

              {uploadType === 'bank-statement' && (
                <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-info" />
                    <h4 className="font-medium text-info">كشف الحساب البنكي</h4>
                  </div>
                  <p className="text-sm text-info/80 mb-2">
                    ترتيب الأعمدة المطلوب:
                  </p>
                  <div className="text-xs text-info/90 space-y-1">
                    <div>1. التاريخ</div>
                    <div>2. الرصيد</div>
                    <div>3. مدين</div>
                    <div>4. دائن</div>
                    <div>5. تفاصيل العملية</div>
                    <div>6. التصنيف</div>
                    <div>7. التصنيف الفرعي</div>
                    <div>8. المشروع</div>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {uploadStatus === 'idle' && (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">اسحب وأفلت ملف Excel هنا أو</p>
                    <div className="relative">
                      <input
                        type="file"
                        title="اختر ملف Excel"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button>
                        <FileSpreadsheet className="h-4 w-4 ml-2" />
                        اختر ملف Excel
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      يدعم النظام ملفات .xlsx و .xls
                    </p>
                  </>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-primary mx-auto animate-pulse" />
                    <p className="text-primary">جاري رفع الملف...</p>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                  </div>
                )}

                {uploadStatus === 'processing' && (
                  <div className="space-y-4">
                    <RefreshCw className="h-12 w-12 text-warning mx-auto animate-spin" />
                    <p className="text-warning">جاري معالجة البيانات...</p>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="space-y-4">
                    <CheckCircle className="h-12 w-12 text-success mx-auto" />
                    <p className="text-success">تم رفع الملف بنجاح!</p>
                    <p className="text-sm text-muted-foreground">
                      تم العثور على {uploadedData.length} سجل
                    </p>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="space-y-4">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-destructive">حدث خطأ في رفع الملف</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setUploadStatus('idle')}
                    >
                      المحاولة مرة أخرى
                    </Button>
                  </div>
                )}
              </div>

              {uploadStatus === 'success' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={confirmImport}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 ml-2" />
                    {uploadType === 'bank-statement' ? 'تحليل البيانات' : 'تأكيد الاستيراد'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* معلومات النظام */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">إصدار النظام:</span>
                <Badge variant="outline">{settingsStats.systemVersion}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">آخر تحديث:</span>
                <span className="text-sm text-foreground">{settingsStats.lastUpdate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الوحدات النشطة:</span>
                <Badge variant="success">
                  {settingsStats.activeModules} وحدات
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المستخدمون النشطون:</span>
                <span className="text-sm text-foreground">{settingsStats.activeUsers} مستخدم</span>
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات الاستخدام */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-secondary-foreground" />
                إحصائيات الاستخدام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">مساحة التخزين</span>
                  <span className="text-foreground">
                    {settingsStats.storageUsed} GB / {settingsStats.storageTotal} GB
                  </span>
                </div>
                <Progress value={(settingsStats.storageUsed / settingsStats.storageTotal) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">المستخدمون النشطون</span>
                  <span className="text-foreground">{settingsStats.activeUsers} / 25</span>
                </div>
                <Progress value={(settingsStats.activeUsers / 25) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">المشاريع النشطة</span>
                  <span className="text-foreground">{activeProjects} / {projectCapacity}</span>
                </div>
                <Progress value={(activeProjects / Math.max(projectCapacity, 1)) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">المنافسات النشطة</span>
                  <span className="text-foreground">{activeTenders} / {tenderCapacity}</span>
                </div>
                <Progress value={(activeTenders / Math.max(tenderCapacity, 1)) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* إدارة البيانات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-success" />
                إدارة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleBackup}
              >
                <Database className="h-4 w-4 ml-2" />
                نسخ احتياطي
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => void handleExport()}
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير البيانات
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Globe className="h-4 w-4 ml-2" />
                مزامنة البيانات
              </Button>
              <div className="pt-2 border-t text-sm text-muted-foreground">
                <p>آخر نسخة احتياطية: {settingsStats.lastBackup}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن - الإعدادات الرئيسية */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* معاينة البيانات المستوردة */}
          {showPreview && previewData.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  معاينة البيانات - {getTypeLabel(uploadType)}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      عرض أول 5 سجلات من أصل {uploadedData.length}
                    </p>
                    <Badge variant="info">
                      {uploadedData.length} سجل
                    </Badge>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {previewData[0] && Object.keys(previewData[0]).slice(0, 6).map(key => (
                            <th key={key} className="text-right p-2 font-medium text-foreground">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(row).slice(0, 6).map((value, i) => (
                              <td key={i} className="p-2 text-foreground">
                                {formatPreviewValue(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={confirmImport} className="flex-1">
                      <Check className="h-4 w-4 ml-2" />
                      {uploadType === 'bank-statement' ? 
                        `تحليل البيانات (${uploadedData.length} معاملة)` : 
                        `تأكيد الاستيراد (${uploadedData.length} سجل)`
                      }
                    </Button>
                    <Button variant="outline" onClick={cancelImport}>
                      <X className="h-4 w-4 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* إعدادات الشركة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                معلومات الشركة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="company-name" className="text-sm font-medium">اسم الشركة</Label>
                  <Input id="company-name" defaultValue="شركة المقاولات المتطورة" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="commercial-register" className="text-sm font-medium">رقم السجل التجاري</Label>
                  <Input id="commercial-register" defaultValue="1234567890" className="ltr-numbers mt-1" />
                </div>
                <div>
                  <Label htmlFor="tax-number" className="text-sm font-medium">الرقم الضريبي</Label>
                  <Input id="tax-number" defaultValue="300012345600003" className="ltr-numbers mt-1" />
                </div>
                <div>
                  <Label htmlFor="classification" className="text-sm font-medium">تصنيف المقاولين</Label>
                  <Input id="classification" defaultValue="الدرجة الأولى" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium">العنوان</Label>
                  <Input id="address" defaultValue="شارع الملك فهد، الرياض، المملكة العربية السعودية" className="mt-1" />
                </div>
              </div>
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>

          {/* إعدادات المظهر */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-secondary-foreground" />
                إعدادات المظهر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSelector />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">الوضع الداكن</Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل المظهر الداكن لعناصر الواجهة
                    {isHighContrast && ' (غير متاح مع وضع التباين العالي)'}
                  </p>
                </div>
                <Switch 
                  id="dark-mode"
                  checked={isDark}
                  disabled={isHighContrast}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="high-contrast-mode" className="font-medium">وضع التباين العالي</Label>
                  <p className="text-sm text-muted-foreground">تعزيز التباين للأوضاع ذات الحاجة البصرية</p>
                </div>
                <Switch
                  id="high-contrast-mode"
                  checked={isHighContrast}
                  onCheckedChange={handleHighContrastToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">لغة الواجهة</Label>
                  <p className="text-sm text-muted-foreground">العربية (افتراضي)</p>
                </div>
                <Badge variant="outline">عربي</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">حجم الخط</Label>
                  <p className="text-sm text-muted-foreground">متوسط (14px)</p>
                </div>
                <Badge variant="outline">متوسط</Badge>
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الإشعارات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-warning" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_OPTIONS.map((notification) => (
                <div key={notification.key} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <Label className="font-medium">{notification.label}</Label>
                    <p className="text-sm text-muted-foreground">{notification.desc}</p>
                  </div>
                  <Switch 
                    checked={notifications[notification.key]}
                    onCheckedChange={(value) => handleNotificationChange(notification.key, value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* إعدادات الأمان */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                الأمان والخصوصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">المصادقة الثنائية</Label>
                  <p className="text-sm text-muted-foreground">حماية إضافية لحسابك</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">تسجيل الأنشطة</Label>
                  <p className="text-sm text-muted-foreground">حفظ سجل للعمليات المهمة</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="space-y-3">
                <Label className="font-medium">تغيير كلمة المرور</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="password" placeholder="كلمة المرور الحالية" />
                  <Input type="password" placeholder="كلمة المرور الجديدة" />
                </div>
                <Button variant="outline">
                  <Lock className="h-4 w-4 ml-2" />
                  تحديث كلمة المرور
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}