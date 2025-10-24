// WorkflowTab Component
// Tender results management and workflow
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TenderQuickResults } from '@/presentation/pages/Tenders/components/TenderQuickResults'
import { TenderResultsManager } from '@/presentation/pages/Tenders/components/TenderResultsManager'

interface WorkflowTabProps {
  tender: any
  localTender: any
  setLocalTender?: (tender: any) => void
}

export function WorkflowTab({ tender, localTender }: WorkflowTabProps) {
  const handleUpdate = () => {
    // تحديث البيانات باستخدام نظام الأحداث
    void import('@/events/bus').then(({ APP_EVENTS, emit }) => emit(APP_EVENTS.TENDER_UPDATED))
  }

  return (
    <div className="space-y-6">
      {/* طريقة إدخال النتائج السريعة */}
      <TenderQuickResults tender={localTender} onUpdate={handleUpdate} />

      {/* إدارة النتائج الكاملة */}
      <TenderResultsManager tender={tender} onUpdate={handleUpdate} />
    </div>
  )
}
