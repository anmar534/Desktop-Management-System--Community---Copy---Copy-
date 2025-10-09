import { describe, it, expect } from 'vitest'
import { useTenderStatus } from '@/application/hooks/useTenderStatus'
import type { Tender } from '@/data/centralData'

function makeTender(partial: Partial<Tender> = {}): Tender {
  const now = new Date()
  const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const base: Tender = {
    id: 't-1',
    name: 'Test Tender',
    title: 'Test Tender Title',
    client: 'ACME',
    value: 0,
    totalValue: 0,
    status: 'new',
    totalItems: 0,
    pricedItems: 0,
    technicalFilesUploaded: false,
    deadline,
    daysLeft: 3,
    phase: 'pricing',
    progress: 0,
    priority: 'medium',
    team: 'core-team',
    manager: 'Test Manager',
    winChance: 0.3,
    competition: 'open',
    submissionDate: deadline,
    lastAction: 'init',
    lastUpdate: now.toISOString(),
    category: 'General',
    location: 'Riyadh',
    type: 'general',
  }
  return { ...base, ...partial }
}

describe('useTenderStatus', () => {
  it('shows Submit when status is ready_to_submit even if not strictly ready', () => {
    const tender = makeTender({
      status: 'ready_to_submit',
      totalItems: 10,
      pricedItems: 5,
      technicalFilesUploaded: false,
    })
    const { shouldShowSubmitButton, shouldShowPricingButton } = useTenderStatus(tender)
    expect(shouldShowSubmitButton).toBe(true)
    expect(shouldShowPricingButton).toBe(false)
  })

  it('shows Submit when strictly ready even if status is under_action', () => {
    const tender = makeTender({
      status: 'under_action',
      totalItems: 10,
      pricedItems: 10,
      technicalFilesUploaded: true,
      lastAction: 'تسعير مكتمل'
    })
    const { shouldShowSubmitButton, shouldShowPricingButton, completionInfo } = useTenderStatus(tender)
    expect(completionInfo.isReadyToSubmit).toBe(true)
    expect(shouldShowSubmitButton).toBe(true)
    expect(shouldShowPricingButton).toBe(false)
  })

  it('shows Pricing when reverted to pricing even if strictly ready', () => {
    const tender = makeTender({
      status: 'under_action',
      totalItems: 10,
      pricedItems: 10,
      technicalFilesUploaded: true,
      lastAction: 'تراجع للتسعير والتعديل'
    })
    const { shouldShowSubmitButton, shouldShowPricingButton, completionInfo } = useTenderStatus(tender)
    expect(completionInfo.isReadyToSubmit).toBe(true)
    expect(shouldShowSubmitButton).toBe(false)
    expect(shouldShowPricingButton).toBe(true)
  })

  it('shows Pricing for new when not ready', () => {
    const tender = makeTender({
      status: 'new',
      totalItems: 10,
      pricedItems: 4,
      technicalFilesUploaded: false,
    })
    const { shouldShowSubmitButton, shouldShowPricingButton } = useTenderStatus(tender)
    expect(shouldShowSubmitButton).toBe(false)
    expect(shouldShowPricingButton).toBe(true)
  })

  it('hides both Submit and Pricing for submitted', () => {
    const tender = makeTender({
      status: 'submitted',
      totalItems: 10,
      pricedItems: 10,
      technicalFilesUploaded: true,
    })
    const { shouldShowSubmitButton, shouldShowPricingButton } = useTenderStatus(tender)
    expect(shouldShowSubmitButton).toBe(false)
    expect(shouldShowPricingButton).toBe(false)
  })
})
