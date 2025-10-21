import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import { InlineAlert, type InlineAlertVariant } from '@/presentation/components/ui/inline-alert'
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Trophy,
  Plus,
  X,
  Upload,
  FileText,
  Save,
  XCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { PageLayout } from '@/presentation/components/layout/PageLayout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/presentation/components/ui/alert-dialog'
import { ExcelProcessor } from '@/shared/utils/data/excelProcessor'
import type { QuantityItem } from '../types/contracts'
import type { Tender as DataTender } from '@/data/centralData'

interface AttachmentMetadata {
  name: string
  size: number
  type?: string
  url?: string
  lastModified?: number
}

type AttachmentLike = File | AttachmentMetadata

type TenderDraft = Omit<DataTender, 'id'> & {
  id?: string
  projectDuration?: string
  description?: string
  quantities: QuantityItem[]
  attachments?: AttachmentLike[]
  createdAt?: string
}

type ExistingTender = Partial<TenderDraft>

interface NewTenderFormProps {
  onSave?: (formData: TenderDraft) => void
  onBack?: () => void
  existingTender?: ExistingTender | null
}

interface TenderFormData {
  name: string
  ownerEntity: string
  location: string
  projectDuration: string
  bookletPrice: string
  deadline: string
  type: string
  estimatedValue: string
  description: string
}

interface PointerSnapshot {
  tag: string
  id: string
  className: string
  pointerEvents: string
  dataDisabled: string | null
  ariaDisabled: string | null
  role?: string
}

interface LevelInfo {
  label: string
  status: StatusBadgeProps['status']
}

const DEBUG_LOG_DELAY_MS = 400

const generateRowId = () => Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`)

const createEmptyQuantityRow = (): QuantityItem => ({
  id: generateRowId(),
  serialNumber: '',
  unit: '',
  quantity: '',
  specifications: '',
  originalDescription: '',
  description: '',
  canonicalDescription: ''
})

const toInputString = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

const buildFormData = (tender?: ExistingTender | null): TenderFormData => ({
  name: tender?.name ?? tender?.title ?? '',
  ownerEntity: tender?.client ?? '',
  location: tender?.location ?? '',
  projectDuration: tender?.projectDuration ?? '',
  bookletPrice: toInputString(tender?.bookletPrice ?? tender?.documentPrice ?? ''),
  deadline: tender?.deadline ?? '',
  type: tender?.type ?? '',
  estimatedValue: toInputString(tender?.totalValue ?? tender?.value ?? ''),
  description: tender?.description ?? ''
})

const createQuantitiesState = (tender?: ExistingTender | null): QuantityItem[] => {
  if (tender?.quantities && tender.quantities.length > 0) {
    return tender.quantities.map((row, index) => ({
      id: typeof row.id === 'number' ? row.id : generateRowId() + index,
      serialNumber: row.serialNumber ?? '',
      unit: row.unit ?? '',
      quantity: row.quantity ?? '',
      specifications: row.specifications ?? '',
      originalDescription: row.originalDescription ?? '',
      description: row.description ?? '',
      canonicalDescription: row.canonicalDescription ?? ''
    }))
  }
  return [createEmptyQuantityRow()]
}

const createInitialAttachments = (tender?: ExistingTender | null): AttachmentLike[] => {
  if (!tender?.attachments) {
    return []
  }
  return tender.attachments.map((item) => (item instanceof File ? item : { ...item }))
}

const calculateDaysRemaining = (deadline: string): number => {
  if (!deadline) {
    return 0
  }
  const deadlineDate = new Date(deadline)
  if (Number.isNaN(deadlineDate.getTime())) {
    return 0
  }
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const parseNumericValue = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const normalized = trimmed.replace(/,/g, '')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

const computeUrgencyInfo = (daysRemaining: number): LevelInfo => {
  if (daysRemaining <= 7) {
    return { label: 'عاجل جداً', status: 'overdue' }
  }
  if (daysRemaining <= 15) {
    return { label: 'عاجل', status: 'dueSoon' }
  }
  if (daysRemaining <= 30) {
    return { label: 'متوسط', status: 'info' }
  }
  return { label: 'عادي', status: 'success' }
}

const computeCompetitionInfo = (estimatedValue: number | null): LevelInfo => {
  if (estimatedValue === null) {
    return { label: 'غير محدد', status: 'default' }
  }
  if (estimatedValue >= 5_000_000) {
    return { label: 'منافسة عالية', status: 'error' }
  }
  if (estimatedValue >= 1_000_000) {
    return { label: 'منافسة متوسطة', status: 'warning' }
  }
  return { label: 'منافسة قليلة', status: 'success' }
}

const STATUS_SEVERITY: Partial<Record<StatusBadgeProps['status'], number>> = {
  overdue: 5,
  error: 5,
  overBudget: 5,
  dueSoon: 4,
  warning: 4,
  nearBudget: 4,
  info: 3,
  onTrack: 3,
  onBudget: 3,
  notStarted: 2,
  default: 2,
  success: 1,
  completed: 1,
  underBudget: 1,
}

const STATUS_TO_ALERT_VARIANT: Partial<Record<StatusBadgeProps['status'], InlineAlertVariant>> = {
  overdue: 'destructive',
  error: 'destructive',
  overBudget: 'destructive',
  dueSoon: 'warning',
  warning: 'warning',
  nearBudget: 'warning',
  info: 'info',
  onTrack: 'info',
  onBudget: 'info',
  notStarted: 'neutral',
  default: 'neutral',
  success: 'success',
  completed: 'success',
  underBudget: 'success',
}

const resolveAlertVariant = (status?: StatusBadgeProps['status']): InlineAlertVariant => {
  return STATUS_TO_ALERT_VARIANT[status ?? 'default'] ?? 'info'
}

const resolveSeverity = (status?: StatusBadgeProps['status']): number => {
  return STATUS_SEVERITY[status ?? 'default'] ?? 2
}

const formatCurrency = (amount: number): string => new Intl.NumberFormat('ar-SA', {
  style: 'currency',
  currency: 'SAR'
}).format(amount)

export function NewTenderForm({ onSave, onBack, existingTender }: NewTenderFormProps) {
  const [formData, setFormData] = useState<TenderFormData>(() => buildFormData(existingTender))
  const [quantities, setQuantities] = useState<QuantityItem[]>(() => createQuantitiesState(existingTender))
  const [attachments, setAttachments] = useState<AttachmentLike[]>(() => createInitialAttachments(existingTender))
  const [isLoading, setIsLoading] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const excelInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setFormData(buildFormData(existingTender))
    setQuantities(createQuantitiesState(existingTender))
    setAttachments(createInitialAttachments(existingTender))
  }, [existingTender])

  const isDebugMode = process.env.NODE_ENV !== 'production'

  useEffect(() => {
    if (!isDebugMode || typeof window === 'undefined') {
      return undefined
    }

    const options: AddEventListenerOptions = { capture: true }
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.id === 'name' && event.key.length === 1) {
        console.debug('[NewTenderForm][debug] Key received in #name input:', event.key)
      }
    }

    window.addEventListener('keydown', handleKeydown, options)
    return () => {
      window.removeEventListener('keydown', handleKeydown, options)
    }
  }, [isDebugMode])

  useEffect(() => {
    if (!isDebugMode || typeof window === 'undefined') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      try {
        const input = document.getElementById('name') as HTMLInputElement | null
        if (!input) {
          return
        }

        const pointerChain: PointerSnapshot[] = []
        let element: HTMLElement | null = input

        while (element) {
          const computedStyle = window.getComputedStyle(element)
          pointerChain.push({
            tag: element.tagName,
            id: element.id,
            className: element.className,
            pointerEvents: computedStyle.pointerEvents,
            dataDisabled: element.getAttribute('data-disabled'),
            ariaDisabled: element.getAttribute('aria-disabled'),
            role: element.getAttribute('role') ?? undefined
          })
          element = element.parentElement
        }

        console.groupCollapsed('[NewTenderForm][debug] Pointer-events ancestry for #name')
        console.table(pointerChain)
        console.groupEnd()

        const potentialLayers = Array.from(
          document.querySelectorAll('[data-radix-portal], [role="dialog"], [role="alertdialog"]')
        ).filter((node): node is HTMLElement => {
          return node instanceof HTMLElement && window.getComputedStyle(node).display !== 'none'
        })

        console.debug('[NewTenderForm][debug] Potential active portal layers:', potentialLayers.length, potentialLayers)

        const coveringLayers = potentialLayers.filter((node) => {
          const rect = node.getBoundingClientRect()
          const occupiesViewport = rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8
          const hasPointerEvents = window.getComputedStyle(node).pointerEvents !== 'none'
          return occupiesViewport && hasPointerEvents
        })

        if (coveringLayers.length > 0) {
          console.warn('[NewTenderForm][debug] Large overlay(s) detected that might block interaction:', coveringLayers)
        }
      } catch (error) {
        console.warn('[NewTenderForm][debug] Diagnostics error:', error)
      }
    }, DEBUG_LOG_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isDebugMode])

  const handleInputChange = useCallback((field: keyof TenderFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const addQuantityRow = useCallback(() => {
    setQuantities((prev) => [...prev, createEmptyQuantityRow()])
  }, [])

  const removeQuantityRow = useCallback((id: number) => {
    setQuantities((prev) => {
      if (prev.length <= 1) {
        return prev
      }
      return prev.filter((row) => row.id !== id)
    })
  }, [])

  const handleQuantityChange = useCallback((id: number, field: keyof QuantityItem, value: string) => {
    setQuantities((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }, [])

  const handleExcelImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.currentTarget
    const file = inputElement.files?.[0]
    if (!file) {
      return
    }

    try {
      setIsLoading(true)
      console.log('بدء معالجة الملف:', file.name)

      const processedData = await ExcelProcessor.processExcelFile(file)

      if (processedData.length > 0) {
        console.log(`تم معالجة ${processedData.length} صف بنجاح`)
        setQuantities(processedData)
        alert(`تم استيراد ${processedData.length} صف بنجاح!`)
      } else {
        console.warn('لم يتم العثور على بيانات صالحة في الملف')
        alert('لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة: الرقم، الوحدة، الكمية، المواصفات')
      }
    } catch (error) {
      console.error('خطأ في معالجة الملف:', error)
      alert('حدث خطأ أثناء معالجة الملف. تأكد من تنسيق البيانات.')
    } finally {
      setIsLoading(false)
      inputElement.value = ''
    }
  }, [])

  const handleExcelInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleExcelImport(event)
    },
    [handleExcelImport]
  )

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) {
      return
    }

    const acceptedFiles = Array.from(files).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`الملف ${file.name} كبير جداً. الحد الأقصى 10 ميجابايت.`)
        return false
      }
      return true
    })

    setAttachments((prev) => {
      const existing = new Set(prev.map((item) => `${item.name}-${item.size}`))
      const deduped = acceptedFiles.filter((file) => !existing.has(`${file.name}-${file.size}`))
      return [...prev, ...deduped]
    })
  }, [])

  const handleAttachmentInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFileUpload(event.currentTarget.files)
      event.currentTarget.value = ''
    },
    [handleFileUpload]
  )

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }, [])

  const openExcelImport = useCallback(() => {
    excelInputRef.current?.click()
  }, [])

  const openAttachmentDialog = useCallback(() => {
    attachmentInputRef.current?.click()
  }, [])

  const daysRemaining = useMemo(() => calculateDaysRemaining(formData.deadline), [formData.deadline])
  const urgencyInfo = useMemo(() => computeUrgencyInfo(daysRemaining), [daysRemaining])
  const parsedEstimatedValue = useMemo(() => parseNumericValue(formData.estimatedValue), [formData.estimatedValue])
  const competitionInfo = useMemo(() => computeCompetitionInfo(parsedEstimatedValue), [parsedEstimatedValue])
  const formattedEstimatedValue = useMemo(
    () => formatCurrency(parsedEstimatedValue ?? 0),
    [parsedEstimatedValue]
  )
  const tenderInsightsAlert = useMemo(() => {
    if (!formData.deadline && !formData.estimatedValue) {
      return null
    }

    const notes: string[] = []
    const statuses: StatusBadgeProps['status'][] = []

    if (formData.deadline) {
      statuses.push(urgencyInfo.status)
      notes.push(`الموعد النهائي بعد ${daysRemaining} أيام (${urgencyInfo.label}).`)
    }

    if (formData.estimatedValue) {
      statuses.push(competitionInfo.status)
      notes.push(`القيمة التقديرية ${formattedEstimatedValue} (${competitionInfo.label}).`)
    }

    const dominantStatus = statuses.reduce<StatusBadgeProps['status'] | null>((current, status) => {
      if (!current) {
        return status
      }
      return resolveSeverity(status) > resolveSeverity(current) ? status : current
    }, null)

    return {
      variant: resolveAlertVariant(dominantStatus),
      title: 'مؤشرات المنافسة',
      description: notes.join(' '),
    }
  }, [competitionInfo, daysRemaining, formData.deadline, formData.estimatedValue, formattedEstimatedValue, urgencyInfo])

  const isFormValid = useMemo(() => {
    const requiredFields = [
      formData.name,
      formData.ownerEntity,
      formData.location,
      formData.projectDuration,
      formData.bookletPrice,
      formData.deadline
    ]
    return requiredFields.every((field) => field.trim().length > 0)
  }, [formData])

  const handleSave = useCallback(async () => {
    setIsLoading(true)

    try {
      const trimmedName = formData.name.trim()
      const ownerEntity = formData.ownerEntity.trim()
      const locationValue = formData.location.trim()
      const typeInput = formData.type.trim()
      const resolvedType = typeInput.length > 0 ? typeInput : existingTender?.type ?? 'مناقصة عامة'
      const projectDurationInput = formData.projectDuration.trim()
      const resolvedProjectDuration = projectDurationInput.length > 0 ? projectDurationInput : existingTender?.projectDuration
      const descriptionInput = formData.description.trim()
      const resolvedDescription = descriptionInput.length > 0 ? descriptionInput : existingTender?.description

      const estimatedValue = parseNumericValue(formData.estimatedValue) ?? existingTender?.value ?? 0
      const existingDocumentPrice = parseNumericValue(existingTender?.documentPrice ?? existingTender?.bookletPrice ?? null)
      const documentPriceValue = parseNumericValue(formData.bookletPrice) ?? existingDocumentPrice ?? 0
      const bookletPriceInput = formData.bookletPrice.trim()
      const resolvedBookletPrice = bookletPriceInput.length > 0 ? bookletPriceInput : existingTender?.bookletPrice

      const normalizedQuantities = quantities.map((row, index) => {
        const sanitizedSerial = row.serialNumber ?? String(index + 1)
        const sanitizedUnit = row.unit ?? ''
        const sanitizedQuantity = row.quantity ?? ''
        const sanitizedSpecs = row.specifications ?? ''

        const descriptionCandidates = [
          row.description?.trim(),
          sanitizedSpecs.trim(),
          row.originalDescription?.trim()
        ].filter((value): value is string => Boolean(value && value.length > 0))

        const resolvedDescriptionText = descriptionCandidates[0] ?? ''
        const normalizedDescription = resolvedDescriptionText.length > 0 ? resolvedDescriptionText : ''
        const normalizedOriginal = row.originalDescription?.trim()
        const normalizedCanonical = row.canonicalDescription?.trim()
        const fallbackDescription = normalizedDescription.length > 0 ? normalizedDescription : undefined

        return {
          ...row,
          id: row.id ?? generateRowId() + index,
          serialNumber: sanitizedSerial,
          unit: sanitizedUnit,
          quantity: sanitizedQuantity,
          specifications: sanitizedSpecs,
          description: normalizedDescription,
          originalDescription:
            normalizedOriginal && normalizedOriginal.length > 0 ? normalizedOriginal : fallbackDescription,
          canonicalDescription:
            normalizedCanonical && normalizedCanonical.length > 0 ? normalizedCanonical : fallbackDescription
        }
      })

      const tenderData: TenderDraft = {
        ...(existingTender?.id ? { id: existingTender.id } : { id: `TND-${Date.now()}` }),
        name: trimmedName,
        title: trimmedName,
        client: ownerEntity,
        value: estimatedValue,
        totalValue: estimatedValue,
        documentPrice: documentPriceValue,
        bookletPrice: resolvedBookletPrice,
        status: existingTender?.status ?? 'new',
        phase: existingTender?.phase ?? 'تحضير',
        deadline: formData.deadline,
        daysLeft: calculateDaysRemaining(formData.deadline),
        progress: existingTender?.progress ?? 0,
        priority: existingTender?.priority ?? 'medium',
        team: existingTender?.team ?? 'فريق المنافسات',
        manager: existingTender?.manager ?? 'مدير المشاريع',
        winChance: existingTender?.winChance ?? 50,
        competition: existingTender?.competition ?? 'منافسة عادية',
        submissionDate: formData.deadline,
        lastAction: existingTender ? 'تم تحديث المنافسة' : 'تم إنشاء المنافسة',
        lastUpdate: new Date().toISOString(),
        category: existingTender?.category ?? 'مقاولات عامة',
        location: locationValue,
        type: resolvedType,
        projectDuration: resolvedProjectDuration,
        description: resolvedDescription,
        createdAt: existingTender?.createdAt ?? new Date().toISOString(),
        quantities: normalizedQuantities,
        attachments,
        totalItems: existingTender?.totalItems ?? normalizedQuantities.length,
        itemsPriced: existingTender?.itemsPriced,
        pricedItems: existingTender?.pricedItems,
        completionPercentage: existingTender?.completionPercentage,
        technicalFilesUploaded: existingTender?.technicalFilesUploaded,
        resultNotes: existingTender?.resultNotes,
        winningBidValue: existingTender?.winningBidValue,
        ourBidValue: existingTender?.ourBidValue,
        winDate: existingTender?.winDate,
        lostDate: existingTender?.lostDate,
        resultDate: existingTender?.resultDate,
        cancelledDate: existingTender?.cancelledDate
      }

      await onSave?.(tenderData)
      setSaveDialogOpen(false)
    } catch (error) {
      console.error('خطأ في الحفظ:', error)
      alert('حدث خطأ أثناء حفظ البيانات')
    } finally {
      setIsLoading(false)
    }
  }, [attachments, existingTender, formData, onSave, quantities])

  const quickActions = useMemo(
    () => [
      {
        label: existingTender ? 'حفظ التغييرات' : 'حفظ المنافسة',
        icon: Save,
        onClick: () => {
          void handleSave()
        },
        variant: 'default' as const,
        primary: true
      },
      {
        label: 'العودة للقائمة',
        icon: ArrowRight,
        onClick: () => onBack?.(),
        variant: 'outline' as const
      },
      {
        label: 'حفظ كمسودة',
        icon: FileText,
        onClick: () => {
          void handleSave()
        },
        variant: 'outline' as const
      },
      {
        label: 'استيراد من ملف',
        icon: Upload,
        onClick: openExcelImport,
        variant: 'outline' as const
      }
    ],
    [existingTender, handleSave, onBack, openExcelImport]
  )

  return (
    <PageLayout
      tone="primary"
      title={existingTender ? "تحرير المنافسة" : "منافسة جديدة"}
      description={existingTender ? "تعديل بيانات المنافسة الموجودة" : "إضافة منافسة جديدة وإعداد البيانات المطلوبة"}
      icon={Trophy}
      quickStats={[]}
      quickActions={quickActions}
      onBack={onBack}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* العمود الأيسر - النموذج الرئيسي */}
        <div className="xl:col-span-2 space-y-6">

          {/* بطاقة معلومات المنافسة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                معلومات المنافسة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* الخانات الإلزامية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* اسم المنافسة - إلزامي */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                    اسم المنافسة
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="أدخل اسم المنافسة"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>

                {/* الجهة المالكة - إلزامي */}
                <div className="space-y-2">
                  <Label htmlFor="ownerEntity" className="text-sm font-medium flex items-center gap-1">
                    الجهة المالكة
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ownerEntity"
                    placeholder="أدخل اسم الجهة المالكة"
                    value={formData.ownerEntity}
                    onChange={(e) => handleInputChange('ownerEntity', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>

                {/* موقع التنفيذ - إلزامي */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    موقع التنفيذ
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="أدخل موقع تنفيذ المشروع"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>

                {/* مدة المشروع - إلزامي */}
                <div className="space-y-2">
                  <Label htmlFor="projectDuration" className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    مدة المشروع
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="projectDuration"
                    placeholder="مثال: 12 شهر"
                    value={formData.projectDuration}
                    onChange={(e) => handleInputChange('projectDuration', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>

                {/* سعر الكراسة - إلزامي */}
                <div className="space-y-2">
                  <Label htmlFor="bookletPrice" className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    سعر الكراسة
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bookletPrice"
                    type="number"
                    placeholder="0.00"
                    value={formData.bookletPrice}
                    onChange={(e) => handleInputChange('bookletPrice', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>

                {/* الموعد النهائي للتقديم - إلزامي */}
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    الموعد النهائي للتقديم
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
              </div>

              {/* الحقول الاختيارية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">نوع المنافسة</Label>
                  <Input
                    id="type"
                    placeholder="مثال: إنشاءات، صيانة، توريدات"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">القيمة المتوقعة</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    placeholder="القيمة التقديرية بالريال السعودي"
                    value={formData.estimatedValue}
                    onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف المنافسة</Label>
                <Textarea
                  id="description"
                  placeholder="وصف مفصل للمنافسة والنطاق المطلوب"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="bg-background"
                />
              </div>

              {/* تحليل المواعيد والقيمة */}
              {(formData.deadline || formData.estimatedValue) && (
                <div className="mt-4 space-y-3">
                  {tenderInsightsAlert && (
                    <InlineAlert
                      variant={tenderInsightsAlert.variant}
                      title={tenderInsightsAlert.title}
                      description={tenderInsightsAlert.description}
                    />
                  )}
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h4 className="mb-3 font-medium text-foreground">تحليل سريع</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                      {formData.deadline && (
                        <div>
                          <span className="text-muted-foreground">الأيام المتبقية:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-warning">{daysRemaining} أيام</span>
                            <StatusBadge
                              status={urgencyInfo.status}
                              label={urgencyInfo.label}
                              size="sm"
                              showIcon={false}
                              className="shadow-none"
                            />
                          </div>
                        </div>
                      )}
                      {formData.estimatedValue && (
                        <>
                          <div>
                            <span className="text-muted-foreground">مستوى المنافسة:</span>
                            <StatusBadge
                              status={competitionInfo.status}
                              label={competitionInfo.label}
                              size="sm"
                              showIcon={false}
                              className="shadow-none"
                            />
                          </div>
                          <div>
                            <span className="text-muted-foreground">القيمة المنسقة:</span>
                            <div className="font-medium text-success">{formattedEstimatedValue}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* بطاقة جداول الكميات */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                جداول الكميات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* أزرار إدارة الجدول */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  onClick={addQuantityRow}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة صف
                </Button>

                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={openExcelImport}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4" />
                    {isLoading ? 'جاري المعالجة...' : 'استيراد من Excel/CSV'}
                  </Button>
                  <input
                    id="excel-import"
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    ref={excelInputRef}
                    onChange={handleExcelInputChange}
                    className="hidden"
                    title="استيراد ملف Excel أو CSV"
                    placeholder="اختر ملف للاستيراد"
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                يدعم: Excel (.xlsx, .xls), CSV, TSV, TXT (الأعمدة المتوقعة: رقم، وحدة، كمية، مواصفات)
              </p>

              {/* جدول الكميات */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-3 text-right">الرقم التسلسلي</th>
                      <th className="border p-3 text-right">الوحدة</th>
                      <th className="border p-3 text-right">الكمية</th>
                      <th className="border p-3 text-right">المواصفات</th>
                      <th className="border p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quantities.map((row, index) => (
                      <tr key={row.id}>
                        <td className="border p-2">
                          <Input
                            value={row.serialNumber}
                            onChange={(e) => handleQuantityChange(row.id, 'serialNumber', e.target.value)}
                            placeholder={`${index + 1}`}
                            className="bg-background"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            value={row.unit}
                            onChange={(e) => handleQuantityChange(row.id, 'unit', e.target.value)}
                            placeholder="متر، م²، قطعة"
                            className="bg-background"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(row.id, 'quantity', e.target.value)}
                            placeholder="الكمية"
                            type="number"
                            className="bg-background"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            value={row.specifications}
                            onChange={(e) => handleQuantityChange(row.id, 'specifications', e.target.value)}
                            placeholder="المواصفات والتفاصيل"
                            className="bg-background"
                          />
                        </td>
                        <td className="border p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuantityRow(row.id)}
                            disabled={quantities.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة المرفقات */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Upload className="h-6 w-6 text-primary" />
                المرفقات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* منطقة رفع الملفات */}
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">اسحب الملفات هنا أو</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openAttachmentDialog}
                >
                  اختر الملفات
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  ref={attachmentInputRef}
                  onChange={handleAttachmentInputChange}
                  className="hidden"
                  title="اختيار مرفقات"
                  placeholder="اختر ملفات للرفع"
                />
              </div>

              {/* قائمة المرفقات */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">الملفات المرفقة:</h4>
                  <div className="space-y-2">
                    {attachments.map((file, index) => {
                      const attachmentKey = `${file.name}-${file.size}-${index}`
                      return (
                        <div
                          key={attachmentKey}
                          className="flex items-center justify-between rounded bg-muted/40 p-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex justify-between items-center">
            {/* زر الإلغاء والعودة */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="px-6"
              onClick={onBack}
            >
              <XCircle className="h-5 w-5 mr-2" />
              إلغاء والعودة
            </Button>

            {/* زر الحفظ */}
            <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="px-8"
                  disabled={!isFormValid || isLoading}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isLoading ? 'جاري الحفظ...' : 'حفظ المنافسة'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحفظ</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل تريد حفظ بيانات المنافسة؟ سيتم حفظ جميع المعلومات المدخلة.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      void handleSave()
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري الحفظ...' : 'نعم، احفظ'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* العمود الأيمن - المعلومات المساعدة */}
        <div className="space-y-6">

          {/* قائمة المراجعة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                قائمة المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { item: 'اسم المنافسة', completed: !!formData.name, required: true },
                { item: 'الجهة المالكة', completed: !!formData.ownerEntity, required: true },
                { item: 'موقع التنفيذ', completed: !!formData.location, required: true },
                { item: 'مدة المشروع', completed: !!formData.projectDuration, required: true },
                { item: 'سعر الكراسة', completed: !!formData.bookletPrice, required: true },
                { item: 'الموعد النهائي', completed: !!formData.deadline, required: true },
                { item: 'نوع المنافسة', completed: !!formData.type, required: false },
                { item: 'القيمة المتوقعة', completed: !!formData.estimatedValue, required: false },
                { item: 'وصف المنافسة', completed: !!formData.description, required: false },
                { item: 'جداول الكميات', completed: quantities.some(q => q.specifications), required: false },
                { item: 'المرفقات', completed: attachments.length > 0, required: false }
              ].map((check, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    check.completed ? 'border-success bg-success' :
                    check.required ? 'border-destructive/40' : 'border-border/60'
                  }`}>
                    {check.completed && <div className="h-2 w-2 rounded-full bg-success-foreground" />}
                  </div>
                  <span className={`text-sm ${
                    check.completed ? 'text-foreground' :
                    check.required ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {check.item}
                    {check.required && <span className="ml-1 text-destructive">*</span>}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

