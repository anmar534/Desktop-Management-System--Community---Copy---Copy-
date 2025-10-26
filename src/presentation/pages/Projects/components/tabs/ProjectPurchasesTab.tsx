/**
 * ProjectPurchasesTab Component
 *
 * Displays purchase orders related to the project
 * Refactored to use useProjectFormatters hook - Phase 1.3
 */

import { ProjectPurchasesTable } from '@/presentation/components/projects/ProjectPurchasesTable'
import { useProjectFormatters } from '../hooks/useProjectFormatters'

interface PurchaseOrder {
  id: string
  client?: string
  createdDate: string | number | Date
  value?: number
  status?: string
  items?: unknown[]
}

interface ProjectPurchasesTabProps {
  purchaseOrders: PurchaseOrder[]
}

export function ProjectPurchasesTab({ purchaseOrders }: ProjectPurchasesTabProps) {
  const { formatCurrency, formatDateOnly } = useProjectFormatters()

  return (
    <ProjectPurchasesTable
      purchases={purchaseOrders}
      formatCurrency={(value) => formatCurrency(value)}
      formatDate={(value) => formatDateOnly(value, '—')}
    />
  )
}
