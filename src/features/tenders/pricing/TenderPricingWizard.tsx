import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import type { Tender } from '@/data/centralData'
import { useFinancialState, useNavigation } from '@/application/context'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Separator } from '@/presentation/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/presentation/components/ui/dialog'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Target,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { formatDateValue } from '@/utils/formatters'
import { RiskAssessmentMatrix } from '../../../components/bidding/RiskAssessmentMatrix'
import type { RiskAssessment } from '../../../types/templates'

type WizardStepId = 'registration' | 'technical' | 'financial' | 'review' | 'submit'

interface WizardStep {
  id: WizardStepId
  title: string
  description: string
  icon: ReactNode
}

interface ChecklistItem {
  key: string
  label: string
  description?: string
}

interface TenderPricingWizardDraft {
  tenderId: string
  updatedAt: string | null
  completedSteps: Partial<Record<WizardStepId, boolean>>
  registration: {
    form: {
      name: string
      client: string
      deadline: string
      type: string
      estimatedValue: string
    }
    notes: string
    lastSavedAt: string | null
  }
  technical: {
    uploadedFiles: string[]
    checklist: Record<string, boolean>
    notes: string
    lastSavedAt: string | null
  }
  financial: {
    strategy: 'boq' | 'lump-sum' | 'hybrid'
    profitMargin: number | null
    vatIncluded: boolean
    riskLevel: 'low' | 'medium' | 'high'
    riskAssessment: RiskAssessment | null
    checklist: Record<string, boolean>
    notes: string
    lastSavedAt: string | null
  }
  review: {
    comments: string
    notifyTeam: boolean
    readyForSubmission: boolean
  }
}

interface TenderPricingWizardProps {
  tender?: Tender | null
  onExit?: () => void
}

type AutoSaveState = 'idle' | 'saving' | 'saved' | 'error'

const AUTO_SAVE_BADGE_STATUS: Record<AutoSaveState, StatusBadgeProps['status']> = {
  idle: 'info',
  saving: 'info',
  saved: 'success',
  error: 'error',
}

const UPLOAD_BADGE_META = {
  completed: { status: 'success' as StatusBadgeProps['status'], label: 'مكتمل' },
  pending: { status: 'warning' as StatusBadgeProps['status'], label: 'بانتظار' },
}

const CHECKLIST_BADGE_META = {
  completed: { status: 'success' as StatusBadgeProps['status'], label: 'مكتمل' },
  incomplete: { status: 'warning' as StatusBadgeProps['status'], label: 'غير مكتمل' },
}

const STRATEGY_BADGE_META: Record<
  TenderPricingWizardDraft['financial']['strategy'],
  { status: StatusBadgeProps['status']; label: string }
> = {
  boq: { status: 'info', label: 'جداول الكميات (BoQ)' },
  'lump-sum': { status: 'success', label: 'عقد مقطوعية' },
  hybrid: { status: 'warning', label: 'استراتيجية هجينة' },
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'registration',
    title: 'التسجيل',
    description: 'تأكيد البيانات الأساسية للمنافسة قبل البدء في التسعير',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    id: 'technical',
    title: 'الملفات الفنية',
    description: 'رفع الملفات والتحقق من استكمال المتطلبات الفنية',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'financial',
    title: 'الملفات المالية',
    description: 'مراجعة استراتيجية التسعير وتأكيد النسب والمؤشرات',
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: 'review',
    title: 'المراجعة',
    description: 'تلخيص الحالة وتأكيد الجاهزية قبل الإرسال',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'submit',
    title: 'الإرسال',
    description: 'إرسال المنافسة واعتماد السجل النهائي',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
]

const TECHNICAL_CHECKLIST: ChecklistItem[] = [
  {
    key: 'specsReviewed',
    label: 'مراجعة المواصفات الفنية',
    description: 'تم التحقق من مطابقة نطاق العمل وجداول الكميات للمتطلبات',
  },
  {
    key: 'complianceConfirmed',
    label: 'اكتمال نماذج المطابقة',
    description: 'تم تجهيز نماذج الامتثال والتوقيعات المطلوبة',
  },
  {
    key: 'approvalsCollected',
    label: 'توثيق الموافقات الداخلية',
    description: 'حصلت المنافسة على موافقة الجهات الفنية الداخلية',
  },
]

const FINANCIAL_CHECKLIST: ChecklistItem[] = [
  {
    key: 'pricingDataImported',
    label: 'استيراد بيانات التسعير',
    description: 'تم استيراد/تجهيز بنود الأسعار النهائية',
  },
  {
    key: 'totalsReconciled',
    label: 'مطابقة الإجماليات',
    description: 'تم التحقق من اتساق الإجماليات مع التقارير المالية',
  },
  {
    key: 'approvalsSecured',
    label: 'الموافقات المالية',
    description: 'تم أخذ الموافقات النهائية على استراتيجية التسعير',
  },
]

type DraftMap = Record<string, TenderPricingWizardDraft>

async function loadDraftMap(): Promise<DraftMap> {
  return await loadFromStorage<DraftMap>(STORAGE_KEYS.TENDER_PRICING_WIZARDS, {})
}

async function persistDraftMap(nextMap: DraftMap): Promise<void> {
  await saveToStorage(STORAGE_KEYS.TENDER_PRICING_WIZARDS, nextMap)
}

async function persistDraft(tenderId: string, draft: TenderPricingWizardDraft): Promise<void> {
  const map = await loadDraftMap()
  const nextMap: DraftMap = { ...map, [tenderId]: draft }
  await persistDraftMap(nextMap)
}

async function clearDraft(tenderId: string): Promise<void> {
  const map = await loadDraftMap()
  if (!(tenderId in map)) {
    return
  }
  const { [tenderId]: _removed, ...rest } = map
  await persistDraftMap(rest)
}

function createDefaultDraft(tenderId: string, tender: Tender | null): TenderPricingWizardDraft {
  const estimatedValue =
    typeof tender?.totalValue === 'number'
      ? tender.totalValue
      : typeof tender?.value === 'number'
        ? tender.value
        : null

  return {
    tenderId,
    updatedAt: null,
    completedSteps: {},
    registration: {
      form: {
        name: tender?.name ?? tender?.title ?? '',
        client: tender?.client ?? '',
        deadline: tender?.deadline ?? '',
        type: tender?.type ?? '',
        estimatedValue: estimatedValue !== null ? String(estimatedValue) : '',
      },
      notes: '',
      lastSavedAt: null,
    },
    technical: {
      uploadedFiles: [],
      checklist: {
        specsReviewed: tender?.technicalFilesUploaded ?? false,
        complianceConfirmed: false,
        approvalsCollected: false,
      },
      notes: '',
      lastSavedAt: null,
    },
    financial: {
      strategy: 'boq',
      profitMargin: 15,
      vatIncluded: true,
      riskLevel: 'medium',
      riskAssessment: null,
      checklist: {
        pricingDataImported: false,
        totalsReconciled: false,
        approvalsSecured: false,
      },
      notes: '',
      lastSavedAt: null,
    },
    review: {
      comments: '',
      notifyTeam: true,
      readyForSubmission: false,
    },
  }
}

function formatDate(date: string | null): string {
  if (!date) {
    return '—'
  }
  return formatDateValue(date, { locale: 'ar-SA' }, date)
}

function isChecklistComplete(checklist: Record<string, boolean>): boolean {
  return Object.values(checklist).every(Boolean)
}

function getStepStatus(
  draft: TenderPricingWizardDraft | null,
  stepId: WizardStepId,
): 'pending' | 'current' | 'done' {
  if (!draft) {
    return 'pending'
  }
  return draft.completedSteps[stepId] ? 'done' : 'pending'
}

function StepIndicator({
  steps,
  activeStep,
  draft,
  onStepClick,
}: {
  steps: WizardStep[]
  activeStep: WizardStepId
  draft: TenderPricingWizardDraft | null
  onStepClick: (stepId: WizardStepId) => void
}) {
  return (
    <ol className="grid gap-4 sm:grid-cols-5">
      {steps.map((step, index) => {
        const status = getStepStatus(draft, step.id)
        const isCurrent = step.id === activeStep
        const isClickable =
          status === 'done' || index <= steps.findIndex((s) => s.id === activeStep)
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              className={`group flex w-full flex-col items-start gap-2 rounded-xl border p-4 text-right transition shadow-sm ${
                isCurrent
                  ? 'border-primary bg-primary/5'
                  : status === 'done'
                    ? 'border-success/30 bg-success/10'
                    : 'border-border bg-card'
              } ${isClickable ? 'hover:border-primary/40 hover:bg-primary/10' : 'cursor-not-allowed opacity-60'}`}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={`rounded-full border p-2 ${
                    status === 'done'
                      ? 'border-success/40 bg-success/10 text-success'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {step.icon}
                </div>
                {status === 'done' && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-card-foreground">{step.title}</span>
                <span className="text-xs text-muted-foreground leading-5">{step.description}</span>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function TenderPricingWizard({ tender, onExit }: TenderPricingWizardProps) {
  const { navigate, params } = useNavigation()
  const { tenders: tendersState } = useFinancialState()
  const { tenders, updateTender, refreshTenders } = tendersState
  const { formatCurrencyValue } = useCurrencyFormatter()

  const [selectedTenderId, setSelectedTenderId] = useState<string>(
    () => tender?.id ?? params.tenderId ?? '',
  )
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [draft, setDraft] = useState<TenderPricingWizardDraft | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(false)
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>('idle')
  const [isSavingRegistration, setIsSavingRegistration] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [riskAssessmentOpen, setRiskAssessmentOpen] = useState(false)
  const skipNextAutoSaveRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activeStepId = WIZARD_STEPS[activeStepIndex]?.id ?? 'registration'

  const activeTender = useMemo(() => {
    if (!selectedTenderId) {
      return tender ?? null
    }
    const match = tenders.find((item) => item.id === selectedTenderId)
    if (match) {
      return match
    }
    if (tender?.id === selectedTenderId) {
      return tender
    }
    return null
  }, [selectedTenderId, tenders, tender])

  useEffect(() => {
    if (!selectedTenderId && tender?.id) {
      setSelectedTenderId(tender.id)
    }
  }, [selectedTenderId, tender?.id])

  useEffect(() => {
    if (!selectedTenderId) {
      return
    }
    if (params.tenderId === selectedTenderId) {
      return
    }
    navigate('tender-pricing-wizard', {
      tender: activeTender ?? undefined,
      params: { tenderId: selectedTenderId },
    })
  }, [selectedTenderId, params.tenderId, navigate, activeTender])

  useEffect(() => {
    if (!selectedTenderId) {
      setDraft(null)
      return
    }

    let cancelled = false
    setIsDraftLoading(true)

    void (async () => {
      try {
        const map = await loadDraftMap()
        const stored = map[selectedTenderId]
        const baseDraft =
          stored ?? createDefaultDraft(selectedTenderId, activeTender ?? tender ?? null)
        if (!cancelled) {
          skipNextAutoSaveRef.current = true
          setDraft(baseDraft)
        }
      } catch (error) {
        console.error('[TenderPricingWizard] فشل تحميل مسودة المعالج', error)
        if (!cancelled) {
          skipNextAutoSaveRef.current = true
          setDraft(createDefaultDraft(selectedTenderId, activeTender ?? tender ?? null))
        }
      } finally {
        if (!cancelled) {
          setIsDraftLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedTenderId, activeTender, tender])

  useEffect(() => {
    if (!draft || !selectedTenderId || isDraftLoading) {
      return
    }
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false
      return
    }

    setAutoSaveState('saving')
    const timer = window.setTimeout(() => {
      void persistDraft(selectedTenderId, draft)
        .then(() => setAutoSaveState('saved'))
        .catch((error) => {
          console.error('[TenderPricingWizard] فشل الحفظ التلقائي', error)
          setAutoSaveState('error')
        })
    }, 600)

    return () => window.clearTimeout(timer)
  }, [draft, selectedTenderId, isDraftLoading])

  const updateDraftState = useCallback(
    (updater: (current: TenderPricingWizardDraft) => TenderPricingWizardDraft) => {
      setDraft((prev) => {
        if (!prev) {
          return prev
        }
        const next = updater(prev)
        return {
          ...next,
          updatedAt: new Date().toISOString(),
        }
      })
    },
    [],
  )

  const markStepCompleted = useCallback(
    (stepId: WizardStepId) => {
      updateDraftState((current) => ({
        ...current,
        completedSteps: {
          ...current.completedSteps,
          [stepId]: true,
        },
      }))
    },
    [updateDraftState],
  )

  const handleRegistrationFieldChange = useCallback(
    (field: keyof TenderPricingWizardDraft['registration']['form'], value: string) => {
      updateDraftState((current) => ({
        ...current,
        registration: {
          ...current.registration,
          form: {
            ...current.registration.form,
            [field]: value,
          },
        },
      }))
    },
    [updateDraftState],
  )

  const handleRegistrationNext = useCallback(async (): Promise<boolean> => {
    if (!draft || !activeTender) {
      toast.error('يرجى اختيار المنافسة المراد تسعيرها أولاً')
      return false
    }
    const { name, client, deadline, type, estimatedValue } = draft.registration.form
    if (!name || !client || !deadline) {
      toast.error('يرجى إكمال الحقول الإلزامية (الاسم، الجهة، الموعد النهائي)')
      return false
    }
    setIsSavingRegistration(true)
    try {
      const parsedValue = estimatedValue ? Number(estimatedValue) : undefined
      const nextTender: Tender = {
        ...activeTender,
        name,
        title: name,
        client,
        deadline,
        type: type || activeTender.type,
        value: Number.isFinite(parsedValue)
          ? (parsedValue ?? activeTender.value)
          : activeTender.value,
        totalValue: Number.isFinite(parsedValue)
          ? (parsedValue ?? activeTender.totalValue ?? activeTender.value)
          : activeTender.totalValue,
        lastUpdate: new Date().toISOString(),
        lastAction: 'تحديث بيانات التسجيل عبر معالج التسعير',
      }

      await updateTender(nextTender)
      updateDraftState((current) => ({
        ...current,
        registration: {
          ...current.registration,
          lastSavedAt: new Date().toISOString(),
        },
      }))
      markStepCompleted('registration')
      toast.success('تم تحديث بيانات المنافسة بنجاح')
      return true
    } catch (error) {
      console.error('[TenderPricingWizard] فشل حفظ بيانات التسجيل', error)
      toast.error('تعذر حفظ بيانات المنافسة، يرجى المحاولة لاحقاً')
      return false
    } finally {
      setIsSavingRegistration(false)
    }
  }, [draft, activeTender, updateTender, updateDraftState, markStepCompleted])

  const handleTechnicalFilesSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!draft || !activeTender) {
        return
      }
      const input = event.target
      const files = Array.from(input.files ?? [])
      if (!files.length) {
        return
      }
      const fileNames = files.map((file) => file.name)
      updateDraftState((current) => ({
        ...current,
        technical: {
          ...current.technical,
          uploadedFiles: fileNames,
          lastSavedAt: new Date().toISOString(),
        },
      }))

      try {
        await updateTender({
          ...activeTender,
          technicalFilesUploaded: true,
          lastUpdate: new Date().toISOString(),
          lastAction: 'تأكيد رفع الملفات الفنية عبر معالج التسعير',
        })
        toast.success('تم تسجيل رفع الملفات الفنية بنجاح')
      } catch (error) {
        console.error('[TenderPricingWizard] فشل تحديث حالة الملفات الفنية', error)
        toast.error('تعذر تحديث حالة الملفات الفنية، سيتم حفظ التغيير في المسودة فقط')
      } finally {
        input.value = ''
      }
    },
    [draft, activeTender, updateDraftState, updateTender],
  )

  const handleTechnicalFilesReset = useCallback(async () => {
    if (!draft || !activeTender) {
      return
    }
    updateDraftState((current) => ({
      ...current,
      technical: {
        ...current.technical,
        uploadedFiles: [],
        lastSavedAt: new Date().toISOString(),
      },
    }))

    try {
      if (activeTender.technicalFilesUploaded) {
        await updateTender({
          ...activeTender,
          technicalFilesUploaded: false,
          lastUpdate: new Date().toISOString(),
          lastAction: 'إعادة تعيين حالة الملفات الفنية عبر معالج التسعير',
        })
      }
      toast.info('تم إعادة تعيين حالة الملفات الفنية')
    } catch (error) {
      console.error('[TenderPricingWizard] فشل إعادة تعيين حالة الملفات الفنية', error)
    }
  }, [draft, activeTender, updateDraftState, updateTender])

  const handleTechnicalChecklistToggle = useCallback(
    (key: string, checked: boolean) => {
      updateDraftState((current) => ({
        ...current,
        technical: {
          ...current.technical,
          checklist: {
            ...current.technical.checklist,
            [key]: checked,
          },
        },
      }))
    },
    [updateDraftState],
  )

  const handleFinancialChecklistToggle = useCallback(
    (key: string, checked: boolean) => {
      updateDraftState((current) => ({
        ...current,
        financial: {
          ...current.financial,
          checklist: {
            ...current.financial.checklist,
            [key]: checked,
          },
        },
      }))
    },
    [updateDraftState],
  )

  const handleRiskAssessmentSave = useCallback(
    (assessment: RiskAssessment) => {
      updateDraftState((current) => ({
        ...current,
        financial: {
          ...current.financial,
          riskAssessment: assessment,
          // Update risk level based on assessment
          riskLevel:
            assessment.overallRiskLevel === 'critical' ? 'high' : assessment.overallRiskLevel,
        },
      }))
      setRiskAssessmentOpen(false)
      toast.success('تم حفظ تقييم المخاطر بنجاح')
    },
    [updateDraftState],
  )

  const handleTechnicalNext = useCallback((): boolean => {
    if (!draft || !activeTender) {
      toast.error('يرجى اختيار المنافسة المراد تسعيرها أولاً')
      return false
    }
    if (!activeTender.technicalFilesUploaded) {
      toast.error('يجب رفع ملفات العرض الفني قبل المتابعة')
      return false
    }
    if (!isChecklistComplete(draft.technical.checklist)) {
      toast.error('يرجى استكمال عناصر التحقق الفني قبل المتابعة')
      return false
    }
    updateDraftState((current) => ({
      ...current,
      technical: {
        ...current.technical,
        lastSavedAt: new Date().toISOString(),
      },
    }))
    markStepCompleted('technical')
    return true
  }, [draft, activeTender, updateDraftState, markStepCompleted])

  const handleFinancialNext = useCallback((): boolean => {
    if (!draft) {
      toast.error('تعذر قراءة مسودة المعالج الحالية')
      return false
    }
    if (!isChecklistComplete(draft.financial.checklist)) {
      toast.error('يرجى إكمال عناصر التحقق المالي قبل المتابعة')
      return false
    }
    updateDraftState((current) => ({
      ...current,
      financial: {
        ...current.financial,
        lastSavedAt: new Date().toISOString(),
      },
    }))
    markStepCompleted('financial')
    return true
  }, [draft, updateDraftState, markStepCompleted])

  const handleReviewNext = useCallback((): boolean => {
    if (!draft) {
      toast.error('تعذر قراءة مسودة المعالج الحالية')
      return false
    }
    if (!draft.review.readyForSubmission) {
      toast.error('يرجى تأكيد الجاهزية للإرسال قبل الاستمرار')
      return false
    }
    markStepCompleted('review')
    return true
  }, [draft, markStepCompleted])

  const handleSubmit = useCallback(async () => {
    if (!draft || !activeTender) {
      toast.error('لا توجد منافسة جاهزة للإرسال')
      return
    }
    if (!draft.review.readyForSubmission) {
      toast.error('يرجى تأكيد الجاهزية للإرسال قبل الإرسال النهائي')
      return
    }

    try {
      setIsSubmitting(true)
      const { tenderSubmissionService } = await import(
        '@/application/services/tenderSubmissionService'
      )
      await tenderSubmissionService.submit(activeTender)
      await refreshTenders()
      await clearDraft(activeTender.id)
      toast.success('تم إرسال المنافسة واعتمادها بنجاح')
      if (onExit) {
        onExit()
      } else {
        navigate('tenders')
      }
    } catch (error) {
      console.error('[TenderPricingWizard] فشل إرسال المنافسة', error)
      toast.error('حدث خطأ أثناء إرسال المنافسة')
    } finally {
      setIsSubmitting(false)
    }
  }, [draft, activeTender, refreshTenders, onExit, navigate])

  const goToStep = useCallback((stepId: WizardStepId) => {
    const index = WIZARD_STEPS.findIndex((step) => step.id === stepId)
    if (index !== -1) {
      setActiveStepIndex(index)
    }
  }, [])

  const handleNext = useCallback(async () => {
    const currentStep = WIZARD_STEPS[activeStepIndex]
    if (!currentStep) {
      return
    }

    let canProceed = true

    if (currentStep.id === 'registration') {
      canProceed = await handleRegistrationNext()
    } else if (currentStep.id === 'technical') {
      canProceed = handleTechnicalNext()
    } else if (currentStep.id === 'financial') {
      canProceed = handleFinancialNext()
    } else if (currentStep.id === 'review') {
      canProceed = handleReviewNext()
    }

    if (canProceed) {
      setActiveStepIndex((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1))
    }
  }, [
    activeStepIndex,
    handleFinancialNext,
    handleRegistrationNext,
    handleReviewNext,
    handleTechnicalNext,
  ])

  const handleBack = useCallback(() => {
    setActiveStepIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const autoSaveLabel = useMemo(() => {
    switch (autoSaveState) {
      case 'saving':
        return 'جارٍ الحفظ التلقائي...'
      case 'saved':
        return 'تم الحفظ تلقائياً'
      case 'error':
        return 'تعذر الحفظ التلقائي'
      default:
        return 'جاهز للحفظ'
    }
  }, [autoSaveState])

  const autoSaveBadgeStatus = useMemo(() => AUTO_SAVE_BADGE_STATUS[autoSaveState], [autoSaveState])
  const technicalChecklistCompleted = isChecklistComplete(draft?.technical?.checklist ?? {})
  const financialChecklistCompleted = isChecklistComplete(draft?.financial?.checklist ?? {})
  const hasUploadedFiles = (draft?.technical?.uploadedFiles?.length ?? 0) > 0
  const technicalUploadBadge =
    hasUploadedFiles || (activeTender?.technicalFilesUploaded ?? false)
      ? UPLOAD_BADGE_META.completed
      : UPLOAD_BADGE_META.pending
  const technicalChecklistBadge = technicalChecklistCompleted
    ? CHECKLIST_BADGE_META.completed
    : CHECKLIST_BADGE_META.incomplete
  const financialChecklistBadge = financialChecklistCompleted
    ? CHECKLIST_BADGE_META.completed
    : CHECKLIST_BADGE_META.incomplete
  const strategyBadge = STRATEGY_BADGE_META[draft?.financial?.strategy ?? 'hybrid']

  if (!tenders.length && !tender) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="لا توجد منافسات متاحة"
          description="قم بإنشاء منافسة جديدة من شاشة «المنافسات» قبل استخدام معالج التسعير."
          actionLabel="العودة إلى قائمة المنافسات"
          onAction={() => navigate('tenders')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">معالج تسعير المنافسة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            اتبع الخطوات المتسلسلة لتجهيز المنافسة بالكامل من التسجيل وحتى الإرسال، مع حفظ تلقائي
            لكل خطوة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={autoSaveBadgeStatus}
            showIcon={false}
            size="sm"
            className="shadow-none gap-1.5"
          >
            <>
              {autoSaveState === 'saving' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
              )}
              <span>{autoSaveLabel}</span>
            </>
          </StatusBadge>
          <Button variant="outline" onClick={onExit ?? (() => navigate('tenders'))}>
            العودة للمنافسات
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>حدد المنافسة</CardTitle>
          <CardDescription>
            اختر المنافسة المراد تسعيرها. يتم حفظ تقدمك تلقائياً لكل منافسة على حدة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTenderId} onValueChange={(value) => setSelectedTenderId(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر المنافسة" />
            </SelectTrigger>
            <SelectContent>
              {tenders.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} — الموعد النهائي: {formatDate(item.deadline)}
                </SelectItem>
              ))}
              {tender && !tenders.some((item) => item.id === tender.id) && (
                <SelectItem value={tender.id}>
                  {tender.name ?? tender.title ?? tender.id}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {activeTender && (
            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                <span className="font-medium text-card-foreground">العميل:</span>
                <span className="mr-2">{activeTender.client || 'غير محدد'}</span>
              </div>
              <div>
                <span className="font-medium text-card-foreground">الموعد النهائي:</span>
                <span className="mr-2">{formatDate(activeTender.deadline ?? null)}</span>
              </div>
              <div>
                <span className="font-medium text-card-foreground">القيمة التقديرية:</span>
                <span className="mr-2">
                  {formatCurrencyValue(activeTender.totalValue ?? activeTender.value ?? 0)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StepIndicator
        steps={WIZARD_STEPS}
        activeStep={activeStepId}
        draft={draft}
        onStepClick={(stepId) => goToStep(stepId)}
      />

      {!activeTender || !draft ? (
        <Card>
          <CardHeader>
            <CardTitle>لم يتم تحديد منافسة بعد</CardTitle>
            <CardDescription>اختر منافسة لبدء خطوات معالج التسعير.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{WIZARD_STEPS[activeStepIndex]?.title}</CardTitle>
            <CardDescription>{WIZARD_STEPS[activeStepIndex]?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeStepId === 'registration' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      اسم المنافسة
                    </label>
                    <Input
                      value={draft.registration.form.name}
                      onChange={(event) =>
                        handleRegistrationFieldChange('name', event.target.value)
                      }
                      placeholder="مثال: مشروع تطوير المجمع التجاري"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      الجهة المالكة
                    </label>
                    <Input
                      value={draft.registration.form.client}
                      onChange={(event) =>
                        handleRegistrationFieldChange('client', event.target.value)
                      }
                      placeholder="اسم الجهة أو العميل"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      نوع المنافسة
                    </label>
                    <Input
                      value={draft.registration.form.type}
                      onChange={(event) =>
                        handleRegistrationFieldChange('type', event.target.value)
                      }
                      placeholder="إنشائي، تشغيلي، توريد..."
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      الموعد النهائي
                    </label>
                    <Input
                      type="date"
                      value={draft.registration.form.deadline}
                      onChange={(event) =>
                        handleRegistrationFieldChange('deadline', event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      القيمة التقديرية
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={draft.registration.form.estimatedValue}
                      onChange={(event) =>
                        handleRegistrationFieldChange('estimatedValue', event.target.value)
                      }
                      placeholder="أدخل القيمة الرقمية"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      ملاحظات التسجيل
                    </label>
                    <Textarea
                      rows={4}
                      value={draft.registration.notes}
                      onChange={(event) => {
                        const value = event.target.value
                        updateDraftState((current) => ({
                          ...current,
                          registration: {
                            ...current.registration,
                            notes: value,
                          },
                        }))
                      }}
                      placeholder="أضف أي ملاحظات أو تعليمات مرتبطة بالمنافسة"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStepId === 'technical' && (
              <div className="space-y-6">
                <div className="rounded-xl border bg-muted/10 p-4">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">
                    رفع الملفات الفنية
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    يتم حفظ الملفات المرفوعة مباشرة في مساحة التخزين الآمنة للمستخدم وتحديث حالة
                    المنافسة تلقائياً.
                  </p>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      aria-label="رفع الملفات الفنية"
                      onChange={handleTechnicalFilesSelected}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        اختر الملفات الفنية
                      </Button>
                      {(draft.technical.uploadedFiles.length > 0 ||
                        activeTender.technicalFilesUploaded) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-warning hover:text-warning"
                          onClick={() => void handleTechnicalFilesReset()}
                        >
                          <XCircle className="h-4 w-4" />
                          إعادة تعيين الملفات
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      {draft.technical.uploadedFiles.length > 0 ? (
                        <>
                          <p className="text-card-foreground font-medium">
                            الملفات المرفوعة (يتم حفظها محلياً):
                          </p>
                          <ul className="space-y-1 text-muted-foreground">
                            {draft.technical.uploadedFiles.map((file) => (
                              <li
                                key={file}
                                className="rounded border border-border bg-card/80 px-3 py-1 text-xs"
                              >
                                {file}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : activeTender.technicalFilesUploaded ? (
                        <p className="text-xs text-muted-foreground">
                          تم تأكيد رفع الملفات الفنية مسبقاً لهذه المنافسة. يمكنك إعادة رفعها إذا
                          لزم الأمر.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          لم يتم رفع ملفات بعد. يدعم النظام رفع ملفات PDF، Word، وExcel.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-card-foreground">
                    قائمة التحقق الفنية
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {TECHNICAL_CHECKLIST.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Checkbox
                          checked={draft.technical.checklist[item.key] ?? false}
                          onCheckedChange={(value) =>
                            handleTechnicalChecklistToggle(item.key, Boolean(value))
                          }
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      ملاحظات فنية إضافية
                    </label>
                    <Textarea
                      rows={4}
                      value={draft.technical.notes}
                      onChange={(event) =>
                        updateDraftState((current) => ({
                          ...current,
                          technical: {
                            ...current.technical,
                            notes: event.target.value,
                          },
                        }))
                      }
                      placeholder="أضف ملاحظات فنية أو نقاط متابعة (اختياري)"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStepId === 'financial' && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        استراتيجية التسعير
                      </label>
                      <Select
                        value={draft.financial.strategy}
                        onValueChange={(value) =>
                          updateDraftState((current) => ({
                            ...current,
                            financial: {
                              ...current.financial,
                              strategy: value as TenderPricingWizardDraft['financial']['strategy'],
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="حدد الاستراتيجية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boq">حسب بنود جدول الكميات</SelectItem>
                          <SelectItem value="lump-sum">مبلغ مقطوع</SelectItem>
                          <SelectItem value="hybrid">نهج هجين (بند/مقطوع)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        هامش الربح المستهدف (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={draft.financial.profitMargin ?? ''}
                        onChange={(event) => {
                          const numericValue = Number(event.target.value)
                          updateDraftState((current) => ({
                            ...current,
                            financial: {
                              ...current.financial,
                              profitMargin: Number.isFinite(numericValue) ? numericValue : null,
                            },
                          }))
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="vatIncluded"
                        checked={draft.financial.vatIncluded}
                        onCheckedChange={(value) =>
                          updateDraftState((current) => ({
                            ...current,
                            financial: {
                              ...current.financial,
                              vatIncluded: Boolean(value),
                            },
                          }))
                        }
                      />
                      <label htmlFor="vatIncluded" className="text-sm text-card-foreground">
                        الأسعار تشمل ضريبة القيمة المضافة
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        تقييم المخاطر
                      </label>
                      <div className="space-y-3">
                        {draft.financial.riskAssessment ? (
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">مستوى المخاطر:</span>
                                <StatusBadge
                                  status={
                                    draft.financial.riskAssessment.overallRiskLevel === 'low'
                                      ? 'success'
                                      : draft.financial.riskAssessment.overallRiskLevel === 'medium'
                                        ? 'warning'
                                        : draft.financial.riskAssessment.overallRiskLevel === 'high'
                                          ? 'destructive'
                                          : 'destructive'
                                  }
                                  label={
                                    draft.financial.riskAssessment.overallRiskLevel === 'low'
                                      ? 'منخفض'
                                      : draft.financial.riskAssessment.overallRiskLevel === 'medium'
                                        ? 'متوسط'
                                        : draft.financial.riskAssessment.overallRiskLevel === 'high'
                                          ? 'مرتفع'
                                          : 'حرج'
                                  }
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRiskAssessmentOpen(true)}
                              >
                                تعديل التقييم
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">نقاط المخاطر:</span>
                                <span className="ml-2 font-medium">
                                  {draft.financial.riskAssessment.riskScore.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">هامش الربح المقترح:</span>
                                <span className="ml-2 font-medium">
                                  {draft.financial.riskAssessment.recommendedMargin}%
                                </span>
                              </div>
                            </div>
                            {draft.financial.riskAssessment.mitigationPlan && (
                              <div className="mt-3 pt-3 border-t">
                                <span className="text-xs text-muted-foreground">خطة التخفيف:</span>
                                <p className="text-sm mt-1">
                                  {draft.financial.riskAssessment.mitigationPlan}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              لم يتم إجراء تقييم مخاطر مفصل بعد
                            </p>
                            <Button variant="outline" onClick={() => setRiskAssessmentOpen(true)}>
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              إجراء تقييم المخاطر
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">
                        ملاحظات مالية
                      </label>
                      <Textarea
                        value={draft.financial.notes}
                        onChange={(event) => {
                          const value = event.target.value
                          updateDraftState((current) => ({
                            ...current,
                            financial: {
                              ...current.financial,
                              notes: value,
                            },
                          }))
                        }}
                        rows={4}
                        placeholder="أضف ملاحظات مالية أو اعتبارات إضافية"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-card-foreground">
                    قائمة التحقق المالية
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {FINANCIAL_CHECKLIST.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Checkbox
                          checked={draft.financial.checklist[item.key] ?? false}
                          onCheckedChange={(value) =>
                            handleFinancialChecklistToggle(item.key, Boolean(value))
                          }
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/10 p-4 text-xs text-muted-foreground">
                  <p>
                    لإدارة تفاصيل التسعير بشكل كامل، استخدم شاشة التسعير التفصيلي في قسم المنافسات.
                    سيتم ربط البيانات تلقائياً بعد حفظ التغييرات من خلال هذا المعالج.
                  </p>
                </div>
              </div>
            )}

            {activeStepId === 'review' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-success/30 bg-success/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">ملخص التحقق الفني</CardTitle>
                      <CardDescription>
                        الحالة الحالية للملفات الفنية وقائمة التحقق.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>الملفات الفنية مرفوعة</span>
                        <StatusBadge
                          status={technicalUploadBadge.status}
                          label={technicalUploadBadge.label}
                          size="sm"
                          showIcon={false}
                          className="shadow-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>قائمة التحقق الفنية</span>
                        <StatusBadge
                          status={technicalChecklistBadge.status}
                          label={technicalChecklistBadge.label}
                          size="sm"
                          showIcon={false}
                          className="shadow-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-info/30 bg-info/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">ملخص التحقق المالي</CardTitle>
                      <CardDescription>حالة المهام المالية والمتطلبات المرتبطة.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>الاستراتيجية المختارة</span>
                        <StatusBadge
                          status={strategyBadge.status}
                          label={strategyBadge.label}
                          size="sm"
                          showIcon={false}
                          className="shadow-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>قائمة التحقق المالية</span>
                        <StatusBadge
                          status={financialChecklistBadge.status}
                          label={financialChecklistBadge.label}
                          size="sm"
                          showIcon={false}
                          className="shadow-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      ملاحظات المراجعة النهائية
                    </label>
                    <Textarea
                      rows={4}
                      value={draft.review.comments}
                      onChange={(event) =>
                        updateDraftState((current) => ({
                          ...current,
                          review: {
                            ...current.review,
                            comments: event.target.value,
                          },
                        }))
                      }
                      placeholder="أضف أي ملاحظات أو توصيات قبل الإرسال"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="inline-flex items-center gap-3">
                      <Checkbox
                        checked={draft.review.notifyTeam}
                        onCheckedChange={(value) =>
                          updateDraftState((current) => ({
                            ...current,
                            review: {
                              ...current.review,
                              notifyTeam: Boolean(value),
                            },
                          }))
                        }
                      />
                      <span className="text-sm text-card-foreground">
                        إشعار فريق التسعير بعد الإرسال
                      </span>
                    </label>
                    <label className="inline-flex items-center gap-3">
                      <Checkbox
                        checked={draft.review.readyForSubmission}
                        onCheckedChange={(value) =>
                          updateDraftState((current) => ({
                            ...current,
                            review: {
                              ...current.review,
                              readyForSubmission: Boolean(value),
                            },
                          }))
                        }
                      />
                      <span className="text-sm font-medium text-card-foreground">
                        تم الانتهاء من جميع المتطلبات والمنافسة جاهزة للإرسال
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeStepId === 'submit' && (
              <div className="space-y-6">
                <div className="rounded-xl border bg-muted/10 p-4">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">ملخص الإرسال</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    سيتم تغيير حالة المنافسة إلى الحالة «submitted» وتسجيل الأنشطة المرتبطة (أوامر
                    الشراء، مصروفات الكراسة) تلقائياً.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-success" />
                      <span>سيتم تحديث سجل التدقيق وإشعار الفريق إذا تم تفعيل ذلك.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-success" />
                      <span>يتم الاحتفاظ بنسخة احتياطية من التسعير في التخزين الآمن.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="mt-1 h-4 w-4 text-warning" />
                      <span>
                        تأكد من اكتمال جميع الخطوات السابقة قبل الإرسال النهائي، لا يمكن التراجع إلا
                        عبر واجهة المنافسات.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {draft.updatedAt && (
                <span>
                  آخر حفظ: {formatDateValue(draft.updatedAt, { locale: 'ar-SA' }, draft.updatedAt)}
                </span>
              )}
              {draft.registration.lastSavedAt && activeStepId === 'registration' && (
                <span>
                  — تم تحديث البيانات في{' '}
                  {formatDateValue(
                    draft.registration.lastSavedAt,
                    { locale: 'ar-SA', timeStyle: 'short', dateStyle: 'short' },
                    draft.registration.lastSavedAt,
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={activeStepIndex === 0}
              >
                <ChevronRight className="ml-1 h-4 w-4" />
                السابق
              </Button>
              {activeStepId !== 'submit' ? (
                <Button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={
                    isDraftLoading || (activeStepId === 'registration' && isSavingRegistration)
                  }
                >
                  {activeStepId === 'registration' && isSavingRegistration && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  التالي
                  <ChevronLeft className="mr-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !draft.review.readyForSubmission}
                >
                  {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إرسال المنافسة
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Risk Assessment Dialog */}
      <Dialog open={riskAssessmentOpen} onOpenChange={setRiskAssessmentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>تقييم مخاطر المنافسة</DialogTitle>
            <DialogDescription>
              قم بتقييم العوامل المختلفة للمخاطر لتحديد هامش الربح المناسب
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <RiskAssessmentMatrix
              initialAssessment={draft?.financial.riskAssessment || undefined}
              onAssessmentComplete={handleRiskAssessmentSave}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TenderPricingWizard


