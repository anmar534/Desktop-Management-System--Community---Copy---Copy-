'use client'

import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import {
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '../data/centralData'

interface MonthlyExpensesChartProps {
  onSectionChange: (section: string) => void
}

interface MonthlyExpense {
  month: string
  amount: number
  materials: number
  labor: number
  equipment: number
  other: number
}

interface ExpenseBreakdown {
  name: string
  value: number
  color: string
  textClass: string
  dotClass: string
}

interface ChartTooltipPayload {
  value?: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string
}

interface PieTooltipPayload {
  value?: number
  payload?: ExpenseBreakdown
}

interface PieTooltipProps {
  active?: boolean
  payload?: PieTooltipPayload[]
}

export function MonthlyExpensesChart({ onSectionChange }: MonthlyExpensesChartProps) {
  // بيانات المصاريف الشهرية (آخر 6 أشهر)
  const monthlyExpenses: MonthlyExpense[] = [
    { month: 'يناير', amount: 2.8, materials: 1.2, labor: 0.9, equipment: 0.4, other: 0.3 },
    { month: 'فبراير', amount: 3.2, materials: 1.4, labor: 1.0, equipment: 0.5, other: 0.3 },
    { month: 'مارس', amount: 2.9, materials: 1.3, labor: 0.8, equipment: 0.5, other: 0.3 },
    { month: 'أبريل', amount: 3.5, materials: 1.6, labor: 1.1, equipment: 0.5, other: 0.3 },
    { month: 'مايو', amount: 3.1, materials: 1.4, labor: 1.0, equipment: 0.4, other: 0.3 },
    { month: 'يونيو', amount: 3.4, materials: 1.5, labor: 1.1, equipment: 0.5, other: 0.3 }
  ]

  // بيانات توزيع المصاريف للشهر الحالي
  const currentMonthBreakdown: ExpenseBreakdown[] = [
    { name: 'المواد', value: 1.5, color: '#3b82f6', textClass: 'text-blue-500', dotClass: 'bg-blue-500' },
    { name: 'العمالة', value: 1.1, color: '#10b981', textClass: 'text-emerald-500', dotClass: 'bg-emerald-500' },
    { name: 'المعدات', value: 0.5, color: '#f59e0b', textClass: 'text-amber-500', dotClass: 'bg-amber-500' },
    { name: 'أخرى', value: 0.3, color: '#8b5cf6', textClass: 'text-violet-500', dotClass: 'bg-violet-500' }
  ]

  // حساب الإحصائيات
  const currentMonth = monthlyExpenses[monthlyExpenses.length - 1]
  const previousMonth = monthlyExpenses[monthlyExpenses.length - 2]
  const monthlyChange = currentMonth.amount - previousMonth.amount
  const changePercentage = ((monthlyChange / previousMonth.amount) * 100).toFixed(1)
  const totalExpenses = currentMonthBreakdown.reduce((sum, item) => sum + item.value, 0)
  const averageMonthly = monthlyExpenses.reduce((sum, month) => sum + month.amount, 0) / monthlyExpenses.length

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length || typeof payload[0]?.value !== 'number' || !label) {
      return null
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-blue-600">
          {`المصاريف: ${formatCurrency(payload[0].value)}`}
        </p>
      </div>
    )
  }

  const PieTooltip = ({ active, payload }: PieTooltipProps) => {
    if (!active || !payload?.length) {
      return null
    }

    const pieData = payload[0]?.payload

    if (!pieData) {
      return null
    }

    const percentage = ((pieData.value / totalExpenses) * 100).toFixed(1)

    return (
      <div className="bg-popover p-2 border border-border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-popover-foreground">{pieData.name}</p>
        <p className={`text-sm ${pieData.textClass}`}>
          {`${formatCurrency(pieData.value)} (${percentage}%)`}
        </p>
      </div>
    )
  }

  return (
    <Card className="bg-card border-border shadow-sm h-full">
      <CardContent className="p-3 space-y-3">
        
        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">الشهر الحالي</div>
                <div className="text-sm font-bold text-primary">
                  {formatCurrency(currentMonth.amount)}
                </div>
              </div>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </div>
          
          <div className={`p-2 rounded-lg border ${
            monthlyChange >= 0 
              ? 'bg-destructive/10 border-destructive/20'
              : 'bg-success/10 border-success/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">التغيير</div>
                <div className={`text-sm font-bold flex items-center gap-1 ${
                  monthlyChange >= 0 ? 'text-destructive' : 'text-success'
                }`}>
                  {monthlyChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(parseFloat(changePercentage))}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الرسم البياني الشريطي للمصاريف الشهرية */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-purple-500" />
            المصاريف الشهرية (آخر 6 أشهر)
          </h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenses} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* الرسم الدائري لتوزيع المصاريف */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">
            توزيع المصاريف - يونيو 2024
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {/* الرسم الدائري */}
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentMonthBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={15}
                    outerRadius={35}
                    dataKey="value"
                    stroke="hsl(var(--card))"
                  >
                    {currentMonthBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* المفاتيح والقيم */}
            <div className="space-y-1">
              {currentMonthBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${item.dotClass}`} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* المتوسط الشهري */}
        <div className="p-2 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg border border-border">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">المتوسط الشهري</span>
            <span className="text-sm font-bold text-purple-500">
              {formatCurrency(averageMonthly)}
            </span>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-1 pt-2 border-t border-border">
          <Button 
            size="sm" 
            className="flex-1 h-6 text-xs bg-purple-600 text-white hover:bg-purple-700"
            onClick={() => onSectionChange('financial')}
          >
            <BarChart3 className="h-3 w-3 ml-1" />
            تفاصيل المصاريف
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="h-6 text-xs"
            onClick={() => onSectionChange('reports')}
          >
            تقرير
          </Button>
        </div>

        {/* معلومات التحديث */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">آخر تحديث: اليوم</p>
        </div>
      </CardContent>
    </Card>
  )
}