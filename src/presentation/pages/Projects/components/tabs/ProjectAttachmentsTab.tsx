/**
 * ProjectAttachmentsTab Component
 *
 * Displays project attachments with upload/download functionality
 * Refactored to use useProjectAttachments hook - Phase 1.3
 */

import { useProjectAttachments } from '../hooks/useProjectAttachments'
import type { ProjectAttachment } from '../hooks/useProjectAttachments'
import { useProjectFormatters } from '../hooks/useProjectFormatters'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Upload, Download, Trash2 } from 'lucide-react'

interface ProjectAttachmentsTabProps {
  projectId: string
}

export function ProjectAttachmentsTab({ projectId }: ProjectAttachmentsTabProps) {
  const { attachments, isUploading, uploadFile, downloadFile, deleteFile } = useProjectAttachments({
    projectId,
  })

  const { formatTimestamp } = useProjectFormatters()

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        uploadFile(file)
      }
    }
    input.click()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">المرفقات</h3>
              <p className="text-sm text-muted-foreground">
                حافظ على جميع ملفات المشروع منظمة ويمكن الوصول إليها.
              </p>
            </div>
            <Button onClick={handleUpload} disabled={isUploading}>
              <Upload className="h-4 w-4 ml-2" />
              رفع ملف
            </Button>
          </div>

          <div className="space-y-2">
            {attachments.map((attachment: ProjectAttachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{attachment.name}</p>
                  <p className="text-sm text-muted-foreground">{formatTimestamp(attachment.uploadedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(attachment as ProjectAttachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFile(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
