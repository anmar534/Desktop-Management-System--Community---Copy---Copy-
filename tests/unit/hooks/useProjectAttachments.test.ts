/**
 * Tests for useProjectAttachments hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProjectAttachments } from '@/application/hooks/useProjectAttachments'
import { useProjectAttachmentsStore } from '@/application/stores/projectAttachmentsStore'

// Mock the store
vi.mock('@/application/stores/projectAttachmentsStore')

describe('useProjectAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // Hook Initialization
  // ========================================================================

  it('should return initial state', () => {
    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())

    expect(result.current.attachments).toEqual([])
    expect(result.current.uploads).toEqual([])
    expect(result.current.isUploading).toBe(false)
  })

  // ========================================================================
  // Actions
  // ========================================================================

  it('should load attachments for project', async () => {
    const setLoading = vi.fn()
    const setAttachments = vi.fn()

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments,
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading,
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())

    await act(async () => {
      await result.current.loadAttachments('proj-1')
    })

    expect(setLoading).toHaveBeenCalledWith(true)
    expect(setAttachments).toHaveBeenCalledWith([])
  })

  it(
    'should upload file',
    async () => {
      const startUpload = vi.fn()
      const updateUploadProgress = vi.fn()
      const completeUpload = vi.fn()

      vi.mocked(useProjectAttachmentsStore).mockReturnValue({
        attachments: [],
        uploads: [],
        isUploading: false,
        loading: false,
        error: null,
        setAttachments: vi.fn(),
        startUpload,
        updateUploadProgress,
        completeUpload,
        failUpload: vi.fn(),
        cancelUpload: vi.fn(),
        clearUploads: vi.fn(),
        clearError: vi.fn(),
        getAttachmentById: vi.fn(),
        getAttachmentsByCategory: vi.fn(() => []),
        getAttachmentsByType: vi.fn(() => []),
        getTotalSize: vi.fn(() => 0),
        getFormattedTotalSize: vi.fn(() => '0 Bytes'),
        getAttachmentCount: vi.fn(() => 0),
        getActiveUploads: vi.fn(() => []),
        getTotalUploadProgress: vi.fn(() => 0),
        removeAttachment: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      } as any)

      const { result } = renderHook(() => useProjectAttachments())

      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

      await act(async () => {
        await result.current.uploadFile(mockFile, 'proj-1', 'documents')
      })

      expect(startUpload).toHaveBeenCalled()
      expect(updateUploadProgress).toHaveBeenCalled()
      expect(completeUpload).toHaveBeenCalled()
    },
    { timeout: 5000 },
  )

  it('should delete attachment', async () => {
    const removeAttachment = vi.fn()
    const setLoading = vi.fn()

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment,
      setLoading,
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())

    await act(async () => {
      await result.current.deleteAttachment('att-1')
    })

    expect(setLoading).toHaveBeenCalledWith(true)
    expect(removeAttachment).toHaveBeenCalledWith('att-1')
  })

  it('should cancel upload', () => {
    const cancelUpload = vi.fn()

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload,
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())

    act(() => {
      result.current.cancelUpload('file-1')
    })

    expect(cancelUpload).toHaveBeenCalledWith('file-1')
  })

  it('should clear uploads', () => {
    const clearUploads = vi.fn()

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads,
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())

    act(() => {
      result.current.clearUploads()
    })

    expect(clearUploads).toHaveBeenCalled()
  })

  it('should clear error', () => {
    const clearError = vi.fn()

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError,
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())

    act(() => {
      result.current.clearError()
    })

    expect(clearError).toHaveBeenCalled()
  })

  // ========================================================================
  // Selectors
  // ========================================================================

  it('should get attachment by id', () => {
    const mockAttachment = { id: 'att-1', name: 'Test.pdf' }
    const getAttachmentById = vi.fn(() => mockAttachment)

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [mockAttachment as any],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById,
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const attachment = result.current.getAttachmentById('att-1')

    expect(getAttachmentById).toHaveBeenCalledWith('att-1')
    expect(attachment?.id).toBe('att-1')
  })

  it('should get attachments by category', () => {
    const getAttachmentsByCategory = vi.fn(() => [{ category: 'photos' }])

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory,
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const attachments = result.current.getAttachmentsByCategory('photos')

    expect(getAttachmentsByCategory).toHaveBeenCalledWith('photos')
    expect(attachments).toHaveLength(1)
  })

  it('should get attachments by type', () => {
    const getAttachmentsByType = vi.fn(() => [{ type: 'application/pdf' }])

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType,
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const attachments = result.current.getAttachmentsByType('pdf')

    expect(getAttachmentsByType).toHaveBeenCalledWith('pdf')
    expect(attachments).toHaveLength(1)
  })

  it('should get total size', () => {
    const getTotalSize = vi.fn(() => 1024000)

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize,
      getFormattedTotalSize: vi.fn(() => '1 MB'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const size = result.current.getTotalSize()

    expect(getTotalSize).toHaveBeenCalled()
    expect(size).toBe(1024000)
  })

  it('should get formatted total size', () => {
    const getFormattedTotalSize = vi.fn(() => '1.5 MB')

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize,
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const formatted = result.current.getFormattedTotalSize()

    expect(getFormattedTotalSize).toHaveBeenCalled()
    expect(formatted).toBe('1.5 MB')
  })

  it('should get attachment count', () => {
    const getAttachmentCount = vi.fn(() => 5)

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount,
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const count = result.current.getAttachmentCount()

    expect(getAttachmentCount).toHaveBeenCalled()
    expect(count).toBe(5)
  })

  it('should get active uploads', () => {
    const getActiveUploads = vi.fn(() => [{ status: 'uploading' }])

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads,
      getTotalUploadProgress: vi.fn(() => 0),
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const active = result.current.getActiveUploads()

    expect(getActiveUploads).toHaveBeenCalled()
    expect(active).toHaveLength(1)
  })

  it('should get total upload progress', () => {
    const getTotalUploadProgress = vi.fn(() => 75)

    vi.mocked(useProjectAttachmentsStore).mockReturnValue({
      attachments: [],
      uploads: [],
      isUploading: false,
      loading: false,
      error: null,
      setAttachments: vi.fn(),
      startUpload: vi.fn(),
      updateUploadProgress: vi.fn(),
      completeUpload: vi.fn(),
      failUpload: vi.fn(),
      cancelUpload: vi.fn(),
      clearUploads: vi.fn(),
      clearError: vi.fn(),
      getAttachmentById: vi.fn(),
      getAttachmentsByCategory: vi.fn(() => []),
      getAttachmentsByType: vi.fn(() => []),
      getTotalSize: vi.fn(() => 0),
      getFormattedTotalSize: vi.fn(() => '0 Bytes'),
      getAttachmentCount: vi.fn(() => 0),
      getActiveUploads: vi.fn(() => []),
      getTotalUploadProgress,
      removeAttachment: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectAttachments())
    const progress = result.current.getTotalUploadProgress()

    expect(getTotalUploadProgress).toHaveBeenCalled()
    expect(progress).toBe(75)
  })
})
