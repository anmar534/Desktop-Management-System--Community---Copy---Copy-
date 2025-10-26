/**
 * useProjectAttachments Hook
 *
 * Custom hook for managing project attachments and file uploads.
 * Handles file operations, upload progress, and storage management.
 */

import { useCallback } from 'react'
import { useProjectAttachmentsStore } from '@/application/stores/projectAttachmentsStore'
import type { ProjectAttachment } from '@/application/stores/projectAttachmentsStore'

export interface UseProjectAttachmentsReturn {
  // State
  attachments: ProjectAttachment[]
  uploads: any[] // UploadProgress[]
  isUploading: boolean
  loading: boolean
  error: string | null

  // Actions
  loadAttachments: (projectId: string) => Promise<void>
  uploadFile: (file: File, projectId: string, category?: string) => Promise<void>
  deleteAttachment: (id: string) => Promise<void>
  cancelUpload: (fileId: string) => void
  clearUploads: () => void
  clearError: () => void

  // Selectors
  getAttachmentById: (id: string) => ProjectAttachment | undefined
  getAttachmentsByCategory: (category: string) => ProjectAttachment[]
  getAttachmentsByType: (type: string) => ProjectAttachment[]
  getTotalSize: () => number
  getFormattedTotalSize: () => string
  getAttachmentCount: () => number
  getActiveUploads: () => any[] // UploadProgress[]
  getTotalUploadProgress: () => number
}

export function useProjectAttachments(): UseProjectAttachmentsReturn {
  const {
    attachments,
    uploads,
    isUploading,
    loading,
    error,
    setAttachments,
    startUpload,
    updateUploadProgress,
    completeUpload,
    failUpload,
    cancelUpload: storeCancelUpload,
    clearUploads: storeClearUploads,
    clearError: storeClearError,
    getAttachmentById: storeGetAttachmentById,
    getAttachmentsByCategory: storeGetAttachmentsByCategory,
    getAttachmentsByType: storeGetAttachmentsByType,
    getTotalSize: storeGetTotalSize,
    getFormattedTotalSize: storeGetFormattedTotalSize,
    getAttachmentCount: storeGetAttachmentCount,
    getActiveUploads: storeGetActiveUploads,
    getTotalUploadProgress: storeGetTotalUploadProgress,
    removeAttachment,
    setLoading,
    setError,
  } = useProjectAttachmentsStore()

  // Actions
  const loadAttachments = useCallback(
    async (projectId: string) => {
      setLoading(true)
      try {
        // Simulate loading attachments from API
        // In real implementation, call API here
        await new Promise((resolve) => setTimeout(resolve, 500))
        setAttachments([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attachments')
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setAttachments, setError],
  )

  const uploadFile = useCallback(
    async (file: File, projectId: string, category = 'general') => {
      const fileId = `file-${Date.now()}`

      try {
        startUpload(fileId, file.name, file.size)

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          updateUploadProgress(fileId, i, (file.size * i) / 100)
        }

        // Create attachment record
        const attachment: ProjectAttachment = {
          id: `att-${Date.now()}`,
          projectId,
          name: file.name,
          filename: file.name,
          size: file.size,
          type: file.type,
          category,
          uploadedAt: new Date().toISOString(),
        }

        completeUpload(fileId, attachment)
      } catch (err) {
        failUpload(fileId, err instanceof Error ? err.message : 'Upload failed')
      }
    },
    [startUpload, updateUploadProgress, completeUpload, failUpload],
  )

  const deleteAttachment = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300))
        removeAttachment(id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete attachment')
      } finally {
        setLoading(false)
      }
    },
    [setLoading, removeAttachment, setError],
  )

  const cancelUpload = useCallback(
    (fileId: string) => {
      storeCancelUpload(fileId)
    },
    [storeCancelUpload],
  )

  const clearUploads = useCallback(() => {
    storeClearUploads()
  }, [storeClearUploads])

  const clearError = useCallback(() => {
    storeClearError()
  }, [storeClearError])

  // Selectors
  const getAttachmentById = useCallback(
    (id: string) => {
      return storeGetAttachmentById(id)
    },
    [storeGetAttachmentById],
  )

  const getAttachmentsByCategory = useCallback(
    (category: string) => {
      return storeGetAttachmentsByCategory(category)
    },
    [storeGetAttachmentsByCategory],
  )

  const getAttachmentsByType = useCallback(
    (type: string) => {
      return storeGetAttachmentsByType(type)
    },
    [storeGetAttachmentsByType],
  )

  const getTotalSize = useCallback(() => {
    return storeGetTotalSize()
  }, [storeGetTotalSize])

  const getFormattedTotalSize = useCallback(() => {
    return storeGetFormattedTotalSize()
  }, [storeGetFormattedTotalSize])

  const getAttachmentCount = useCallback(() => {
    return storeGetAttachmentCount()
  }, [storeGetAttachmentCount])

  const getActiveUploads = useCallback(() => {
    return storeGetActiveUploads()
  }, [storeGetActiveUploads])

  const getTotalUploadProgress = useCallback(() => {
    return storeGetTotalUploadProgress()
  }, [storeGetTotalUploadProgress])

  return {
    // State
    attachments,
    uploads,
    isUploading,
    loading,
    error,

    // Actions
    loadAttachments,
    uploadFile,
    deleteAttachment,
    cancelUpload,
    clearUploads,
    clearError,

    // Selectors
    getAttachmentById,
    getAttachmentsByCategory,
    getAttachmentsByType,
    getTotalSize,
    getFormattedTotalSize,
    getAttachmentCount,
    getActiveUploads,
    getTotalUploadProgress,
  }
}
