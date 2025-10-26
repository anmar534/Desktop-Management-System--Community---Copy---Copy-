/**
 * ProjectAttachmentsTab Component
 *
 * Displays project attachments with upload/download functionality
 * Refactored to use useProjectAttachments hook - Phase 1.3
 */

import { ProjectAttachmentsList } from '@/presentation/components/projects/ProjectAttachmentsList'
import { useProjectAttachments } from '../hooks/useProjectAttachments'
import type { ProjectAttachment } from '../hooks/useProjectAttachments'
import { useProjectFormatters } from '../hooks/useProjectFormatters'

interface ProjectAttachmentsTabProps {
  projectId: string
}

export function ProjectAttachmentsTab({ projectId }: ProjectAttachmentsTabProps) {
  const { attachments, isUploading, uploadFile, downloadFile, deleteFile } = useProjectAttachments({
    projectId,
  })

  const { formatTimestamp } = useProjectFormatters()

  return (
    <ProjectAttachmentsList
      attachments={attachments}
      uploading={isUploading}
      onUpload={uploadFile}
      onDownload={(attachment) => downloadFile(attachment as ProjectAttachment)}
      onDelete={(attachment) => deleteFile(attachment.id)}
      formatTimestamp={formatTimestamp}
      description="حافظ على جميع ملفات المشروع منظمة ويمكن الوصول إليها."
    />
  )
}
