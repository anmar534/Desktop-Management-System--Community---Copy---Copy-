import React from 'react'
import { TechnicalFilesUpload } from '@/presentation/pages/Tenders/components/TechnicalFilesUpload'

interface TechnicalViewProps {
  tenderId: string
}

export const TechnicalView: React.FC<TechnicalViewProps> = ({ tenderId }) => {
  return (
    <div className="space-y-6 p-1 pb-20" dir="rtl">
      {/* تم إزالة Card الخارجي لتجنب التكرار */}
      <TechnicalFilesUpload tenderId={tenderId} />
    </div>
  )
}
