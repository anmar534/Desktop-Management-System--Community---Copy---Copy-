/**
 * ProjectPurchasesTab Component
 *
 * Displays purchase orders related to the project
 * Refactored to use useProjectFormatters hook - Phase 1.3
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Package } from 'lucide-react'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          أوامر الشراء المرتبطة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم أمر الشراء</TableHead>
              <TableHead>المورد/العميل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>بنود</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(purchaseOrders || []).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id}</TableCell>
                <TableCell>{o.client || '—'}</TableCell>
                <TableCell>{formatDateOnly(o.createdDate, '—')}</TableCell>
                <TableCell className="font-medium">{formatCurrency(o.value || 0)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{o.status || '—'}</Badge>
                </TableCell>
                <TableCell>{o.items?.length || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
