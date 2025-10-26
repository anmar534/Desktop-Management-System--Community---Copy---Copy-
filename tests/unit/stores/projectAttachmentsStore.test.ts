/**
 * Tests for projectAttachmentsStore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectAttachmentsStore } from '@/application/stores/projectAttachmentsStore'
import type { ProjectAttachment } from '@/application/stores/projectAttachmentsStore'

// Mock data
const mockAttachments: ProjectAttachment[] = [
  {
    id: 'att-1',
    projectId: 'proj-1',
    name: 'Contract Document',
    filename: 'contract.pdf',
    size: 1024000,
    type: 'application/pdf',
    category: 'contract',
    uploadedAt: '2025-01-01',
  },
  {
    id: 'att-2',
    projectId: 'proj-1',
    name: 'Project Photo',
    filename: 'photo.jpg',
    size: 2048000,
    type: 'image/jpeg',
    category: 'photos',
    uploadedAt: '2025-01-15',
  },
]

describe('projectAttachmentsStore', () => {
  beforeEach(() => {
    useProjectAttachmentsStore.getState().reset()
  })

  // ========================================================================
  // Initial State
  // ========================================================================

  describe('Initial State', () => {
    it('should have empty attachments', () => {
      const { attachments } = useProjectAttachmentsStore.getState()
      expect(attachments).toEqual([])
    })

    it('should not be uploading', () => {
      const { isUploading } = useProjectAttachmentsStore.getState()
      expect(isUploading).toBe(false)
    })

    it('should have no uploads', () => {
      const { uploads } = useProjectAttachmentsStore.getState()
      expect(uploads).toEqual([])
    })
  })

  // ========================================================================
  // Attachments Actions
  // ========================================================================

  describe('setAttachments', () => {
    it('should set attachments', () => {
      const store = useProjectAttachmentsStore.getState()
      store.setAttachments(mockAttachments)

      expect(store.attachments).toHaveLength(2)
    })

    it('should clear error', () => {
      const store = useProjectAttachmentsStore.getState()
      store.setError('Test error')
      store.setAttachments(mockAttachments)

      expect(store.error).toBeNull()
    })
  })

  describe('addAttachment', () => {
    it('should add attachment', () => {
      const store = useProjectAttachmentsStore.getState()
      store.addAttachment(mockAttachments[0])

      expect(store.attachments).toHaveLength(1)
      expect(store.attachments[0].id).toBe('att-1')
    })
  })

  describe('updateAttachment', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should update attachment', () => {
      const store = useProjectAttachmentsStore.getState()
      store.updateAttachment('att-1', { name: 'Updated Contract' })

      expect(store.attachments[0].name).toBe('Updated Contract')
    })

    it('should handle non-existent attachment', () => {
      const store = useProjectAttachmentsStore.getState()
      expect(() => {
        store.updateAttachment('non-existent', { name: 'Test' })
      }).not.toThrow()
    })
  })

  describe('removeAttachment', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should remove attachment', () => {
      const store = useProjectAttachmentsStore.getState()
      store.removeAttachment('att-1')

      expect(store.attachments).toHaveLength(1)
      expect(store.attachments[0].id).toBe('att-2')
    })
  })

  // ========================================================================
  // Upload Actions
  // ========================================================================

  describe('startUpload', () => {
    it('should start new upload', () => {
      const store = useProjectAttachmentsStore.getState()
      store.startUpload('file-1', 'test.pdf', 1000)

      expect(store.uploads).toHaveLength(1)
      expect(store.uploads[0].filename).toBe('test.pdf')
      expect(store.uploads[0].status).toBe('uploading')
      expect(store.isUploading).toBe(true)
    })
  })

  describe('updateUploadProgress', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().startUpload('file-1', 'test.pdf', 1000)
    })

    it('should update upload progress', () => {
      const store = useProjectAttachmentsStore.getState()
      store.updateUploadProgress('file-1', 50, 500)

      expect(store.uploads[0].progress).toBe(50)
      expect(store.uploads[0].uploaded).toBe(500)
    })
  })

  describe('completeUpload', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().startUpload('file-1', 'test.pdf', 1000)
    })

    it('should complete upload', () => {
      const store = useProjectAttachmentsStore.getState()
      store.completeUpload('file-1', mockAttachments[0])

      expect(store.uploads[0].status).toBe('completed')
      expect(store.uploads[0].progress).toBe(100)
      expect(store.attachments).toHaveLength(1)
      expect(store.isUploading).toBe(false)
    })

    it('should keep uploading state if other uploads active', () => {
      const store = useProjectAttachmentsStore.getState()
      store.startUpload('file-2', 'test2.pdf', 1000)
      store.completeUpload('file-1', mockAttachments[0])

      expect(store.isUploading).toBe(true)
    })
  })

  describe('failUpload', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().startUpload('file-1', 'test.pdf', 1000)
    })

    it('should fail upload with error', () => {
      const store = useProjectAttachmentsStore.getState()
      store.failUpload('file-1', 'Upload failed')

      expect(store.uploads[0].status).toBe('error')
      expect(store.uploads[0].error).toBe('Upload failed')
      expect(store.isUploading).toBe(false)
    })
  })

  describe('cancelUpload', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().startUpload('file-1', 'test.pdf', 1000)
    })

    it('should cancel and remove upload', () => {
      const store = useProjectAttachmentsStore.getState()
      store.cancelUpload('file-1')

      expect(store.uploads).toHaveLength(0)
      expect(store.isUploading).toBe(false)
    })
  })

  describe('clearUploads', () => {
    beforeEach(() => {
      const store = useProjectAttachmentsStore.getState()
      store.startUpload('file-1', 'test.pdf', 1000)
      store.startUpload('file-2', 'test2.pdf', 2000)
    })

    it('should clear all uploads', () => {
      const store = useProjectAttachmentsStore.getState()
      store.clearUploads()

      expect(store.uploads).toEqual([])
      expect(store.isUploading).toBe(false)
    })
  })

  // ========================================================================
  // Computed Selectors
  // ========================================================================

  describe('getAttachmentById', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should find attachment by id', () => {
      const store = useProjectAttachmentsStore.getState()
      const attachment = store.getAttachmentById('att-1')

      expect(attachment?.id).toBe('att-1')
    })

    it('should return undefined for non-existent id', () => {
      const store = useProjectAttachmentsStore.getState()
      const attachment = store.getAttachmentById('non-existent')

      expect(attachment).toBeUndefined()
    })
  })

  describe('getAttachmentsByCategory', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should filter by category', () => {
      const store = useProjectAttachmentsStore.getState()
      const contracts = store.getAttachmentsByCategory('contract')

      expect(contracts).toHaveLength(1)
      expect(contracts[0].category).toBe('contract')
    })
  })

  describe('getAttachmentsByType', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should filter by type', () => {
      const store = useProjectAttachmentsStore.getState()
      const pdfs = store.getAttachmentsByType('pdf')

      expect(pdfs).toHaveLength(1)
      expect(pdfs[0].type).toContain('pdf')
    })
  })

  describe('getTotalSize', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should calculate total size', () => {
      const store = useProjectAttachmentsStore.getState()
      const total = store.getTotalSize()

      expect(total).toBe(3072000) // 1024000 + 2048000
    })
  })

  describe('getFormattedTotalSize', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should format total size', () => {
      const store = useProjectAttachmentsStore.getState()
      const formatted = store.getFormattedTotalSize()

      expect(formatted).toContain('MB')
    })
  })

  describe('getAttachmentCount', () => {
    beforeEach(() => {
      useProjectAttachmentsStore.getState().setAttachments(mockAttachments)
    })

    it('should count attachments', () => {
      const store = useProjectAttachmentsStore.getState()
      expect(store.getAttachmentCount()).toBe(2)
    })
  })

  describe('getActiveUploads', () => {
    beforeEach(() => {
      const store = useProjectAttachmentsStore.getState()
      store.startUpload('file-1', 'test.pdf', 1000)
      store.startUpload('file-2', 'test2.pdf', 2000)
      store.completeUpload('file-1', mockAttachments[0])
    })

    it('should return only active uploads', () => {
      const store = useProjectAttachmentsStore.getState()
      const active = store.getActiveUploads()

      expect(active).toHaveLength(1)
      expect(active[0].fileId).toBe('file-2')
    })
  })

  describe('getTotalUploadProgress', () => {
    beforeEach(() => {
      const store = useProjectAttachmentsStore.getState()
      store.startUpload('file-1', 'test.pdf', 1000)
      store.startUpload('file-2', 'test2.pdf', 2000)
      store.updateUploadProgress('file-1', 50, 500)
      store.updateUploadProgress('file-2', 100, 2000)
    })

    it('should calculate average progress', () => {
      const store = useProjectAttachmentsStore.getState()
      const progress = store.getTotalUploadProgress()

      expect(progress).toBe(75) // (50 + 100) / 2
    })

    it('should return 0 if no uploads', () => {
      const store = useProjectAttachmentsStore.getState()
      store.clearUploads()

      expect(store.getTotalUploadProgress()).toBe(0)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      const store = useProjectAttachmentsStore.getState()
      expect(store.formatFileSize(0)).toBe('0 Bytes')
      expect(store.formatFileSize(1024)).toBe('1 KB')
      expect(store.formatFileSize(1048576)).toBe('1 MB')
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useProjectAttachmentsStore.getState()
      store.setAttachments(mockAttachments)
      store.startUpload('file-1', 'test.pdf', 1000)

      store.reset()

      expect(store.attachments).toEqual([])
      expect(store.uploads).toEqual([])
      expect(store.isUploading).toBe(false)
    })
  })
})
