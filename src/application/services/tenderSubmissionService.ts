/**
 * @fileoverview Tender Submission Service
 * @module services/tenderSubmissionService
 *
 * Service responsible for handling tender submission workflow including:
 * - Updating tender status to 'submitted'
 * - Creating purchase orders for submission fees
 * - Creating booklet expenses
 * - Updating development statistics
 *
 * @see {@link https://github.com/anmar534/Desktop-Management-System/docs/TENDER_SYSTEM_ARCHITECTURE.md}
 */

import type { Tender } from '@/data/centralData'
import { getTenderRepository } from './serviceRegistry'
import { purchaseOrderService, type BookletExpense } from './purchaseOrderService'
import { developmentStatsService } from './developmentStatsService'
import type { PurchaseOrder } from '@/shared/types/contracts'
import type { Project } from '@/data/centralData'
import type { DevelopmentStats } from './developmentStatsService'

/**
 * Result object returned from tender submission operation
 *
 * @interface TenderSubmissionResult
 * @property {Tender} tender - The updated tender after submission
 * @property {PurchaseOrder} purchaseOrder - Purchase order created for submission fees
 * @property {BookletExpense | null} bookletExpense - Booklet expense if created, null otherwise
 * @property {Project | null} relatedProject - Related project if exists
 * @property {DevelopmentStats} stats - Updated development statistics
 * @property {Object} created - Flags indicating what was created
 * @property {boolean} created.purchaseOrder - Whether a new purchase order was created
 * @property {boolean} created.bookletExpense - Whether a new booklet expense was created
 * @property {Object} counts - Before/after counts for verification
 * @property {Object} counts.before - Counts before submission
 * @property {number} counts.before.ordersCount - Purchase orders count before
 * @property {number} counts.before.expensesCount - Booklet expenses count before
 * @property {Object} counts.after - Counts after submission
 * @property {number} counts.after.ordersCount - Purchase orders count after
 * @property {number} counts.after.expensesCount - Booklet expenses count after
 */
export interface TenderSubmissionResult {
  tender: Tender
  purchaseOrder: PurchaseOrder
  bookletExpense: BookletExpense | null
  relatedProject?: Project | null
  stats: DevelopmentStats
  created: {
    purchaseOrder: boolean
    bookletExpense: boolean
  }
  counts: {
    before: {
      ordersCount: number
      expensesCount: number
    }
    after: {
      ordersCount: number
      expensesCount: number
    }
  }
}

/** Default last action message for submitted tenders */
const SUBMISSION_LAST_ACTION = 'تم تقديم العرض - بانتظار النتائج'

/**
 * Service for handling tender submission workflow
 *
 * @class TenderSubmissionService
 * @description Manages the complete submission process including:
 * - Status updates
 * - Purchase order creation
 * - Booklet expense creation
 * - Statistics updates
 *
 * @example
 * ```typescript
 * const result = await tenderSubmissionService.submit(tender)
 * console.log('Submitted:', result.tender.status) // 'submitted'
 * console.log('PO created:', result.created.purchaseOrder) // true
 * ```
 */
class TenderSubmissionService {
  /**
   * Submit a tender and perform all related operations
   *
   * @async
   * @param {Tender} tender - The tender to submit
   * @returns {Promise<TenderSubmissionResult>} Complete submission result
   * @throws {Error} If tender update fails or tender ID is invalid
   *
   * @description
   * This method performs the following steps in order:
   * 1. Updates tender status to 'submitted'
   * 2. Sets submission date and last action
   * 3. Counts existing related orders/expenses (before)
   * 4. Creates purchase order for submission fees
   * 5. Creates booklet expense if applicable
   * 6. Counts related orders/expenses (after)
   * 7. Updates development statistics
   * 8. Returns comprehensive result object
   *
   * @example
   * ```typescript
   * try {
   *   const result = await tenderSubmissionService.submit(tender)
   *
   *   if (result.created.purchaseOrder) {
   *     console.log('Purchase order created:', result.purchaseOrder.id)
   *   }
   *
   *   if (result.created.bookletExpense) {
   *     console.log('Booklet expense created:', result.bookletExpense?.id)
   *   }
   *
   *   console.log('Stats updated:', result.stats)
   * } catch (error) {
   *   console.error('Submission failed:', error.message)
   * }
   * ```
   */
  async submit(tender: Tender): Promise<TenderSubmissionResult> {
    const repository = getTenderRepository()
    const submissionTimestamp = new Date().toISOString()

    const updatedTender: Tender = {
      ...tender,
      status: 'submitted',
      submissionDate: submissionTimestamp,
      lastAction: SUBMISSION_LAST_ACTION,
      lastUpdate: submissionTimestamp,
    }

    const savedTender = await repository.update(tender.id, updatedTender)

    if (!savedTender) {
      throw new Error(`تعذر تحديث بيانات المنافسة بالمعرف ${tender.id}`)
    }

    const beforeCounts = await purchaseOrderService.getTenderRelatedOrdersCount(tender.id)
    const { purchaseOrder, bookletExpense, relatedProject } =
      await purchaseOrderService.processTenderSubmission(savedTender)
    const afterCounts = await purchaseOrderService.getTenderRelatedOrdersCount(tender.id)

    const stats = developmentStatsService.updateStatsForTenderSubmission(savedTender)

    return {
      tender: savedTender,
      purchaseOrder,
      bookletExpense: bookletExpense ?? null,
      relatedProject,
      stats,
      created: {
        purchaseOrder: afterCounts.ordersCount > beforeCounts.ordersCount,
        bookletExpense: afterCounts.expensesCount > beforeCounts.expensesCount,
      },
      counts: {
        before: beforeCounts,
        after: afterCounts,
      },
    }
  }
}

/**
 * Singleton instance of TenderSubmissionService
 *
 * @type {TenderSubmissionService}
 * @description Pre-instantiated service instance ready for use across the application
 *
 * @example
 * ```typescript
 * import { tenderSubmissionService } from '@/application/services/tenderSubmissionService'
 *
 * const result = await tenderSubmissionService.submit(tender)
 * ```
 */
export const tenderSubmissionService = new TenderSubmissionService()

/**
 * Default export of the service instance
 * @type {TenderSubmissionService}
 */
export default tenderSubmissionService
