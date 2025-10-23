// WorkflowTab Component
// Tender results management and workflow

import React from 'react'
import { TenderQuickResults } from '@/presentation/pages/Tenders/components/TenderQuickResults'
import { TenderResultsManager } from '@/presentation/pages/Tenders/components/TenderResultsManager'

interface WorkflowTabProps {
  tender: any
  localTender: any
  setLocalTender: (tender: any) => void
}

export function WorkflowTab({ tender, localTender, setLocalTender }: WorkflowTabProps) {
  return (
    <div className="space-y-6">
      {/* طريقة إدخال النتائج السريعة */}
      <TenderQuickResults
        tender={localTender}
        onTenderUpdate={(updatedTender: any) => {
          setLocalTender(updatedTender)
        }}
      />

      {/* إدارة النتائج الكاملة */}
      <TenderResultsManager tender={tender} />
    </div>
  )
}
