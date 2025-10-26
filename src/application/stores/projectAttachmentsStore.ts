/**
 * 📎 Project Attachments Store - File Management
 * Zustand store for managing project attachments and file uploads
 *
 * Features:
 * - Attachments list management
 * - File upload with progress tracking
 * - File operations (download, delete)
 * - File metadata and categorization
 * - Storage size calculations
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ProjectAttachment {
  id: string
  projectId: string
  name: string
  filename: string
  size: number
  type: string
  category: string
  uploadedAt: string
  uploadedBy?: string
  path?: string
  url?: string
}

export interface UploadProgress {
  fileId: string
  filename: string
  progress: number
  uploaded: number
  total: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface ProjectAttachmentsStore {
  // State - Attachments
  attachments: ProjectAttachment[]
  loading: boolean
  error: string | null

  // State - Upload
  uploads: UploadProgress[]
  isUploading: boolean

  // Actions - Attachments
  setAttachments: (attachments: ProjectAttachment[]) => void
  addAttachment: (attachment: ProjectAttachment) => void
  updateAttachment: (id: string, updates: Partial<ProjectAttachment>) => void
  removeAttachment: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Actions - Upload
  startUpload: (fileId: string, filename: string, size: number) => void
  updateUploadProgress: (fileId: string, progress: number, uploaded: number) => void
  completeUpload: (fileId: string, attachment: ProjectAttachment) => void
  failUpload: (fileId: string, error: string) => void
  cancelUpload: (fileId: string) => void
  clearUploads: () => void

  // Computed Selectors
  getAttachmentById: (id: string) => ProjectAttachment | undefined
  getAttachmentsByCategory: (category: string) => ProjectAttachment[]
  getAttachmentsByType: (type: string) => ProjectAttachment[]
  getTotalSize: () => number
  getFormattedTotalSize: () => string
  getAttachmentCount: () => number
  getActiveUploads: () => UploadProgress[]
  getCompletedUploads: () => UploadProgress[]
  getFailedUploads: () => UploadProgress[]
  getTotalUploadProgress: () => number

  // Utilities
  reset: () => void
  formatFileSize: (bytes: number) => string
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  attachments: [],
  loading: false,
  error: null,
  uploads: [],
  isUploading: false,
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectAttachmentsStore = create<ProjectAttachmentsStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================================================
      // Attachments Actions
      // ========================================================================

      setAttachments: (attachments) => {
        set((state) => {
          state.attachments = attachments
          state.error = null
        })
      },

      addAttachment: (attachment) => {
        set((state) => {
          state.attachments.push(attachment)
          state.error = null
        })
      },

      updateAttachment: (id, updates) => {
        set((state) => {
          const index = state.attachments.findIndex((a) => a.id === id)
          if (index !== -1) {
            state.attachments[index] = { ...state.attachments[index], ...updates }
          }
        })
      },

      removeAttachment: (id) => {
        set((state) => {
          state.attachments = state.attachments.filter((a) => a.id !== id)
        })
      },

      setLoading: (loading) => {
        set((state) => {
          state.loading = loading
        })
      },

      setError: (error) => {
        set((state) => {
          state.error = error
        })
      },

      clearError: () => {
        set((state) => {
          state.error = null
        })
      },

      // ========================================================================
      // Upload Actions
      // ========================================================================

      startUpload: (fileId, filename, size) => {
        set((state) => {
          state.uploads.push({
            fileId,
            filename,
            progress: 0,
            uploaded: 0,
            total: size,
            status: 'uploading',
          })
          state.isUploading = true
        })
      },

      updateUploadProgress: (fileId, progress, uploaded) => {
        set((state) => {
          const upload = state.uploads.find((u) => u.fileId === fileId)
          if (upload) {
            upload.progress = progress
            upload.uploaded = uploaded
          }
        })
      },

      completeUpload: (fileId, attachment) => {
        set((state) => {
          const upload = state.uploads.find((u) => u.fileId === fileId)
          if (upload) {
            upload.status = 'completed'
            upload.progress = 100
            upload.uploaded = upload.total
          }

          state.attachments.push(attachment)

          // Check if all uploads are done
          const hasActiveUploads = state.uploads.some(
            (u) => u.status === 'uploading' || u.status === 'pending',
          )
          state.isUploading = hasActiveUploads
        })
      },

      failUpload: (fileId, error) => {
        set((state) => {
          const upload = state.uploads.find((u) => u.fileId === fileId)
          if (upload) {
            upload.status = 'error'
            upload.error = error
          }

          // Check if all uploads are done
          const hasActiveUploads = state.uploads.some(
            (u) => u.status === 'uploading' || u.status === 'pending',
          )
          state.isUploading = hasActiveUploads
        })
      },

      cancelUpload: (fileId) => {
        set((state) => {
          state.uploads = state.uploads.filter((u) => u.fileId !== fileId)

          // Check if all uploads are done
          const hasActiveUploads = state.uploads.some(
            (u) => u.status === 'uploading' || u.status === 'pending',
          )
          state.isUploading = hasActiveUploads
        })
      },

      clearUploads: () => {
        set((state) => {
          state.uploads = []
          state.isUploading = false
        })
      },

      // ========================================================================
      // Computed Selectors
      // ========================================================================

      getAttachmentById: (id) => {
        return get().attachments.find((a) => a.id === id)
      },

      getAttachmentsByCategory: (category) => {
        return get().attachments.filter((a) => a.category === category)
      },

      getAttachmentsByType: (type) => {
        return get().attachments.filter((a) => a.type.includes(type))
      },

      getTotalSize: () => {
        return get().attachments.reduce((total, attachment) => {
          return total + (attachment.size || 0)
        }, 0)
      },

      getFormattedTotalSize: () => {
        const totalBytes = get().getTotalSize()
        return formatBytes(totalBytes)
      },

      getAttachmentCount: () => {
        return get().attachments.length
      },

      getActiveUploads: () => {
        return get().uploads.filter((u) => u.status === 'uploading' || u.status === 'pending')
      },

      getCompletedUploads: () => {
        return get().uploads.filter((u) => u.status === 'completed')
      },

      getFailedUploads: () => {
        return get().uploads.filter((u) => u.status === 'error')
      },

      getTotalUploadProgress: () => {
        const { uploads } = get()
        if (uploads.length === 0) return 0

        const totalProgress = uploads.reduce((sum, upload) => {
          return sum + upload.progress
        }, 0)

        return totalProgress / uploads.length
      },

      // ========================================================================
      // Utilities
      // ========================================================================

      formatFileSize: (bytes) => {
        return formatBytes(bytes)
      },

      reset: () => {
        set(initialState)
      },
    })),
    { name: 'ProjectAttachmentsStore' },
  ),
)
