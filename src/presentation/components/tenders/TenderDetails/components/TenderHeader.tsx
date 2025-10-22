// TenderHeader Component
// Header section with title, back button, status badges, and actions

import React from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { TenderStatusManager } from '@/presentation/pages/Tenders/components/TenderStatusManager'
import { ArrowRight, Send } from 'lucide-react'
import { getStatusColor } from '@/shared/utils/ui/statusColors'

interface TenderHeaderProps {
  tender: any
  isReadyToSubmit: boolean
  isPricingCompleted: boolean
  isTechnicalFilesUploaded: boolean
  onBack: () => void
  onSubmitTender: () => void
  getStatusText: (status: string) => string
}

export function TenderHeader({
  tender,
  isReadyToSubmit,
  isPricingCompleted,
  isTechnicalFilesUploaded,
  onBack,
  onSubmitTender,
  getStatusText,
}: TenderHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowRight className="h-4 w-4" /> العودة
        </Button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">{tender.name}</h1>
          <p className="text-sm text-muted-foreground">
            {tender.client || tender.ownerEntity || 'غير محدد'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* زر تقديم العرض - يظهر للمنافسات الجاهزة تماماً */}
        {(tender.status === 'ready_to_submit' || isReadyToSubmit) && (
          <Button
            onClick={onSubmitTender}
            className="gap-2 bg-success text-success-foreground hover:bg-success/90"
          >
            <Send className="h-4 w-4" />
            ارسال
          </Button>
        )}

        {/* مدير حالات المنافسة - يظهر للحالات المناسبة */}
        {tender.status === 'submitted' && <TenderStatusManager tender={tender} />}

        <Badge className={`px-3 py-1 ${getStatusColor(tender.status)}`}>
          {getStatusText(tender.status)}
        </Badge>

        {/* معلومات إضافية حول جاهزية المنافسة */}
        {isReadyToSubmit && tender.status !== 'submitted' && (
          <Badge className="bg-success/10 text-success border-success/30">جاهزة للإرسال</Badge>
        )}
        {isPricingCompleted && !isTechnicalFilesUploaded && tender.status !== 'submitted' && (
          <Badge className="bg-warning/10 text-warning border-warning/30">يحتاج ملفات فنية</Badge>
        )}
      </div>
    </div>
  )
}
