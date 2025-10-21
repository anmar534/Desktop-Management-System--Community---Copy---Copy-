import type { Tender } from '@/data/centralData'
import { getTenderRepository } from './serviceRegistry'
import { purchaseOrderService, type BookletExpense } from './purchaseOrderService'
import { developmentStatsService } from './developmentStatsService'
import type { PurchaseOrder } from '@/shared/types/contracts'
import type { Project } from '@/data/centralData'
import type { DevelopmentStats } from './developmentStatsService'

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

const SUBMISSION_LAST_ACTION = 'تم تقديم العرض - بانتظار النتائج'

class TenderSubmissionService {
  async submit(tender: Tender): Promise<TenderSubmissionResult> {
    const repository = getTenderRepository()
    const submissionTimestamp = new Date().toISOString()

    const updatedTender: Tender = {
      ...tender,
      status: 'submitted',
      submissionDate: submissionTimestamp,
      lastAction: SUBMISSION_LAST_ACTION,
      lastUpdate: submissionTimestamp
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
        bookletExpense: afterCounts.expensesCount > beforeCounts.expensesCount
      },
      counts: {
        before: beforeCounts,
        after: afterCounts
      }
    }
  }
}

export const tenderSubmissionService = new TenderSubmissionService()

export default tenderSubmissionService
