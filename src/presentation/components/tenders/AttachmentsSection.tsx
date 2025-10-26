/**
 * Attachments Section Component
 *
 * @fileoverview Component for managing tender file attachments.
 * Extracted from NewTenderForm.tsx for better reusability.
 *
 * @module presentation/components/tenders/AttachmentsSection
 */

import { useCallback, useRef, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Upload, X, FileText } from 'lucide-react'
import type { AttachmentLike } from '@/shared/utils/tender/tenderFormDefaults'

/**
 * Props for AttachmentsSection component
 */
export interface AttachmentsSectionProps {
  /** Array of attachments */
  attachments: AttachmentLike[]
  /** Callback when attachments change */
  onAttachmentsChange: (attachments: AttachmentLike[]) => void
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number
}

/**
 * AttachmentsSection Component
 *
 * Displays file upload area and list of attached files.
 *
 * @example
 * ```tsx
 * <AttachmentsSection
 *   attachments={attachments}
 *   onAttachmentsChange={setAttachments}
 *   maxFileSize={10 * 1024 * 1024}
 * />
 * ```
 */
export function AttachmentsSection({
  attachments,
  onAttachmentsChange,
  maxFileSize = 10 * 1024 * 1024, // Default 10MB
}: AttachmentsSectionProps) {
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) {
        return
      }

      const acceptedFiles = Array.from(files).filter((file) => {
        if (file.size > maxFileSize) {
          alert(
            `الملف ${file.name} كبير جداً. الحد الأقصى ${Math.round(maxFileSize / (1024 * 1024))} ميجابايت.`,
          )
          return false
        }
        return true
      })

      const existing = new Set(attachments.map((item) => `${item.name}-${item.size}`))
      const deduped = acceptedFiles.filter((file) => !existing.has(`${file.name}-${file.size}`))

      onAttachmentsChange([...attachments, ...deduped])
    },
    [attachments, maxFileSize, onAttachmentsChange],
  )

  const handleAttachmentInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFileUpload(event.currentTarget.files)
      event.currentTarget.value = ''
    },
    [handleFileUpload],
  )

  const removeAttachment = useCallback(
    (index: number) => {
      onAttachmentsChange(attachments.filter((_, fileIndex) => fileIndex !== index))
    },
    [attachments, onAttachmentsChange],
  )

  const openAttachmentDialog = useCallback(() => {
    attachmentInputRef.current?.click()
  }, [])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          المرفقات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* منطقة رفع الملفات */}
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">اسحب الملفات هنا أو</p>
          <Button type="button" variant="outline" onClick={openAttachmentDialog}>
            اختر الملفات
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            ref={attachmentInputRef}
            onChange={handleAttachmentInputChange}
            className="hidden"
            title="اختيار مرفقات"
            placeholder="اختر ملفات للرفع"
          />
        </div>

        {/* قائمة المرفقات */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">الملفات المرفقة:</h4>
            <div className="space-y-2">
              {attachments.map((file, index) => {
                const attachmentKey = `${file.name}-${file.size}-${index}`
                return (
                  <div
                    key={attachmentKey}
                    className="flex items-center justify-between rounded bg-muted/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
