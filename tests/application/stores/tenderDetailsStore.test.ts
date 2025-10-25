/**
 * @fileoverview Tests for tenderDetailsStore
 * @module tests/stores/tenderDetailsStore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  useTenderDetailsStore,
  tenderDetailsSelectors,
} from '@/application/stores/tenderDetailsStore'
import type { Tender } from '@/data/centralData'
import type { AttachmentItem } from '@/application/hooks/useTenderAttachments'

describe('tenderDetailsStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useTenderDetailsStore.getState().reset()
  })

  // Mock tender data
  const mockTender: Tender = {
    id: 'tender-1',
    name: 'Test Tender',
    title: 'Test Tender',
    client: 'Test Org',
    value: 100000,
    status: 'new',
    phase: 'initial',
    deadline: '2025-12-31',
    daysLeft: 30,
    progress: 0,
    priority: 'medium' as const,
    team: 'Team A',
    manager: 'Manager A',
    winChance: 75,
    competition: 'Medium',
    submissionDate: '2025-12-31',
    lastAction: 'Created',
    lastUpdate: '2025-01-01',
    category: 'Construction',
    location: 'Test City',
    type: 'Public',
    description: 'Test description',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  }

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTenderDetailsStore.getState()

      expect(state.tender).toBeNull()
      expect(state.originalTender).toBeNull()
      expect(state.isEditMode).toBe(false)
      expect(state.activeTab).toBe('overview')
      expect(state.attachments).toEqual([])
      expect(state.pendingAttachments).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.isSaving).toBe(false)
      expect(state.error).toBeNull()
      expect(state.isDirty).toBe(false)
      expect(state.dirtyFields.size).toBe(0)
    })
  })

  describe('Tender Operations', () => {
    it('should set tender and original tender', () => {
      const { setTender } = useTenderDetailsStore.getState()

      setTender(mockTender)

      const state = useTenderDetailsStore.getState()
      expect(state.tender).toEqual(mockTender)
      expect(state.originalTender).toEqual(mockTender)
      expect(state.isEditMode).toBe(false)
      expect(state.isDirty).toBe(false)
    })

    it('should update tender and mark as dirty', () => {
      const { setTender, updateTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated Title' })

      const state = useTenderDetailsStore.getState()
      expect(state.tender?.title).toBe('Updated Title')
      expect(state.isDirty).toBe(true)
      expect(state.dirtyFields.has('title')).toBe(true)
    })

    it('should reset tender to original', () => {
      const { setTender, updateTender, resetTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated Title' })
      resetTender()

      const state = useTenderDetailsStore.getState()
      expect(state.tender?.title).toBe('Test Tender')
      expect(state.isDirty).toBe(false)
      expect(state.dirtyFields.size).toBe(0)
    })

    it('should track multiple dirty fields', () => {
      const { setTender, updateTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated Title' })
      updateTender({ description: 'Updated Description' })

      const state = useTenderDetailsStore.getState()
      expect(state.dirtyFields.has('title')).toBe(true)
      expect(state.dirtyFields.has('description')).toBe(true)
      expect(state.dirtyFields.size).toBe(2)
    })
  })

  describe('Edit Mode Operations', () => {
    it('should enter edit mode', () => {
      const { enterEditMode } = useTenderDetailsStore.getState()

      enterEditMode()

      expect(useTenderDetailsStore.getState().isEditMode).toBe(true)
    })

    it('should exit edit mode and reset if dirty', () => {
      const { setTender, enterEditMode, updateTender, exitEditMode } =
        useTenderDetailsStore.getState()

      setTender(mockTender)
      enterEditMode()
      updateTender({ title: 'Updated Title' })
      exitEditMode()

      const state = useTenderDetailsStore.getState()
      expect(state.isEditMode).toBe(false)
      expect(state.tender?.title).toBe('Test Tender')
      expect(state.isDirty).toBe(false)
    })

    it('should toggle edit mode', () => {
      const { toggleEditMode } = useTenderDetailsStore.getState()

      toggleEditMode()
      expect(useTenderDetailsStore.getState().isEditMode).toBe(true)

      toggleEditMode()
      expect(useTenderDetailsStore.getState().isEditMode).toBe(false)
    })
  })

  describe('Tab Navigation', () => {
    it('should set active tab', () => {
      const { setActiveTab } = useTenderDetailsStore.getState()

      setActiveTab('pricing')

      expect(useTenderDetailsStore.getState().activeTab).toBe('pricing')
    })

    it('should go to next tab', () => {
      const { setActiveTab, goToNextTab } = useTenderDetailsStore.getState()

      setActiveTab('overview')
      goToNextTab()

      expect(useTenderDetailsStore.getState().activeTab).toBe('boq')
    })

    it('should wrap to first tab when going next from last', () => {
      const { setActiveTab, goToNextTab } = useTenderDetailsStore.getState()

      setActiveTab('history')
      goToNextTab()

      expect(useTenderDetailsStore.getState().activeTab).toBe('overview')
    })

    it('should go to previous tab', () => {
      const { setActiveTab, goToPreviousTab } = useTenderDetailsStore.getState()

      setActiveTab('pricing')
      goToPreviousTab()

      expect(useTenderDetailsStore.getState().activeTab).toBe('boq')
    })

    it('should wrap to last tab when going previous from first', () => {
      const { setActiveTab, goToPreviousTab } = useTenderDetailsStore.getState()

      setActiveTab('overview')
      goToPreviousTab()

      expect(useTenderDetailsStore.getState().activeTab).toBe('history')
    })
  })

  describe('Attachments Operations', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const mockAttachments: AttachmentItem[] = [
      {
        id: '1',
        name: 'file1.pdf',
        type: 'application/pdf',
        size: 1024,
        content: 'base64content',
        uploadDate: '2025-01-01',
        tenderId: 'tender-1',
        attachmentType: 'technical' as const,
        source: 'technical' as const,
      },
    ]

    it('should set attachments', () => {
      const { setAttachments } = useTenderDetailsStore.getState()

      setAttachments(mockAttachments)

      expect(useTenderDetailsStore.getState().attachments).toEqual(mockAttachments)
    })

    it('should add pending attachment', () => {
      const { addPendingAttachment } = useTenderDetailsStore.getState()

      addPendingAttachment(mockFile)

      const state = useTenderDetailsStore.getState()
      expect(state.pendingAttachments).toHaveLength(1)
      expect(state.pendingAttachments[0]).toBe(mockFile)
      expect(state.isDirty).toBe(true)
    })

    it('should remove pending attachment by name', () => {
      const { addPendingAttachment, removePendingAttachment } = useTenderDetailsStore.getState()

      addPendingAttachment(mockFile)
      removePendingAttachment('test.pdf')

      expect(useTenderDetailsStore.getState().pendingAttachments).toHaveLength(0)
    })

    it('should clear all pending attachments', () => {
      const { addPendingAttachment, clearPendingAttachments } = useTenderDetailsStore.getState()

      addPendingAttachment(mockFile)
      addPendingAttachment(new File(['content2'], 'test2.pdf', { type: 'application/pdf' }))
      clearPendingAttachments()

      expect(useTenderDetailsStore.getState().pendingAttachments).toHaveLength(0)
    })
  })

  describe('Save/Cancel Operations', () => {
    it('should not save if tender is null', async () => {
      const { saveTender } = useTenderDetailsStore.getState()

      await saveTender()

      expect(useTenderDetailsStore.getState().isSaving).toBe(false)
    })

    it('should not save if not dirty', async () => {
      const { setTender, saveTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      await saveTender()

      expect(useTenderDetailsStore.getState().isSaving).toBe(false)
    })

    it('should save tender and update original', async () => {
      const { setTender, updateTender, saveTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated Title' })
      await saveTender()

      const state = useTenderDetailsStore.getState()
      expect(state.isSaving).toBe(false)
      expect(state.isDirty).toBe(false)
      expect(state.isEditMode).toBe(false)
      expect(state.originalTender?.title).toBe('Updated Title')
    })

    it('should cancel edit and restore original', () => {
      const { setTender, updateTender, addPendingAttachment, cancelEdit } =
        useTenderDetailsStore.getState()
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      setTender(mockTender)
      updateTender({ title: 'Updated Title' })
      addPendingAttachment(mockFile)
      cancelEdit()

      const state = useTenderDetailsStore.getState()
      expect(state.tender?.title).toBe('Test Tender')
      expect(state.isDirty).toBe(false)
      expect(state.isEditMode).toBe(false)
      expect(state.pendingAttachments).toHaveLength(0)
    })
  })

  describe('Dirty State Tracking', () => {
    it('should mark field as dirty', () => {
      const { markFieldDirty } = useTenderDetailsStore.getState()

      markFieldDirty('title')

      const state = useTenderDetailsStore.getState()
      expect(state.isDirty).toBe(true)
      expect(state.dirtyFields.has('title')).toBe(true)
    })

    it('should clear dirty state', () => {
      const { markFieldDirty, clearDirtyState } = useTenderDetailsStore.getState()

      markFieldDirty('title')
      markFieldDirty('description')
      clearDirtyState()

      const state = useTenderDetailsStore.getState()
      expect(state.isDirty).toBe(false)
      expect(state.dirtyFields.size).toBe(0)
    })
  })

  describe('Loading/Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useTenderDetailsStore.getState()

      setLoading(true)
      expect(useTenderDetailsStore.getState().isLoading).toBe(true)

      setLoading(false)
      expect(useTenderDetailsStore.getState().isLoading).toBe(false)
    })

    it('should set saving state', () => {
      const { setSaving } = useTenderDetailsStore.getState()

      setSaving(true)
      expect(useTenderDetailsStore.getState().isSaving).toBe(true)

      setSaving(false)
      expect(useTenderDetailsStore.getState().isSaving).toBe(false)
    })

    it('should set error state', () => {
      const { setError } = useTenderDetailsStore.getState()

      setError('Test error')
      expect(useTenderDetailsStore.getState().error).toBe('Test error')

      setError(null)
      expect(useTenderDetailsStore.getState().error).toBeNull()
    })
  })

  describe('Reset Store', () => {
    it('should reset store to initial state', () => {
      const { setTender, updateTender, enterEditMode, setActiveTab, reset } =
        useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated' })
      enterEditMode()
      setActiveTab('pricing')

      reset()

      const state = useTenderDetailsStore.getState()
      expect(state.tender).toBeNull()
      expect(state.isEditMode).toBe(false)
      expect(state.activeTab).toBe('overview')
      expect(state.isDirty).toBe(false)
    })
  })

  describe('Selectors', () => {
    it('canSave should return true when tender exists, is dirty, and not saving', () => {
      const { setTender, updateTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated' })

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.canSave(state)).toBe(true)
    })

    it('canSave should return false when not dirty', () => {
      const { setTender } = useTenderDetailsStore.getState()

      setTender(mockTender)

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.canSave(state)).toBe(false)
    })

    it('canExitEditMode should return false when dirty', () => {
      const { setTender, updateTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated' })

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.canExitEditMode(state)).toBe(false)
    })

    it('currentTabIndex should return correct index', () => {
      const { setActiveTab } = useTenderDetailsStore.getState()

      setActiveTab('pricing')

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.currentTabIndex(state)).toBe(2)
    })

    it('isFirstTab should return true for overview tab', () => {
      const { setActiveTab } = useTenderDetailsStore.getState()

      setActiveTab('overview')

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.isFirstTab(state)).toBe(true)
    })

    it('isLastTab should return true for history tab', () => {
      const { setActiveTab } = useTenderDetailsStore.getState()

      setActiveTab('history')

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.isLastTab(state)).toBe(true)
    })

    it('totalAttachmentsCount should count existing and pending', () => {
      const { setAttachments, addPendingAttachment } = useTenderDetailsStore.getState()
      const mockAttachment: AttachmentItem = {
        id: '1',
        name: 'file1.pdf',
        type: 'application/pdf',
        size: 1024,
        content: 'base64content',
        uploadDate: '2025-01-01',
        tenderId: 'tender-1',
      }

      setAttachments([mockAttachment])
      addPendingAttachment(new File(['content'], 'test.pdf', { type: 'application/pdf' }))

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.totalAttachmentsCount(state)).toBe(2)
    })

    it('hasUnsavedChanges should return true when dirty or has pending attachments', () => {
      const { setTender, updateTender } = useTenderDetailsStore.getState()

      setTender(mockTender)
      updateTender({ title: 'Updated' })

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.hasUnsavedChanges(state)).toBe(true)
    })

    it('hasUnsavedChanges should return true with pending attachments', () => {
      const { addPendingAttachment } = useTenderDetailsStore.getState()

      addPendingAttachment(new File(['content'], 'test.pdf', { type: 'application/pdf' }))

      const state = useTenderDetailsStore.getState()
      expect(tenderDetailsSelectors.hasUnsavedChanges(state)).toBe(true)
    })
  })
})
