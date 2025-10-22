/**
 * Financial Summary Card Component
 */

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { useFinancialState } from '@/application/context'
import { formatCurrency } from '@/shared/utils/formatters/formatters'
import { motion } from 'framer-motion'

interface FinancialSummaryCardProps {
  onSectionChange?: (section: string) => void
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({ onSectionChange }) => {
  const { projects: projectsState, tenders: tendersState } = useFinancialState()
  const { projects } = projectsState
  const { tenders } = tendersState

  // حساب الملخص المالي
  const financialSummary = useMemo(() => {
    // إجمالي إيرادات المشاريع
    const totalRevenue = projects.reduce((sum, project) => {
      return sum + (project.totalBudget || 0)
    }, 0)

    // إجمالي المصروفات
    const totalExpenses = projects.reduce((sum, project) => {
      return sum + (project.actualCost || 0)
    }, 0)

    // صافي الربح
    const netProfit = totalRevenue - totalExpenses

    // قيمة المنافسات الفائزة
    const wonTendersValue = tenders
      .filter(t => t.status === 'won')
      .reduce((sum, t) => sum + (t.value || 0), 0)

    // قيمة المنافسات قيد الانتظار
    const pendingTendersValue = tenders
      .filter(t => t.status === 'submitted' || t.status === 'under_action')
      .reduce((sum, t) => sum + (t.value || 0), 0)

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      wonTendersValue,
      pendingTendersValue,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
    }
  }, [projects, tenders])

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="p-2 rounded-lg bg-success/20 border border-success/30">
            <Wallet className="h-5 w-5 text-success" />
          </div>
          الملخص المالي
        </CardTitle>
        <p className="text-sm text-muted-foreground">نظرة سريعة على الوضع المالي</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* صافي الربح */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">صافي الربح</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(financialSummary.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                هامش ربح: {financialSummary.profitMargin}%
              </p>
            </div>
            {financialSummary.netProfit >= 0 ? (
              <TrendingUp className="h-8 w-8 text-success" />
            ) : (
              <TrendingDown className="h-8 w-8 text-destructive" />
            )}
          </div>
        </motion.div>

        {/* الإيرادات والمصروفات */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 bg-primary/10 rounded-lg border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">الإيرادات</p>
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(financialSummary.totalRevenue)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 bg-destructive/10 rounded-lg border border-destructive/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">المصروفات</p>
            </div>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(financialSummary.totalExpenses)}
            </p>
          </motion.div>
        </div>

        {/* المنافسات */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">منافسات فائزة</span>
            <span className="text-sm font-semibold text-success">
              {formatCurrency(financialSummary.wonTendersValue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">منافسات معلقة</span>
            <span className="text-sm font-semibold text-warning">
              {formatCurrency(financialSummary.pendingTendersValue)}
            </span>
          </div>
        </div>

        {/* زر التفاصيل */}
        <Button
          size="sm"
          className="w-full mt-2"
          onClick={() => onSectionChange?.('financial')}
        >
          عرض التفاصيل الكاملة
        </Button>
      </CardContent>
    </Card>
  )
}

