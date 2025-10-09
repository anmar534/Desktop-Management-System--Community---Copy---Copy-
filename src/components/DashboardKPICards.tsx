import { useMemo } from 'react'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Trophy,
  Building2,
  Minus,
  ArrowRight,
} from 'lucide-react'
import { useDevelopment } from '@/application/hooks/useDevelopment'
import { useFinancialState } from '@/application/context'
import { formatCurrency } from '@/utils/formatters'

interface DashboardKPICardsProps {
  onSectionChange: (section: string) => void
}

export function DashboardKPICards({ onSectionChange }: DashboardKPICardsProps) {
  const { goals } = useDevelopment()
  const {
    metrics,
    tenders: { tenders },
    projects: { projects },
  } = useFinancialState()

  // حساب القيم الفعلية من البيانات
  const actualValues = useMemo(() => {
    const currentYear = new Date().getFullYear()

    // إجمالي الإيرادات (من المشاريع النشطة)
    const totalRevenue = projects
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + (p.contractValue || 0), 0)

    // صافي الربح (تقدير 15% من الإيرادات)
    const totalProfit = totalRevenue * 0.15

    // عدد المنافسات الفائزة
    const wonTenders = tenders.filter(t => t.status === 'won').length

    // عدد المشاريع النشطة
    const activeProjects = projects.filter(p => p.status === 'active').length

    return {
      revenue: totalRevenue,
      profit: totalProfit,
      tenders: wonTenders,
      projects: activeProjects,
    }
  }, [projects, tenders])

  // دمج الأهداف مع القيم الفعلية
  const kpiCards = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const targetKey = `targetValue${currentYear}` as 'targetValue2025' | 'targetValue2026' | 'targetValue2027'

    // تجميع الأهداف حسب الفئة
    const goalsByCategory = goals.reduce((acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = []
      }
      acc[goal.category].push(goal)
      return acc
    }, {} as Record<string, typeof goals>)

    const cards = []

    // بطاقة الإيرادات
    const revenueGoals = goalsByCategory['revenue'] || []
    const revenueTarget = revenueGoals.find(g => g.type === 'yearly')?.[targetKey] || 0
    const revenueActual = actualValues.revenue
    const revenueProgress = revenueTarget > 0 ? Math.min((revenueActual / revenueTarget) * 100, 100) : 0
    const revenueStatus = revenueProgress >= 100 ? 'exceeded' : revenueProgress >= 80 ? 'on-track' : revenueProgress >= 50 ? 'warning' : 'behind'

    cards.push({
      id: 'revenue',
      title: 'إجمالي الإيرادات',
      actual: revenueActual,
      target: revenueTarget,
      progress: revenueProgress,
      status: revenueStatus,
      unit: 'currency',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: 'financial',
    })

    // بطاقة الأرباح
    const profitGoals = goalsByCategory['profit'] || []
    const profitTarget = profitGoals.find(g => g.type === 'yearly')?.[targetKey] || 0
    const profitActual = actualValues.profit
    const profitProgress = profitTarget > 0 ? Math.min((profitActual / profitTarget) * 100, 100) : 0
    const profitStatus = profitProgress >= 100 ? 'exceeded' : profitProgress >= 80 ? 'on-track' : profitProgress >= 50 ? 'warning' : 'behind'

    cards.push({
      id: 'profit',
      title: 'صافي الأرباح',
      actual: profitActual,
      target: profitTarget,
      progress: profitProgress,
      status: profitStatus,
      unit: 'currency',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: 'financial',
    })

    // بطاقة المنافسات
    const tendersGoals = goalsByCategory['tenders'] || []
    const tendersTarget = tendersGoals.find(g => g.type === 'yearly')?.[targetKey] || 0
    const tendersActual = actualValues.tenders
    const tendersProgress = tendersTarget > 0 ? Math.min((tendersActual / tendersTarget) * 100, 100) : 0
    const tendersStatus = tendersProgress >= 100 ? 'exceeded' : tendersProgress >= 80 ? 'on-track' : tendersProgress >= 50 ? 'warning' : 'behind'

    cards.push({
      id: 'tenders',
      title: 'المنافسات الفائزة',
      actual: tendersActual,
      target: tendersTarget,
      progress: tendersProgress,
      status: tendersStatus,
      unit: 'number',
      icon: Trophy,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: 'tenders',
    })

    // بطاقة المشاريع
    const projectsGoals = goalsByCategory['projects'] || []
    const projectsTarget = projectsGoals.find(g => g.type === 'yearly')?.[targetKey] || 0
    const projectsActual = actualValues.projects
    const projectsProgress = projectsTarget > 0 ? Math.min((projectsActual / projectsTarget) * 100, 100) : 0
    const projectsStatus = projectsProgress >= 100 ? 'exceeded' : projectsProgress >= 80 ? 'on-track' : projectsProgress >= 50 ? 'warning' : 'behind'

    cards.push({
      id: 'projects',
      title: 'المشاريع النشطة',
      actual: projectsActual,
      target: projectsTarget,
      progress: projectsProgress,
      status: projectsStatus,
      unit: 'number',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: 'projects',
    })

    return cards
  }, [goals, actualValues])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'on-track':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'behind':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'متجاوز'
      case 'on-track':
        return 'على المسار'
      case 'warning':
        return 'يحتاج متابعة'
      case 'behind':
        return 'متأخر'
      default:
        return 'غير محدد'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <TrendingUp className="h-3 w-3" />
      case 'on-track':
        return <Target className="h-3 w-3" />
      case 'warning':
        return <Minus className="h-3 w-3" />
      case 'behind':
        return <TrendingDown className="h-3 w-3" />
      default:
        return null
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'currency') {
      return formatCurrency(value, { currency: 'SAR', notation: 'compact' })
    }
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`
    }
    return value.toFixed(0)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <Card
          key={card.id}
          className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-2"
          onClick={() => onSectionChange(card.link)}
        >
          <CardContent className="p-0">
            {/* Header */}
            <div className={`p-4 ${card.bgColor} border-b`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                    <h3 className="text-sm font-semibold text-gray-700">
                      {card.title}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(card.status)}`}
                  >
                    {getStatusIcon(card.status)}
                    <span className="mr-1">{getStatusText(card.status)}</span>
                  </Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* القيم */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">الفعلي:</span>
                  <span className={`text-xl font-bold ${card.color}`}>
                    {formatValue(card.actual, card.unit)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">المستهدف:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatValue(card.target, card.unit)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">نسبة الإنجاز</span>
                  <span className={`font-semibold ${card.color}`}>
                    {card.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={card.progress}
                  className="h-2"
                  indicatorClassName={
                    card.status === 'exceeded'
                      ? 'bg-green-500'
                      : card.status === 'on-track'
                      ? 'bg-blue-500'
                      : card.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }
                />
              </div>

              {/* الفرق */}
              {card.target > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">الفرق:</span>
                    <span
                      className={`font-medium ${
                        card.actual >= card.target
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {card.actual >= card.target ? '+' : ''}
                      {formatValue(card.actual - card.target, card.unit)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
