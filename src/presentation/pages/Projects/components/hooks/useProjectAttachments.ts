/**
 * 🎣 Custom Hook: useProjectAttachments
 * Manages project file attachments (upload, download, delete)
 *
 * Purpose:
 * - Handle file uploads with validation
 * - Manage attachment list state
 * - Provide download and delete functionality
 * - Persist attachments in localStorage
 *
 * @module useProjectAttachments
 */

import { useState, useEffect, useCallback } from 'react'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { toast } from 'sonner'

export interface ProjectAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
  contentBase64: string
}

interface UseProjectAttachmentsOptions {
  projectId: string
}

export interface UseProjectAttachmentsReturn {
  // Attachments data
  attachments: ProjectAttachment[]

  // State flags
  isUploading: boolean

  // Actions
  uploadFile: (file: File) => Promise<void>
  downloadFile: (attachment: ProjectAttachment) => void
  deleteFile: (attachmentId: string) => void
}

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
  'text/plain',
]

/**
 * Hook to manage project file attachments
 *
 * @param options - Configuration options
 * @returns Attachments data and CRUD operations
 *
 * @example
 * ```tsx
 * const { attachments, uploadFile, deleteFile, isUploading } = useProjectAttachments({
 *   projectId: '123'
 * })
 *
 * const handleFileSelect = async (file: File) => {
 *   await uploadFile(file)
 * }
 *
 * return (
 *   <FileUpload
 *     onUpload={handleFileSelect}
 *     loading={isUploading}
 *     files={attachments}
 *     onDelete={deleteFile}
 *   />
 * )
 * ```
 */
export function useProjectAttachments({
  projectId,
}: UseProjectAttachmentsOptions): UseProjectAttachmentsReturn {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Load attachments from localStorage
  useEffect(() => {
    try {
      const storageKey = `project-attachments-${projectId}`
      const stored = safeLocalStorage.getItem<string>(storageKey, '')

      if (stored) {
        const parsed = JSON.parse(stored) as ProjectAttachment[]
        setAttachments(Array.isArray(parsed) ? parsed : [])

        console.log('📎 [useProjectAttachments] Loaded attachments:', parsed.length)
      }
    } catch (error) {
      console.warn('⚠️ [useProjectAttachments] Failed to load attachments:', error)
      setAttachments([])
    }
  }, [projectId])

  // Save attachments to localStorage
  const saveAttachments = useCallback(
    (newAttachments: ProjectAttachment[]) => {
      try {
        const storageKey = `project-attachments-${projectId}`
        safeLocalStorage.setItem(storageKey, JSON.stringify(newAttachments))
        setAttachments(newAttachments)

        console.log('💾 [useProjectAttachments] Saved attachments:', newAttachments.length)
      } catch (error) {
        console.error('❌ [useProjectAttachments] Failed to save attachments:', error)
        toast.error('فشل حفظ المرفق')
      }
    },
    [projectId],
  )

  // Upload file
  const uploadFile = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE / 1024 / 1024} ميجابايت)`)
        return
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error('نوع الملف غير مدعوم')
        return
      }

      try {
        setIsUploading(true)

        // Read file as base64
        const contentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()

          reader.onload = () => {
            const result = reader.result as string
            // Remove data:mime/type;base64, prefix
            const base64 = result.split(',')[1] || result
            resolve(base64)
          }

          reader.onerror = () => reject(new Error('Failed to read file'))

          reader.readAsDataURL(file)
        })

        // Create attachment object
        const newAttachment: ProjectAttachment = {
          id: `attachment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          contentBase64,
        }

        // Add to attachments list
        const updatedAttachments = [...attachments, newAttachment]
        saveAttachments(updatedAttachments)

        toast.success('تم رفع الملف بنجاح')

        console.log('✅ [useProjectAttachments] File uploaded:', {
          name: file.name,
          size: file.size,
          type: file.type,
        })
      } catch (error) {
        console.error('❌ [useProjectAttachments] Upload failed:', error)
        toast.error('فشل رفع الملف')
      } finally {
        setIsUploading(false)
      }
    },
    [attachments, saveAttachments],
  )

  // Download file
  const downloadFile = useCallback((attachment: ProjectAttachment) => {
    try {
      // Create blob from base64
      const byteCharacters = atob(attachment.contentBase64)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: attachment.mimeType })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.name

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('تم تنزيل الملف')

      console.log('⬇️ [useProjectAttachments] File downloaded:', attachment.name)
    } catch (error) {
      console.error('❌ [useProjectAttachments] Download failed:', error)
      toast.error('فشل تنزيل الملف')
    }
  }, [])

  // Delete file
  const deleteFile = useCallback(
    (attachmentId: string) => {
      try {
        const updatedAttachments = attachments.filter((a) => a.id !== attachmentId)
        saveAttachments(updatedAttachments)

        toast.success('تم حذف الملف')

        console.log('🗑️ [useProjectAttachments] File deleted:', attachmentId)
      } catch (error) {
        console.error('❌ [useProjectAttachments] Delete failed:', error)
        toast.error('فشل حذف الملف')
      }
    },
    [attachments, saveAttachments],
  )

  return {
    attachments,
    isUploading,
    uploadFile,
    downloadFile,
    deleteFile,
  }
}
