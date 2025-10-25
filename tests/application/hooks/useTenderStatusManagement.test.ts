/**
 * Tests for useTenderStatusManagement Hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useTenderStatusManagement,
  isFinalStatus,
  isActiveStatus,
  isPendingStatus,
  getAvailableTransitions,
  validateStatusTransition,
} from '@/application/hooks/useTenderStatusManagement'
import type { Tender } from '@/data/centralData'

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
  submissionDate: '2025-12-31',
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
  competitors: ['منافس 1', 'منافس 2'],
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

// ============================================================================
// Hook Tests
// ============================================================================

describe('useTenderStatusManagement', () => {
  describe('Initial State', () => {
    it('should return status info for new tender', () => {
      const tender = createMockTender({ status: 'new' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.statusInfo.label).toBe('جديدة')
      expect(result.current.statusInfo.description).toBe('منافسة جديدة لم يبدأ العمل عليها بعد')
    })

    it('should identify active status correctly', () => {
      const tender = createMockTender({ status: 'under_action' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.isActive).toBe(true)
      expect(result.current.workflow.isFinal).toBe(false)
      expect(result.current.workflow.isPending).toBe(false)
    })

    it('should identify final status correctly', () => {
      const tender = createMockTender({ status: 'won' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.isFinal).toBe(true)
      expect(result.current.workflow.isActive).toBe(false)
      expect(result.current.workflow.isPending).toBe(false)
    })

    it('should identify pending status correctly', () => {
      const tender = createMockTender({ status: 'submitted' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.isPending).toBe(true)
      expect(result.current.workflow.isActive).toBe(false)
      expect(result.current.workflow.isFinal).toBe(false)
    })
  })

  describe('Status Transitions', () => {
    it('should allow transition from new to under_action', () => {
      const tender = createMockTender({ status: 'new' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.canTransitionTo('under_action')).toBe(true)
      const validation = result.current.validateTransition('under_action')
      expect(validation.isValid).toBe(true)
    })

    it('should allow transition from new to cancelled', () => {
      const tender = createMockTender({ status: 'new' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.canTransitionTo('cancelled')).toBe(true)
    })

    it('should reject transition from under_action to ready_to_submit without pricing', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 0,
        technicalFilesUploaded: false,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('ready_to_submit')
      expect(validation.isValid).toBe(false)
      expect(validation.reason).toBe('يجب إكمال التسعير ورفع الملفات الفنية')
    })

    it('should reject transition from under_action to ready_to_submit without pricing (only files)', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 0,
        technicalFilesUploaded: true,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('ready_to_submit')
      expect(validation.isValid).toBe(false)
      expect(validation.reason).toBe('يجب إكمال تسعير البنود')
    })

    it('should allow transition from under_action to ready_to_submit with pricing but warn about missing files', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 5,
        technicalFilesUploaded: false,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('ready_to_submit')
      expect(validation.isValid).toBe(true)
      expect(validation.warning).toBe('لم يتم رفع الملفات الفنية بعد')
    })

    it('should allow transition from under_action to ready_to_submit with pricing and files', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 5,
        technicalFilesUploaded: true,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('ready_to_submit')
      expect(validation.isValid).toBe(true)
      expect(validation.warning).toBeUndefined()
    })

    it('should allow transition from ready_to_submit to submitted with pricing', () => {
      const tender = createMockTender({
        status: 'ready_to_submit',
        pricedItems: 10,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.canTransitionTo('submitted')).toBe(true)
    })

    it('should reject transition from ready_to_submit to submitted without pricing', () => {
      const tender = createMockTender({
        status: 'ready_to_submit',
        pricedItems: 0,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('submitted')
      expect(validation.isValid).toBe(false)
      expect(validation.reason).toBe('يجب إكمال التسعير قبل التقديم')
    })

    it('should warn when transitioning from ready_to_submit back to under_action', () => {
      const tender = createMockTender({ status: 'ready_to_submit' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('under_action')
      expect(validation.isValid).toBe(true)
      expect(validation.warning).toBe('سيتم التراجع إلى حالة تحت الإجراء')
    })

    it('should allow transition from submitted to won', () => {
      const tender = createMockTender({ status: 'submitted' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.canTransitionTo('won')).toBe(true)
    })

    it('should allow transition from submitted to lost', () => {
      const tender = createMockTender({ status: 'submitted' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.canTransitionTo('lost')).toBe(true)
    })

    it('should warn when reverting from submitted to ready_to_submit', () => {
      const tender = createMockTender({ status: 'submitted' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('ready_to_submit')
      expect(validation.isValid).toBe(true)
      expect(validation.warning).toBe('سيتم حذف أوامر الشراء المرتبطة')
    })

    it('should allow reverting from won to submitted', () => {
      const tender = createMockTender({ status: 'won' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('submitted')
      expect(validation.isValid).toBe(true)
      expect(validation.warning).toBe('سيتم التراجع عن النتيجة النهائية')
    })

    it('should allow reverting from lost to submitted', () => {
      const tender = createMockTender({ status: 'lost' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('submitted')
      expect(validation.isValid).toBe(true)
      expect(validation.warning).toBe('سيتم التراجع عن النتيجة النهائية')
    })
  })

  describe('Available Transitions', () => {
    it('should return correct transitions for new status', () => {
      const tender = createMockTender({ status: 'new' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.availableTransitions).toHaveLength(2)
      expect(result.current.workflow.availableTransitions[0].to).toBe('under_action')
      expect(result.current.workflow.availableTransitions[1].to).toBe('cancelled')
    })

    it('should return correct transitions for under_action status', () => {
      const tender = createMockTender({ status: 'under_action' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.availableTransitions).toHaveLength(3)
      const transitionTargets = result.current.workflow.availableTransitions.map((t) => t.to)
      expect(transitionTargets).toContain('ready_to_submit')
      expect(transitionTargets).toContain('new')
      expect(transitionTargets).toContain('cancelled')
    })

    it('should return only valid transitions using getValidTransitions', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 0,
        technicalFilesUploaded: false,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validTransitions = result.current.getValidTransitions()
      expect(validTransitions).not.toContain('ready_to_submit')
      expect(validTransitions).toContain('new')
      expect(validTransitions).toContain('cancelled')
    })

    it('should have no transitions for expired status', () => {
      const tender = createMockTender({ status: 'expired' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.availableTransitions).toHaveLength(0)
    })

    it('should have no transitions for cancelled status', () => {
      const tender = createMockTender({ status: 'cancelled' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.availableTransitions).toHaveLength(0)
    })
  })

  describe('Next Action Recommendations', () => {
    it('should recommend starting pricing for new tender', () => {
      const tender = createMockTender({ status: 'new' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('ابدأ عملية التسعير')
    })

    it('should recommend pricing and files for under_action without both', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 0,
        technicalFilesUploaded: false,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('قم بتسعير البنود ورفع الملفات الفنية')
    })

    it('should recommend pricing for under_action without pricing', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 0,
        technicalFilesUploaded: true,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('قم بتسعير البنود')
    })

    it('should recommend files for under_action without files', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 5,
        technicalFilesUploaded: false,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('قم برفع الملفات الفنية')
    })

    it('should recommend status update for under_action with pricing and files', () => {
      const tender = createMockTender({
        status: 'under_action',
        pricedItems: 5,
        technicalFilesUploaded: true,
      })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('حدث الحالة إلى جاهزة للتقديم')
    })

    it('should recommend submission for ready_to_submit', () => {
      const tender = createMockTender({ status: 'ready_to_submit' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('قدم العرض للعميل')
    })

    it('should indicate waiting for submitted', () => {
      const tender = createMockTender({ status: 'submitted' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBe('بانتظار إعلان النتائج')
    })

    it('should have no next action for final statuses', () => {
      const tender = createMockTender({ status: 'won' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.workflow.nextAction).toBeUndefined()
    })
  })

  describe('Invalid Transitions', () => {
    it('should reject invalid transition', () => {
      const tender = createMockTender({ status: 'new' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      const validation = result.current.validateTransition('submitted')
      expect(validation.isValid).toBe(false)
      expect(validation.reason).toContain('لا يمكن الانتقال')
    })

    it('should reject transition from won to cancelled', () => {
      const tender = createMockTender({ status: 'won' })
      const { result } = renderHook(() => useTenderStatusManagement(tender))

      expect(result.current.canTransitionTo('cancelled')).toBe(false)
    })
  })
})

// ============================================================================
// Standalone Functions Tests
// ============================================================================

describe('Standalone Functions', () => {
  describe('isFinalStatus', () => {
    it('should identify final statuses', () => {
      expect(isFinalStatus('won')).toBe(true)
      expect(isFinalStatus('lost')).toBe(true)
      expect(isFinalStatus('expired')).toBe(true)
      expect(isFinalStatus('cancelled')).toBe(true)
    })

    it('should not identify active statuses as final', () => {
      expect(isFinalStatus('new')).toBe(false)
      expect(isFinalStatus('under_action')).toBe(false)
      expect(isFinalStatus('ready_to_submit')).toBe(false)
      expect(isFinalStatus('submitted')).toBe(false)
    })
  })

  describe('isActiveStatus', () => {
    it('should identify active statuses', () => {
      expect(isActiveStatus('new')).toBe(true)
      expect(isActiveStatus('under_action')).toBe(true)
      expect(isActiveStatus('ready_to_submit')).toBe(true)
    })

    it('should not identify final/pending statuses as active', () => {
      expect(isActiveStatus('submitted')).toBe(false)
      expect(isActiveStatus('won')).toBe(false)
      expect(isActiveStatus('lost')).toBe(false)
    })
  })

  describe('isPendingStatus', () => {
    it('should identify pending status', () => {
      expect(isPendingStatus('submitted')).toBe(true)
    })

    it('should not identify other statuses as pending', () => {
      expect(isPendingStatus('new')).toBe(false)
      expect(isPendingStatus('won')).toBe(false)
      expect(isPendingStatus('lost')).toBe(false)
    })
  })

  describe('getAvailableTransitions', () => {
    it('should return transitions for new status', () => {
      const transitions = getAvailableTransitions('new')
      expect(transitions).toHaveLength(2)
      expect(transitions[0].to).toBe('under_action')
    })

    it('should return empty array for final statuses', () => {
      expect(getAvailableTransitions('expired')).toHaveLength(0)
      expect(getAvailableTransitions('cancelled')).toHaveLength(0)
    })
  })

  describe('validateStatusTransition', () => {
    it('should validate transition with partial tender data', () => {
      const validation = validateStatusTransition('ready_to_submit', 'submitted', {
        pricedItems: 5,
      })
      expect(validation.isValid).toBe(true)
    })

    it('should reject transition with insufficient data', () => {
      const validation = validateStatusTransition('ready_to_submit', 'submitted', {
        pricedItems: 0,
      })
      expect(validation.isValid).toBe(false)
    })

    it('should work without tender data for simple transitions', () => {
      const validation = validateStatusTransition('new', 'under_action')
      expect(validation.isValid).toBe(true)
    })
  })
})
