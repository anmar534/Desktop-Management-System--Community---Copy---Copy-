import React, { memo, useMemo, useRef, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { cn } from '@/presentation/components/ui/utils'
import { UploadCloud, FileText, Download, Eye, Trash2 } from 'lucide-react'

export interface ProjectAttachmentListItem {
  id: string
  name: string
  size: number
  uploadedAt?: string | number | Date
  mimeType?: string
  category?: string
  description?: string
  contentBase64?: string
}

export interface ProjectAttachmentUploadStatus {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'failed'
  errorMessage?: string
}

export interface ProjectAttachmentsListProps {
  attachments?: ProjectAttachmentListItem[]
  uploading?: boolean
  uploadsInProgress?: ProjectAttachmentUploadStatus[]
  onUpload?: (file: File) => Promise<void> | void
  onDownload?: (attachment: ProjectAttachmentListItem) => void
  onPreview?: (attachment: ProjectAttachmentListItem) => void
  onDelete?: (attachment: ProjectAttachmentListItem) => void
  title?: string
  description?: string
  emptyTitle?: string
  emptyDescription?: string
  showSummary?: boolean
  className?: string
  formatTimestamp?: (value: string | number | Date | null | undefined) => string
  formatFileSize?: (value: number) => string
}

const DEFAULT_EMPTY_TITLE = 'لا توجد مرفقات'
const DEFAULT_EMPTY_DESCRIPTION = 'ابدأ برفع ملفات المشروع لحفظ الوثائق المهمة في مكان واحد.'

const defaultTimestampFormatter = (value: string | number | Date | null | undefined): string => {
  if (!value) {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const defaultFileSizeFormatter = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 ك.ب'
  }

  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} ك.ب`
  }

  const mb = kb / 1024
  if (mb < 1024) {
    return `${mb.toFixed(1)} م.ب`
  }

  const gb = mb / 1024
  return `${gb.toFixed(1)} ج.ب`
}

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.')
  if (parts.length <= 1) {
    return 'ملف'
  }
  return parts.pop()?.toUpperCase() ?? 'ملف'
}

export const ProjectAttachmentsList: React.FC<ProjectAttachmentsListProps> = memo(
  ({
    attachments = [],
    uploading = false,
    uploadsInProgress = [],
    onUpload,
    onDownload,
    onPreview,
    onDelete,
    title = 'المستندات والمرفقات',
    description,
    emptyTitle = DEFAULT_EMPTY_TITLE,
    emptyDescription = DEFAULT_EMPTY_DESCRIPTION,
    showSummary = true,
    className = '',
    formatTimestamp = defaultTimestampFormatter,
    formatFileSize = defaultFileSizeFormatter,
  }) => {
    const uploadInputRef = useRef<HTMLInputElement>(null)

    const totalSize = useMemo(
      () => attachments.reduce((acc, item) => acc + (item.size ?? 0), 0),
      [attachments],
    )

    const categories = useMemo(() => {
      return attachments.reduce<Record<string, number>>((acc, item) => {
        if (!item.category) {
          return acc
        }
        const key = item.category.trim()
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
    }, [attachments])

    const handleUploadButtonClick = useCallback(() => {
      uploadInputRef.current?.click()
    }, [])

    const handleFileChange = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && onUpload) {
          await onUpload(file)
        }
        event.target.value = ''
      },
      [onUpload],
    )

    const renderActionsCell = (attachment: ProjectAttachmentListItem) => {
      if (!onDownload && !onPreview && !onDelete) {
        return null
      }

      return (
        <TableCell className="w-[132px]">
          <div
            className="flex items-center justify-end gap-1"
            data-testid={`attachment-actions-${attachment.id}`}
          >
            {onPreview && (
              <Button
                data-testid={`attachment-preview-${attachment.id}`}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPreview(attachment)}
                aria-label="معاينة الملف"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button
                data-testid={`attachment-download-${attachment.id}`}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDownload(attachment)}
                aria-label="تحميل الملف"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                data-testid={`attachment-delete-${attachment.id}`}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-error hover:text-error"
                onClick={() => onDelete(attachment)}
                aria-label="حذف الملف"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )
    }

    const hasAttachments = attachments.length > 0
    const hasActiveUploads = uploadsInProgress.length > 0

    return (
      <Card className={cn('border-border/70', className)} data-testid="project-attachments-card">
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-muted-foreground" />
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="pt-1 text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
            {showSummary && (
              <div className="flex flex-wrap items-center gap-2" data-testid="attachments-summary">
                <Badge variant="outline" className="border-muted text-muted-foreground">
                  {attachments.length} ملف
                </Badge>
                <Badge variant="outline" className="border-muted text-muted-foreground">
                  {formatFileSize(totalSize)}
                </Badge>
              </div>
            )}
          </div>

          {showSummary && Object.keys(categories).length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground"
              data-testid="attachment-categories"
            >
              {Object.entries(categories).map(([category, count]) => (
                <span key={category} className="rounded-full border border-muted px-2 py-0.5">
                  {category} • {count}
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {onUpload && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                ref={uploadInputRef}
                type="file"
                className="hidden"
                data-testid="attachments-upload-input"
                onChange={handleFileChange}
                disabled={uploading}
                aria-label="رفع ملف"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadButtonClick}
                disabled={uploading}
                data-testid="attachments-upload-button"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {uploading ? 'جاري الرفع...' : 'رفع ملف'}
              </Button>
              {hasActiveUploads && (
                <span
                  className="text-xs text-muted-foreground"
                  data-testid="attachments-upload-status"
                >
                  {uploadsInProgress
                    .map((item) => `${item.name} (${Math.round(item.progress)}%)`)
                    .join('، ')}
                </span>
              )}
            </div>
          )}

          {!hasAttachments ? (
            <div data-testid="attachments-empty-state">
              <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            <div className="overflow-x-auto" data-testid="attachments-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">الملف</TableHead>
                    <TableHead className="w-[20%] text-right">الحجم</TableHead>
                    <TableHead className="w-[25%] text-right">تاريخ الرفع</TableHead>
                    {(onDownload || onPreview || onDelete) && (
                      <TableHead className="text-right">إجراءات</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachments.map((attachment) => (
                    <TableRow key={attachment.id} data-testid={`attachment-row-${attachment.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                          <div className="min-w-0">
                            <div
                              className="truncate font-medium text-foreground"
                              title={attachment.name}
                            >
                              {attachment.name}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {getFileExtension(attachment.name)}
                                </Badge>
                                {attachment.mimeType && <span>{attachment.mimeType}</span>}
                              </span>
                              {attachment.description && <span>{attachment.description}</span>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right text-sm text-muted-foreground"
                        data-testid={`attachment-size-${attachment.id}`}
                      >
                        {formatFileSize(attachment.size)}
                      </TableCell>
                      <TableCell
                        className="text-right text-sm text-muted-foreground"
                        data-testid={`attachment-date-${attachment.id}`}
                      >
                        {formatTimestamp(attachment.uploadedAt ?? null)}
                      </TableCell>
                      {renderActionsCell(attachment)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

ProjectAttachmentsList.displayName = 'ProjectAttachmentsList'
