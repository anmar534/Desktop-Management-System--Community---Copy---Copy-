/**
 * ProjectAttachmentsTab Component
 *
 * Displays project attachments with upload/download functionality
 * Refactored to use useProjectAttachments hook - Phase 1.3
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { FileText } from 'lucide-react'
import { useProjectAttachments } from '../hooks/useProjectAttachments'
import { useProjectFormatters } from '../hooks/useProjectFormatters'

interface ProjectAttachmentsTabProps {
  projectId: string
}

export function ProjectAttachmentsTab({ projectId }: ProjectAttachmentsTabProps) {
  const { attachments, isUploading, uploadFile, downloadFile, deleteFile } = useProjectAttachments({
    projectId,
  })

  const { formatTimestamp } = useProjectFormatters()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file)
      // Reset input to allow uploading the same file again
      e.target.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          المستندات والمرفقات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            aria-label="رفع ملف"
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {!attachments || attachments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="لا توجد مرفقات"
            description="ابدأ برفع ملفات المشروع لحفظ الوثائق المهمة في مكان واحد."
          />
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between border rounded-md p-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{att.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(att.uploadedAt)} • {(att.size / 1024).toFixed(1)} ك.ب
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadFile(att)}>
                    تحميل
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteFile(att.id)}>
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
