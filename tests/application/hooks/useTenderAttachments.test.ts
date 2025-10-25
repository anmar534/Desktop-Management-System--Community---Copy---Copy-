/**
 * Tests for useTenderAttachments Hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useTenderAttachments,
  validateAttachment,
  formatAttachmentSize,
  getAttachmentIcon,
} from '@/application/hooks/useTenderAttachments'
import { FileUploadService } from '@/shared/utils/fileUploadService'
import type { Tender } from '@/data/centralData'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/shared/utils/fileUploadService', () => ({
  FileUploadService: {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    downloadFile: vi.fn(),
    getFilesByTender: vi.fn(),
    formatFileSize: vi.fn((bytes: number) => `${(bytes / 1024).toFixed(2)} KB`),
    getFileIcon: vi.fn((type: string) => (type.includes('pdf') ? 'pdf-icon' : 'file-icon')),
    isFileTypeAllowed: vi.fn(() => true),
    isFileSizeValid: vi.fn(() => true),
  },
}))

// ============================================================================
// Mock Data
// ============================================================================

const createMockTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 'test-tender-1',
  name: 'منافسة اختبارية',
  title: 'منافسة اختبارية',
  status: 'new',
  phase: 'bidding',
  deadline: '2025-12-31',
  client: 'عميل اختباري',
  value: 500000,
  category: 'construction',
  location: 'الرياض',
  type: 'public',
  daysLeft: 30,
  progress: 0,
  priority: 'high',
  team: 'فريق المنافسات',
  manager: 'مدير المشروع',
  winChance: 75,
  competition: 'medium',
  submissionDate: '',
  competitors: [],
  lastAction: 'تم إنشاء المنافسة',
  requirements: [],
  documents: [],
  proposals: [],
  evaluationCriteria: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  lastUpdate: '2025-01-01T00:00:00Z',
  ...overrides,
})

const mockUploadedFile = {
  id: 'file-1',
  name: 'document.pdf',
  type: 'application/pdf',
  size: 102400,
  content: 'base64content',
  uploadDate: '2025-01-25T10:00:00Z',
  tenderId: 'test-tender-1',
}

const mockOriginalAttachment = {
  id: 'orig-1',
  name: 'specification.pdf',
  type: 'application/pdf',
  size: 204800,
  uploadedAt: '2025-01-20T10:00:00Z',
  attachmentType: 'specifications',
}

// ============================================================================
// Hook Tests
// ============================================================================

describe('useTenderAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([])
  })

  describe('Initial State', () => {
    it('should initialize with empty attachments when no files exist', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      expect(result.current.attachments).toHaveLength(0)
      expect(result.current.technicalFiles).toHaveLength(0)
      expect(result.current.originalAttachments).toHaveLength(0)
      expect(result.current.stats.total).toBe(0)
    })

    it('should load original attachments', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, [mockOriginalAttachment]))

      expect(result.current.attachments).toHaveLength(1)
      expect(result.current.originalAttachments).toHaveLength(1)
      expect(result.current.originalAttachments[0].source).toBe('original')
      expect(result.current.technicalFiles).toHaveLength(0)
    })

    it('should load technical files from storage', () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      expect(result.current.attachments).toHaveLength(1)
      expect(result.current.technicalFiles).toHaveLength(1)
      expect(result.current.technicalFiles[0].source).toBe('technical')
    })

    it('should combine original and technical attachments', () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, [mockOriginalAttachment]))

      expect(result.current.attachments).toHaveLength(2)
      expect(result.current.originalAttachments).toHaveLength(1)
      expect(result.current.technicalFiles).toHaveLength(1)
    })
  })

  describe('Statistics', () => {
    it('should calculate correct statistics', () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])
      vi.mocked(FileUploadService.formatFileSize).mockReturnValue('300.00 KB')

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, [mockOriginalAttachment]))

      expect(result.current.stats.total).toBe(2)
      expect(result.current.stats.technical).toBe(1)
      expect(result.current.stats.original).toBe(1)
      expect(result.current.stats.totalSize).toBe(307200) // 102400 + 204800
    })

    it('should format total size', () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])
      vi.mocked(FileUploadService.formatFileSize).mockReturnValue('100.00 KB')

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      expect(result.current.stats.formattedTotalSize).toBe('100.00 KB')
      expect(FileUploadService.formatFileSize).toHaveBeenCalled()
    })
  })

  describe('Upload Attachment', () => {
    it('should upload file successfully', async () => {
      const uploadedFile = { ...mockUploadedFile, id: 'new-file-1' }
      vi.mocked(FileUploadService.uploadFile).mockResolvedValue(uploadedFile)
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([uploadedFile])

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      let uploadedAttachment
      await act(async () => {
        uploadedAttachment = await result.current.uploadAttachment(file, 'technical')
      })

      expect(FileUploadService.uploadFile).toHaveBeenCalledWith(file, tender.id)
      expect(uploadedAttachment).toBeDefined()
      expect(uploadedAttachment?.source).toBe('technical')
      expect(uploadedAttachment?.attachmentType).toBe('technical')
    })

    it('should set uploading state during upload', async () => {
      vi.mocked(FileUploadService.uploadFile).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUploadedFile), 100)),
      )

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      let uploadPromise
      act(() => {
        uploadPromise = result.current.uploadAttachment(file)
      })

      expect(result.current.isUploading).toBe(true)

      await act(async () => {
        await uploadPromise
      })

      expect(result.current.isUploading).toBe(false)
    })

    it('should handle upload error', async () => {
      vi.mocked(FileUploadService.uploadFile).mockRejectedValue(new Error('Upload failed'))

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      await expect(act(() => result.current.uploadAttachment(file))).rejects.toThrow(
        'Upload failed',
      )

      expect(result.current.isUploading).toBe(false)
    })
  })

  describe('Delete Attachment', () => {
    it('should delete file successfully', async () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])
      vi.mocked(FileUploadService.deleteFile).mockReturnValue(true)

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      let deleted
      await act(async () => {
        deleted = await result.current.deleteAttachment('file-1')
      })

      expect(FileUploadService.deleteFile).toHaveBeenCalledWith('file-1')
      expect(deleted).toBe(true)
    })

    it('should handle delete failure', async () => {
      vi.mocked(FileUploadService.deleteFile).mockReturnValue(false)

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      let deleted
      await act(async () => {
        deleted = await result.current.deleteAttachment('file-1')
      })

      expect(deleted).toBe(false)
    })
  })

  describe('Download Attachment', () => {
    it('should download file successfully', async () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])
      vi.mocked(FileUploadService.downloadFile).mockResolvedValue(undefined)

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      await act(async () => {
        await result.current.downloadAttachment('file-1')
      })

      expect(FileUploadService.downloadFile).toHaveBeenCalled()
    })

    it('should throw error if attachment not found', async () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      await expect(act(() => result.current.downloadAttachment('nonexistent'))).rejects.toThrow(
        'Attachment not found',
      )
    })
  })

  describe('Filters', () => {
    beforeEach(() => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([
        mockUploadedFile,
        { ...mockUploadedFile, id: 'file-2', name: 'report.pdf' },
      ])
    })

    it('should filter by type', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      act(() => {
        result.current.setFilters({ type: 'technical' })
      })

      expect(
        result.current.filteredAttachments.every((a) => a.attachmentType === 'technical'),
      ).toBe(true)
    })

    it('should filter by source', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, [mockOriginalAttachment]))

      act(() => {
        result.current.setFilters({ source: 'technical' })
      })

      expect(result.current.filteredAttachments.every((a) => a.source === 'technical')).toBe(true)
    })

    it('should search by name', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      act(() => {
        result.current.searchAttachments('document')
      })

      expect(result.current.filteredAttachments).toHaveLength(1)
      expect(result.current.filteredAttachments[0].name).toBe('document.pdf')
    })

    it('should clear filters', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      act(() => {
        result.current.setFilters({ type: 'technical' })
        result.current.clearFilters()
      })

      expect(result.current.filters).toEqual({})
      expect(result.current.filteredAttachments.length).toBe(result.current.attachments.length)
    })
  })

  describe('Validation', () => {
    it('should allow submission when has technical files', () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      expect(result.current.hasTechnicalFiles).toBe(true)
      expect(result.current.canSubmit).toBe(true)
    })

    it('should not allow submission without technical files', () => {
      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([])

      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      expect(result.current.hasTechnicalFiles).toBe(false)
      expect(result.current.canSubmit).toBe(false)
    })
  })

  describe('Refresh', () => {
    it('should refresh attachments list', () => {
      const tender = createMockTender()
      const { result } = renderHook(() => useTenderAttachments(tender, []))

      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([mockUploadedFile])

      act(() => {
        result.current.refreshAttachments()
      })

      expect(FileUploadService.getFilesByTender).toHaveBeenCalledWith(tender.id)
    })
  })
})

// ============================================================================
// Standalone Functions Tests
// ============================================================================

describe('Standalone Functions', () => {
  describe('validateAttachment', () => {
    it('should validate allowed file type and size', () => {
      vi.mocked(FileUploadService.isFileTypeAllowed).mockReturnValue(true)
      vi.mocked(FileUploadService.isFileSizeValid).mockReturnValue(true)

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const result = validateAttachment(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid file type', () => {
      vi.mocked(FileUploadService.isFileTypeAllowed).mockReturnValue(false)

      const file = new File(['content'], 'test.exe', { type: 'application/x-executable' })
      const result = validateAttachment(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('نوع الملف غير مدعوم')
    })

    it('should reject file that is too large', () => {
      vi.mocked(FileUploadService.isFileTypeAllowed).mockReturnValue(true)
      vi.mocked(FileUploadService.isFileSizeValid).mockReturnValue(false)

      const file = new File(['x'.repeat(3000000)], 'large.pdf', { type: 'application/pdf' })
      const result = validateAttachment(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('حجم الملف كبير جداً')
    })
  })

  describe('formatAttachmentSize', () => {
    it('should format file size', () => {
      vi.mocked(FileUploadService.formatFileSize).mockReturnValue('1.00 MB')

      const formatted = formatAttachmentSize(1048576)

      expect(formatted).toBe('1.00 MB')
      expect(FileUploadService.formatFileSize).toHaveBeenCalledWith(1048576)
    })
  })

  describe('getAttachmentIcon', () => {
    it('should get icon for PDF', () => {
      vi.mocked(FileUploadService.getFileIcon).mockReturnValue('pdf-icon')

      const icon = getAttachmentIcon('application/pdf')

      expect(icon).toBe('pdf-icon')
    })

    it('should get icon for other file types', () => {
      vi.mocked(FileUploadService.getFileIcon).mockReturnValue('file-icon')

      const icon = getAttachmentIcon('application/msword')

      expect(icon).toBe('file-icon')
    })
  })
})
