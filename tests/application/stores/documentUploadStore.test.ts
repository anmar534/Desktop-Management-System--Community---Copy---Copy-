/**
 * @fileoverview Tests for documentUploadStore
 * @module tests/stores/documentUploadStore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useDocumentUploadStore,
  documentUploadSelectors,
} from '@/application/stores/documentUploadStore'

describe('documentUploadStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useDocumentUploadStore.getState().reset()
  })

  // Mock file
  const createMockFile = (name = 'test.pdf', type = 'application/pdf', size = 1024): File => {
    const content = new Array(size).fill('a').join('')
    const file = new File([content], name, { type })

    // Ensure size property is set correctly
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false,
    })

    return file
  }

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useDocumentUploadStore.getState()

      expect(state.queue).toEqual([])
      expect(state.currentUploadId).toBeNull()
      expect(state.maxConcurrentUploads).toBe(3)
      expect(state.maxFileSize).toBe(10 * 1024 * 1024) // 10MB
      expect(state.allowedFileTypes).toContain('application/pdf')
      expect(state.autoUpload).toBe(false)
    })
  })

  describe('Queue Operations', () => {
    it('should add file to queue', () => {
      const { addToQueue } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical', 'tender-1')

      const state = useDocumentUploadStore.getState()
      expect(state.queue).toHaveLength(1)
      expect(state.queue[0].id).toBe(id)
      expect(state.queue[0].file).toBe(file)
      expect(state.queue[0].category).toBe('technical')
      expect(state.queue[0].status).toBe('pending')
      expect(state.queue[0].progress).toBe(0)
      expect(state.queue[0].tenderId).toBe('tender-1')
    })

    it('should remove file from queue', () => {
      const { addToQueue, removeFromQueue } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')
      removeFromQueue(id)

      expect(useDocumentUploadStore.getState().queue).toHaveLength(0)
    })

    it('should clear entire queue', () => {
      const { addToQueue, clearQueue } = useDocumentUploadStore.getState()

      addToQueue(createMockFile('file1.pdf'), 'technical')
      addToQueue(createMockFile('file2.pdf'), 'financial')

      clearQueue()

      expect(useDocumentUploadStore.getState().queue).toHaveLength(0)
    })

    it('should clear only completed items', () => {
      const { addToQueue, markAsCompleted, clearCompleted } = useDocumentUploadStore.getState()

      const id1 = addToQueue(createMockFile('file1.pdf'), 'technical')
      const id2 = addToQueue(createMockFile('file2.pdf'), 'financial')

      markAsCompleted(id1)
      clearCompleted()

      const state = useDocumentUploadStore.getState()
      expect(state.queue).toHaveLength(1)
      expect(state.queue[0].id).toBe(id2)
    })
  })

  describe('Upload Operations', () => {
    it('should start upload and update status', async () => {
      const { addToQueue, startUpload } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')

      // Start upload (will complete quickly in test)
      const uploadPromise = startUpload(id)

      // Check that status changed to uploading
      let state = useDocumentUploadStore.getState()
      const item = state.queue.find((q) => q.id === id)
      expect(item?.status).toBe('uploading')

      // Wait for upload to complete
      await uploadPromise

      // Check final status
      state = useDocumentUploadStore.getState()
      const completedItem = state.queue.find((q) => q.id === id)
      expect(completedItem?.status).toBe('completed')
      expect(completedItem?.progress).toBe(100)
    })

    it('should cancel upload', () => {
      const { addToQueue, cancelUpload } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')

      // Manually set to uploading status
      useDocumentUploadStore.setState((state) => {
        const item = state.queue.find((q) => q.id === id)
        if (item) item.status = 'uploading'
      })

      cancelUpload(id)

      const state = useDocumentUploadStore.getState()
      const item = state.queue.find((q) => q.id === id)
      expect(item?.status).toBe('cancelled')
    })

    it('should retry failed upload', async () => {
      const { addToQueue, markAsFailed, retryUpload } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')
      markAsFailed(id, 'Network error')

      expect(useDocumentUploadStore.getState().queue[0].status).toBe('failed')

      await retryUpload(id)

      const state = useDocumentUploadStore.getState()
      expect(state.queue[0].status).toBe('completed') // Retry succeeded
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress', () => {
      const { addToQueue, updateProgress } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')
      updateProgress(id, 50)

      const state = useDocumentUploadStore.getState()
      expect(state.queue[0].progress).toBe(50)
    })

    it('should clamp progress between 0 and 100', () => {
      const { addToQueue, updateProgress } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')

      updateProgress(id, 150)
      expect(useDocumentUploadStore.getState().queue[0].progress).toBe(100)

      updateProgress(id, -10)
      expect(useDocumentUploadStore.getState().queue[0].progress).toBe(0)
    })

    it('should mark as completed', () => {
      const { addToQueue, markAsCompleted } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')
      markAsCompleted(id)

      const state = useDocumentUploadStore.getState()
      expect(state.queue[0].status).toBe('completed')
      expect(state.queue[0].progress).toBe(100)
      expect(state.queue[0].completedAt).toBeDefined()
    })

    it('should mark as failed with error', () => {
      const { addToQueue, markAsFailed } = useDocumentUploadStore.getState()
      const file = createMockFile()

      const id = addToQueue(file, 'technical')
      markAsFailed(id, 'Upload failed')

      const state = useDocumentUploadStore.getState()
      expect(state.queue[0].status).toBe('failed')
      expect(state.queue[0].error).toBe('Upload failed')
    })
  })

  describe('Validation', () => {
    it('should validate file size', () => {
      const { validateFile } = useDocumentUploadStore.getState()

      // Valid file
      const validFile = createMockFile('test.pdf', 'application/pdf', 1024)
      expect(validateFile(validFile).isValid).toBe(true)

      // Too large file
      const largeFile = createMockFile('large.pdf', 'application/pdf', 20 * 1024 * 1024)
      const result = validateFile(largeFile)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('exceeds maximum')
    })

    it('should validate file type', () => {
      const { validateFile } = useDocumentUploadStore.getState()

      // Valid type
      const pdfFile = createMockFile('test.pdf', 'application/pdf', 1024)
      expect(validateFile(pdfFile).isValid).toBe(true)

      // Invalid type
      const invalidFile = createMockFile('test.exe', 'application/x-executable', 1024)
      const result = validateFile(invalidFile)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not allowed')
    })
  })

  describe('Configuration', () => {
    it('should set max concurrent uploads', () => {
      const { setMaxConcurrentUploads } = useDocumentUploadStore.getState()

      setMaxConcurrentUploads(5)

      expect(useDocumentUploadStore.getState().maxConcurrentUploads).toBe(5)
    })

    it('should set max file size', () => {
      const { setMaxFileSize } = useDocumentUploadStore.getState()

      setMaxFileSize(5 * 1024 * 1024) // 5MB

      expect(useDocumentUploadStore.getState().maxFileSize).toBe(5 * 1024 * 1024)
    })

    it('should set allowed file types', () => {
      const { setAllowedFileTypes } = useDocumentUploadStore.getState()

      setAllowedFileTypes(['image/jpeg', 'image/png'])

      const state = useDocumentUploadStore.getState()
      expect(state.allowedFileTypes).toEqual(['image/jpeg', 'image/png'])
    })

    it('should set auto upload', () => {
      const { setAutoUpload } = useDocumentUploadStore.getState()

      setAutoUpload(true)

      expect(useDocumentUploadStore.getState().autoUpload).toBe(true)
    })
  })

  describe('Reset Store', () => {
    it('should reset store to initial state', () => {
      const { addToQueue, setMaxConcurrentUploads, reset } = useDocumentUploadStore.getState()

      addToQueue(createMockFile(), 'technical')
      setMaxConcurrentUploads(5)

      reset()

      const state = useDocumentUploadStore.getState()
      expect(state.queue).toEqual([])
      expect(state.maxConcurrentUploads).toBe(3)
    })
  })

  describe('Selectors', () => {
    beforeEach(() => {
      const { addToQueue, markAsCompleted, markAsFailed, updateProgress } =
        useDocumentUploadStore.getState()

      const id1 = addToQueue(createMockFile('file1.pdf'), 'technical')
      const id2 = addToQueue(createMockFile('file2.pdf'), 'financial')
      const id3 = addToQueue(createMockFile('file3.pdf'), 'technical')

      markAsCompleted(id1)
      markAsFailed(id2, 'Error')
      updateProgress(id3, 50)
    })

    it('getStatistics should return correct statistics', () => {
      const state = useDocumentUploadStore.getState()
      const stats = documentUploadSelectors.getStatistics(state)

      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(1)
      expect(stats.failed).toBe(1)
      expect(stats.pending).toBe(1)
    })

    it('getItemsByStatus should filter by status', () => {
      const state = useDocumentUploadStore.getState()

      const completed = documentUploadSelectors.getItemsByStatus(state, 'completed')
      expect(completed).toHaveLength(1)

      const failed = documentUploadSelectors.getItemsByStatus(state, 'failed')
      expect(failed).toHaveLength(1)
    })

    it('getItemsByCategory should filter by category', () => {
      const state = useDocumentUploadStore.getState()

      const technical = documentUploadSelectors.getItemsByCategory(state, 'technical')
      expect(technical).toHaveLength(2)

      const financial = documentUploadSelectors.getItemsByCategory(state, 'financial')
      expect(financial).toHaveLength(1)
    })

    it('hasActiveUploads should return false when no uploads are active', () => {
      const state = useDocumentUploadStore.getState()

      expect(documentUploadSelectors.hasActiveUploads(state)).toBe(false)
    })

    it('isQueueEmpty should return false when queue has items', () => {
      const state = useDocumentUploadStore.getState()

      expect(documentUploadSelectors.isQueueEmpty(state)).toBe(false)
    })

    it('isQueueEmpty should return true when queue is empty', () => {
      useDocumentUploadStore.getState().clearQueue()
      const state = useDocumentUploadStore.getState()

      expect(documentUploadSelectors.isQueueEmpty(state)).toBe(true)
    })

    it('getFailedUploads should return only failed items', () => {
      const state = useDocumentUploadStore.getState()
      const failed = documentUploadSelectors.getFailedUploads(state)

      expect(failed).toHaveLength(1)
      expect(failed[0].status).toBe('failed')
    })

    it('getPendingCount should return count of pending uploads', () => {
      const state = useDocumentUploadStore.getState()

      expect(documentUploadSelectors.getPendingCount(state)).toBe(1)
    })

    it('canUploadMore should check against concurrent limit', () => {
      const state = useDocumentUploadStore.getState()

      // No uploads in progress, should be able to upload more
      expect(documentUploadSelectors.canUploadMore(state)).toBe(true)
    })

    it('canUploadMore should return false when at limit', () => {
      // Add 3 uploading items (max concurrent is 3)
      const { addToQueue } = useDocumentUploadStore.getState()

      const id1 = addToQueue(createMockFile('a.pdf'), 'technical')
      const id2 = addToQueue(createMockFile('b.pdf'), 'technical')
      const id3 = addToQueue(createMockFile('c.pdf'), 'technical')

      // Set all to uploading
      useDocumentUploadStore.setState((state) => {
        state.queue.forEach((item) => {
          if ([id1, id2, id3].includes(item.id)) {
            item.status = 'uploading'
          }
        })
      })

      const state = useDocumentUploadStore.getState()
      expect(documentUploadSelectors.canUploadMore(state)).toBe(false)
    })
  })

  describe('Auto Upload', () => {
    it('should auto-upload when enabled', async () => {
      const { setAutoUpload, addToQueue } = useDocumentUploadStore.getState()

      setAutoUpload(true)

      const file = createMockFile()
      const id = addToQueue(file, 'technical')

      // Wait a bit for auto-upload to start
      await new Promise((resolve) => setTimeout(resolve, 50))

      const state = useDocumentUploadStore.getState()
      const item = state.queue.find((q) => q.id === id)

      // Should be uploading or completed
      expect(['uploading', 'completed']).toContain(item?.status)
    })
  })
})
