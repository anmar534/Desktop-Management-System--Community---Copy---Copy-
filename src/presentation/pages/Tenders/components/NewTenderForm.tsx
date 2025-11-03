/**
 * New Tender Form Component (Refactored)
 *
 * @fileoverview Main form for creating/editing tender opportunities.
 * Refactored to use extracted utilities and components for better maintainability.
 *
 * Original LOC: 1,102
 * Target LOC: ≤300
 *
 * @module presentation/pages/Tenders/components/NewTenderForm
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Trophy, Save, ArrowRight, FileText } from 'lucide-react'
import { PageLayout } from '@/presentation/components/layout/PageLayout'
import {
  TenderBasicInfoSection,
  QuantityTableSection,
  AttachmentsSection,
} from '@/presentation/components/tenders'
import type { QuantityItem } from '@/shared/types/contracts'
import {
  parseNumericValue,
  calculateDaysRemaining,
} from '@/shared/utils/tender/tenderFormValidators'
import {
  buildFormData,
  createQuantitiesState,
  createInitialAttachments,
  normalizeQuantities,
  formatProjectDuration,
  DEFAULT_TENDER_VALUES,
  type TenderFormData,
  type TenderDraft,
  type ExistingTender,
  type AttachmentLike,
} from '@/shared/utils/tender/tenderFormDefaults'

/**
 * Props for NewTenderForm component
 */
export interface NewTenderFormProps {
  /** Callback when form is saved */
  onSave?: (formData: TenderDraft) => void
  /** Callback when user clicks back */
  onBack?: () => void
  /** Existing tender data for editing (optional) */
  existingTender?: ExistingTender | null
}

/**
 * NewTenderForm Component
 *
 * Complete form for creating/editing tender opportunities with:
 * - Basic tender information
 * - Quantity tables (BOQ)
 * - File attachments
 * - Validation and insights
 *
 * @example
 * ```tsx
 * <NewTenderForm
 *   onSave={handleSave}
 *   onBack={() => navigate('/tenders')}
 *   existingTender={tenderData}
 * />
 * ```
 */
export function NewTenderForm({ onSave, onBack, existingTender }: NewTenderFormProps) {
  // Form state
  const [formData, setFormData] = useState<TenderFormData>(() => buildFormData(existingTender))
  const [quantities, setQuantities] = useState<QuantityItem[]>(() =>
    createQuantitiesState(existingTender),
  )
  const [attachments, setAttachments] = useState<AttachmentLike[]>(() =>
    createInitialAttachments(existingTender),
  )
  const [isLoading, setIsLoading] = useState(false)

  // Update form when existingTender changes
  useEffect(() => {
    console.log('[NewTenderForm] existingTender changed:', existingTender?.id)
    setFormData(buildFormData(existingTender))
    setQuantities(createQuantitiesState(existingTender))
    setAttachments(createInitialAttachments(existingTender))
  }, [existingTender])

  // Form data change handler
  const handleInputChange = useCallback((field: keyof TenderFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Save handler
  const handleSave = useCallback(async () => {
    console.log('[NewTenderForm][handleSave] Starting save process')
    setIsLoading(true)

    try {
      const trimmedName = formData.name.trim()
      const ownerEntity = formData.ownerEntity.trim()
      const locationValue = formData.location.trim()
      const typeInput = formData.type.trim()
      const resolvedType =
        typeInput.length > 0 ? typeInput : (existingTender?.type ?? DEFAULT_TENDER_VALUES.type)

      // Format project duration with unit (e.g., "12 شهر")
      const formattedProjectDuration = formatProjectDuration(
        formData.projectDuration,
        formData.projectDurationUnit,
      )
      const resolvedProjectDuration =
        formattedProjectDuration.length > 0
          ? formattedProjectDuration
          : existingTender?.projectDuration

      const descriptionInput = formData.description.trim()
      const resolvedDescription =
        descriptionInput.length > 0 ? descriptionInput : existingTender?.description

      const estimatedValue =
        parseNumericValue(formData.estimatedValue) ?? existingTender?.value ?? 0
      const existingDocumentPrice = parseNumericValue(
        existingTender?.documentPrice ?? existingTender?.bookletPrice ?? null,
      )
      const documentPriceValue =
        parseNumericValue(formData.bookletPrice) ?? existingDocumentPrice ?? 0
      const bookletPriceInput = formData.bookletPrice.trim()
      const resolvedBookletPrice =
        bookletPriceInput.length > 0 ? bookletPriceInput : existingTender?.bookletPrice

      const normalizedQuantities = normalizeQuantities(quantities)

      const tenderData: TenderDraft = {
        id: existingTender?.id ?? `TND-${Date.now()}`,
        name: trimmedName,
        title: trimmedName,
        client: ownerEntity,
        value: estimatedValue,
        totalValue: estimatedValue,
        documentPrice: documentPriceValue,
        bookletPrice: resolvedBookletPrice,
        status: existingTender?.status ?? DEFAULT_TENDER_VALUES.status,
        phase: existingTender?.phase ?? DEFAULT_TENDER_VALUES.phase,
        deadline: formData.deadline,
        daysLeft: calculateDaysRemaining(formData.deadline),
        progress: existingTender?.progress ?? DEFAULT_TENDER_VALUES.progress,
        priority: existingTender?.priority ?? DEFAULT_TENDER_VALUES.priority,
        team: existingTender?.team ?? DEFAULT_TENDER_VALUES.team,
        manager: existingTender?.manager ?? DEFAULT_TENDER_VALUES.manager,
        winChance: existingTender?.winChance ?? DEFAULT_TENDER_VALUES.winChance,
        competition: existingTender?.competition ?? DEFAULT_TENDER_VALUES.competition,
        submissionDate: formData.deadline,
        lastAction: existingTender ? 'تم تحديث المنافسة' : 'تم إنشاء المنافسة',
        lastUpdate: new Date().toISOString(),
        category: existingTender?.category ?? DEFAULT_TENDER_VALUES.category,
        location: locationValue,
        type: resolvedType,
        projectDuration: resolvedProjectDuration,
        description: resolvedDescription,
        createdAt: existingTender?.createdAt ?? new Date().toISOString(),
        quantities: normalizedQuantities,
        quantityTable: normalizedQuantities,
        items: normalizedQuantities,
        boqItems: normalizedQuantities,
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
        cancelledDate: existingTender?.cancelledDate,
      }

      console.log(
        '[NewTenderForm][handleSave] Final tenderData:',
        tenderData.id,
        tenderData.quantities?.length,
      )

      await onSave?.(tenderData)
    } catch (error) {
      console.error('خطأ في الحفظ:', error)
      alert('حدث خطأ أثناء حفظ البيانات')
    } finally {
      setIsLoading(false)
    }
  }, [attachments, existingTender, formData, onSave, quantities])

  // Quick actions for PageLayout
  const quickActions = useMemo(
    () => [
      {
        label: existingTender ? 'حفظ التغييرات' : 'حفظ المنافسة',
        icon: Save,
        onClick: () => void handleSave(),
        variant: 'default' as const,
        primary: true,
      },
      {
        label: 'العودة للقائمة',
        icon: ArrowRight,
        onClick: () => onBack?.(),
        variant: 'outline' as const,
      },
      {
        label: 'حفظ كمسودة',
        icon: FileText,
        onClick: () => void handleSave(),
        variant: 'outline' as const,
      },
    ],
    [existingTender, handleSave, onBack],
  )

  return (
    <PageLayout
      tone="primary"
      title={existingTender ? 'تحرير المنافسة' : 'منافسة جديدة'}
      description={
        existingTender
          ? 'تعديل بيانات المنافسة الموجودة'
          : 'إضافة منافسة جديدة وإعداد البيانات المطلوبة'
      }
      icon={Trophy}
      quickStats={[]}
      quickActions={quickActions}
      onBack={onBack}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* العمود الأيسر - النموذج الرئيسي */}
        <div className="xl:col-span-2 space-y-6">
          {/* معلومات المنافسة الأساسية */}
          <TenderBasicInfoSection formData={formData} onFormDataChange={handleInputChange} />

          {/* جداول الكميات */}
          <QuantityTableSection
            quantities={quantities}
            onQuantitiesChange={setQuantities}
            isLoading={isLoading}
          />

          {/* المرفقات */}
          <AttachmentsSection attachments={attachments} onAttachmentsChange={setAttachments} />
        </div>

        {/* العمود الأيمن - معلومات إضافية (يمكن إضافتها لاحقاً) */}
        <div className="space-y-6">{/* يمكن إضافة sidebar components هنا */}</div>
      </div>
    </PageLayout>
  )
}
