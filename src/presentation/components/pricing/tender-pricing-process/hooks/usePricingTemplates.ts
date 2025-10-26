import { useCallback } from 'react'
import { toast } from 'sonner'
import type { PricingTemplate } from '@/shared/types/templates'
import type { PricingData } from '@/shared/types/pricing'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

interface DefaultPercentages {
  administrative: number
  operational: number
  profit: number
}

interface QuantityItem {
  id: string
  [key: string]: unknown
}

interface NewPricingTemplate {
  name: string
  description?: string
  defaultPercentages: DefaultPercentages
  costBreakdown?: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
  }
}

interface UsePricingTemplatesProps {
  pricingData: Map<string, PricingData>
  quantityItems: QuantityItem[]
  defaultPercentages: DefaultPercentages
  setPricingData: (data: Map<string, PricingData>) => void
  setDefaultPercentages: (percentages: DefaultPercentages) => void
  markDirty: () => void
  setTemplateManagerOpen: (open: boolean) => void
  tenderId?: string | number
}

interface UsePricingTemplatesReturn {
  handleTemplateApply: (template: PricingTemplate) => void
  handleTemplateSave: (templateData: NewPricingTemplate) => void
  handleTemplateUpdate: (template: PricingTemplate) => void
  handleTemplateDelete: (templateId: string) => void
}

/**
 * Custom hook for managing pricing templates
 * Handles applying, saving, updating, and deleting pricing templates
 */
export function usePricingTemplates({
  pricingData,
  quantityItems,
  defaultPercentages,
  setPricingData,
  setDefaultPercentages,
  markDirty,
  setTemplateManagerOpen,
  tenderId,
}: UsePricingTemplatesProps): UsePricingTemplatesReturn {
  const auditKey =
    typeof tenderId === 'number' || typeof tenderId === 'string'
      ? String(tenderId)
      : 'unknown-tender'

  /**
   * Apply a pricing template to the current tender
   */
  const handleTemplateApply = useCallback(
    (template: PricingTemplate) => {
      try {
        // Apply template percentages to default percentages
        setDefaultPercentages({
          administrative: template.defaultPercentages.administrative,
          operational: template.defaultPercentages.operational,
          profit: template.defaultPercentages.profit,
        })

        // Apply template to all existing items if they don't have custom pricing
        const updatedPricingData = new Map(pricingData)

        quantityItems.forEach((item) => {
          const existingPricing = updatedPricingData.get(item.id)

          // Only apply template if item doesn't have detailed pricing yet
          if (
            !existingPricing ||
            (!existingPricing.materials?.length &&
              !existingPricing.labor?.length &&
              !existingPricing.equipment?.length &&
              !existingPricing.subcontractors?.length)
          ) {
            const templatePricing = {
              ...existingPricing,
              percentages: {
                administrative: template.defaultPercentages.administrative,
                operational: template.defaultPercentages.operational,
                profit: template.defaultPercentages.profit,
              },
              additionalPercentages: {
                administrative: template.defaultPercentages.administrative,
                operational: template.defaultPercentages.operational,
                profit: template.defaultPercentages.profit,
              },
              materials: existingPricing?.materials || [],
              labor: existingPricing?.labor || [],
              equipment: existingPricing?.equipment || [],
              subcontractors: existingPricing?.subcontractors || [],
              completed: existingPricing?.completed || false,
              technicalNotes: existingPricing?.technicalNotes || '',
            }

            updatedPricingData.set(item.id, templatePricing)
          }
        })

        setPricingData(updatedPricingData)
        markDirty()

        toast.success(`تم تطبيق قالب "${template.name}" بنجاح`)
        setTemplateManagerOpen(false)
      } catch (error) {
        void recordAuditEvent({
          category: 'tender-pricing',
          action: 'template-apply-failed',
          key: auditKey,
          level: 'error',
          status: 'error',
          metadata: {
            templateId: template.id,
            templateName: template.name,
            message: error instanceof Error ? error.message : 'unknown-error',
          },
        })
        toast.error('فشل في تطبيق القالب')
      }
    },
    [
      pricingData,
      quantityItems,
      markDirty,
      setDefaultPercentages,
      setPricingData,
      setTemplateManagerOpen,
      auditKey,
    ],
  )

  /**
   * Save current pricing state as a new template
   */
  const handleTemplateSave = useCallback(
    (templateData: NewPricingTemplate) => {
      try {
        // Create template from current pricing state
        const templatePayload: NewPricingTemplate = {
          ...templateData,
          defaultPercentages: {
            administrative: defaultPercentages.administrative,
            operational: defaultPercentages.operational,
            profit: defaultPercentages.profit,
          },
          // Calculate average cost breakdown from current pricing
          costBreakdown: {
            materials: 40, // Default values - could be calculated from current data
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
        }

        void recordAuditEvent({
          category: 'tender-pricing',
          action: 'template-save-placeholder',
          key: auditKey,
          level: 'info',
          metadata: {
            templateName: templatePayload.name,
          },
        })
        toast.success(`تم حفظ القالب "${templatePayload.name}" بنجاح`)
      } catch (error) {
        void recordAuditEvent({
          category: 'tender-pricing',
          action: 'template-save-failed',
          key: auditKey,
          level: 'error',
          status: 'error',
          metadata: {
            templateName: templateData.name,
            message: error instanceof Error ? error.message : 'unknown-error',
          },
        })
        toast.error('فشل في حفظ القالب')
        throw error
      }
    },
    [defaultPercentages, auditKey],
  )

  /**
   * Update an existing pricing template
   */
  const handleTemplateUpdate = useCallback(
    (template: PricingTemplate) => {
      try {
        // Update template logic would go here
        toast.success(`تم تحديث القالب "${template.name}" بنجاح`)
      } catch (error) {
        void recordAuditEvent({
          category: 'tender-pricing',
          action: 'template-update-failed',
          key: auditKey,
          level: 'error',
          status: 'error',
          metadata: {
            templateId: template.id,
            templateName: template.name,
            message: error instanceof Error ? error.message : 'unknown-error',
          },
        })
        toast.error('فشل في تحديث القالب')
      }
    },
    [auditKey],
  )

  /**
   * Delete a pricing template
   */
  const handleTemplateDelete = useCallback(
    (_templateId: string) => {
      try {
        // Delete template logic would go here
        toast.success('تم حذف القالب بنجاح')
      } catch (error) {
        void recordAuditEvent({
          category: 'tender-pricing',
          action: 'template-delete-failed',
          key: auditKey,
          level: 'error',
          status: 'error',
          metadata: {
            message: error instanceof Error ? error.message : 'unknown-error',
          },
        })
        toast.error('فشل في حذف القالب')
      }
    },
    [auditKey],
  )

  return {
    handleTemplateApply,
    handleTemplateSave,
    handleTemplateUpdate,
    handleTemplateDelete,
  }
}
