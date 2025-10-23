// AttachmentsTab Component
// Displays all tender attachments including technical files

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { AttachmentItem } from '../components/AttachmentItem'
import { Paperclip, CheckCircle } from 'lucide-react'
import type { TenderAttachment } from '../types'

interface AttachmentsTabProps {
  allAttachments: (TenderAttachment & { source?: string; uploadDate?: string })[]
  technicalFilesCount: number
  onPreview: (attachment: any) => void
  onDownload: (attachment: any) => void
}

export function AttachmentsTab({
  allAttachments,
  technicalFilesCount,
  onPreview,
  onDownload,
}: AttachmentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          المرفقات والمستندات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* تنبيه الملفات الفنية */}
          {technicalFilesCount > 0 && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-center gap-2 text-accent">
                <CheckCircle className="w-5 h-5 text-accent" />
                <p className="font-medium">الملفات الفنية من التسعير</p>
              </div>
              <p className="text-sm text-accent mt-1">
                تم العثور على {technicalFilesCount} ملف فني تم رفعه من خلال صفحة التسعير.
              </p>
            </div>
          )}

          {/* قائمة المرفقات */}
          {allAttachments.map((attachment, index) => (
            <AttachmentItem
              key={attachment.id || index}
              attachment={attachment}
              index={index}
              onPreview={onPreview}
              onDownload={onDownload}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
