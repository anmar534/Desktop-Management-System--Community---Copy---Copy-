/**
 * useTenderStatusManagement Hook
 *
 * Centralized hook for managing tender status lifecycle, transitions, and validation.
 * Provides status information, workflow rules, and transition capabilities.
 *
 * @module application/hooks/useTenderStatusManagement
 */

import { useMemo, useCallback } from 'react'
import type { Tender } from '@/data/centralData'
import { getTenderStatusInfo } from '@/shared/utils/tender/tenderStatusHelpers'
import type { TenderStatusInfo } from '@/shared/utils/tender/tenderStatusHelpers'

// ============================================================================
// Types
// ============================================================================

/**
 * Tender status type
 */
export type TenderStatus = Tender['status']

/**
 * Status transition validation result
 */
export interface StatusTransitionValidation {
  /** Whether the transition is valid */
  isValid: boolean
  /** Reason for rejection (if invalid) */
  reason?: string
  /** Warning message (if valid but risky) */
  warning?: string
}

/**
 * Status transition rule
 */
export interface StatusTransitionRule {
  /** Target status */
  to: TenderStatus
  /** Validation function */
  validate: (tender: Tender) => StatusTransitionValidation
  /** Action label */
  label: string
  /** Action description */
  description: string
}

/**
 * Status workflow information
 */
export interface StatusWorkflowInfo {
  /** Current status information */
  current: TenderStatusInfo
  /** Available transitions from current status */
  availableTransitions: StatusTransitionRule[]
  /** Whether status is final (won/lost/expired/cancelled) */
  isFinal: boolean
  /** Whether status is active (new/under_action/ready_to_submit) */
  isActive: boolean
  /** Whether status is pending results (submitted) */
  isPending: boolean
  /** Next recommended action */
  nextAction?: string
}

/**
 * Hook return type
 */
export interface UseTenderStatusManagementReturn {
  /** Current status information */
  statusInfo: TenderStatusInfo
  /** Workflow information */
  workflow: StatusWorkflowInfo
  /** Validate a status transition */
  validateTransition: (toStatus: TenderStatus) => StatusTransitionValidation
  /** Check if transition is allowed */
  canTransitionTo: (toStatus: TenderStatus) => boolean
  /** Get all valid transitions */
  getValidTransitions: () => TenderStatus[]
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Final statuses (cannot transition further)
 */
const FINAL_STATUSES: readonly TenderStatus[] = ['won', 'lost', 'expired', 'cancelled'] as const

/**
 * Active statuses (in progress)
 */
const ACTIVE_STATUSES: readonly TenderStatus[] = ['new', 'under_action', 'ready_to_submit'] as const

/**
 * Pending statuses (awaiting results)
 */
const PENDING_STATUSES: readonly TenderStatus[] = ['submitted'] as const

// ============================================================================
// Transition Rules
// ============================================================================

/**
 * Define status transition rules
 */
const STATUS_TRANSITION_RULES: Record<TenderStatus, StatusTransitionRule[]> = {
  new: [
    {
      to: 'under_action',
      validate: () => ({ isValid: true }),
      label: 'بدء العمل',
      description: 'بدء عملية التسعير ورفع الملفات',
    },
    {
      to: 'cancelled',
      validate: () => ({ isValid: true }),
      label: 'إلغاء',
      description: 'إلغاء المنافسة',
    },
  ],

  under_action: [
    {
      to: 'ready_to_submit',
      validate: (tender) => {
        const hasPricing = (tender.pricedItems ?? 0) > 0 || (tender.itemsPriced ?? 0) > 0
        const hasFiles = tender.technicalFilesUploaded === true

        if (!hasPricing && !hasFiles) {
          return {
            isValid: false,
            reason: 'يجب إكمال التسعير ورفع الملفات الفنية',
          }
        }

        if (!hasPricing) {
          return {
            isValid: false,
            reason: 'يجب إكمال تسعير البنود',
          }
        }

        if (!hasFiles) {
          return {
            isValid: true,
            warning: 'لم يتم رفع الملفات الفنية بعد',
          }
        }

        return { isValid: true }
      },
      label: 'جاهزة للتقديم',
      description: 'تحديث الحالة إلى جاهزة للتقديم',
    },
    {
      to: 'new',
      validate: () => ({ isValid: true }),
      label: 'إعادة تعيين',
      description: 'إعادة المنافسة إلى حالة جديدة',
    },
    {
      to: 'cancelled',
      validate: () => ({ isValid: true }),
      label: 'إلغاء',
      description: 'إلغاء المنافسة',
    },
  ],

  ready_to_submit: [
    {
      to: 'submitted',
      validate: (tender) => {
        const hasPricing = (tender.pricedItems ?? 0) > 0 || (tender.itemsPriced ?? 0) > 0

        if (!hasPricing) {
          return {
            isValid: false,
            reason: 'يجب إكمال التسعير قبل التقديم',
          }
        }

        return { isValid: true }
      },
      label: 'تقديم',
      description: 'تقديم العرض للعميل',
    },
    {
      to: 'under_action',
      validate: () => ({
        isValid: true,
        warning: 'سيتم التراجع إلى حالة تحت الإجراء',
      }),
      label: 'تراجع للتسعير',
      description: 'العودة لتعديل التسعير',
    },
    {
      to: 'cancelled',
      validate: () => ({ isValid: true }),
      label: 'إلغاء',
      description: 'إلغاء المنافسة',
    },
  ],

  submitted: [
    {
      to: 'won',
      validate: () => ({ isValid: true }),
      label: 'فائزة',
      description: 'تسجيل الفوز بالمنافسة',
    },
    {
      to: 'lost',
      validate: () => ({ isValid: true }),
      label: 'خاسرة',
      description: 'تسجيل الخسارة في المنافسة',
    },
    {
      to: 'ready_to_submit',
      validate: () => ({
        isValid: true,
        warning: 'سيتم حذف أوامر الشراء المرتبطة',
      }),
      label: 'تراجع للإرسال',
      description: 'التراجع عن الإرسال',
    },
    {
      to: 'cancelled',
      validate: () => ({ isValid: true }),
      label: 'إلغاء',
      description: 'إلغاء المنافسة',
    },
  ],

  won: [
    {
      to: 'submitted',
      validate: () => ({
        isValid: true,
        warning: 'سيتم التراجع عن النتيجة النهائية',
      }),
      label: 'تراجع عن النتيجة',
      description: 'العودة لحالة بانتظار النتائج',
    },
  ],

  lost: [
    {
      to: 'submitted',
      validate: () => ({
        isValid: true,
        warning: 'سيتم التراجع عن النتيجة النهائية',
      }),
      label: 'تراجع عن النتيجة',
      description: 'العودة لحالة بانتظار النتائج',
    },
  ],

  expired: [],

  cancelled: [],
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing tender status lifecycle
 *
 * @param tender - The tender to manage status for
 * @returns Status management utilities
 *
 * @example
 * ```tsx
 * const { statusInfo, workflow, validateTransition, canTransitionTo } = useTenderStatusManagement(tender);
 *
 * // Get current status information
 * console.log(statusInfo.label); // "جاهزة للتقديم"
 * console.log(statusInfo.description); // "تم إنجاز التسعير والملفات الفنية"
 *
 * // Check if can transition to submitted
 * if (canTransitionTo('submitted')) {
 *   const validation = validateTransition('submitted');
 *   if (validation.isValid) {
 *     // Proceed with transition
 *   }
 * }
 *
 * // Get available transitions
 * const validTransitions = getValidTransitions();
 * workflow.availableTransitions.forEach(rule => {
 *   console.log(rule.label, rule.description);
 * });
 * ```
 */
export function useTenderStatusManagement(tender: Tender): UseTenderStatusManagementReturn {
  // Get current status information
  const statusInfo = useMemo(() => getTenderStatusInfo(tender.status), [tender.status])

  // Validate a transition to a specific status
  const validateTransition = useCallback(
    (toStatus: TenderStatus): StatusTransitionValidation => {
      const rules = STATUS_TRANSITION_RULES[tender.status] || []
      const rule = rules.find((r) => r.to === toStatus)

      if (!rule) {
        return {
          isValid: false,
          reason: `لا يمكن الانتقال من "${statusInfo.label}" إلى "${getTenderStatusInfo(toStatus).label}"`,
        }
      }

      return rule.validate(tender)
    },
    [tender, statusInfo.label],
  )

  // Check if can transition to a status
  const canTransitionTo = useCallback(
    (toStatus: TenderStatus): boolean => {
      return validateTransition(toStatus).isValid
    },
    [validateTransition],
  )

  // Get all valid transitions
  const getValidTransitions = useCallback((): TenderStatus[] => {
    const rules = STATUS_TRANSITION_RULES[tender.status] || []
    return rules.filter((rule) => rule.validate(tender).isValid).map((rule) => rule.to)
  }, [tender])

  // Build workflow information
  const workflow = useMemo((): StatusWorkflowInfo => {
    const availableTransitions = STATUS_TRANSITION_RULES[tender.status] || []
    const isFinal = FINAL_STATUSES.includes(tender.status)
    const isActive = ACTIVE_STATUSES.includes(tender.status)
    const isPending = PENDING_STATUSES.includes(tender.status)

    // Determine next recommended action
    let nextAction: string | undefined

    if (tender.status === 'new') {
      nextAction = 'ابدأ عملية التسعير'
    } else if (tender.status === 'under_action') {
      const hasPricing = (tender.pricedItems ?? 0) > 0 || (tender.itemsPriced ?? 0) > 0
      const hasFiles = tender.technicalFilesUploaded === true

      if (!hasPricing && !hasFiles) {
        nextAction = 'قم بتسعير البنود ورفع الملفات الفنية'
      } else if (!hasPricing) {
        nextAction = 'قم بتسعير البنود'
      } else if (!hasFiles) {
        nextAction = 'قم برفع الملفات الفنية'
      } else {
        nextAction = 'حدث الحالة إلى جاهزة للتقديم'
      }
    } else if (tender.status === 'ready_to_submit') {
      nextAction = 'قدم العرض للعميل'
    } else if (tender.status === 'submitted') {
      nextAction = 'بانتظار إعلان النتائج'
    }

    return {
      current: statusInfo,
      availableTransitions,
      isFinal,
      isActive,
      isPending,
      nextAction,
    }
  }, [tender, statusInfo])

  return {
    statusInfo,
    workflow,
    validateTransition,
    canTransitionTo,
    getValidTransitions,
  }
}

// ============================================================================
// Standalone Utility Functions
// ============================================================================

/**
 * Check if a status is final
 */
export function isFinalStatus(status: TenderStatus): boolean {
  return FINAL_STATUSES.includes(status)
}

/**
 * Check if a status is active
 */
export function isActiveStatus(status: TenderStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

/**
 * Check if a status is pending
 */
export function isPendingStatus(status: TenderStatus): boolean {
  return PENDING_STATUSES.includes(status)
}

/**
 * Get available transitions for a status
 */
export function getAvailableTransitions(status: TenderStatus): StatusTransitionRule[] {
  return STATUS_TRANSITION_RULES[status] || []
}

/**
 * Validate a transition without a tender instance
 */
export function validateStatusTransition(
  fromStatus: TenderStatus,
  toStatus: TenderStatus,
  tenderData?: Partial<Tender>,
): StatusTransitionValidation {
  const rules = STATUS_TRANSITION_RULES[fromStatus] || []
  const rule = rules.find((r) => r.to === toStatus)

  if (!rule) {
    return {
      isValid: false,
      reason: `لا يمكن الانتقال من "${getTenderStatusInfo(fromStatus).label}" إلى "${getTenderStatusInfo(toStatus).label}"`,
    }
  }

  // Create a minimal tender object for validation
  const minimalTender: Tender = {
    id: '',
    name: '',
    title: '',
    status: fromStatus,
    phase: '',
    deadline: '',
    client: '',
    value: 0,
    category: '',
    location: '',
    type: '',
    daysLeft: 0,
    progress: 0,
    priority: 'medium',
    team: '',
    manager: '',
    winChance: 0,
    competition: '',
    submissionDate: '',
    competitors: [],
    lastAction: '',
    requirements: [],
    documents: [],
    proposals: [],
    evaluationCriteria: [],
    createdAt: '',
    updatedAt: '',
    lastUpdate: '',
    ...tenderData,
  }

  return rule.validate(minimalTender)
}
