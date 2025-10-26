/**
 * Unit Tests for useTenderStatus Hook
 * Tests status info, urgency, completion, and button visibility logic
 */

import { describe, it, expect } from 'vitest'
import { useTenderStatus } from '@/application/hooks/useTenderStatus'
import type { Tender } from '@/data/centralData'

describe('useTenderStatus', () => {
  const baseTender: Partial<Tender> = {
    id: 'tender-1',
    title: 'Test Tender',
    deadline: '2025-12-31',
    pricedItems: 0,
    totalItems: 10,
    technicalFilesUploaded: false,
  }

  describe('Status Info', () => {
    it('should return correct info for new status', () => {
      const tender = { ...baseTender, status: 'new' } as Tender
      const result = useTenderStatus(tender)

      expect(result.statusInfo.text).toBe('جديدة')
      expect(result.statusInfo.variant).toBe('secondary')
      expect(result.statusInfo.badgeStatus).toBe('notStarted')
    })

    it('should return correct info for under_action status', () => {
      const tender = { ...baseTender, status: 'under_action' } as Tender
      const result = useTenderStatus(tender)

      expect(result.statusInfo.text).toBe('تحت الإجراء')
      expect(result.statusInfo.variant).toBe('warning')
      expect(result.statusInfo.badgeStatus).toBe('warning')
    })

    it('should return correct info for ready_to_submit status', () => {
      const tender = { ...baseTender, status: 'ready_to_submit' } as Tender
      const result = useTenderStatus(tender)

      expect(result.statusInfo.text).toBe('جاهزة للتقديم')
      expect(result.statusInfo.variant).toBe('default')
      expect(result.statusInfo.badgeStatus).toBe('onTrack')
    })

    it('should return correct info for submitted status', () => {
      const tender = { ...baseTender, status: 'submitted' } as Tender
      const result = useTenderStatus(tender)

      expect(result.statusInfo.text).toBe('بانتظار النتائج')
      expect(result.statusInfo.variant).toBe('info')
      expect(result.statusInfo.badgeStatus).toBe('info')
    })

    it('should return correct info for won status', () => {
      const tender = { ...baseTender, status: 'won' } as Tender
      const result = useTenderStatus(tender)

      expect(result.statusInfo.text).toBe('فائزة')
      expect(result.statusInfo.variant).toBe('success')
      expect(result.statusInfo.badgeStatus).toBe('success')
    })

    it('should return correct info for lost status', () => {
      const tender = { ...baseTender, status: 'lost' } as Tender
      const result = useTenderStatus(tender)

      expect(result.statusInfo.text).toBe('خاسرة')
      expect(result.statusInfo.variant).toBe('destructive')
      expect(result.statusInfo.badgeStatus).toBe('error')
    })
  })

  describe('Urgency Info', () => {
    it('should show overdue for expired tender', () => {
      const tender = { ...baseTender, status: 'new', deadline: '2020-01-01' } as Tender
      const result = useTenderStatus(tender)

      expect(result.urgencyInfo.text).toBe('منتهية')
      expect(result.urgencyInfo.badgeStatus).toBe('overdue')
    })

    it('should show due soon for tender with 3 days left', () => {
      const threeDaysLater = new Date()
      threeDaysLater.setDate(threeDaysLater.getDate() + 3)
      const tender = {
        ...baseTender,
        status: 'new',
        deadline: threeDaysLater.toISOString().split('T')[0],
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.urgencyInfo.text).toContain('أيام متبقية')
      expect(result.urgencyInfo.badgeStatus).toBe('dueSoon')
    })

    it('should show on track for tender with 7 days left', () => {
      const sevenDaysLater = new Date()
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
      const tender = {
        ...baseTender,
        status: 'new',
        deadline: sevenDaysLater.toISOString().split('T')[0],
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.urgencyInfo.text).toContain('أيام متبقية')
      expect(result.urgencyInfo.badgeStatus).toBe('onTrack')
    })

    it('should show default for tender with many days left', () => {
      const manyDaysLater = new Date()
      manyDaysLater.setDate(manyDaysLater.getDate() + 30)
      const tender = {
        ...baseTender,
        status: 'new',
        deadline: manyDaysLater.toISOString().split('T')[0],
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.urgencyInfo.text).toContain('يوم')
      expect(result.urgencyInfo.badgeStatus).toBe('default')
    })
  })

  describe('Completion Info', () => {
    it('should show pricing incomplete when no items priced', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        pricedItems: 0,
        totalItems: 10,
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.completionInfo.isPricingCompleted).toBe(false)
    })

    it('should show pricing complete when all items priced', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        pricedItems: 10,
        totalItems: 10,
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.completionInfo.isPricingCompleted).toBe(true)
    })

    it('should check technical files uploaded status', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        technicalFilesUploaded: true,
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.completionInfo.isTechnicalFilesUploaded).toBe(true)
    })

    it('should mark as ready to submit when pricing and files complete', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        pricedItems: 10,
        totalItems: 10,
        technicalFilesUploaded: true,
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.completionInfo.isReadyToSubmit).toBe(true)
    })
  })

  describe('Button Visibility', () => {
    it('should show pricing button for new tender', () => {
      const tender = { ...baseTender, status: 'new' } as Tender
      const result = useTenderStatus(tender)

      expect(result.shouldShowPricingButton).toBe(true)
      expect(result.shouldShowSubmitButton).toBe(false)
    })

    it('should show pricing button for under_action tender without completion', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        pricedItems: 5,
        totalItems: 10,
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.shouldShowPricingButton).toBe(true)
      expect(result.shouldShowSubmitButton).toBe(false)
    })

    it('should show submit button for ready_to_submit status', () => {
      const tender = { ...baseTender, status: 'ready_to_submit' } as Tender
      const result = useTenderStatus(tender)

      expect(result.shouldShowSubmitButton).toBe(true)
      expect(result.shouldShowPricingButton).toBe(false)
    })

    it('should show submit button when strictly ready (pricing + files)', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        pricedItems: 10,
        totalItems: 10,
        technicalFilesUploaded: true,
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.shouldShowSubmitButton).toBe(true)
      expect(result.shouldShowPricingButton).toBe(false)
    })

    it('should not show submit button if reverted to pricing', () => {
      const tender = {
        ...baseTender,
        status: 'under_action',
        pricedItems: 10,
        totalItems: 10,
        technicalFilesUploaded: true,
        lastAction: 'تراجع للتسعير',
      } as Tender
      const result = useTenderStatus(tender)

      expect(result.shouldShowSubmitButton).toBe(false)
      expect(result.shouldShowPricingButton).toBe(true)
    })

    it('should not show buttons for final states', () => {
      const statuses = ['submitted', 'won', 'lost', 'expired', 'cancelled'] as const

      statuses.forEach((status) => {
        const tender = { ...baseTender, status } as Tender
        const result = useTenderStatus(tender)

        expect(result.shouldShowPricingButton).toBe(false)
        expect(result.shouldShowSubmitButton).toBe(false)
      })
    })

    it('should never suggest promotion', () => {
      const tender = { ...baseTender, status: 'under_action' } as Tender
      const result = useTenderStatus(tender)

      expect(result.shouldSuggestPromotion).toBe(false)
    })
  })
})
