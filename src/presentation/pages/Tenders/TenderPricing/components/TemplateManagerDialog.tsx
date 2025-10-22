import React from 'react'
import type { PricingTemplate } from '@/shared/types/templates'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/presentation/components/ui/dialog'
import { PricingTemplateManager } from '@/presentation/components/tenders/PricingTemplateManager'

interface NewPricingTemplate {
  name: string
  description?: string
  defaultPercentages: {
    administrative: number
    operational: number
    profit: number
  }
}

interface TemplateManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: PricingTemplate) => void
  onCreateTemplate: (templateData: NewPricingTemplate) => void
  onUpdateTemplate: (template: PricingTemplate) => void
  onDeleteTemplate: (templateId: string) => void
}

export const TemplateManagerDialog: React.FC<TemplateManagerDialogProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>إدارة قوالب التسعير</DialogTitle>
          <DialogDescription>
            اختر قالب تسعير لتطبيقه على المنافسة أو احفظ الإعدادات الحالية كقالب جديد
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PricingTemplateManager
            onSelectTemplate={onSelectTemplate}
            onCreateTemplate={onCreateTemplate}
            onUpdateTemplate={onUpdateTemplate}
            onDeleteTemplate={onDeleteTemplate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
