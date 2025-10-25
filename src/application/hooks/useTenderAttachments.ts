/**
 * useTenderAttachments Hook
 *
 * Centralized hook for managing tender attachments and technical files.
 * Provides upload, delete, download, and filtering capabilities.
 *
 * @module application/hooks/useTenderAttachments
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { FileUploadService } from '@/shared/utils/fileUploadService'
import type { UploadedFile } from '@/shared/utils/fileUploadService'
import type { Tender } from '@/data/centralData'

// ============================================================================
// Types
// ============================================================================

/**
 * Attachment type categories
 */
export type AttachmentType =
  | 'specifications' // كراسة الشروط
  | 'quantity' // جدول الكميات
  | 'technical' // ملفات فنية
  | 'financial' // ملفات مالية
  | 'legal' // ملفات قانونية
  | 'other' // أخرى

/**
 * Enhanced attachment item with metadata
 */
export interface AttachmentItem extends UploadedFile {
  /** Attachment type category */
  attachmentType?: AttachmentType
  /** Source of attachment (original/technical) */
  source?: 'original' | 'technical'
}

/**
 * Attachment statistics
 */
export interface AttachmentStats {
  /** Total number of attachments */
  total: number
  /** Number of technical files */
  technical: number
  /** Number of original attachments */
  original: number
  /** Total size in bytes */
  totalSize: number
  /** Formatted total size */
  formattedTotalSize: string
}

/**
 * Attachment filters
 */
export interface AttachmentFilters {
  /** Filter by type */
  type?: AttachmentType
  /** Filter by source */
  source?: 'original' | 'technical'
  /** Search by name */
  searchQuery?: string
}

/**
 * Hook return type
 */
export interface UseTenderAttachmentsReturn {
  /** All attachments */
  attachments: AttachmentItem[]
  /** Technical files only */
  technicalFiles: AttachmentItem[]
  /** Original attachments only */
  originalAttachments: AttachmentItem[]
  /** Filtered attachments */
  filteredAttachments: AttachmentItem[]
  /** Attachment statistics */
  stats: AttachmentStats
  /** Upload state */
  isUploading: boolean
  /** Delete state */
  isDeleting: boolean
  /** Active filters */
  filters: AttachmentFilters

  // Actions
  /** Upload a file */
  uploadAttachment: (file: File, type?: AttachmentType) => Promise<AttachmentItem>
  /** Delete an attachment */
  deleteAttachment: (id: string) => Promise<boolean>
  /** Download an attachment */
  downloadAttachment: (id: string) => Promise<void>
  /** Refresh attachments list */
  refreshAttachments: () => void

  // Filters
  /** Set filters */
  setFilters: (filters: Partial<AttachmentFilters>) => void
  /** Clear all filters */
  clearFilters: () => void
  /** Search attachments */
  searchAttachments: (query: string) => void

  // Validation
  /** Check if can submit (has required attachments) */
  canSubmit: boolean
  /** Check if has technical files */
  hasTechnicalFiles: boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing tender attachments
 *
 * @param tender - The tender to manage attachments for
 * @param originalAttachments - Original attachments from tender data
 * @returns Attachment management utilities
 *
 * @example
 * ```tsx
 * const {
 *   attachments,
 *   technicalFiles,
 *   uploadAttachment,
 *   deleteAttachment,
 *   stats
 * } = useTenderAttachments(tender, tender.attachments);
 *
 * // Upload a file
 * const handleUpload = async (file: File) => {
 *   try {
 *     const uploaded = await uploadAttachment(file, 'technical');
 *     console.log('Uploaded:', uploaded.name);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 *
 * // Filter technical files
 * const techFiles = technicalFiles.filter(f => f.size < 1000000);
 * ```
 */
export function useTenderAttachments(
  tender: Tender,
  originalAttachments: unknown[] = [],
): UseTenderAttachmentsReturn {
  // State
  const [technicalFilesState, setTechnicalFilesState] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filters, setFiltersState] = useState<AttachmentFilters>({})

  // Load technical files on mount and when tender changes
  const refreshAttachments = useCallback(() => {
    try {
      const files = FileUploadService.getFilesByTender(tender.id)
      setTechnicalFilesState(files)
    } catch (error) {
      console.error('Error loading attachments:', error)
      setTechnicalFilesState([])
    }
  }, [tender.id])

  useEffect(() => {
    refreshAttachments()
  }, [refreshAttachments])

  // Combine original and technical attachments
  const attachments = useMemo((): AttachmentItem[] => {
    const original: AttachmentItem[] = (originalAttachments || []).map((att: unknown) => {
      const attachment = att as Record<string, unknown>
      return {
        id: (attachment.id as string) || `orig-${Date.now()}`,
        name: (attachment.name as string) || 'Unnamed',
        type: (attachment.type as string) || 'application/octet-stream',
        size: (attachment.size as number) || 0,
        content: (attachment.content as string) || '',
        uploadDate:
          (attachment.uploadDate as string) ||
          (attachment.uploadedAt as string) ||
          new Date().toISOString(),
        tenderId: tender.id,
        source: 'original' as const,
        attachmentType:
          (attachment.attachmentType as AttachmentType) || ('other' as AttachmentType),
      }
    })

    const technical: AttachmentItem[] = technicalFilesState.map((file) => ({
      ...file,
      source: 'technical' as const,
      attachmentType: 'technical' as AttachmentType,
    }))

    return [...original, ...technical]
  }, [originalAttachments, technicalFilesState, tender.id])

  // Filter technical files only
  const technicalFiles = useMemo(
    () => attachments.filter((att) => att.source === 'technical'),
    [attachments],
  )

  // Filter original attachments only
  const originalAttachmentsFiltered = useMemo(
    () => attachments.filter((att) => att.source === 'original'),
    [attachments],
  )

  // Apply filters
  const filteredAttachments = useMemo(() => {
    let result = attachments

    // Filter by type
    if (filters.type) {
      result = result.filter((att) => att.attachmentType === filters.type)
    }

    // Filter by source
    if (filters.source) {
      result = result.filter((att) => att.source === filters.source)
    }

    // Search by name
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter((att) => att.name.toLowerCase().includes(query))
    }

    return result
  }, [attachments, filters])

  // Calculate statistics
  const stats = useMemo((): AttachmentStats => {
    const total = attachments.length
    const technical = technicalFiles.length
    const original = originalAttachmentsFiltered.length
    const totalSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0)

    return {
      total,
      technical,
      original,
      totalSize,
      formattedTotalSize: FileUploadService.formatFileSize(totalSize),
    }
  }, [attachments, technicalFiles.length, originalAttachmentsFiltered.length])

  // Upload attachment
  const uploadAttachment = useCallback(
    async (file: File, type: AttachmentType = 'technical'): Promise<AttachmentItem> => {
      setIsUploading(true)

      try {
        const uploadedFile = await FileUploadService.uploadFile(file, tender.id)

        const attachmentItem: AttachmentItem = {
          ...uploadedFile,
          source: 'technical',
          attachmentType: type,
        }

        // Refresh list
        refreshAttachments()

        return attachmentItem
      } finally {
        setIsUploading(false)
      }
    },
    [tender.id, refreshAttachments],
  )

  // Delete attachment
  const deleteAttachment = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeleting(true)

      try {
        const success = FileUploadService.deleteFile(id)

        if (success) {
          // Refresh list
          refreshAttachments()
        }

        return success
      } catch (error) {
        console.error('Error deleting attachment:', error)
        return false
      } finally {
        setIsDeleting(false)
      }
    },
    [refreshAttachments],
  )

  // Download attachment
  const downloadAttachment = useCallback(
    async (id: string): Promise<void> => {
      const attachment = attachments.find((att) => att.id === id)

      if (!attachment) {
        throw new Error('Attachment not found')
      }

      try {
        await FileUploadService.downloadFile(attachment)
      } catch (error) {
        throw new Error(`Failed to download: ${(error as Error).message}`)
      }
    },
    [attachments],
  )

  // Set filters
  const setFilters = useCallback((newFilters: Partial<AttachmentFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFiltersState({})
  }, [])

  // Search attachments
  const searchAttachments = useCallback((query: string) => {
    setFiltersState((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  // Validation: can submit if has technical files
  const hasTechnicalFiles = technicalFiles.length > 0
  const canSubmit = hasTechnicalFiles

  return {
    attachments,
    technicalFiles,
    originalAttachments: originalAttachmentsFiltered,
    filteredAttachments,
    stats,
    isUploading,
    isDeleting,
    filters,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    refreshAttachments,
    setFilters,
    clearFilters,
    searchAttachments,
    canSubmit,
    hasTechnicalFiles,
  }
}

// ============================================================================
// Standalone Utility Functions
// ============================================================================

/**
 * Get attachment icon based on file type
 */
export function getAttachmentIcon(fileType: string): string {
  return FileUploadService.getFileIcon(fileType)
}

/**
 * Format file size for display
 */
export function formatAttachmentSize(bytes: number): string {
  return FileUploadService.formatFileSize(bytes)
}

/**
 * Check if file type is allowed
 */
export function isAttachmentTypeAllowed(file: File): boolean {
  return FileUploadService.isFileTypeAllowed(file)
}

/**
 * Check if file size is valid
 */
export function isAttachmentSizeValid(file: File): boolean {
  return FileUploadService.isFileSizeValid(file)
}

/**
 * Validate attachment before upload
 */
export function validateAttachment(file: File): { valid: boolean; error?: string } {
  if (!isAttachmentTypeAllowed(file)) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. الملفات المدعومة: Word, Excel, PowerPoint, PDF',
    }
  }

  if (!isAttachmentSizeValid(file)) {
    return {
      valid: false,
      error: 'حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت',
    }
  }

  return { valid: true }
}
