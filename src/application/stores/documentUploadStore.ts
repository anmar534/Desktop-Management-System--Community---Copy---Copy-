/**
 * @fileoverview Zustand store for managing document upload queue
 * @module stores/documentUploadStore
 *
 * This store centralizes state management for document uploads, including:
 * - Upload queue management
 * - Progress tracking per file
 * - Validation and error handling
 * - File metadata management
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * Upload status for each file
 */
export type UploadStatus =
  | 'pending' // Waiting to be uploaded
  | 'uploading' // Currently uploading
  | 'completed' // Successfully uploaded
  | 'failed' // Upload failed
  | 'cancelled' // Upload cancelled

/**
 * File type categories
 */
export type FileCategory =
  | 'technical' // Technical specifications
  | 'financial' // Financial documents
  | 'legal' // Legal documents
  | 'specifications' // Tender specifications
  | 'other' // Other documents

/**
 * Upload queue item
 */
export interface UploadQueueItem {
  /** Unique identifier */
  id: string

  /** File object */
  file: File

  /** File category */
  category: FileCategory

  /** Upload status */
  status: UploadStatus

  /** Upload progress (0-100) */
  progress: number

  /** Error message if failed */
  error?: string

  /** Upload start time */
  startedAt?: string

  /** Upload completion time */
  completedAt?: string

  /** Associated tender ID */
  tenderId?: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether file is valid */
  isValid: boolean

  /** Error message if invalid */
  error?: string
}

/**
 * Upload statistics
 */
export interface UploadStatistics {
  /** Total files in queue */
  total: number

  /** Pending files */
  pending: number

  /** Uploading files */
  uploading: number

  /** Completed files */
  completed: number

  /** Failed files */
  failed: number

  /** Cancelled files */
  cancelled: number

  /** Overall progress percentage */
  overallProgress: number
}

/**
 * State structure for document upload
 */
export interface DocumentUploadState {
  /** Upload queue */
  queue: UploadQueueItem[]

  /** Currently uploading item ID */
  currentUploadId: string | null

  /** Maximum concurrent uploads */
  maxConcurrentUploads: number

  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize: number

  /** Allowed file types */
  allowedFileTypes: string[]

  /** Auto-upload flag */
  autoUpload: boolean
}

/**
 * Actions for document upload store
 */
export interface DocumentUploadActions {
  // Queue operations
  addToQueue: (file: File, category: FileCategory, tenderId?: string) => string
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  clearCompleted: () => void

  // Upload operations
  startUpload: (id: string) => Promise<void>
  cancelUpload: (id: string) => void
  retryUpload: (id: string) => Promise<void>
  uploadAll: () => Promise<void>

  // Progress tracking
  updateProgress: (id: string, progress: number) => void
  markAsCompleted: (id: string) => void
  markAsFailed: (id: string, error: string) => void

  // Validation
  validateFile: (file: File) => ValidationResult

  // Configuration
  setMaxConcurrentUploads: (max: number) => void
  setMaxFileSize: (size: number) => void
  setAllowedFileTypes: (types: string[]) => void
  setAutoUpload: (enabled: boolean) => void

  // Reset store
  reset: () => void
}

/**
 * Combined store type
 */
export type DocumentUploadStore = DocumentUploadState & DocumentUploadActions

/**
 * Initial state
 */
const initialState: DocumentUploadState = {
  queue: [],
  currentUploadId: null,
  maxConcurrentUploads: 3,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  autoUpload: false,
}

/**
 * Generate unique ID for upload items
 */
function generateId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Document upload store
 * Manages upload queue with progress tracking and validation
 */
export const useDocumentUploadStore = create<DocumentUploadStore>()(
  immer((set, get) => ({
    ...initialState,

    // Queue operations
    addToQueue: (file, category, tenderId) => {
      const id = generateId()

      set((state) => {
        state.queue.push({
          id,
          file,
          category,
          status: 'pending',
          progress: 0,
          tenderId,
        })
      })

      // Auto-upload if enabled
      if (get().autoUpload) {
        get().startUpload(id)
      }

      return id
    },

    removeFromQueue: (id) => {
      set((state) => {
        const index = state.queue.findIndex((item) => item.id === id)
        if (index !== -1) {
          state.queue.splice(index, 1)
        }

        // Clear current upload if it's the removed item
        if (state.currentUploadId === id) {
          state.currentUploadId = null
        }
      })
    },

    clearQueue: () => {
      set((state) => {
        state.queue = []
        state.currentUploadId = null
      })
    },

    clearCompleted: () => {
      set((state) => {
        state.queue = state.queue.filter((item) => item.status !== 'completed')
      })
    },

    // Upload operations
    startUpload: async (id) => {
      const item = get().queue.find((q) => q.id === id)
      if (!item || item.status === 'uploading') {
        return
      }

      set((state) => {
        const queueItem = state.queue.find((q) => q.id === id)
        if (queueItem) {
          queueItem.status = 'uploading'
          queueItem.startedAt = new Date().toISOString()
          queueItem.progress = 0
        }
        state.currentUploadId = id
      })

      try {
        // TODO: Implement actual upload logic
        // Simulate upload with progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          get().updateProgress(id, progress)
        }

        get().markAsCompleted(id)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        get().markAsFailed(id, errorMessage)
      } finally {
        set((state) => {
          if (state.currentUploadId === id) {
            state.currentUploadId = null
          }
        })
      }
    },

    cancelUpload: (id) => {
      set((state) => {
        const item = state.queue.find((q) => q.id === id)
        if (item && item.status === 'uploading') {
          item.status = 'cancelled'
          item.progress = 0
        }

        if (state.currentUploadId === id) {
          state.currentUploadId = null
        }
      })
    },

    retryUpload: async (id) => {
      const item = get().queue.find((q) => q.id === id)
      if (!item || item.status !== 'failed') {
        return
      }

      set((state) => {
        const queueItem = state.queue.find((q) => q.id === id)
        if (queueItem) {
          queueItem.status = 'pending'
          queueItem.progress = 0
          queueItem.error = undefined
        }
      })

      await get().startUpload(id)
    },

    uploadAll: async () => {
      const pendingItems = get().queue.filter((item) => item.status === 'pending')

      for (const item of pendingItems) {
        await get().startUpload(item.id)
      }
    },

    // Progress tracking
    updateProgress: (id, progress) => {
      set((state) => {
        const item = state.queue.find((q) => q.id === id)
        if (item) {
          item.progress = Math.min(100, Math.max(0, progress))
        }
      })
    },

    markAsCompleted: (id) => {
      set((state) => {
        const item = state.queue.find((q) => q.id === id)
        if (item) {
          item.status = 'completed'
          item.progress = 100
          item.completedAt = new Date().toISOString()
        }
      })
    },

    markAsFailed: (id, error) => {
      set((state) => {
        const item = state.queue.find((q) => q.id === id)
        if (item) {
          item.status = 'failed'
          item.error = error
        }
      })
    },

    // Validation
    validateFile: (file) => {
      const { maxFileSize, allowedFileTypes } = get()

      // Check file size
      if (file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2)
        return {
          isValid: false,
          error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
        }
      }

      // Check file type
      if (!allowedFileTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `File type ${file.type} is not allowed`,
        }
      }

      return { isValid: true }
    },

    // Configuration
    setMaxConcurrentUploads: (max) => {
      set((state) => {
        state.maxConcurrentUploads = max
      })
    },

    setMaxFileSize: (size) => {
      set((state) => {
        state.maxFileSize = size
      })
    },

    setAllowedFileTypes: (types) => {
      set((state) => {
        state.allowedFileTypes = types
      })
    },

    setAutoUpload: (enabled) => {
      set((state) => {
        state.autoUpload = enabled
      })
    },

    // Reset store
    reset: () => {
      set(initialState)
    },
  })),
)

/**
 * Selectors for common state access patterns
 */
export const documentUploadSelectors = {
  /**
   * Get upload statistics
   */
  getStatistics: (state: DocumentUploadStore): UploadStatistics => {
    const total = state.queue.length
    const pending = state.queue.filter((q) => q.status === 'pending').length
    const uploading = state.queue.filter((q) => q.status === 'uploading').length
    const completed = state.queue.filter((q) => q.status === 'completed').length
    const failed = state.queue.filter((q) => q.status === 'failed').length
    const cancelled = state.queue.filter((q) => q.status === 'cancelled').length

    const overallProgress =
      total > 0 ? state.queue.reduce((sum, item) => sum + item.progress, 0) / total : 0

    return {
      total,
      pending,
      uploading,
      completed,
      failed,
      cancelled,
      overallProgress: Math.round(overallProgress),
    }
  },

  /**
   * Get items by status
   */
  getItemsByStatus: (state: DocumentUploadStore, status: UploadStatus) => {
    return state.queue.filter((item) => item.status === status)
  },

  /**
   * Get items by category
   */
  getItemsByCategory: (state: DocumentUploadStore, category: FileCategory) => {
    return state.queue.filter((item) => item.category === category)
  },

  /**
   * Check if any uploads are in progress
   */
  hasActiveUploads: (state: DocumentUploadStore) => {
    return state.queue.some((item) => item.status === 'uploading')
  },

  /**
   * Check if queue is empty
   */
  isQueueEmpty: (state: DocumentUploadStore) => {
    return state.queue.length === 0
  },

  /**
   * Get failed uploads
   */
  getFailedUploads: (state: DocumentUploadStore) => {
    return state.queue.filter((item) => item.status === 'failed')
  },

  /**
   * Get pending uploads count
   */
  getPendingCount: (state: DocumentUploadStore) => {
    return state.queue.filter((item) => item.status === 'pending').length
  },

  /**
   * Check if can upload more (based on concurrent limit)
   */
  canUploadMore: (state: DocumentUploadStore) => {
    const uploadingCount = state.queue.filter((q) => q.status === 'uploading').length
    return uploadingCount < state.maxConcurrentUploads
  },
}
