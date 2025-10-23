/**
 * ProjectAttachmentsTab Component
 *
 * Displays project attachments with upload/download functionality
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { FileText } from 'lucide-react'

interface ProjectAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
  contentBase64: string
}

interface ProjectAttachmentsTabProps {
  attachments: ProjectAttachment[]
  isUploading: boolean
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteAttachment: (id: string) => void
  onDownloadAttachment: (att: ProjectAttachment) => void
  onRefreshAttachments: () => void
  formatTimestamp: (value: string | number | Date | null | undefined) => string
}

export function ProjectAttachmentsTab({
  attachments,
  isUploading,
  onFileUpload,
  onDeleteAttachment,
  onDownloadAttachment,
  onRefreshAttachments,
  formatTimestamp,
}: ProjectAttachmentsTabProps) {
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
          <input aria-label="رفع ملف" type="file" onChange={onFileUpload} disabled={isUploading} />
          <Button variant="outline" size="sm" onClick={onRefreshAttachments}>
            تحديث القائمة
          </Button>
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
                  <Button size="sm" variant="outline" onClick={() => onDownloadAttachment(att)}>
                    تحميل
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteAttachment(att.id)}
                  >
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
