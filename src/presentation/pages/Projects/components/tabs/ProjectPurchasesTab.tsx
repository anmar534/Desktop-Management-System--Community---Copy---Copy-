/**
 * ProjectPurchasesTab Component
 *
 * Displays purchase orders related to the project
 * Refactored to use useProjectFormatters hook - Phase 1.3
 */

import { useProjectFormatters } from '../hooks/useProjectFormatters'
import { Card, CardContent } from '@/presentation/components/ui/card'

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
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">أوامر الشراء</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">العميل</th>
                <th className="text-right p-2">التاريخ</th>
                <th className="text-right p-2">القيمة</th>
                <th className="text-right p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((order: PurchaseOrder) => (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.client || '—'}</td>
                  <td className="p-2">{formatDateOnly(order.createdDate, '—')}</td>
                  <td className="p-2">{order.value ? formatCurrency(order.value) : '—'}</td>
                  <td className="p-2">{order.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
