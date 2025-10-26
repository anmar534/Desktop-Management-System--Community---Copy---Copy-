import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectPurchasesTable } from '@/presentation/components/projects/ProjectPurchasesTable'
import type { ProjectPurchaseRow } from '@/presentation/components/projects/ProjectPurchasesTable'

describe('ProjectPurchasesTable', () => {
  const samplePurchases: ProjectPurchaseRow[] = [
    {
      id: 'PO-1001',
      reference: 'PO-1001',
      supplier: 'شركة البناء المتحدة',
      category: 'مواد بناء',
      createdDate: '2025-02-10',
      value: 185000,
      currency: 'SAR',
      status: 'approved',
      itemsCount: 12,
      linkedTender: 'TN-204',
    },
    {
      id: 'PO-1002',
      supplier: 'شركة الكهرباء المتقدمة',
      category: 'كهرباء',
      createdDate: '2025-02-12',
      value: 72000,
      currency: 'SAR',
      status: 'pending',
      items: [{ id: 1 }, { id: 2 }],
    },
  ]

  const currencyFormatter = (value: number) => `${value.toLocaleString('ar-SA')} ر.س.`
  const dateFormatter = (value: string | number | Date | null | undefined) =>
    value ? `formatted-${value}` : '—'

  it('renders purchases summary and rows', () => {
    render(
      <ProjectPurchasesTable
        purchases={samplePurchases}
        formatCurrency={currencyFormatter}
        formatDate={dateFormatter}
      />,
    )

    expect(screen.getByTestId('purchases-summary')).toBeInTheDocument()
    expect(screen.getByText('شركة البناء المتحدة')).toBeInTheDocument()
    expect(screen.getAllByTestId(/purchase-row-/)).toHaveLength(2)
  })

  it('shows empty state when no purchases provided', () => {
    render(<ProjectPurchasesTable purchases={[]} />)
    expect(screen.getByTestId('purchases-empty-state')).toBeInTheDocument()
  })

  it('handles loading state with skeleton rows', () => {
    render(<ProjectPurchasesTable loading purchases={samplePurchases} />)
    expect(screen.getByTestId('purchases-loading-state')).toBeInTheDocument()
  })

  it('invokes callbacks for view and unlink actions', async () => {
    const onViewDetails = vi.fn()
    const onUnlink = vi.fn()
    const user = userEvent.setup()

    render(
      <ProjectPurchasesTable
        purchases={[samplePurchases[0]]}
        onViewDetails={onViewDetails}
        onUnlink={onUnlink}
        formatCurrency={currencyFormatter}
        formatDate={dateFormatter}
      />,
    )

    const row = screen.getByTestId('purchase-row-PO-1001')
    const actions = within(row)

    await user.click(actions.getByTestId('purchase-view-PO-1001'))
    await user.click(actions.getByTestId('purchase-unlink-PO-1001'))

    expect(onViewDetails).toHaveBeenCalledTimes(1)
    expect(onUnlink).toHaveBeenCalledTimes(1)
  })
})
